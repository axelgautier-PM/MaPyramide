/**
 * Icône pyramide officielle MaPyramide — 5 rectangles empilés blanc sur fond violet.
 * Trois variantes : "logo" (horizontal auth), "icon" (app icon), "mini" (header nav).
 */

/** Pyramide logo horizontal — viewBox 52×52 — blanche, sur fond violet */
export function PyramidLogoSvg({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <rect x="1"  y="40" width="50" height="10" rx="5"    fill="rgba(255,255,255,0.30)" />
      <rect x="6"  y="29" width="40" height="9"  rx="4.5"  fill="rgba(255,255,255,0.45)" />
      <rect x="11" y="19" width="30" height="8.5" rx="4.25" fill="rgba(255,255,255,0.65)" />
      <rect x="16" y="10" width="20" height="7.5" rx="3.75" fill="rgba(255,255,255,0.82)" />
      <rect x="21" y="2"  width="10" height="6.5" rx="3.25" fill="white" />
    </svg>
  );
}

/** Icône app — viewBox 56×54 — gradient #7B74FF → #5249D6, arrondie */
export function PyramidAppIcon({ size = 96 }: { size?: number }) {
  const radius = Math.round(size * 0.27);
  return (
    <div
      style={{
        width:        size,
        height:       size,
        borderRadius: radius,
        background:   "linear-gradient(145deg, #7B74FF 0%, #5249D6 100%)",
        boxShadow:    `0 ${Math.round(size * 0.08)}px ${Math.round(size * 0.29)}px rgba(108,99,255,0.40)`,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        flexShrink:   0,
      }}
    >
      <svg
        width={Math.round(size * 0.60)}
        height={Math.round(size * 0.57)}
        viewBox="0 0 56 54"
        fill="none"
      >
        <rect x="0"  y="43" width="56" height="11" rx="5.5" fill="rgba(255,255,255,0.28)" />
        <rect x="6"  y="30" width="44" height="11" rx="5.5" fill="rgba(255,255,255,0.44)" />
        <rect x="12" y="18" width="32" height="10" rx="5"   fill="rgba(255,255,255,0.63)" />
        <rect x="17" y="8"  width="22" height="9"  rx="4.5" fill="rgba(255,255,255,0.82)" />
        <rect x="24" y="0"  width="8"  height="7"  rx="3.5" fill="white" />
      </svg>
    </div>
  );
}

/** Mini icône pour le header — rectangle gradient, petit format */
export function PyramidMiniIcon({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width:        size,
        height:       size,
        borderRadius: Math.round(size * 0.31),
        background:   "linear-gradient(145deg, #7B74FF 0%, #5249D6 100%)",
        boxShadow:    "0 3px 10px rgba(108,99,255,0.35)",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        flexShrink:   0,
      }}
    >
      <svg
        width={Math.round(size * 0.55)}
        height={Math.round(size * 0.52)}
        viewBox="0 0 22 20"
        fill="none"
      >
        <rect x="0"  y="15" width="22" height="5"   rx="2.5"  fill="rgba(255,255,255,0.28)" />
        <rect x="3"  y="10" width="16" height="4.5" rx="2.25" fill="rgba(255,255,255,0.48)" />
        <rect x="6"  y="5.5" width="10" height="4"  rx="2"    fill="rgba(255,255,255,0.70)" />
        <rect x="8"  y="2"  width="6"  height="3"   rx="1.5"  fill="rgba(255,255,255,0.90)" />
        <rect x="10" y="0"  width="2"  height="2"   rx="1"    fill="white" />
      </svg>
    </div>
  );
}
