/**
 * Design tokens centralisés — UI Kit MaPyramide
 * Source de vérité pour toutes les couleurs, ombres et espacements.
 * N'utiliser QUE ces tokens dans les composants, jamais de valeurs hardcodées.
 */

export const colors = {
  /* Fond et surfaces */
  bg:      "#F7F7FA",
  surface: "#FFFFFF",
  border:  "#EBEBF2",
  border2: "#D4D4E8",

  /* Texte */
  text1: "#16162A",
  text2: "#7B7B99",
  text3: "#B0B0C8",

  /* Primaire */
  primary:      "#6C63FF",
  primaryLight: "#EEF0FF",

  /* États */
  success:     "#3EC98A",
  successLight: "#EDFAF4",
  danger:      "#FF6B6B",
  dangerLight: "#FFF0F0",
} as const;

export const shadows = {
  sm:          "0 1px 4px rgba(22,22,42,0.06)",
  md:          "0 4px 16px rgba(22,22,42,0.09)",
  lg:          "0 8px 32px rgba(22,22,42,0.12)",
  primary:     "0 4px 16px rgba(108,99,255,0.30)",
  primaryHover:"0 6px 20px rgba(108,99,255,0.40)",
} as const;

export const radii = {
  sm:   "8px",
  md:   "12px",
  lg:   "16px",
  xl:   "20px",
  xxl:  "24px",
  full: "9999px",
} as const;

export const font = {
  dm: "var(--font-dm-sans)",
} as const;

/**
 * Tokens par domaine — couleur principale, fond, bordure, ombre colorée.
 * Clé = slug du domaine en base.
 */
export const domainTokens: Record<string, {
  color:  string;
  bg:     string;
  border: string;
  shadow: string;
}> = {
  sante: {
    color:  "#3EC98A",
    bg:     "#EDFAF4",
    border: "#A8E8CC",
    shadow: "rgba(62,201,138,0.25)",
  },
  finances: {
    color:  "#6C63FF",
    bg:     "#EEF0FF",
    border: "#C4BEFF",
    shadow: "rgba(108,99,255,0.25)",
  },
  travail: {
    color:  "#4A90D9",
    bg:     "#EBF4FD",
    border: "#A8D4F5",
    shadow: "rgba(74,144,217,0.25)",
  },
  entrepreneuriat: {
    color:  "#FF8C42",
    bg:     "#FFF3EB",
    border: "#FFD0AA",
    shadow: "rgba(255,140,66,0.25)",
  },
  "bien-etre": {
    color:  "#8B5CF6",
    bg:     "#F3F0FF",
    border: "#C4B8FF",
    shadow: "rgba(139,92,246,0.25)",
  },
  ecologie: {
    color:  "#27AE60",
    bg:     "#E8F8EE",
    border: "#A8DEC0",
    shadow: "rgba(39,174,96,0.25)",
  },
};
