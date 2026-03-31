"use client";

import { colors, font } from "@/lib/tokens";

// ─── Modale de confirmation de déconnexion Google Calendar ────────────────────

interface GoogleDisconnectModalProps {
  onCancel:  () => void;
  onConfirm: () => void;
  loading:   boolean;
}

export function GoogleDisconnectModal({ onCancel, onConfirm, loading }: GoogleDisconnectModalProps) {
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
            style={{ background: colors.warningLight }}
          >
            🔌
          </div>
          <p
            className="text-[20px] text-center"
            style={{ fontFamily: font.dm, fontWeight: 800, color: colors.text1, letterSpacing: "-0.4px" }}
          >
            Déconnecter Google Calendar ?
          </p>
          <p
            className="text-[14px] text-center leading-relaxed"
            style={{ fontFamily: font.dm, color: colors.text2 }}
          >
            La synchronisation sera arrêtée. Tes créneaux MaPyramide <strong>restent intacts</strong> — seul le lien avec Google est supprimé.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-2.5 pt-2 pb-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-[15px] transition-all active:scale-[0.98]"
            style={{
              background: loading ? colors.border : colors.danger,
              color:      loading ? colors.text3 : "#fff",
              fontFamily: font.dm,
              fontWeight: 700,
            }}
          >
            {loading ? "Déconnexion…" : "Déconnecter"}
          </button>

          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl text-[15px] transition-all active:opacity-70"
            style={{
              background: colors.bg,
              border:     `1.5px solid ${colors.border}`,
              color:      colors.text2,
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
