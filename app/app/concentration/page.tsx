"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { colors, font, shadows } from "@/lib/tokens";

// ─── Constantes ───────────────────────────────────────────────────────────────

const WORK_OPTIONS  = [15, 20, 25, 30, 45, 50];
const BREAK_OPTIONS = [5, 10, 15, 20];
const MAX_SESSIONS  = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "work" | "break" | "idle";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Arc SVG de progression ───────────────────────────────────────────────────

function TimerArc({
  progress,   // 0 → 1
  phase,
  size = 260,
}: {
  progress: number;
  phase: Phase;
  size?: number;
}) {
  const stroke = 6;
  const r      = (size - stroke * 2) / 2;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  const trackColor  = phase === "work" ? "rgba(108,99,255,0.15)" : "rgba(76,175,130,0.15)";
  const activeColor = phase === "work" ? colors.primary : colors.success;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Piste */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      {/* Arc actif */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={activeColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.5s linear" }}
      />
    </svg>
  );
}

// ─── Sélecteur de durée ───────────────────────────────────────────────────────

function DurationPicker({
  label,
  options,
  value,
  onChange,
  color,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] uppercase tracking-widest px-1"
        style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text3 }}>
        {label}
      </p>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="px-3 py-1.5 rounded-full text-[13px] transition-all active:scale-95"
            style={{
              background: value === opt ? color : colors.bg,
              border:     `1.5px solid ${value === opt ? color : colors.border}`,
              color:      value === opt ? "#fff" : colors.text2,
              fontFamily: font.dm,
              fontWeight: value === opt ? 700 : 400,
            }}
          >
            {opt} min
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ConcentrationPage() {
  // Config
  const [workDuration,  setWorkDuration]  = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  // État du timer
  const [phase,      setPhase]      = useState<Phase>("idle");
  const [running,    setRunning]    = useState(false);
  const [remaining,  setRemaining]  = useState(workDuration * 60);
  const [sessionNum, setSessionNum] = useState(1);

  // Mode chronomètre (compte à rebours → compte depuis 0)
  const [chronoMode, setChronoMode] = useState(false);
  const [elapsed,    setElapsed]    = useState(0);

  // Plein écran
  const [fullscreen, setFullscreen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Total secondes pour la phase en cours (pour l'arc)
  const totalSecs = phase === "break"
    ? breakDuration * 60
    : workDuration * 60;

  // Progression de l'arc (1 → 0 en mode normal, 0 → 1 en mode chrono)
  const progress = chronoMode
    ? Math.min(elapsed / totalSecs, 1)
    : remaining / totalSecs;

  // ── Réinitialiser le timer si les durées changent et qu'on n'est pas en cours ──

  useEffect(() => {
    if (!running && phase === "idle") {
      setRemaining(workDuration * 60);
      setElapsed(0);
    }
  }, [workDuration, running, phase]);

  // ── Tick du timer ──────────────────────────────────────────────────────────

  const tick = useCallback(() => {
    if (chronoMode) {
      setElapsed((e) => e + 1);
    } else {
      setRemaining((r) => {
        if (r <= 1) {
          // Fin de phase
          clearInterval(intervalRef.current!);
          setRunning(false);
          handlePhaseEnd();
          return 0;
        }
        return r - 1;
      });
    }
  }, [chronoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, tick]);

  // ── Fin de phase (automatique) ─────────────────────────────────────────────

  function handlePhaseEnd() {
    if (phase === "work") {
      // Proposer une pause
      setPhase("break");
      setRemaining(breakDuration * 60);
      setElapsed(0);
    } else if (phase === "break") {
      // Prochaine session de travail
      const next = sessionNum < MAX_SESSIONS ? sessionNum + 1 : 1;
      setSessionNum(next);
      setPhase("work");
      setRemaining(workDuration * 60);
      setElapsed(0);
    }
  }

  // ── Actions utilisateur ────────────────────────────────────────────────────

  function handleStartPause() {
    if (phase === "idle") {
      setPhase("work");
      setRemaining(workDuration * 60);
      setElapsed(0);
    }
    setRunning((r) => !r);
  }

  function handleStop() {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("idle");
    setRemaining(workDuration * 60);
    setElapsed(0);
    setSessionNum(1);
  }

  function handleSkipToBreak() {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("break");
    setRemaining(breakDuration * 60);
    setElapsed(0);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  }

  // ── Couleurs selon la phase ────────────────────────────────────────────────

  const phaseColor = phase === "break" ? colors.success : colors.primary;
  const phaseLabel = phase === "idle"  ? "Prêt à te concentrer ?"
                   : phase === "work"  ? `Session ${sessionNum} / ${MAX_SESSIONS}`
                   :                    "Pause méritée 🌿";

  const displayTime = chronoMode
    ? fmtTime(elapsed)
    : fmtTime(remaining);

  return (
    <div className="flex flex-col gap-6 pb-4">

      {/* En-tête */}
      <div>
        <h1 className="text-[22px]"
          style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.4px" }}>
          Concentration 🧘
        </h1>
        <p className="text-[14px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
          Pomodoro — travail profond par sessions
        </p>
      </div>

      {/* ── Zone timer ── */}
      <div
        className="rounded-3xl flex flex-col items-center py-8 gap-4"
        style={{
          background: colors.surface,
          border:     `1.5px solid ${colors.border}`,
          boxShadow:  shadows.sm,
        }}
      >
        {/* Label de phase */}
        <p className="text-[13px] tracking-wide"
          style={{ fontFamily: font.dm, fontWeight: 600, color: phaseColor }}>
          {phaseLabel}
        </p>

        {/* Arc + timer */}
        <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <TimerArc progress={progress} phase={phase} size={240} />
          </div>
          <div className="flex flex-col items-center gap-1 z-10">
            <span
              className="text-[52px] tabular-nums leading-none"
              style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-2px" }}
            >
              {displayTime}
            </span>
            <span className="text-[12px]" style={{ color: colors.text3, fontFamily: font.dm }}>
              {chronoMode ? "écoulé" : phase === "work" ? "restant" : phase === "break" ? "de pause" : ""}
            </span>
          </div>
        </div>

        {/* Indicateurs de sessions */}
        <div className="flex gap-2">
          {Array.from({ length: MAX_SESSIONS }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i < sessionNum && phase !== "idle"
                  ? colors.primary
                  : i === sessionNum - 1 && running
                  ? colors.primary
                  : colors.border,
              }}
            />
          ))}
        </div>

        {/* Boutons principaux */}
        <div className="flex gap-3 mt-2">
          {/* Stop (visible seulement si en cours) */}
          {phase !== "idle" && (
            <button
              onClick={handleStop}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
              aria-label="Arrêter"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="3" width="12" height="12" rx="2" fill={colors.text2} />
              </svg>
            </button>
          )}

          {/* Play / Pause */}
          <button
            onClick={handleStartPause}
            className="h-12 px-8 rounded-2xl flex items-center gap-2 text-[15px] font-bold transition-all active:scale-95"
            style={{
              background: phaseColor,
              color:      "#fff",
              fontFamily: font.dm,
              boxShadow:  `0 4px 16px ${phaseColor}40`,
            }}
            aria-label={running ? "Pause" : "Démarrer"}
          >
            {running ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="2" width="4" height="12" rx="1.5" fill="white" />
                  <rect x="9" y="2" width="4" height="12" rx="1.5" fill="white" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 3l9 5-9 5V3z" fill="white" />
                </svg>
                {phase === "idle" ? "Démarrer" : "Reprendre"}
              </>
            )}
          </button>

          {/* Passer à la pause (visible en phase work) */}
          {phase === "work" && (
            <button
              onClick={handleSkipToBreak}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
              title="Passer à la pause"
              aria-label="Passer à la pause"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l7 5-7 5V4z" fill={colors.text2} />
                <rect x="13" y="4" width="2" height="10" rx="1" fill={colors.text2} />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Configuration ── */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-5"
        style={{ background: colors.surface, border: `1.5px solid ${colors.border}`, boxShadow: shadows.sm }}
      >
        <p className="text-[11px] uppercase tracking-widest"
          style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text3 }}>
          Configuration
        </p>

        <DurationPicker
          label="Session de travail"
          options={WORK_OPTIONS}
          value={workDuration}
          onChange={(v) => { setWorkDuration(v); if (!running && phase === "idle") setRemaining(v * 60); }}
          color={colors.primary}
        />

        <DurationPicker
          label="Durée de la pause"
          options={BREAK_OPTIONS}
          value={breakDuration}
          onChange={setBreakDuration}
          color={colors.success}
        />
      </div>

      {/* ── Options ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
      >
        {/* Mode chronomètre */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
              ⏱ Mode chronomètre
            </p>
            <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
              Compte depuis 0 au lieu d&apos;un compte à rebours
            </p>
          </div>
          <button
            onClick={() => { setChronoMode((v) => !v); setElapsed(0); }}
            className="w-12 h-7 rounded-full transition-all relative shrink-0"
            style={{ background: chronoMode ? colors.primary : colors.border }}
            role="switch"
            aria-checked={chronoMode}
          >
            <span
              className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all"
              style={{ left: chronoMode ? "calc(100% - 25px)" : 3 }}
            />
          </button>
        </div>

        {/* Plein écran */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <div>
            <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
              ⛶ Plein écran
            </p>
            <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
              Masque les distractions pendant la session
            </p>
          </div>
          <button
            onClick={toggleFullscreen}
            className="w-12 h-7 rounded-full transition-all relative shrink-0"
            style={{ background: fullscreen ? colors.primary : colors.border }}
            role="switch"
            aria-checked={fullscreen}
          >
            <span
              className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all"
              style={{ left: fullscreen ? "calc(100% - 25px)" : 3 }}
            />
          </button>
        </div>
      </div>

    </div>
  );
}
