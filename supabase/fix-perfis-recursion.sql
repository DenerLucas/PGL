-- ============================================================
-- Correção: recursão infinita na política da tabela "perfis"
-- Corre isto no SQL Editor do Supabase.
-- ============================================================

drop policy if exists "perfis: escrita só admin" on perfis;

create policy "perfis: escrita só admin" on perfis
  for all
  using (sou_admin())
  with check (sou_admin());
