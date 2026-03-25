-- Migration 005 — Table calendar_events
-- Stocke les créneaux planifiés par l'utilisateur (liés ou non à un défi)

create table if not exists calendar_events (
  id                      uuid default gen_random_uuid() primary key,
  user_id                 uuid references auth.users(id) on delete cascade not null,
  challenge_id            uuid references challenges(id) on delete set null,
  domain_id               uuid references domains(id) on delete set null,

  title                   text not null,
  domain_color            text,           -- snapshot couleur domaine pour affichage rapide
  domain_icon             text,           -- snapshot emoji domaine

  -- Timing
  event_date              date not null,
  start_time              time not null,
  duration_minutes        integer not null default 30 check (duration_minutes > 0),

  -- Récurrence hebdomadaire
  is_recurring            boolean default false not null,
  recurrence_days         integer[] default '{}',   -- [1..7] Lun=1 … Dim=7
  recurrence_end_date     date,

  -- Rappel in-app
  has_reminder            boolean default false not null,
  reminder_minutes_before integer default 15 check (reminder_minutes_before >= 0),

  created_at              timestamptz default now() not null
);

-- Index pour les requêtes par utilisateur + plage de dates
create index if not exists calendar_events_user_date
  on calendar_events (user_id, event_date);

-- RLS : chaque utilisateur ne voit que ses propres événements
alter table calendar_events enable row level security;

create policy "user_owns_calendar_events" on calendar_events
  for all using (auth.uid() = user_id);
