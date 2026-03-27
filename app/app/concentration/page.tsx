"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { colors, font } from "@/lib/tokens";

// ─── Constantes ───────────────────────────────────────────────────────────────

const BREAK_OPTIONS = [5, 10, 15, 20];
const MAX_SESSIONS  = 4; // utilisé en interne pour le cycle, non affiché

const POMODORO_BACKGROUNDS = [
  "/pomodoro/bg-1.jpg",
  "/pomodoro/bg-2.jpg",
  "/pomodoro/bg-3.jpg",
  "/pomodoro/bg-4.jpg",
];

type Phase = "work" | "break" | "idle";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Arc SVG statique (utilisé dans FocusOverlay) ─────────────────────────────

function TimerArc({
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

// ─── Cadran interactif (carte principale — glisser pour régler) ───────────────

function InteractiveDial({
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
  const padding = 16; // espace pour le curseur
  const r       = (size - padding * 2) / 2;
  const cx      = size / 2;
  const cy      = size / 2;
  const circ    = 2 * Math.PI * r;

  const clamped = Math.max(0, Math.min(1, progress));
  const offset  = circ * (1 - clamped);

  // Position du curseur (12h = sommet, sens horaire)
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
    // Retour haptique léger (Android)
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
      {/* Arc pivoté pour que 12h = départ */}
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
          {/* Ombre portée */}
          <circle cx={cursorX} cy={cursorY} r={12} fill="rgba(0,0,0,0.12)" transform={`translate(0,1)`} />
          {/* Anneau blanc */}
          <circle cx={cursorX} cy={cursorY} r={11} fill="white" />
          {/* Point violet */}
          <circle cx={cursorX} cy={cursorY} r={7}  fill={activeColor} />
        </>
      )}
    </svg>
  );
}

// ─── Sheet Paramètres (bottom sheet) ─────────────────────────────────────────

