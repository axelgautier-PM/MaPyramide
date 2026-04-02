"use client";

import { useState, useRef, useEffect } from "react";
import { colors, font } from "@/lib/tokens";

// ─── Déclaration Web Speech API (pas de types natifs dans TS) ─────────────────
interface ISpeechRecognition extends EventTarget {
  lang:             string;
  continuous:       boolean;
  interimResults:   boolean;
  start():          void;
  stop():           void;
  onresult:         ((e: SpeechRecognitionEvent) => void) | null;
  onend:            (() => void) | null;
  onerror:          ((e: SpeechRecognitionErrorEvent) => void) | null;
}
interface SpeechRecognitionEvent   { results: SpeechRecognitionResultList }
interface SpeechRecognitionErrorEvent { error: string }

declare global {
  interface Window {
    SpeechRecognition?:       new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface CaptureBarProps {
  /** Ajoute la tâche capturée (texte déjà nettoyé) */
  onCapture: (text: string) => void;
  /** Placeholder à afficher dans l'input */
  placeholder?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function CaptureBar({ onCapture, placeholder = "Ajouter une tâche" }: CaptureBarProps) {
  const [text,      setText]      = useState("");
  const [listening, setListening] = useState(false);
  const [canAudio,  setCanAudio]  = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Vérifie si l'API audio est disponible (client-side only)
  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setCanAudio(!!SR);
  }, []);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onCapture(trimmed);
    setText("");
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  function toggleMic() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec      = new SR();
    rec.lang             = "fr-FR";
    rec.continuous       = false;
    rec.interimResults   = true;

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setText(transcript);
    };

    rec.onend = () => {
      setListening(false);
      // Soumettre automatiquement si du texte a été capturé
      setText((current) => {
        if (current.trim()) {
          onCapture(current.trim());
          return "";
        }
        return current;
      });
    };

    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
      style={{
        background: colors.surface,
        border:     `1.5px solid ${colors.primary}`,
        boxShadow:  `0 0 0 3px ${colors.primary}18`,
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Icône crayon — signale clairement un champ de saisie */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" style={{ color: colors.primary }}>
        <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Input texte */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={listening ? "J'écoute…" : placeholder}
        className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[colors.text3]"
        style={{
          fontFamily: font.dm,
          color:      colors.text1,
          minWidth:   0,
        }}
        autoComplete="off"
        autoCorrect="off"
      />

      {/* Bouton micro */}
      {canAudio && (
        <button
          onClick={toggleMic}
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90"
          style={{
            background: listening ? colors.primary : colors.primaryLight,
            color:      listening ? "#fff" : colors.primary,
          }}
          aria-label={listening ? "Arrêter l'écoute" : "Saisie vocale"}
        >
          {listening ? (
            /* Onde pulsante (stop) */
            <span className="w-2.5 h-2.5 rounded-sm block" style={{ background: "currentColor" }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="5" y="1" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 7a5 5 0 0010 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M7 12v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}

      {/* Bouton ajouter */}
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90"
        style={{
          background: text.trim() ? colors.primary : colors.border,
          color:      "#fff",
        }}
        aria-label="Ajouter la tâche"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
