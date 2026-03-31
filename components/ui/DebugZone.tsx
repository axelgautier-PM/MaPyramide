"use client";

import { useState, useEffect } from "react";
import { font } from "@/lib/tokens";

// ─── Zone de commentaire CLAUDE_DEBUG — visible uniquement en mode debug ──────
// Usage : <DebugZone pageId="objectifs" /> en bas de chaque page principale

interface DebugZoneProps {
  /** Identifiant unique de la page (ex: "objectifs", "defis", "calendrier") */
  pageId: string;
}

export function DebugZone({ pageId }: DebugZoneProps) {
  const [visible, setVisible] = useState(false);
  const [note,    setNote]    = useState("");
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVisible(localStorage.getItem("mp_debug_mode") === "true");
    setNote(localStorage.getItem(`mp_debug_note_${pageId}`) ?? "");
  }, [pageId]);

  if (!visible) return null;

  function save() {
    localStorage.setItem(`mp_debug_note_${pageId}`, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div
      className="mt-4 rounded-xl p-3 flex flex-col gap-2"
      style={{ background: "#1A1A2E", border: "1.5px solid #6C63FF40" }}
    >
      {/* En-tête */}
      <div className="flex items-center gap-2">
        <span className="text-[11px]" style={{ color: "#6C63FF", fontFamily: "monospace", fontWeight: 700 }}>
          🤖 CLAUDE_DEBUG
        </span>
        <span className="text-[10px]" style={{ color: "#7B7B99", fontFamily: "monospace" }}>
          page: {pageId}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        placeholder={`Commentaires sur la page "${pageId}" : UX, contenus à améliorer, bugs observés…`}
        rows={3}
        className="w-full outline-none resize-none text-[12px] bg-transparent"
        style={{
          fontFamily:  "monospace",
          color:       "#9090BB",
          lineHeight:  1.6,
        }}
      />

      {/* Bouton sauvegarder (localStorage) */}
      <button
        onClick={save}
        className="w-full py-2 rounded-lg text-[12px] transition-all"
        style={{
          fontFamily:  "monospace",
          fontWeight:  700,
          background:  saved ? "#1A4A2E" : "#6C63FF22",
          border:      `1px solid ${saved ? "#3EC98A" : "#6C63FF"}`,
          color:       saved ? "#3EC98A" : "#6C63FF",
        }}
      >
        {saved ? "✓ Note sauvegardée (localStorage)" : "CLAUDE_DEBUG — Sauvegarder"}
      </button>

      {/* Rappel: les notes sont locales */}
      <p className="text-[10px] text-center" style={{ fontFamily: font.dm, color: "#6B6B88" }}>
        Notes stockées localement sur cet appareil uniquement
      </p>
    </div>
  );
}
