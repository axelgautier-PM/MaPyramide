-- Migration 014 : table des calendriers Google sélectionnés par utilisateur
-- Permet de choisir quels calendriers Google afficher dans MaPyramide + couleur associée

CREATE TABLE IF NOT EXISTS google_calendars (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_calendar_id text NOT NULL,
  name               text NOT NULL,
  color              text NOT NULL DEFAULT '#4285F4',
  is_selected        boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, google_calendar_id)
);

ALTER TABLE google_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_calendars: owner only"
  ON google_calendars
  FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
