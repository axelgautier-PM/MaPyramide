-- Migration 017 : Todo lists et tâches
-- Inspiré Microsoft Todo : listes → tâches, étoile, drag & drop, liaison calendrier

CREATE TABLE IF NOT EXISTS todo_lists (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text        NOT NULL DEFAULT '#6C63FF',
  icon       text        NOT NULL DEFAULT '📝',
  position   integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS todo_items (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  list_id           uuid        NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  title             text        NOT NULL,
  description       text,
  is_completed      boolean     NOT NULL DEFAULT false,
  is_starred        boolean     NOT NULL DEFAULT false,
  position          integer     NOT NULL DEFAULT 0,
  due_date          date,
  calendar_event_id uuid        REFERENCES calendar_events(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

-- RLS : chaque utilisateur ne voit que ses propres données
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todo_lists_owner" ON todo_lists
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "todo_items_owner" ON todo_items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_todo_lists_user    ON todo_lists(user_id, position);
CREATE INDEX IF NOT EXISTS idx_todo_items_list    ON todo_items(list_id, position);
CREATE INDEX IF NOT EXISTS idx_todo_items_starred ON todo_items(user_id, is_starred, is_completed);
