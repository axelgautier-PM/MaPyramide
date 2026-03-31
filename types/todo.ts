/** Types pour le module Tâches — MaPyramide */

export interface TodoList {
  id:         string;
  user_id:    string;
  name:       string;
  color:      string;
  icon:       string;
  position:   number;
  created_at: string;
}

export interface TodoItem {
  id:                string;
  user_id:           string;
  list_id:           string;
  title:             string;
  description:       string | null;
  is_completed:      boolean;
  is_starred:        boolean;
  position:          number;
  due_date:          string | null;
  calendar_event_id: string | null;
  created_at:        string;
  completed_at:      string | null;
}

/** Payload pour créer une tâche — seul title est obligatoire */
export interface CreateTodoItem {
  title:       string;
  list_id:     string;
  description?: string;
  is_starred?:  boolean;
  due_date?:    string | null;
}
