-- Migration 015 : colonnes de suivi d'envoi des rappels push
-- Évite d'envoyer le même rappel plusieurs fois si le cron est rejoué

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS reminder_sent_at   timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_2_sent_at timestamptz DEFAULT NULL;

-- Index partiels pour accélérer la requête du cron (ne scanne que les events concernés)
CREATE INDEX IF NOT EXISTS idx_cal_events_reminder_pending
  ON calendar_events (event_date, has_reminder, reminder_sent_at)
  WHERE has_reminder = true AND reminder_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cal_events_reminder2_pending
  ON calendar_events (event_date, has_reminder_2, reminder_2_sent_at)
  WHERE has_reminder_2 = true AND reminder_2_sent_at IS NULL;
