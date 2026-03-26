"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { colors, font } from "@/lib/tokens";

// ─── Constantes ───────────────────────────────────────────────────────────────

const WORK_OPTIONS  = [15, 20, 25, 30, 45, 50];
const BREAK_OPTIONS = [5, 10, 15, 20];
const MAX_SESSIONS  = 4;

type Phase = "work" | "break" | "idle";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Arc SVG de progression ───────────────────────────────────────────────────

function TimerArc({
  progress,
  white = false,
  size = 260,
}: {
  progress: number;
  white?: boolean;
  size?: number;
}) {
  const stroke = 5;
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

// ─── Sheet Paramètres (bottom sheet) ─────────────────────────────────────────

function SettingsSheet({
  workDuration,
  breakDuration,
  chronoMode,
  onWorkChange,
  onBreakChange,
  onChronoChange,
  onClose,
}: {
  workDuration: number;
  breakDuration: number;
  chronoMode: boolean;
  onWorkChange: (v: number) => void;
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
          ⚙️ Paramètres Pomodoro
        </p>

        {/* Durée de travail */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-widest" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text3 }}>
            Session de travail
          </p>
          <div className="flex gap-2 flex-wrap">
            {WORK_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => onWorkChange(opt)}
                className="px-3 py-1.5 rounded-full text-[13px] transition-all active:scale-95"
                style={{
                  background: workDuration === opt ? colors.primary : colors.bg,
                  border: `1.5px solid ${workDuration === opt ? colors.primary : colors.border}`,
                  color: workDuration === opt ? "#fff" : colors.text2,
                  fontFamily: font.dm, fontWeight: workDuration === opt ? 700 : 400,
                }}>
                {opt} min
              </button>
            ))}
          </div>
        </div>

        {/* Durée de pause */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-widest" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text3 }}>
            Pause
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
  running,
  remaining,
  elapsed,
  sessionNum,
  workDuration,
  breakDuration,
  chronoMode,
  onStartPause,
  onStop,
  onSkipToBreak,
  onExit,
}: {
  phase: Phase;
  running: boolean;
  remaining: number;
  elapsed: number;
  sessionNum: number;
  workDuration: number;
  breakDuration: number;
  chronoMode: boolean;
  onStartPause: () => void;
  onStop: () => void;
  onSkipToBreak: () => void;
  onExit: () => void;
}) {
  const totalSecs   = phase === "break" ? breakDuration * 60 : workDuration * 60;
  const progress    = chronoMode ? Math.min(elapsed / totalSecs, 1) : remaining / totalSecs;
  const displayTime = chronoMode ? fmtTime(elapsed) : fmtTime(remaining);
  const isBreak     = phase === "break";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col safe-top"
      style={{
        // Dégradé nuit — ciel étoilé stylisé
        background: isBreak
          ? "linear-gradient(180deg, #0a2a1a 0%, #0d3a22 30%, #1a4a2e 60%, #0d2a1a 100%)"
          : "linear-gradient(180deg, #0d0d2b 0%, #14103d 25%, #1e1650 50%, #2a1f6e 70%, #1a1438 100%)",
      }}
    >
      {/* Étoiles SVG décoratives */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {[...Array(40)].map((_, i) => (
          <circle
            key={i}
            cx={`${(i * 37 + 11) % 100}%`}
            cy={`${(i * 53 + 7) % 65}%`}
            r={i % 4 === 0 ? 1.5 : 1}
            fill="white"
            opacity={0.2 + (i % 5) * 0.1}
          />
        ))}
      </svg>

      {/* Silhouette montagne SVG */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
        viewBox="0 0 375 180"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <path
          d="M0 180 L0 120 L60 80 L100 110 L150 40 L200 90 L240 60 L290 100 L330 70 L375 95 L375 180 Z"
          fill="rgba(0,0,0,0.45)"
        />
        <path
          d="M0 180 L0 140 L80 130 L130 150 L200 135 L260 145 L320 130 L375 140 L375 180 Z"
          fill="rgba(0,0,0,0.6)"
        />
      </svg>

      {/* Reflet lac */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "30%",
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))",
        }}
      />

      {/* ── Bouton quitter (discret, haut droite) ── */}
      <div className="flex justify-end px-5 pt-4 pb-2">
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          aria-label="Quitter le mode focus"
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
          style={{ fontFamily: font.dm, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}
        >
          {isBreak ? "Pause" : `Session ${sessionNum} / ${MAX_SESSIONS}`}
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
                fontWeight: 300,
                fontSize: 64,
                letterSpacing: "-3px",
                color: "rgba(255,255,255,0.95)",
              }}
            >
              {displayTime}
            </span>
            <span style={{ fontFamily: font.dm, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              {chronoMode ? "écoulé" : isBreak ? "de pause" : "restant"}
            </span>
          </div>
        </div>

        {/* Dots sessions */}
        <div className="flex gap-2.5">
          {Array.from({ length: MAX_SESSIONS }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === sessionNum - 1 && phase === "work" ? 20 : 8,
                height: 8,
                background: i < sessionNum - 1
                  ? "rgba(255,255,255,0.7)"
                  : i === sessionNum - 1
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Boutons bas ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-4 pb-12 px-8"
        style={{ paddingBottom: "max(48px, calc(env(safe-area-inset-bottom) + 32px))" }}
      >
        {/* Play / Pause — bouton principal */}
        <button
          onClick={onStartPause}
          className="flex items-center gap-3 px-10 py-4 rounded-full text-[17px] transition-all active:scale-95"
          style={{
            background: "rgba(255,255,255,0.95)",
            color: "#1a1a40",
            fontFamily: font.dm,
            fontWeight: 700,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {running ? (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="2" width="4.5" height="14" rx="2" fill="#1a1a40" />
                <rect x="10.5" y="2" width="4.5" height="14" rx="2" fill="#1a1a40" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M5 3l11 6-11 6V3z" fill="#1a1a40" />
              </svg>
              {phase === "idle" ? "Démarrer" : "Reprendre"}
            </>
          )}
        </button>

        {/* Actions secondaires — très discret */}
        <div className="flex gap-6">
          {phase !== "idle" && (
            <button
              onClick={onStop}
              className="text-[13px] transition-all active:opacity-50"
              style={{ color: "rgba(255,255,255,0.35)", fontFamily: font.dm }}
            >
              Arrêter
            </button>
          )}
          {phase === "work" && (
            <button
              onClick={onSkipToBreak}
              className="text-[13px] transition-all active:opacity-50"
              style={{ color: "rgba(255,255,255,0.35)", fontFamily: font.dm }}
            >
              → Pause
            </button>
          )}
        </div>
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

  // UI
  const [focusMode,    setFocusMode]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSecs = phase === "break" ? breakDuration * 60 : workDuration * 60;
  const progress  = chronoMode
    ? Math.min(elapsed / totalSecs, 1)
    : remaining / totalSecs;
  const displayTime = chronoMode ? fmtTime(elapsed) : fmtTime(remaining);

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

  function handleStartPause() {
    if (phase === "idle") {
      setPhase("work");
      setRemaining(workDuration * 60);
      setElapsed(0);
      setFocusMode(true);
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
    setFocusMode(false);
  }

  function handleSkipToBreak() {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("break");
    setRemaining(breakDuration * 60);
    setElapsed(0);
  }

  function handleExitFocus() {
    setFocusMode(false);
    // Le timer continue en arrière-plan
  }

  const phaseLabel = phase === "idle"  ? "Prêt ?"
                   : phase === "work"  ? `Session ${sessionNum} / ${MAX_SESSIONS}`
                   :                    "Pause 🌿";

  return (
    <>
      {/* ── Mode focus immersif ── */}
      {focusMode && (
        <FocusOverlay
          phase={phase}
          running={running}
          remaining={remaining}
          elapsed={elapsed}
          sessionNum={sessionNum}
          workDuration={workDuration}
          breakDuration={breakDuration}
          chronoMode={chronoMode}
          onStartPause={handleStartPause}
          onStop={handleStop}
          onSkipToBreak={handleSkipToBreak}
          onExit={handleExitFocus}
        />
      )}

      {/* ── Sheet Paramètres ── */}
      {showSettings && (
        <SettingsSheet
          workDuration={workDuration}
          breakDuration={breakDuration}
          chronoMode={chronoMode}
          onWorkChange={(v) => { setWorkDuration(v); if (!running && phase === "idle") setRemaining(v * 60); }}
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

          {/* Arc + timer */}
          <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <TimerArc progress={progress} size={220} />
            </div>
            <div className="flex flex-col items-center gap-1 z-10">
              <span
                className="tabular-nums leading-none"
                style={{ fontFamily: font.dm, fontWeight: 700, fontSize: 48, letterSpacing: "-2px", color: colors.text1 }}
              >
                {displayTime}
              </span>
              <span className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>
                {chronoMode ? "écoulé" : phase === "work" ? "restant" : phase === "break" ? "de pause" : ""}
              </span>
            </div>
          </div>

          {/* Dots sessions */}
          <div className="flex gap-2">
            {Array.from({ length: MAX_SESSIONS }).map((_, i) => (
              <div key={i} className="rounded-full transition-all"
                style={{
                  width: i === sessionNum - 1 && phase !== "idle" ? 16 : 8,
                  height: 8,
                  background: i < sessionNum - 1
                    ? colors.primary
                    : i === sessionNum - 1 && phase !== "idle"
                    ? colors.primary
                    : colors.border,
                }}
              />
            ))}
          </div>

          {/* Boutons */}
          <div className="flex gap-3 mt-2">
            {phase !== "idle" && (
              <button onClick={handleStop}
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
                aria-label="Arrêter"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="3" width="10" height="10" rx="2" fill={colors.text2} />
                </svg>
              </button>
            )}

            <button
              onClick={phase !== "idle" ? handleStartPause : () => { setFocusMode(true); handleStartPause(); }}
              className="h-12 px-7 rounded-2xl flex items-center gap-2 text-[15px] font-bold transition-all active:scale-95"
              style={{
                background: phase === "break" ? colors.success : colors.primary,
                color: "#fff",
                fontFamily: font.dm,
                fontWeight: 700,
                boxShadow: `0 4px 16px ${phase === "break" ? colors.success : colors.primary}40`,
              }}
            >
              {running ? (
                <><svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="1" width="4" height="12" rx="1.5" fill="white" />
                  <rect x="8" y="1" width="4" height="12" rx="1.5" fill="white" />
                </svg>Pause</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 2l10 5-10 5V2z" fill="white" />
                </svg>
                {phase === "idle" ? "Démarrer →" : "Reprendre"}</>
              )}
            </button>

            {phase === "work" && (
              <button onClick={handleSkipToBreak}
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
                title="Passer à la pause" aria-label="Passer à la pause"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l6 4-6 4V3z" fill={colors.text2} />
                  <rect x="11" y="3" width="2" height="10" rx="1" fill={colors.text2} />
                </svg>
              </button>
            )}
          </div>

          {/* Lien "Ouvrir le mode focus" si timer en cours mais overlay fermé */}
          {phase !== "idle" && !focusMode && (
            <button
              onClick={() => setFocusMode(true)}
              className="text-[12px] flex items-center gap-1 mt-1 transition-all active:opacity-70"
              style={{ color: colors.primary, fontFamily: font.dm, fontWeight: 600 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1h4M11 1V5M11 1L6 6M5 3H1v8h8V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Mode focus
            </button>
          )}
        </div>

        {/* ── Résumé config ── */}
        <div
          className="flex items-center justify-between px-5 py-4 rounded-2xl"
          style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
        >
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[20px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.primary }}>{workDuration}</p>
              <p className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>min travail</p>
            </div>
            <div style={{ width: 1, height: 32, background: colors.border }} />
            <div className="text-center">
              <p className="text-[20px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.success }}>{breakDuration}</p>
              <p className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>min pause</p>
            </div>
            <div style={{ width: 1, height: 32, background: colors.border }} />
            <div className="text-center">
              <p className="text-[20px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}>{MAX_SESSIONS}</p>
              <p className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>sessions</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-[12px] px-3 py-1.5 rounded-full transition-all active:scale-95"
            style={{ background: colors.bg, border: `1.5px solid ${colors.border}`, color: colors.text2, fontFamily: font.dm }}
          >
            Modifier
          </button>
        </div>

      </div>
    </>
  );
}
