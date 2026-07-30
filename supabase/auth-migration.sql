-- ============================================================
-- CCEA Famalicão — Migração de segurança: login real (Supabase Auth)
-- Corre este ficheiro no SQL Editor DEPOIS do schema.sql original.
-- ============================================================

-- ---------- PERFIS (liga cada utilizador do Supabase Auth a um papel) ----------
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null check (papel in ('admin', 'lider', 'membro')),
  departamento_id uuid references departamentos(id),
  created_at timestamptz not null default now()
);

alter table perfis enable row level security;

-- Qualquer utilizador autenticado pode ver a lista de perfis (para saber nomes/departamentos)
create policy "perfis: leitura autenticada" on perfis
  for select using (auth.role() = 'authenticated');

-- Só o admin pode criar/editar/remover perfis de outras pessoas
create policy "perfis: escrita só admin" on perfis
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.papel = 'admin')
  ) with check (
    exists (select 1 from perfis p where p.id = auth.uid() and p.papel = 'admin')
  );

-- ---------- Funções auxiliares para as políticas ----------
create or replace function meu_papel() returns text
language sql stable security definer as $$
  select papel from perfis where id = auth.uid();
$$;

create or replace function meu_departamento() returns uuid
language sql stable security definer as $$
  select departamento_id from perfis where id = auth.uid();
$$;

create or replace function sou_admin() returns boolean
language sql stable security definer as $$
  select coalesce((select papel from perfis where id = auth.uid()) = 'admin', false);
$$;

-- ============================================================
-- Remove as políticas antigas (acesso aberto) e cria políticas
-- que exigem sessão autenticada + regras por papel.
-- ============================================================

-- DEPARTAMENTOS
drop policy if exists "acesso total departamentos" on departamentos;
create policy "departamentos: leitura autenticada" on departamentos for select using (auth.role() = 'authenticated');
create policy "departamentos: escrita só admin" on departamentos for all
  using (sou_admin()) with check (sou_admin());

-- FUNÇÕES
drop policy if exists "acesso total funcoes" on funcoes;
create policy "funcoes: leitura autenticada" on funcoes for select using (auth.role() = 'authenticated');
create policy "funcoes: escrita só admin" on funcoes for all
  using (sou_admin()) with check (sou_admin());

-- PESSOAS (admin ou líder podem gerir; qualquer autenticado pode ler)
drop policy if exists "acesso total pessoas" on pessoas;
create policy "pessoas: leitura autenticada" on pessoas for select using (auth.role() = 'authenticated');
create policy "pessoas: escrita admin ou lider" on pessoas for all
  using (meu_papel() in ('admin', 'lider')) with check (meu_papel() in ('admin', 'lider'));

-- ESCALAS
drop policy if exists "acesso total escalas" on escalas;
create policy "escalas: leitura autenticada" on escalas for select using (auth.role() = 'authenticated');
create policy "escalas: escrita admin ou lider" on escalas for all
  using (meu_papel() in ('admin', 'lider')) with check (meu_papel() in ('admin', 'lider'));

-- INVENTÁRIO
drop policy if exists "acesso total inventario" on inventario;
create policy "inventario: leitura autenticada" on inventario for select using (auth.role() = 'authenticated');
create policy "inventario: escrita admin ou lider" on inventario for all
  using (meu_papel() in ('admin', 'lider')) with check (meu_papel() in ('admin', 'lider'));

-- GASTOS (líder regista; só admin aprova/rejeita — ou seja, só admin pode fazer update do estado)
drop policy if exists "acesso total gastos" on gastos;
create policy "gastos: leitura autenticada" on gastos for select using (auth.role() = 'authenticated');
create policy "gastos: inserir admin ou lider" on gastos for insert
  with check (meu_papel() in ('admin', 'lider'));
create policy "gastos: editar só admin" on gastos for update
  using (sou_admin()) with check (sou_admin());
create policy "gastos: remover só admin" on gastos for delete
  using (sou_admin());

-- LOGS (qualquer autenticado regista; só admin lê o histórico completo)
drop policy if exists "acesso total logs" on logs;
create policy "logs: inserir autenticado" on logs for insert with check (auth.role() = 'authenticated');
create policy "logs: leitura só admin" on logs for select using (sou_admin());

-- ============================================================
-- IMPORTANTE — passos manuais depois de correr este script:
--
-- 1. Vai a Authentication → Providers → Email e desliga
--    "Allow new users to sign up" (para que só o Admin crie contas).
--
-- 2. Para cada pessoa da equipa:
--    a) Authentication → Users → Add user → define email + password.
--    b) Copia o "User UID" que aparece na lista.
--    c) Na app, entra como Administrador → página "Utilizadores" →
--       cola esse UID, o nome da pessoa, o papel e o departamento.
--
-- 3. O primeiro utilizador (Dener, Administrador) tem de ser
--    inserido diretamente por SQL, porque a página "Utilizadores"
--    só existe depois de já haver um admin autenticado. Depois de
--    criares a conta dele em Authentication → Users, corre:
--
--    insert into perfis (id, nome, papel, departamento_id)
--    values ('COLA-AQUI-O-USER-UID-DO-DENER', 'Dener', 'admin', null);
-- ============================================================
