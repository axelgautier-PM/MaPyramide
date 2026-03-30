"use client";

import { useState, useEffect } from "react";
import { Btn } from "@/components/ui/Btn";
import { colors, font, radii, shadows } from "@/lib/tokens";

/** Palette de couleurs proposées pour les calendriers Google
 * Respecte la charte graphique MaPyramide — exclut les nuances proches des couleurs de domaines */
export const CALENDAR_COLORS = [
  { hex: "#4285F4", label: "Bleu Google"   },
  { hex: "#6C63FF", label: "Violet"        },
  { hex: "#3EC98A", label: "Vert"          },
  { hex: "#FF6B6B", label: "Rouge"         },
  { hex: "#FF8C42", label: "Orange"        },
  { hex: "#E97FCC", label: "Rose"          },
  { hex: "#4ECDC4", label: "Turquoise"     },
  { hex: "#FFD166", label: "Jaune"         },
  { hex: "#7B7B99", label: "Gris"          },
  { hex: "#44BBA4", label: "Vert sauge"    },
];

export interface GoogleCalendarItem {
  id:          string;
  name:        string;
  color:       string;
  is_selected: boolean;
}

interface GoogleCalendarPickerProps {
  onClose: () => void;
  onSave:  (calendars: GoogleCalendarItem[]) => Promise<void>;
}

/**
 * Bottom sheet de sélection des calendriers Google à synchroniser.
 * Affiché à la première connexion Google Calendar et accessible depuis le profil.
 */
export function GoogleCalendarPicker({ onClose, onSave }: GoogleCalendarPickerProps) {
  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  // ID du calendrier dont on affiche le color picker
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);

  // Charge la liste des calendriers Google de l'utilisateur
  useEffect(() => {
    fetch("/api/google-calendar/calendars")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { calendars: GoogleCalendarItem[] }) => {
        setCalendars(data.calendars ?? []);
      })
      .catch(() => setError("Impossible de charger les calendriers Google."))
      .finally(() => setLoading(false));
  }, []);

  // Toggle sélection d'un calendrier
  function toggleCalendar(id: string) {
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_selected: !c.is_selected } : c))
    );
  }

  // Mise à jour de la couleur d'un calendrier
  function setColor(id: string, color: string) {
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, color } : c))
    );
    setPickerOpenFor(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(calendars);
      onClose();
    } catch {
      setError("Erreur lors de l'enregistrement. Réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(22,22,42,0.5)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sélectionner les calendriers Google"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
        style={{
          background:   colors.surface,
          maxWidth:     720,
          margin:       "0 auto",
          maxHeight:    "85vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          boxShadow:    shadows.lg,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
        </div>

        <div className="px-5 pt-2 pb-4 flex flex-col gap-5">
          {/* En-tête */}
          <div>
            <h2
              className="text-[18px]"
              style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}
            >
              Calendriers Google
            </h2>
            <p
              className="text-[13px] mt-1"
              style={{ fontFamily: font.dm, color: colors.text2 }}
            >
              Choisis quels calendriers afficher dans MaPyramide et leur couleur.
            </p>
          </div>

          {/* États de chargement / erreur */}
          {loading && (
            <div className="flex flex-col gap-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl" style={{ background: colors.border }} />
              ))}
            </div>
          )}

          {error && (
            <div
              className="rounded-xl p-3 text-[13px]"
              style={{ background: "#FFF0F0", color: colors.danger, fontFamily: font.dm }}
            >
              {error}
            </div>
          )}

          {/* Liste des calendriers */}
          {!loading && !error && calendars.length === 0 && (
            <p
              className="text-[14px] text-center py-6"
              style={{ fontFamily: font.dm, color: colors.text3 }}
            >
              Aucun calendrier trouvé dans ton compte Google.
            </p>
          )}

          {!loading && calendars.map((cal) => (
            <div key={cal.id} className="flex flex-col gap-2">
              {/* Ligne principale : toggle sélection + nom + swatch couleur */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: cal.is_selected ? colors.bg : colors.surface,
                  border:     `1.5px solid ${cal.is_selected ? cal.color + "60" : colors.border}`,
                  transition: "all 150ms",
                }}
              >
                {/* Swatch couleur (ouvre le picker) */}
                <button
                  onClick={() => setPickerOpenFor(pickerOpenFor === cal.id ? null : cal.id)}
                  className="w-7 h-7 rounded-full shrink-0 transition-all active:scale-90"
                  style={{ background: cal.color, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}
                  title="Changer la couleur"
                  aria-label={`Couleur de ${cal.name}`}
                />

                {/* Nom */}
                <span
                  className="flex-1 text-[14px]"
                  style={{
                    fontFamily: font.dm,
                    fontWeight: 600,
                    color:      cal.is_selected ? colors.text1 : colors.text3,
                  }}
                >
                  {cal.name}
                </span>

                {/* Toggle sélection */}
                <button
                  onClick={() => toggleCalendar(cal.id)}
                  className="w-11 h-6 rounded-full transition-all relative shrink-0"
                  style={{ background: cal.is_selected ? cal.color : colors.border }}
                  role="switch"
                  aria-checked={cal.is_selected}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: cal.is_selected ? "calc(100% - 22px)" : 2 }}
                  />
                </button>
              </div>

              {/* Palette couleurs inline (visible quand picker ouvert pour ce calendrier) */}
              {pickerOpenFor === cal.id && (
                <div
                  className="flex flex-wrap gap-2 px-4 py-3 rounded-xl"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                >
                  {CALENDAR_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setColor(cal.id, c.hex)}
                      title={c.label}
                      className="w-8 h-8 rounded-full transition-all active:scale-90"
                      style={{
                        background:  c.hex,
                        border:      cal.color === c.hex ? `3px solid ${colors.text1}` : "3px solid transparent",
                        boxShadow:   "0 1px 4px rgba(0,0,0,0.15)",
                      }}
                      aria-label={c.label}
                      aria-pressed={cal.color === c.hex}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Bouton enregistrer */}
          {!loading && calendars.length > 0 && (
            <Btn
              variant="primary"
              fullWidth
              disabled={saving}
              style={{ borderRadius: radii.xl, padding: "16px 24px", fontSize: 16 }}
              onClick={handleSave}
            >
              {saving ? "Enregistrement…" : "Enregistrer la sélection ✓"}
            </Btn>
          )}
        </div>
      </div>
    </>
  );
}
