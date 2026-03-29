"use client";

import { useRef } from "react";
import { colors } from "@/lib/tokens";

// ─── Arc SVG statique ─────────────────────────────────────────────────────────

export function TimerArc({
  progress,
  white = false,
  size = 260,
}: {
  progress: number;
  white?: boolean;
  size?: number;
}) {
  const stroke = 2.5;
  const r      = (size - stroke * 2) / 2;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));

  const trackColor  = white ? "rgba(255,255,255,0.12)" : "rgba(108,99,255,0.12)";
  const activeColor = white ? "rgba(255,255,255,0.85)" : colors.primary;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={activeColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s linear" }}
      />
    </svg>
  );
}

// ─── Cadran interactif (glisser pour régler la durée) ─────────────────────────

export function InteractiveDial({
  duration,
  progress,
  isActive,
  onChange,
  size = 220,
}: {
  duration: number;
  progress: number;
  isActive: boolean;
  onChange: (minutes: number) => void;
  size?: number;
}) {
  const dragging = useRef(false);

  const stroke  = 2.5;
  const padding = 16;
  const r       = (size - padding * 2) / 2;
  const cx      = size / 2;
  const cy      = size / 2;
  const circ    = 2 * Math.PI * r;

  const clamped = Math.max(0, Math.min(1, progress));
  const offset  = circ * (1 - clamped);

  const endAngle = -Math.PI / 2 + 2 * Math.PI * clamped;
  const cursorX  = cx + r * Math.cos(endAngle);
  const cursorY  = cy + r * Math.sin(endAngle);

  const trackColor  = "rgba(108,99,255,0.12)";
  const activeColor = colors.primary;

  function minutesFromPointer(e: React.PointerEvent<SVGSVGElement>): number {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const dx   = e.clientX - rect.left - cx;
    const dy   = e.clientY - rect.top  - cy;
    let angle  = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    const raw     = (angle / (2 * Math.PI)) * 60;
    const snapped = Math.round(raw / 5) * 5;
    return Math.max(5, Math.min(60, snapped));
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (isActive) return;
    dragging.current = true;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    onChange(minutesFromPointer(e));
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging.current || isActive) return;
    onChange(minutesFromPointer(e));
  }

  function handlePointerUp() {
    dragging.current = false;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
  }

  return (
    <svg
      width={size}
      height={size}
      style={{ touchAction: "none", cursor: isActive ? "default" : "grab", display: "block" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {clamped > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={activeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: isActive ? "stroke-dashoffset 0.8s linear" : "none" }}
          />
        )}
      </g>

      {/* Curseur — visible uniquement en mode réglage (idle) */}
      {!isActive && duration > 0 && (
        <>
          <circle cx={cursorX} cy={cursorY} r={12} fill="rgba(0,0,0,0.12)" transform="translate(0,1)" />
          <circle cx={cursorX} cy={cursorY} r={11} fill="white" />
          <circle cx={cursorX} cy={cursorY} r={7}  fill={activeColor} />
        </>
      )}
    </svg>
  );
}
