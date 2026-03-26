"use client";

import { useState, useEffect, useRef } from "react";
import type { Challenge, Domain } from "@/types";
import { Btn } from "@/components/ui/Btn";
import { AddEventSheet } from "@/components/calendar/AddEventSheet";
import { colors, shadows, radii, font } from "@/lib/tokens";
import { useCalendar } from "@/lib/hooks/useCalendar";
import { toDateStr } from "@/lib/hooks/useCalendar";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";

interface CompleteSheetProps {
  challenge: Challenge;
  domain:    Domain;
  isDone:    boolean;
  onClose:   () => void;
  onComplete:(metricValue?: number) => Promise<void>;
}

export function CompleteSheet({ challenge, domain, isDone, onClose, onComplete }: CompleteSheetProps) {
  const [metricValue,  setMetricValue]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [expanded,     setExpanded]     = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);
  const [planOpen,     setPlanOpen]     = useState(false);
  // CLAUDE_DEBUG
  const [debugMode,    setDebugMode]    = useState(false);
  const [debugNote,    setDebugNote]    = useState("");
  const [debugSaving,  setDebugSaving]  = useState(false);
  const [debugSaved,   setDebugSaved]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addEvent } = useCalendar();
  const { profile } = useAppStore();

  // Détection mode debug via localStorage (activer avec mp_debug_mode=true)
  useEffect(() => {
    setDebugMode(localStorage.getItem("mp_debug_mode") === "true");
  }, []);

  // Charge la note existante pour ce défi si on est en mode debug
  useEffect(() => {
    if (!debugMode || !profile) return;
    supabase
      .from("challenge_notes")
      .select("note")
      .eq("challenge_id", challenge.id)
      .eq("user_id", profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.note) setDebugNote(data.note);
      });
  }, [debugMode, challenge.id, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveDebugNote() {
    if (!profile || !debugNote.trim()) return;
    setDebugSaving(true);
    await supabase.from("challenge_notes").upsert({
      challenge_id: challenge.id,
      user_id:      profile.id,
      note:         debugNote.trim(),
      updated_at:   new Date().toISOString(),
    }, { onConflict: "challenge_id,user_id" });
    setDebugSaving(false);
    setDebugSaved(true);
    setTimeout(() => setDebugSaved(false), 2000);
  }

  useEffect(() => {
    if (challenge.is_measure && inputRef.current && !isDone) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [challenge.is_measure, isDone]);

  async function handleComplete() {
    if (loading) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const val = challenge.is_measure && metricValue !== ""
        ? parseFloat(metricValue)
        : undefined;
      if (val !== undefined && (isNaN(val) || val < 0 || val > 1_000_000)) {
        setSubmitError("Valeur invalide. Saisis un nombre positif.");
        return;
      }
      await onComplete(val);
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  const canComplete = !challenge.is_measure || metricValue !== "";

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(22,22,42,0.5)" }} onClick={onClose} />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={challenge.title}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{
          background:    colors.surface,
          maxWidth:      720,
          margin:        "0 auto",
          maxHeight:     "85vh",
          overflowY:     "auto",
          paddingBottom: "calc(60px + env(safe-area-inset-bottom))",
          boxShadow:     shadows.lg,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
        </div>

        <div className="px-5 pb-6">
          {/* En-tête : type + durée */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full"
              style={{
                background: domain.bg_color,
                color:      domain.color,
                fontFamily: font.dm,
                fontWeight: 600,
                border:     `1px solid ${domain.border_color}`,
              }}
            >
              {challenge.type}
            </span>
            <span className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>
              ⏱ {challenge.duration}
            </span>
          </div>

          {/* Titre */}
          <h2
            className="text-[18px] leading-snug mb-4"
            style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.3px" }}
          >
            {challenge.title}
          </h2>

          {/* Question */}
          <div className="rounded-xl p-4 mb-4" style={{ background: domain.bg_color }}>
            <p className="text-[14px] leading-relaxed" style={{ fontFamily: font.dm, color: domain.color, fontWeight: 500 }}>
              {challenge.question}
            </p>
          </div>

          {/* Science — expandable */}
          {challenge.science_text && (
            <button onClick={() => setExpanded(!expanded)} className="w-full text-left mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px]" style={{ color: colors.text3, fontFamily: font.dm }}>
                  🔬 La science derrière
                </span>
                <span style={{ color: colors.text3, fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
              </div>
              {expanded && (
                <p className="text-[13px] leading-relaxed" style={{ fontFamily: font.dm, color: colors.text2 }}>
                  {challenge.science_text}
                </p>
              )}
            </button>
          )}

          {/* Input métrique */}
          {challenge.is_measure && !isDone && (
            <div className="mb-5">
              <label
                className="block text-[13px] mb-1.5"
                style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}
              >
                {challenge.metric_label}
              </label>
              {challenge.metric_sub && (
                <p className="text-[12px] mb-2" style={{ color: colors.text3, fontFamily: font.dm }}>
                  {challenge.metric_sub}
                </p>
              )}
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                placeholder="Ta valeur…"
                className="w-full outline-none text-[16px]"
                style={{
                  padding:      "13px 16px",
                  borderRadius: radii.lg,
                  border:       `2px solid ${metricValue ? domain.color : colors.border}`,
                  fontFamily:   font.dm,
                  background:   colors.surface,
                  transition:   "border-color 200ms",
                }}
              />
            </div>
          )}

          {submitError && (
            <p className="text-[13px] mb-3 text-center" style={{ color: colors.danger, fontFamily: font.dm }}>
              {submitError}
            </p>
          )}

          {/* CTA */}
          {!isDone ? (
            <div className="flex flex-col gap-2">
              <Btn
                variant="domain"
                domainColor={canComplete ? domain.color : colors.border}
                fullWidth
                disabled={!canComplete || loading}
                style={{ borderRadius: radii.xl }}
                onClick={handleComplete}
              >
                {loading ? "Enregistrement…" : "C'est fait ✓"}
              </Btn>
              {/* Bouton planifier ce défi */}
              <button
                onClick={() => setPlanOpen(true)}
                className="w-full py-3 rounded-2xl text-[14px] flex items-center justify-center gap-2 transition-all"
                style={{
                  background: colors.bg,
                  border: `1.5px solid ${colors.border}`,
                  color: colors.text2,
                  fontFamily: font.dm,
                  fontWeight: 500,
                }}
              >
                {challenge.scheduling_type === "recurring"
                  ? "🔄 Planifier en routine régulière"
                  : challenge.scheduling_type === "one_time"
                  ? "📅 Planifier ce rendez-vous"
                  : "📅 Planifier ce défi"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div
                className="w-full py-4 rounded-2xl text-[16px] text-center"
                style={{
                  background: domain.bg_color,
                  color:      domain.color,
                  fontFamily: font.dm,
                  fontWeight: 700,
                  border:     `1.5px solid ${domain.border_color}`,
                }}
              >
                ✓ Défi complété !
              </div>
              <button
                onClick={() => setPlanOpen(true)}
                className="w-full py-3 rounded-2xl text-[14px] flex items-center justify-center gap-2"
                style={{
                  background: colors.bg,
                  border: `1.5px solid ${colors.border}`,
                  color: colors.text2,
                  fontFamily: font.dm,
                  fontWeight: 500,
                }}
              >
                {challenge.scheduling_type === "recurring"
                  ? "🔄 Planifier en routine régulière"
                  : "📅 Replanifier ce défi"}
              </button>
            </div>
          )}
          {/* ── CLAUDE_DEBUG : zone de commentaire admin ── */}
          {debugMode && (
            <div
              className="mt-4 rounded-xl p-3 flex flex-col gap-2"
              style={{
                background: "#1A1A2E",
                border: "1.5px solid #6C63FF40",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono" style={{ color: "#6C63FF" }}>🤖 CLAUDE_DEBUG</span>
                <span className="text-[10px]" style={{ color: "#7B7B99", fontFamily: "monospace" }}>
                  challenge_id: {challenge.id.slice(0, 8)}…
                </span>
              </div>
              <textarea
                value={debugNote}
                onChange={(e) => { setDebugNote(e.target.value); setDebugSaved(false); }}
                placeholder="Commentaire sur ce défi (contenu, scheduling_type, améliorations…)"
                rows={4}
                className="w-full outline-none resize-none text-[13px]"
                style={{
                  background: "#0D0D1A",
                  color: "#E0E0FF",
                  border: "1px solid #6C63FF30",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontFamily: "monospace",
                  lineHeight: 1.5,
                }}
              />
              <button
                onClick={saveDebugNote}
                disabled={debugSaving || !debugNote.trim()}
                className="w-full py-2.5 rounded-lg text-[13px] font-mono font-bold transition-all"
                style={{
                  background: debugSaved ? "#1A4A2E" : "#6C63FF22",
                  border: `1px solid ${debugSaved ? "#3EC98A" : "#6C63FF"}`,
                  color: debugSaved ? "#3EC98A" : "#6C63FF",
                  cursor: debugSaving || !debugNote.trim() ? "not-allowed" : "pointer",
                  opacity: !debugNote.trim() ? 0.5 : 1,
                }}
              >
                {debugSaved ? "✓ Note sauvegardée" : debugSaving ? "Enregistrement…" : "CLAUDE_DEBUG — Sauvegarder"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sheet de planification du défi — pré-rempli selon scheduling_type */}
      {planOpen && (
        <AddEventSheet
          initialForm={{
            title:        challenge.title,
            domain_id:    domain.id,
            domain_color: domain.color,
            domain_icon:  domain.icon,
            challenge_id: challenge.id,
            event_date:   toDateStr(new Date()),
            duration_minutes: challenge.scheduling_type === "one_time" ? 60 : 30,
            // Séances régulières → pré-cocher "Régulier"
            is_recurring: challenge.scheduling_type === "recurring",
            has_reminder: true,
            reminder_minutes_before: 10,
          }}
          onClose={() => setPlanOpen(false)}
          onSave={async (form) => { await addEvent(form); }}
        />
      )}
    </>
  );
}
