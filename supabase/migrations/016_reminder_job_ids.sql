-- Migration 016 : colonnes pour stocker les message IDs QStash
-- Permettent d'annuler un rappel planifié si l'événement est modifié ou supprimé

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS reminder_job_id   text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_2_job_id text DEFAULT NULL;
