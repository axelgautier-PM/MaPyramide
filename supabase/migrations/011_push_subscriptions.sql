-- Migration 011 : table push_subscriptions
-- Architecture extensible : platform 'web' | 'apns' | 'fcm'
-- Web Push (VAPID) implémenté maintenant — APNs/FCM ajoutés si passage App Store natif

create table public.push_subscriptions (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,

  -- Transport : 'web' (Web Push/VAPID), 'apns' (iOS natif), 'fcm' (Android)
  platform     text not null default 'web'
               check (platform in ('web', 'apns', 'fcm')),

  -- Web Push (platform = 'web')
  endpoint     text,
  p256dh       text,
  auth         text,

  -- APNs / FCM (platform = 'apns' | 'fcm') — colonnes futures
  device_token text,

  created_at   timestamptz default now(),

  -- Un endpoint unique par appareil web
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "user_owns_subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id);

-- Index pour lookup rapide par user
create index on public.push_subscriptions (user_id, platform);
