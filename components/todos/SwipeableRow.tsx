"use client";

import { useRef, useState } from "react";

const ACTION_W = 72; // largeur de la zone d'action révélée en px

interface SwipeableRowProps {
  /** Action à gauche — révélée en glissant vers la DROITE (ex: calendrier) */
  leftAction?:       React.ReactNode;
  leftActionColor?:  string;
  onLeftAction?:     () => void;
  /** Action à droite — révélée en glissant vers la GAUCHE (ex: supprimer) */
  rightAction?:      React.ReactNode;
  rightActionColor?: string;
  onRightAction?:    () => void;
  /** Couleur de fond du contenu (pour masquer les zones d'action) */
  contentBg?:        string;
  /** Désactiver le swipe pendant un drag DnD */
  disabled?:         boolean;
  children:          React.ReactNode;
}

// ─── Composant swipe iOS-like ──────────────────────────────────────────────────
export function SwipeableRow({
  leftAction,
  leftActionColor  = "#6C63FF",
  onLeftAction,
  rightAction,
  rightActionColor = "#FF6B6B",
  onRightAction,
  contentBg        = "#FFFFFF",
  disabled         = false,
  children,
}: SwipeableRowProps) {
  const [offset,   setOffset]   = useState(0);
  const [revealed, setRevealed] = useState<"left" | "right" | "none">("none");

  const startX   = useRef<number | null>(null);
  const startY   = useRef<number | null>(null);
  const locked   = useRef<"h" | "v" | null>(null); // direction verrouillée
  const moved    = useRef(false);

  function reset() {
    setOffset(0);
    setRevealed("none");
  }

  function onTouchStart(e: React.TouchEvent) {
    if (disabled) return;
    // Si action déjà révélée, un tap ferme
    if (revealed !== "none") { reset(); return; }
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = null;
    moved.current  = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (disabled || startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Verrouiller la direction au premier mouvement significatif
    if (!locked.current) {
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        locked.current = "h";
      } else if (Math.abs(dy) > 6) {
        locked.current = "v"; // scroll vertical → ignorer
        return;
      } else {
        return; // pas encore assez de mouvement
      }
    }
    if (locked.current !== "h") return;

    // Pas d'action dans cette direction → ignorer
    if (dx > 0 && !onLeftAction)  return;
    if (dx < 0 && !onRightAction) return;

    const max     = ACTION_W + 14;
    const clamped = Math.max(-max, Math.min(max, dx));
    moved.current = true;
    setOffset(clamped);
  }

  function onTouchEnd() {
    if (!moved.current) {
      startX.current = null;
      return;
    }
    startX.current = null;
    moved.current  = false;

    if (offset >= 44 && onLeftAction) {
      setOffset(ACTION_W);
      setRevealed("left");
    } else if (offset <= -44 && onRightAction) {
      setOffset(-ACTION_W);
      setRevealed("right");
    } else {
      setOffset(0);
      setRevealed("none");
    }
  }

  function handleLeftTap(e: React.MouseEvent) {
    e.stopPropagation();
    reset();
    onLeftAction?.();
  }

  function handleRightTap(e: React.MouseEvent) {
    e.stopPropagation();
    reset();
    onRightAction?.();
  }

  // En cours de touch → pas de transition (fluidité), sinon transition spring
  const isAnimating = startX.current === null;

  return (
    <div className="relative overflow-hidden">
      {/* Zone gauche (calendrier, bleue) — révélée au swipe droite */}
      {onLeftAction && (
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center justify-center"
          style={{ width: ACTION_W, background: leftActionColor }}
          onClick={handleLeftTap}
        >
          {leftAction}
        </div>
      )}

      {/* Zone droite (supprimer, rouge) — révélée au swipe gauche */}
      {onRightAction && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center"
          style={{ width: ACTION_W, background: rightActionColor }}
          onClick={handleRightTap}
        >
          {rightAction}
        </div>
      )}

      {/* Contenu principal — se translate horizontalement */}
      <div
        style={{
          transform:  `translateX(${offset}px)`,
          transition: isAnimating ? "transform 0.22s cubic-bezier(.2,.8,.4,1)" : "none",
          willChange: "transform",
          position:   "relative",
          zIndex:     1,
          background: contentBg, // couvre les zones d'action derrière
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
