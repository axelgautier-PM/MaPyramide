-- Table de mapping entre les événements MaPyramide et Google Calendar
-- Permet de savoir si un événement MP a déjà un équivalent dans Google Calendar

create table if not exists public.calendar_sync_map (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  mp_event_id     uuid references calendar_events(id) on delete cascade not null,
  google_event_id text not null,
  synced_at       timestamptz default now() not null,
  unique(user_id, mp_event_id)
);

-- Index pour recherche rapide par google_event_id (updates / deletes)
create index if not exists calendar_sync_map_google_id
  on public.calendar_sync_map (user_id, google_event_id);

alter table public.calendar_sync_map enable row level security;

create policy "user_owns_sync_map" on public.calendar_sync_map
  for all using (auth.uid() = user_id);
