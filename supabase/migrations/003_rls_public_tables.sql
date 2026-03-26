-- ─────────────────────────────────────────────────────────────
-- MaPyramide — Migration 003 : RLS sur tables publiques
-- ─────────────────────────────────────────────────────────────
-- Active RLS sur domains et challenges (lecture publique, écriture interdite)
-- Corrige également le search_path du trigger handle_new_user

-- ─── RLS sur domains ──────────────────────────────────────────
alter table public.domains enable row level security;

create policy "Lecture publique domaines"
  on public.domains for select
  using (true);

-- ─── RLS sur challenges ───────────────────────────────────────
alter table public.challenges enable row level security;

create policy "Lecture publique défis"
  on public.challenges for select
  using (true);

-- ─── Sécurisation du trigger handle_new_user ─────────────────
-- Ajoute SET search_path pour éviter l'injection de schema
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;
