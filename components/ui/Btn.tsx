"use client";

import { colors, shadows, radii, font } from "@/lib/tokens";

type Variant = "primary" | "secondary" | "domain" | "ghost";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Couleur du domaine — utilisée uniquement avec variant="domain" */
  domainColor?: string;
  fullWidth?: boolean;
}

/** Bouton réutilisable aligné sur le design system MaPyramide. */
export function Btn({
  variant = "primary",
  domainColor,
  fullWidth = false,
  style,
  children,
  disabled,
  ...props
}: BtnProps) {
  const base: React.CSSProperties = {
    display:       "inline-flex",
    alignItems:    "center",
    justifyContent:"center",
    gap:           8,
    padding:       "14px 24px",
    borderRadius:  radii.lg,
    border:        "none",
    fontFamily:    font.dm,
    fontSize:      15,
    fontWeight:    600,
    cursor:        disabled ? "not-allowed" : "pointer",
    transition:    "all 0.18s",
    width:         fullWidth ? "100%" : undefined,
    opacity:       disabled ? 0.5 : 1,
  };

  const variantStyles: Record<Variant, React.CSSProperties> = {
    primary: {
      background:  colors.primary,
      color:       "#fff",
      boxShadow:   disabled ? "none" : shadows.primary,
    },
    secondary: {
      background:  colors.primaryLight,
      color:       colors.primary,
    },
    domain: {
      background:  domainColor ?? colors.primary,
      color:       "#fff",
    },
    ghost: {
      background:  "rgba(255,255,255,0.18)",
      color:       "#fff",
      border:      "1.5px solid rgba(255,255,255,0.30)",
    },
  };

  return (
    <button
      disabled={disabled}
      style={{ ...base, ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
