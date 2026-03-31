"use client";

import { useState, useEffect, useRef } from "react";
import { colors, font } from "@/lib/tokens";

// ─── Modale de confirmation de suppression de compte (2 étapes + countdown) ───

interface DeleteModalProps {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function DeleteModal({ onCancel, onConfirm, loading }: DeleteModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCountdown() {
    setCountdown(3);
  }

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  const canConfirm = countdown === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-auto rounded-t-3xl p-6 flex flex-col gap-4"
        style={{ background: colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée */}
        <div className="w-10 h-1 rounded-full mx-auto -mt-1" style={{ background: colors.border }} />

        {/* Icône + titre */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px]"
            style={{ background: colors.dangerLight }}
          >
            🗑️
          </div>
          <p
            className="text-[20px] text-center"
            style={{ fontFamily: font.dm, fontWeight: 800, color: colors.text1, letterSpacing: "-0.4px" }}
          >
            Supprimer mon compte ?
          </p>
          <p
            className="text-[14px] text-center leading-relaxed"
            style={{ fontFamily: font.dm, color: colors.text2 }}
          >
            Cette action est <strong>irréversible</strong>. Toute ta progression, tes défis et ton streak seront définitivement supprimés.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-2.5 pt-2 pb-2">
          {countdown === null ? (
            <button
              onClick={startCountdown}
              className="w-full py-4 rounded-2xl text-[15px] transition-all active:scale-[0.98]"
              style={{ background: colors.danger, color: "#fff", fontFamily: font.dm, fontWeight: 700 }}
            >
              Supprimer définitivement
            </button>
          ) : (
            <button
              onClick={canConfirm ? onConfirm : undefined}
              disabled={!canConfirm || loading}
              className="w-full py-4 rounded-2xl text-[15px] transition-all"
              style={{
                background: canConfirm ? colors.danger : colors.border,
                color: canConfirm ? "#fff" : colors.text3,
                fontFamily: font.dm,
                fontWeight: 700,
                cursor: canConfirm ? "pointer" : "not-allowed",
              }}
            >
              {loading
                ? "Suppression…"
                : canConfirm
                ? "Confirmer la suppression"
                : `Confirmer (${countdown}…)`}
            </button>
          )}

          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl text-[15px] transition-all active:opacity-70"
            style={{
              background: colors.bg,
              border: `1.5px solid ${colors.border}`,
              color: colors.text2,
              fontFamily: font.dm,
              fontWeight: 500,
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
