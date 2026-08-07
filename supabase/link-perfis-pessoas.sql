-- ============================================================
-- Liga cada conta de login (perfis) a uma "pessoa" da escala,
-- para podermos mostrar a cada membro só a escala dele.
-- Corre no SQL Editor do Supabase.
-- ============================================================

alter table perfis add column if not exists pessoa_id uuid references pessoas(id) on delete set null;
