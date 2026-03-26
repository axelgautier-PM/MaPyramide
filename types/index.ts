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

export interface Profile {
  id: string;
  email: string | null;
  streak_count: number;
  last_active_date: string | null;
  created_at: string;
}

// Métrique Santé avec ses paramètres d'affichage
export interface MetricConfig {
  key: string;
  label: string;
  unit: string;
  icon: string;
  goal: number;
  direction: "up" | "down"; // up = plus = mieux
}

export const METRICS_CONFIG: MetricConfig[] = [
  { key: "pas",     label: "Pas / jour",             unit: "pas",     icon: "👟", goal: 8000, direction: "up"   },
  { key: "seances", label: "Séances sport",           unit: "/sem",    icon: "🏋️", goal: 3,    direction: "up"   },
  { key: "repas",   label: "Repas équilibrés",        unit: "/sem",    icon: "🥗", goal: 10,   direction: "up"   },
  { key: "hydra",   label: "Hydratation",             unit: "L/j",     icon: "💧", goal: 1.5,  direction: "up"   },
  { key: "masse",   label: "Masse grasse",            unit: "%",       icon: "⚖️", goal: 15,   direction: "down" },
];
