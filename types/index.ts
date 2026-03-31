// ─── Types globaux MaPyramide ────────────────────────────────

export type DomainSlug =
  | "sante"
  | "finances"
  | "travail"
  | "entrepreneuriat"
  | "bienetre"
  | "ecologie";

export interface Domain {
  id: string;
  slug: DomainSlug;
  label: string;
  color: string;
  bg_color: string;
  border_color: string;
  icon: string;
  tagline: string;
  stat_quote: string | null;
  order_index: number;
  is_active: boolean;
}

export interface Challenge {
  id: string;
  domain_id: string;
  level_index: number;
  order_index: number;
  title: string;
  duration: string;
  type: string;
  question: string;
  science_text: string | null;
  insight_text: string | null;
  metric_key: string | null;
  metric_label: string | null;
  metric_sub: string | null;
  is_measure: boolean;
  is_active: boolean;
  /** Type de planification suggérée pour ce défi :
   * - null       : pas de planification suggérée
   * - "one_time" : rendez-vous unique (ex: bilan médical, bilan financier)
   * - "recurring": séances régulières (ex: sport, méditation)
   */
  scheduling_type: "one_time" | "recurring" | null;
}

export interface ChallengeCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  note: string | null;
  metric_value: number | null;
}

export interface UserMetric {
  id: string;
  user_id: string;
  metric_key: string;
  value: number;
  recorded_at: string;
  challenge_id: string | null;
}

export interface UserDomainProgress {
  user_id: string;
  domain_id: string;
  current_level: number;
  total_completed: number;
  unlocked_at: string | null;
}

/** Note de debug/feedback laissée par l'admin sur un défi (outil CLAUDE_DEBUG) */
export interface ChallengeNote {
  id: string;
  challenge_id: string;
  user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  streak_count: number;
  last_active_date: string | null;
  created_at: string;
}

