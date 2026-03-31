-- Stocke les tokens OAuth Google par utilisateur
-- provider_token (access token) expire après ~1h
-- provider_refresh_token est permanent jusqu'à révocation

create table if not exists public.google_oauth_tokens (
  user_id                uuid references auth.users(id) on delete cascade primary key,
  provider_token         text not null,
  provider_refresh_token text,
  token_expires_at       timestamptz,
  google_calendar_id     text,   -- ID du calendrier "MaPyramide" créé dans Google Calendar
  updated_at             timestamptz default now() not null
);

-- RLS stricte : un utilisateur ne lit/écrit que son propre enregistrement
alter table public.google_oauth_tokens enable row level security;

create policy "user_owns_google_tokens" on public.google_oauth_tokens
  for all using (auth.uid() = user_id);
