"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { colors, font } from "@/lib/tokens";
import { InteractiveDial } from "@/components/concentration/TimerDial";
import { FocusOverlay } from "@/components/concentration/FocusOverlay";
import { DebugZone } from "@/components/ui/DebugZone";

// ─── Alarme de fin de session ─────────────────────────────────────────────────

/** Joue un bip d'alarme via Web Audio + vibration + notification système */
async function playAlarm(isWork: boolean) {
  // 1. Vibration moteur (Android — iOS ignore silencieusement)
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([600, 200, 600, 200, 600, 200, 600]);
  }

  // 2. Son via Web Audio API (fonctionne sur iOS PWA sans fichier audio)
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const beepOnce = (startAt: number) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type            = "sine";
        osc.frequency.value = isWork ? 523 : 440; // Do5 (fin travail) ou La4 (fin pause)
        gain.gain.setValueAtTime(0.6, startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.7);
        osc.start(startAt);
        osc.stop(startAt + 0.7);
      };
      // 3 bips espacés de 0.9s
      [0, 0.9, 1.8].forEach((t) => beepOnce(ctx.currentTime + t));
    }
  } catch { /* Web Audio non disponible */ }

  // 3. Notification système push (affiche bannière + son système)
  if ("serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(
        isWork ? "⏰ Session terminée !" : "⏰ Pause terminée !",
        {
          body:              isWork ? "Excellent ! Prends une pause bien méritée 🌿" : "C'est reparti ! 🎯",
          icon:              "/icons/icon-192.png",
          badge:             "/icons/icon-192.png",
          tag:               "concentration-alarm",
          requireInteraction: true,
        }
      );
    } catch { /* Notification non disponible */ }
  }
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const BREAK_OPTIONS = [5, 10, 15, 20];
const MAX_SESSIONS  = 4;

const POMODORO_BACKGROUNDS = [
  "/pomodoro/bg-1.jpg",
  "/pomodoro/bg-2.jpg",
  "/pomodoro/bg-3.jpg",
  "/pomodoro/bg-4.jpg",
];

type Phase = "work" | "break" | "idle";

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
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
  const [focusMode,         setFocusMode]         = useState(false);
  const [showBreakDropdown, setShowBreakDropdown] = useState(false);

  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  // Signale qu'on doit démarrer automatiquement la pause après une session de travail
  const autoStartBreakRef = useRef(false);

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
          // Passage automatique à la phase suivante + alarme
          setPhase((p) => {
            void playAlarm(p === "work");  // déclenche bips + vibration + notification
            if (p === "work") {
              setRemaining(breakDuration * 60);
              setElapsed(0);
              autoStartBreakRef.current = true; // déclenche le démarrage automatique de la pause
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

  // Démarre automatiquement la pause dès que la phase bascule sur "break"
  useEffect(() => {
    if (phase === "break" && autoStartBreakRef.current) {
      autoStartBreakRef.current = false;
      setRunning(true);
    }
  }, [phase]);

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
              Démarrer
            </button>
          </div>
        </div>

        {/* ── Config inline ── */}
        <div
          className="flex items-center justify-between px-5 py-4 rounded-2xl"
          style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
        >
          {/* Gauche : travail + pause */}
          <div className="flex items-center gap-5">

            {/* Travail — lecture seule (réglé via le cadran) */}
            <div className="flex items-center gap-2">
              <span className="text-[15px]">🎯</span>
              <div>
                <p className="text-[15px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.primary, lineHeight: 1 }}>
                  {workDuration} min
                </p>
                <p className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>travail</p>
              </div>
            </div>

            <div style={{ width: 1, height: 28, background: colors.border }} />

            {/* Pause — cliquable, dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBreakDropdown((v) => !v)}
                className="flex items-center gap-2 transition-all active:opacity-70"
                aria-haspopup="listbox"
                aria-expanded={showBreakDropdown}
              >
                <span className="text-[15px]">🌿</span>
                <div className="text-left">
                  <p className="text-[15px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.success, lineHeight: 1 }}>
                    {breakDuration} min
                  </p>
                  <p className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>pause</p>
                </div>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ transform: showBreakDropdown ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                >
                  <path d="M2 4l4 4 4-4" stroke={colors.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Dropdown */}
              {showBreakDropdown && (
                <>
                  {/* Overlay pour fermer au clic extérieur */}
                  <div className="fixed inset-0 z-20" onClick={() => setShowBreakDropdown(false)} />
                  <div
                    className="absolute bottom-full left-0 mb-2 rounded-2xl overflow-hidden z-30"
                    style={{
                      background: colors.surface,
                      border: `1.5px solid ${colors.border}`,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                      minWidth: 140,
                    }}
                    role="listbox"
                  >
                    {BREAK_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        role="option"
                        aria-selected={breakDuration === opt}
                        onClick={() => { setBreakDuration(opt); setShowBreakDropdown(false); }}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-[14px] transition-all active:opacity-70"
                        style={{
                          fontFamily: font.dm,
                          fontWeight: breakDuration === opt ? 700 : 400,
                          color: breakDuration === opt ? colors.success : colors.text1,
                          background: breakDuration === opt ? `${colors.success}0f` : "transparent",
                        }}
                      >
                        {opt} min
                        {breakDuration === opt && (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7l4 4 6-7" stroke={colors.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Droite : toggle chronomètre */}
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>⏱</span>
            <button
              onClick={() => setChronoMode((v) => !v)}
              className="w-11 h-6 rounded-full transition-all relative shrink-0"
              style={{ background: chronoMode ? colors.primary : colors.border }}
              role="switch"
              aria-checked={chronoMode}
              aria-label="Mode chronomètre"
            >
              <span
                className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all"
                style={{ left: chronoMode ? "calc(100% - 21px)" : 3 }}
              />
            </button>
          </div>
        </div>

        <DebugZone pageId="concentration" />
      </div>
    </>
  );
}
