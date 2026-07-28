# CCEA Famalicão — Plataforma de Gestão de Departamentos

Projeto Vite + React ligado ao Supabase. Este README traz o passo a passo completo:
1. Criar e configurar o Supabase
2. Correr o projeto localmente
3. Subir para o GitHub
4. Publicar no Netlify com deploy contínuo

---

## 1. Supabase

1. Cria conta em **https://supabase.com** (grátis) e clica **New project**.
   - Escolhe um nome (ex: `ccea-famalicao`), uma password para a base de dados (guarda-a) e a região mais próxima (Europa).
2. Espera 1-2 minutos até o projeto ficar pronto.
3. No menu esquerdo, vai a **SQL Editor** → **New query**.
4. Copia todo o conteúdo do ficheiro `supabase/schema.sql` (está neste projeto) e cola no editor.
5. Clica **Run**. Isto cria as 7 tabelas, ativa a segurança (RLS), insere os 12 departamentos e algumas funções de exemplo.
6. Vai a **Project Settings** (ícone de engrenagem) → **API**.
   - Copia o **Project URL** → vai para `VITE_SUPABASE_URL`
   - Copia a chave **anon public** → vai para `VITE_SUPABASE_ANON_KEY`

> ⚠️ **Nota importante sobre segurança:** para simplificar esta fase de testes, a base de dados está aberta — qualquer pessoa com o link da app consegue ler e escrever dados (não há palavras-passe reais ainda, só escolha de perfil). Isto é adequado para o avaliador testar agora, mas antes de usar com dados reais da igreja, o próximo passo deve ser adicionar autenticação real (Supabase Auth) e políticas de RLS por utilizador.

---

## 2. Correr localmente (opcional, mas recomendado antes de publicar)

Precisas de [Node.js](https://nodejs.org) instalado (versão 18 ou superior).

```bash
npm install
cp .env.example .env
```

Abre o `.env` e cola o URL e a chave do Supabase que copiaste acima. Depois:

```bash
npm run dev
```

Abre o link que aparece no terminal (normalmente `http://localhost:5173`).

---

## 3. Subir para o GitHub

1. Cria uma conta em **https://github.com** se ainda não tiveres.
2. Cria um novo repositório (botão **New** em github.com/new), por exemplo `ccea-departamentos`. Deixa-o **privado** se preferires (o Netlify liga-se a repositórios privados na mesma).
3. No teu computador, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Primeira versão da plataforma"
git branch -M main
git remote add origin https://github.com/TEU-UTILIZADOR/ccea-departamentos.git
git push -u origin main
```

(Substitui `TEU-UTILIZADOR` e o nome do repositório pelos teus.)

O ficheiro `.gitignore` já garante que `node_modules` e o teu `.env` (com as chaves) **não** são enviados para o GitHub — isso é importante, porque o `.env` é só local.

---

## 4. Publicar no Netlify (deploy contínuo)

1. Cria conta em **https://netlify.com** (podes entrar diretamente com o GitHub).
2. Clica **Add new site** → **Import an existing project** → **Deploy with GitHub**.
3. Autoriza o Netlify a aceder à tua conta do GitHub e escolhe o repositório `ccea-departamentos`.
4. Nas definições de build, o Netlify já deve detetar automaticamente (graças ao `netlify.toml` incluído):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Antes de publicar, vai a **Site settings → Environment variables** e adiciona:
   - `VITE_SUPABASE_URL` = o teu URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = a tua chave anon
6. Clica **Deploy site**. Em 1-2 minutos o Netlify dá-te um link tipo `https://algo-aleatorio.netlify.app` — é esse link que envias ao avaliador.
7. (Opcional) Em **Site settings → Domain management**, podes mudar o nome para algo como `ccea-famalicao-departamentos.netlify.app`.

### Fluxo para continuares a pedir alterações durante a avaliação

A partir de agora, o fluxo é:

1. Tu pedes-me uma alteração aqui no chat.
2. Eu edito os ficheiros do projeto e devolvo-te os ficheiros atualizados (ou um `git diff`/instruções do que mudou).
3. Tu substituis os ficheiros no teu repositório local, e corres:

```bash
git add .
git commit -m "Descrição da alteração"
git push
```

4. O Netlify deteta o `push` automaticamente e republica o site sozinho em 1-2 minutos — o avaliador não precisa fazer nada, só atualizar a página.

Se preferires, também posso preparar cada alteração já como um pacote de ficheiros prontos para substituir, para tornares esse passo ainda mais rápido.

---

## Estrutura do projeto

```
src/
  lib/
    supabaseClient.js   → ligação ao Supabase
    constants.js        → cores, dias da semana, formatação
    api.js               → funções de leitura/escrita nas tabelas
  context/
    DataContext.jsx      → carrega e sincroniza os dados (com tempo real)
    SessionContext.jsx   → perfil de acesso atual (Admin/Líder/Membro)
  components/
    ui.jsx               → Card, Button, Modal, etc. (estética CCEA)
    Sidebar.jsx           → menu lateral
  pages/
    Login.jsx, Dashboard.jsx, Pessoas.jsx, Departamentos.jsx,
    Funcoes.jsx, Escalas.jsx, Inventario.jsx, Gastos.jsx,
    Relatorios.jsx, Auditoria.jsx
supabase/
  schema.sql              → script para criar tudo no Supabase
```
