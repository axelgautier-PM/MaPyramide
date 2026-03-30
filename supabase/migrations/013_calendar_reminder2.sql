-- Migration 013 : seconde notification sur les événements calendrier
-- Ajoute has_reminder_2 et reminder_minutes_before_2 à calendar_events

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS has_reminder_2 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_minutes_before_2 integer NOT NULL DEFAULT 15;
