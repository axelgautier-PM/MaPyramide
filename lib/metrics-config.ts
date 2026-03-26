/**
 * Configuration des métriques par domaine.
 * Source unique de vérité — utilisée dans toute l'app.
 */

export interface MetricConfig {
  key:       string;
  label:     string;
  unit:      string;
  icon:      string;
  goal:      number | null;   // null = pas d'objectif fixe (ex: patrimoine)
  direction: "up" | "down";   // "up" = plus haut = mieux, "down" = plus bas = mieux
}

export const DOMAIN_METRICS: Record<string, MetricConfig[]> = {
  sante: [
    { key: "pas",      label: "Pas / jour",          unit: "pas",     icon: "👟", goal: 8000, direction: "up"   },
    { key: "seances",  label: "Séances sport",        unit: "/sem",    icon: "🏋️", goal: 3,    direction: "up"   },
    { key: "repas",    label: "Repas équilibrés",     unit: "/sem",    icon: "🥗", goal: 10,   direction: "up"   },
    { key: "hydra",    label: "Hydratation",          unit: "L/jour",  icon: "💧", goal: 1.5,  direction: "up"   },
    { key: "masse",    label: "Masse grasse",         unit: "%",       icon: "⚖️", goal: 15,   direction: "down" },
  ],

  finances: [
    { key: "epargne_taux",    label: "Taux d'épargne",         unit: "%",      icon: "💰", goal: 20,  direction: "up" },
    { key: "patrimoine",      label: "Patrimoine net",          unit: "€",      icon: "🏛️", goal: null,direction: "up" },
    { key: "precaution",      label: "Épargne précaution",      unit: "mois",   icon: "🛡️", goal: 6,   direction: "up" },
    { key: "investi",         label: "Montant investi",         unit: "€/mois", icon: "📈", goal: 200, direction: "up" },
    { key: "revenus_passifs", label: "Revenus passifs",         unit: "€/mois", icon: "🌱", goal: 500, direction: "up" },
  ],

  travail: [
    { key: "energie_pro",  label: "Énergie pro",          unit: "/10",    icon: "⚡", goal: 7.5, direction: "up"   },
    { key: "ratio_choisi", label: "Tâches choisies",      unit: "%",      icon: "🎯", goal: 60,  direction: "up"   },
    { key: "competences",  label: "Compétences actives",  unit: "/trim",  icon: "🧠", goal: 3,   direction: "up"   },
    { key: "stress_pro",   label: "Stress pro",           unit: "/10",    icon: "🌡️", goal: 3,   direction: "down" },
    { key: "revenu_pro",   label: "Revenu mensuel",       unit: "€/mois", icon: "💰", goal: null,direction: "up"   },
  ],

  entrepreneuriat: [
    { key: "revenus_side",   label: "Revenus secondaires",  unit: "€/mois", icon: "💶", goal: 500, direction: "up" },
    { key: "heures_projet",  label: "Heures projet",        unit: "h/sem",  icon: "⏱️", goal: 7,   direction: "up" },
    { key: "apprentissage",  label: "Ressources appliquées",unit: "/mois",  icon: "📚", goal: 4,   direction: "up" },
    { key: "objectifs_mois", label: "Objectifs atteints",   unit: "%",      icon: "🎯", goal: 80,  direction: "up" },
    { key: "actions_val",    label: "Actions validation",   unit: "/mois",  icon: "🚀", goal: 8,   direction: "up" },
    { key: "taux_horaire",   label: "Taux horaire perso",   unit: "€/h",    icon: "⏳", goal: null,direction: "up" },
  ],

  "bien-etre": [
    { key: "bienetre_global", label: "Bien-être global",      unit: "/10",  icon: "🌟", goal: 8,   direction: "up"   },
    { key: "stress_perso",    label: "Niveau de stress",      unit: "/10",  icon: "🌡️", goal: 2,   direction: "down" },
    { key: "pratiques",       label: "Pratiques bien-être",   unit: "/sem", icon: "🧘", goal: 5,   direction: "up"   },
    { key: "joie",            label: "Score de joie",         unit: "/10",  icon: "☀️", goal: 7.5, direction: "up"   },
    { key: "relations",       label: "Qualité des relations", unit: "/10",  icon: "🤝", goal: 8,   direction: "up"   },
  ],

  ecologie: [
    { key: "carbone",       label: "Empreinte carbone",    unit: "t CO²/an", icon: "🌍", goal: 2,   direction: "down" },
    { key: "transport_co2", label: "Transport carboné",    unit: "€/mois",   icon: "🚗", goal: 50,  direction: "down" },
    { key: "electricite",   label: "Conso électrique",     unit: "kWh/mois", icon: "⚡", goal: 150, direction: "down" },
    { key: "seconde_main",  label: "Achats seconde main",  unit: "%",        icon: "♻️", goal: 50,  direction: "up"   },
    { key: "gaspillage",    label: "Gaspillage alimentaire",unit: "repas/sem",icon: "🗑️", goal: 0,   direction: "down" },
  ],
};

/** Récupère la config métriques d'un domaine par slug */
export function getMetricsForDomain(slug: string): MetricConfig[] {
  return DOMAIN_METRICS[slug] ?? [];
}

/** Calcule le % de progression vers l'objectif */
export function computeMetricProgress(value: number, config: MetricConfig): number {
  if (config.goal === null) return 0;
  if (config.direction === "up") {
    return Math.min(100, Math.round((value / config.goal) * 100));
  }
  // down = plus bas = mieux
  if (value <= config.goal) return 100;
  return Math.max(0, Math.round((1 - (value - config.goal) / config.goal) * 100));
}

/** Détermine si la valeur atteint l'objectif */
export function isGoalReached(value: number, config: MetricConfig): boolean {
  if (config.goal === null) return false;
  return config.direction === "up" ? value >= config.goal : value <= config.goal;
}
