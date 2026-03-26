-- ─────────────────────────────────────────────────────────────
-- MaPyramide — Schéma initial
-- ─────────────────────────────────────────────────────────────

-- Extension uuid
create extension if not exists "pgcrypto";

-- ─── Profil utilisateur étendu ────────────────────────────────
-- Supabase Auth gère users dans auth.users.
-- On stocke ici les données métier.
create table public.profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  email            text,
  streak_count     integer default 0 not null,
  last_active_date date,
  created_at       timestamptz default now() not null
);

alter table public.profiles enable row level security;
create policy "Utilisateur voit son profil" on public.profiles
  for all using (auth.uid() = id);

-- Créer un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Domaines (seeded) ────────────────────────────────────────
create table public.domains (
  id           uuid default gen_random_uuid() primary key,
  slug         text unique not null,
  label        text not null,
  color        text not null,
  bg_color     text not null,
  border_color text not null,
  icon         text not null,
  tagline      text not null,
  stat_quote   text,
  order_index  integer not null,
  is_active    boolean default true not null
);

-- Pas de RLS : les domaines sont publics (lecture seule)
-- ─── Défis (seeded) ───────────────────────────────────────────
create table public.challenges (
  id           uuid default gen_random_uuid() primary key,
  domain_id    uuid references public.domains(id) on delete cascade not null,
  level_index  integer not null check (level_index between 0 and 4),
  order_index  integer not null,
  title        text not null,
  duration     text not null,
  type         text not null,
  question     text not null,
  science_text text,
  insight_text text,
  metric_key   text,
  metric_label text,
  metric_sub   text,
  is_measure   boolean default false not null,
  is_active    boolean default true not null
);

-- ─── Complétions utilisateur ──────────────────────────────────
create table public.challenge_completions (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  completed_at timestamptz default now() not null,
  note         text,
  metric_value numeric,
  unique(user_id, challenge_id)
);

alter table public.challenge_completions enable row level security;
create policy "Utilisateur voit ses complétions" on public.challenge_completions
  for all using (auth.uid() = user_id);

-- ─── Historique métriques Santé ───────────────────────────────
create table public.user_metrics (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  metric_key   text not null,
  value        numeric not null,
  recorded_at  timestamptz default now() not null,
  challenge_id uuid references public.challenges(id) on delete set null
);

alter table public.user_metrics enable row level security;
create policy "Utilisateur voit ses métriques" on public.user_metrics
  for all using (auth.uid() = user_id);

-- ─── Progression par domaine ──────────────────────────────────
create table public.user_domain_progress (
  user_id         uuid references auth.users(id) on delete cascade not null,
  domain_id       uuid references public.domains(id) on delete cascade not null,
  current_level   integer default 0 not null,
  total_completed integer default 0 not null,
  unlocked_at     timestamptz,
  primary key (user_id, domain_id)
);

alter table public.user_domain_progress enable row level security;
create policy "Utilisateur voit sa progression" on public.user_domain_progress
  for all using (auth.uid() = user_id);
