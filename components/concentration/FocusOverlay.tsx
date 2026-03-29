"use client";

import Image from "next/image";
import { font } from "@/lib/tokens";
import { TimerArc } from "./TimerDial";

type Phase = "work" | "break" | "idle";

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Overlay immersif affiché pendant une session Pomodoro ────────────────────

interface FocusOverlayProps {
  phase: Phase;
  remaining: number;
  elapsed: number;
  bgUrl: string;
  workDuration: number;
  breakDuration: number;
  chronoMode: boolean;
  onStop: () => void;
  onSkipToBreak: () => void;
}

export function FocusOverlay({
  phase,
  remaining,
  elapsed,
  bgUrl,
  workDuration,
  breakDuration,
  chronoMode,
  onStop,
  onSkipToBreak,
}: FocusOverlayProps) {
  const totalSecs   = phase === "break" ? breakDuration * 60 : workDuration * 60;
  const progress    = chronoMode ? Math.min(elapsed / totalSecs, 1) : remaining / totalSecs;
  const displayTime = chronoMode ? fmtTime(elapsed) : fmtTime(remaining);
  const isBreak     = phase === "break";

  return (
    <div className="fixed inset-0 z-50 flex flex-col safe-top" style={{ background: "#000" }}>
      {/* Photo de fond plein écran */}
      <Image
        src={bgUrl}
        alt=""
        fill
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />

      {/* Voile sombre pour lisibilité */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(0,0,0,0.35)" }}
      />

      {/* ── Bouton quitter (haut droite) ── */}
      <div className="flex justify-end px-5 pt-4 pb-2 relative z-10">
        <button
          onClick={onStop}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          aria-label="Arrêter et quitter"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Zone centrale — timer ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10 px-6">
        <p
          className="text-[13px] uppercase tracking-[3px]"
          style={{ fontFamily: font.dm, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}
        >
          {isBreak ? "Pause" : "Concentration"}
        </p>

        <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <TimerArc progress={progress} white size={260} />
          </div>
          <div className="flex flex-col items-center gap-1 z-10">
            <span
              className="tabular-nums leading-none"
              style={{
                fontFamily: font.dm,
                fontWeight: 200,
                fontSize: 64,
                letterSpacing: "-3px",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {displayTime}
            </span>
            <span style={{ fontFamily: font.dm, fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.4)" }}>
              {chronoMode ? "écoulé" : isBreak ? "de pause" : "restant"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Boutons bas ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-3"
        style={{ paddingBottom: "max(48px, calc(env(safe-area-inset-bottom) + 32px))" }}
      >
        <button
          onClick={onStop}
          className="flex items-center gap-2.5 px-10 py-3.5 rounded-full text-[16px] transition-all active:scale-95"
          style={{
            border: "1.5px solid rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.88)",
            fontFamily: font.dm,
            fontWeight: 600,
            backdropFilter: "blur(6px)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1.5" y="1.5" width="10" height="10" rx="2.5" fill="rgba(255,255,255,0.88)" />
          </svg>
          Arrêter
        </button>

        {phase === "work" && (
          <button
            onClick={onSkipToBreak}
            className="text-[12px] transition-all active:opacity-50"
            style={{ color: "rgba(255,255,255,0.28)", fontFamily: font.dm }}
          >
            passer à la pause →
          </button>
        )}
      </div>
    </div>
  );
}