function SettingsSheet({
  breakDuration,
  chronoMode,
  onBreakChange,
  onChronoChange,
  onClose,
}: {
  breakDuration: number;
  chronoMode: boolean;
  onBreakChange: (v: number) => void;
  onChronoChange: (v: boolean) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(22,22,42,0.5)" }} onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pb-10 pt-3 flex flex-col gap-5"
        style={{ background: colors.surface, maxWidth: 720, margin: "0 auto" }}
      >
        {/* Handle */}
        <div className="flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
        </div>

        <p className="text-[17px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}>
          ⚙️ Personnaliser
        </p>

        {/* Durée de pause */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-widest" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text3 }}>
            Durée de pause
          </p>
          <div className="flex gap-2 flex-wrap">
            {BREAK_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => onBreakChange(opt)}
                className="px-3 py-1.5 rounded-full text-[13px] transition-all active:scale-95"
                style={{
                  background: breakDuration === opt ? colors.success : colors.bg,
                  border: `1.5px solid ${breakDuration === opt ? colors.success : colors.border}`,
                  color: breakDuration === opt ? "#fff" : colors.text2,
                  fontFamily: font.dm, fontWeight: breakDuration === opt ? 700 : 400,
                }}>
                {opt} min
              </button>
            ))}
          </div>
        </div>

        {/* Mode chronomètre */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
              ⏱ Mode chronomètre
            </p>
            <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
              Compte depuis 0 au lieu d&apos;un compte à rebours
            </p>
          </div>
          <button
            onClick={() => onChronoChange(!chronoMode)}
            className="w-12 h-7 rounded-full transition-all relative shrink-0"
            style={{ background: chronoMode ? colors.primary : colors.border }}
            role="switch" aria-checked={chronoMode}
          >
            <span className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all"
              style={{ left: chronoMode ? "calc(100% - 25px)" : 3 }} />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Overlay Focus (mode immersif) ────────────────────────────────────────────

function FocusOverlay({
  phase,
  remaining,
  elapsed,
  bgUrl,
  workDuration,
  breakDuration,
  chronoMode,
  onStop,
  onSkipToBreak,
}: {
  phase: Phase;
  remaining: number;
  elapsed: number;
  bgUrl: string;
  workDuration: number;
  breakDuration: number;
  chronoMode: boolean;
  onStop: () => void;
  onSkipToBreak: () => void;
}) {
  const totalSecs   = phase === "break" ? breakDuration * 60 : workDuration * 60;
  const progress    = chronoMode ? Math.min(elapsed / totalSecs, 1) : remaining / totalSecs;
  const displayTime = chronoMode ? fmtTime(elapsed) : fmtTime(remaining);
  const isBreak     = phase === "break";

  return (
    <div className="fixed inset-0 z-50 flex flex-col safe-top" style={{ background: "#000" }}>
      {/* Photo de fond plein écran */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: "cover", objectPosition: "center center" }}
      />

      {/* Voile sombre pour lisibilité */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(0,0,0,0.35)" }}
      />

      {/* ── Bouton quitter (discret, haut droite) ── */}
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

        {/* Label de phase */}
        <p
          className="text-[13px] uppercase tracking-[3px]"
          style={{ fontFamily: font.dm, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}
        >
          {isBreak ? "Pause" : "Concentration"}
        </p>

        {/* Arc + temps */}
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
        {/* Arrêter — CTA secondaire outlined */}
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

        {/* Passer à la pause — très discret */}
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

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ConcentrationPage() {
  // Config
  const [workDuration,  setWorkDuration]  = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [chronoMode,    setChronoMode]    = useState(false);

  // Timer
  const [phase,      setPhase]      = useState<Phase>("idle");
  const [running,    setRunning]    = useState(false);
  const [remaining,  setRemaining]  = useState(25 * 60);
  const [elapsed,    setElapsed]    = useState(0);
  const [sessionNum, setSessionNum] = useState(1);
  const [bgIndex,    setBgIndex]    = useState(0);

  // UI
  const [focusMode,    setFocusMode]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSecs = phase === "break" ? breakDuration * 60 : workDuration * 60;
  const progress  = chronoMode
    ? Math.min(elapsed / totalSecs, 1)
    : remaining / totalSecs;
  const displayTime = chronoMode ? fmtTime(elapsed) : fmtTime(remaining);

  // Progression pour le cadran : quand idle = fraction de la durée choisie / 60 min
  const dialProgress = phase === "idle" ? workDuration / 60 : progress;

  // Sync durée si config change sans session en cours
  useEffect(() => {
    if (!running && phase === "idle") {
      setRemaining(workDuration * 60);
    }
  }, [workDuration, running, phase]);

  // ── Tick ──────────────────────────────────────────────────────────────────

  const tick = useCallback(() => {
    if (chronoMode) {
      setElapsed((e) => e + 1);
    } else {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          // Passage automatique à la phase suivante
          setPhase((p) => {
            if (p === "work") {
              setRemaining(breakDuration * 60);
              setElapsed(0);
              return "break";
            } else {
              setSessionNum((s) => (s < MAX_SESSIONS ? s + 1 : 1));
              setRemaining(workDuration * 60);
              setElapsed(0);
              return "work";
            }
          });
          return 0;
        }
        return r - 1;
      });
    }
  }, [chronoMode, breakDuration, workDuration]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, tick]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleStart() {
    setPhase("work");
    setRemaining(workDuration * 60);
    setElapsed(0);
    setBgIndex(Math.floor(Math.random() * POMODORO_BACKGROUNDS.length));
    setFocusMode(true);
    setRunning(true);
  }

  function handleStop() {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("idle");
    setRemaining(workDuration * 60);
    setElapsed(0);
    setSessionNum(1);
    setFocusMode(false);
  }

  function handleSkipToBreak() {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("break");
    setRemaining(breakDuration * 60);
    setElapsed(0);
  }

  const phaseLabel = phase === "idle"  ? "Prêt ?"
                   : phase === "work"  ? "Concentration"
                   :                    "Pause 🌿";

  return (
    <>
      {/* ── Mode focus immersif ── */}
      {focusMode && (
        <FocusOverlay
          phase={phase}
          remaining={remaining}
          elapsed={elapsed}
          bgUrl={POMODORO_BACKGROUNDS[bgIndex]}
          workDuration={workDuration}
          breakDuration={breakDuration}
          chronoMode={chronoMode}
          onStop={handleStop}
          onSkipToBreak={handleSkipToBreak}
        />
      )}

      {/* ── Sheet Paramètres ── */}
      {showSettings && (
        <SettingsSheet
          breakDuration={breakDuration}
          chronoMode={chronoMode}
          onBreakChange={setBreakDuration}
          onChronoChange={setChronoMode}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Vue principale ── */}
      <div className="flex flex-col gap-6 pb-4">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px]"
              style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.4px" }}>
              Concentration 🧘
            </h1>
            <p className="text-[14px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
              Pomodoro — sessions de travail profond
            </p>
          </div>

          {/* Bouton paramètres */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
            aria-label="Paramètres"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2.5" stroke={colors.text2} strokeWidth="1.5" />
              <path
                d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.6 3.6l1.4 1.4M13 13l1.4 1.4M3.6 14.4l1.4-1.4M13 5l1.4-1.4"
                stroke={colors.text2} strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Carte timer ── */}
        <div
          className="rounded-3xl flex flex-col items-center py-8 gap-4"
          style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
        >
          {/* Label phase */}
          <p className="text-[12px] uppercase tracking-[2px]"
            style={{ fontFamily: font.dm, fontWeight: 600, color: phase === "break" ? colors.success : colors.primary }}>
            {phaseLabel}
          </p>

          {/* Cadran interactif + timer */}
          <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <InteractiveDial
                duration={workDuration}
                progress={dialProgress}
                isActive={phase !== "idle"}
                onChange={(v) => {
                  setWorkDuration(v);
                  if (!running && phase === "idle") setRemaining(v * 60);
                }}
                size={220}
              />
            </div>
            <div className="flex flex-col items-center gap-1 z-10 pointer-events-none">
              <span
                className="tabular-nums leading-none"
                style={{ fontFamily: font.dm, fontWeight: 700, fontSize: 48, letterSpacing: "-2px", color: colors.text1 }}
              >
                {displayTime}
              </span>
              <span className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>
                {phase === "idle"
                  ? "glisser pour régler"
                  : chronoMode ? "écoulé"
                  : phase === "work" ? "restant"
                  : "de pause"}
              </span>
            </div>
          </div>

          {/* Bouton Démarrer */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleStart}
              className="h-12 px-7 rounded-2xl flex items-center gap-2 text-[15px] transition-all active:scale-95"
              style={{
                background: colors.primary,
                color: "#fff",
                fontFamily: font.dm,
                fontWeight: 700,
                boxShadow: `0 4px 16px ${colors.primary}40`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 2l10 5-10 5V2z" fill="white" />
              </svg>
              Démarrer →
            </button>
          </div>
        </div>

        {/* ── Résumé config ── */}
        <div
          className="flex items-center justify-between px-5 py-4 rounded-2xl"
          style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
        >
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">🎯</span>
              <div>
                <p className="text-[15px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.primary, lineHeight: 1 }}>
                  {workDuration} min
                </p>
                <p className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>travail</p>
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: colors.border }} />
            <div className="flex items-center gap-2">
              <span className="text-[16px]">🌿</span>
              <div>
                <p className="text-[15px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.success, lineHeight: 1 }}>
                  {breakDuration} min
                </p>
                <p className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>pause</p>
              </div>
            </div>
            {chronoMode && (
              <>
                <div style={{ width: 1, height: 28, background: colors.border }} />
                <p className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>⏱ Chrono</p>
              </>
            )}
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90"
            style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
            aria-label="Personnaliser"
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2.5" stroke={colors.text2} strokeWidth="1.5" />
              <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.6 3.6l1.4 1.4M13 13l1.4 1.4M3.6 14.4l1.4-1.4M13 5l1.4-1.4"
                stroke={colors.text2} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

      </div>
    </>
  );
}
