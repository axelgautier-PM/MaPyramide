"use client";

import { useState, useEffect, useRef } from "react";
import type { Challenge, Domain } from "@/types";

interface CompleteSheetProps {
  challenge: Challenge;
  domain: Domain;
  isDone: boolean;
  onClose: () => void;
  onComplete: (metricValue?: number) => Promise<void>;
}

export function CompleteSheet({
  challenge,
  domain,
  isDone,
  onClose,
  onComplete,
}: CompleteSheetProps) {
  const [metricValue, setMetricValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus l'input si is_measure
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
      const val =
        challenge.is_measure && metricValue !== ""
          ? parseFloat(metricValue)
          : undefined;
      // Validation basique de la valeur métrique
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
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={challenge.title}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{
          background: "white",
          maxWidth: 720,
          margin: "0 auto",
          maxHeight: "85vh",
          overflowY: "auto",
          // 60px BottomNav + safe area pour ne pas être masqué
          paddingBottom: "calc(60px + env(safe-area-inset-bottom))",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "#E0DDD6" }}
          />
        </div>

        <div className="px-5 pb-6">
          {/* En-tête : type + durée */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: domain.bg_color,
                color: domain.color,
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                border: `1px solid ${domain.border_color}`,
              }}
            >
              {challenge.type}
            </span>
            <span
              className="text-[11px]"
              style={{ color: "#A8A5A0", fontFamily: "var(--font-dm-sans)" }}
            >
              ⏱ {challenge.duration}
            </span>
          </div>

          {/* Titre */}
          <h2
            className="text-[18px] leading-snug mb-4"
            style={{ fontFamily: "var(--font-syne)", fontWeight: 800, color: "#1A1916" }}
          >
            {challenge.title}
          </h2>

          {/* Question / instructions */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: domain.bg_color }}
          >
            <p
              className="text-[14px] leading-relaxed"
              style={{
                fontFamily: "var(--font-dm-sans)",
                color: domain.color,
                fontWeight: 500,
              }}
            >
              {challenge.question}
            </p>
          </div>

          {/* Science — expandable */}
          {challenge.science_text && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-left mb-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[12px]"
                  style={{ color: "#A8A5A0", fontFamily: "var(--font-dm-sans)" }}
                >
                  🔬 La science derrière
                </span>
                <span style={{ color: "#A8A5A0", fontSize: 12 }}>
                  {expanded ? "▲" : "▼"}
                </span>
              </div>
              {expanded && (
                <p
                  className="text-[13px] leading-relaxed"
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    color: "#6B6860",
                  }}
                >
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
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                  color: "#1A1916",
                }}
              >
                {challenge.metric_label}
              </label>
              {challenge.metric_sub && (
                <p
                  className="text-[12px] mb-2"
                  style={{ color: "#A8A5A0", fontFamily: "var(--font-dm-sans)" }}
                >
                  {challenge.metric_sub}
                </p>
              )}
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                placeholder="Ta valeur..."
                className="w-full rounded-xl px-4 py-3 text-[16px] outline-none"
                style={{
                  border: `2px solid ${metricValue ? domain.color : "#E0DDD6"}`,
                  fontFamily: "var(--font-dm-sans)",
                  background: "white",
                  transition: "border-color 200ms",
                }}
              />
            </div>
          )}

          {/* Message d'erreur */}
          {submitError && (
            <p
              className="text-[13px] mb-3 text-center"
              style={{ color: "#B84020", fontFamily: "var(--font-dm-sans)" }}
            >
              {submitError}
            </p>
          )}

          {/* Bouton complétion */}
          {!isDone ? (
            <button
              onClick={handleComplete}
              disabled={!canComplete || loading}
              className="w-full py-4 rounded-2xl text-[16px] transition-all"
              style={{
                background: canComplete ? domain.color : "#E0DDD6",
                color: canComplete ? "white" : "#A8A5A0",
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                cursor: canComplete ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Enregistrement…" : "C'est fait ✓"}
            </button>
          ) : (
            <div
              className="w-full py-4 rounded-2xl text-[16px] text-center"
              style={{
                background: domain.bg_color,
                color: domain.color,
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                border: `1px solid ${domain.border_color}`,
              }}
            >
              ✓ Défi complété !
            </div>
          )}
        </div>
      </div>
    </>
  );
}
