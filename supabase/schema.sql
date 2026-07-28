-- ============================================================
-- CCEA Famalicão — Plataforma de Gestão de Departamentos
-- Schema Supabase — corre este ficheiro inteiro no SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- DEPARTAMENTOS ----------
create table if not exists departamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  lideres text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- FUNÇÕES ----------
create table if not exists funcoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  departamento_id uuid not null references departamentos(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- PESSOAS ----------
create table if not exists pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contacto text default '',
  disponibilidade text[] not null default '{}',
  atribuicoes jsonb not null default '[]', -- [{departamentoId, funcaoIds:[]}]
  created_at timestamptz not null default now()
);

-- ---------- ESCALAS ----------
create table if not exists escalas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  periodo text not null,
  departamento_id uuid not null references departamentos(id) on delete cascade,
  funcao_id uuid references funcoes(id) on delete set null,
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- INVENTÁRIO ----------
create table if not exists inventario (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  departamento_id uuid not null references departamentos(id) on delete cascade,
  localizacao text default '',
  estado int not null default 5 check (estado between 1 and 5),
  created_at timestamptz not null default now()
);

-- ---------- GASTOS ----------
create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  valor numeric(12,2) not null,
  data date not null,
  descricao text not null,
  categoria text not null,
  departamento_id uuid not null references departamentos(id) on delete cascade,
  estado text not null default 'pendente' check (estado in ('pendente','aprovado','rejeitado')),
  created_at timestamptz not null default now()
);

-- ---------- LOG DE AUDITORIA ----------
create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  quem text not null,
  acao text not null,
  quando timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- Para esta fase de avaliação/teste usamos acesso aberto via
-- chave "anon": qualquer pessoa com o link da app lê e escreve.
-- Não há palavras-passe reais na app ainda, por isso não há
-- forma de restringir por utilizador — trata este ambiente como
-- um servidor de testes, não como produção com dados sensíveis.
-- ============================================================

alter table departamentos enable row level security;
alter table funcoes enable row level security;
alter table pessoas enable row level security;
alter table escalas enable row level security;
alter table inventario enable row level security;
alter table gastos enable row level security;
alter table logs enable row level security;

create policy "acesso total departamentos" on departamentos for all using (true) with check (true);
create policy "acesso total funcoes" on funcoes for all using (true) with check (true);
create policy "acesso total pessoas" on pessoas for all using (true) with check (true);
create policy "acesso total escalas" on escalas for all using (true) with check (true);
create policy "acesso total inventario" on inventario for all using (true) with check (true);
create policy "acesso total gastos" on gastos for all using (true) with check (true);
create policy "acesso total logs" on logs for all using (true) with check (true);

-- ============================================================
-- Dados iniciais: os 12 departamentos da CCEA Famalicão
-- ============================================================

insert into departamentos (nome) values
  ('Louvor'),
  ('Receção'),
  ('Adolescentes'),
  ('Jovens'),
  ('Cantina'),
  ('Pregação'),
  ('Abertura'),
  ('Estudo bíblico'),
  ('Limpeza'),
  ('Transporte'),
  ('Projeção e som'),
  ('Mídia'),
  ('Crianças')
on conflict do nothing;

-- Algumas funções de exemplo (o Administrador pode criar mais na app)
insert into funcoes (nome, departamento_id)
select 'Vocal', id from departamentos where nome = 'Louvor'
union all
select 'Instrumentista', id from departamentos where nome = 'Louvor'
union all
select 'Diretor de louvor', id from departamentos where nome = 'Louvor'
union all
select 'Som', id from departamentos where nome = 'Projeção e som'
union all
select 'Projeção de letras', id from departamentos where nome = 'Projeção e som'
union all
select 'Transmissão', id from departamentos where nome = 'Projeção e som'
union all
select 'Voluntário', id from departamentos where nome not in ('Louvor', 'Projeção e som');

-- Ativar "Realtime" (para a app atualizar sozinha quando outra pessoa altera dados)
alter publication supabase_realtime add table departamentos, funcoes, pessoas, escalas, inventario, gastos, logs;
