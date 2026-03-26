"use client";

import { useState } from "react";
import type { EventForm } from "@/types/calendar";
import { emptyForm } from "@/types/calendar";
import { Btn } from "@/components/ui/Btn";
import { colors, font, radii, shadows } from "@/lib/tokens";
import { useAppStore } from "@/store/app-store";

const DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];
const DAY_LABELS = ["L", "M", "Me", "J", "V", "S", "D"];

interface AddEventSheetProps {
  initialForm?: Partial<EventForm>;
  onClose: () => void;
  onSave: (form: EventForm) => Promise<void>;
}

export function AddEventSheet({ initialForm, onClose, onSave }: AddEventSheetProps) {
  const { domains } = useAppStore();
  const [form, setForm] = useState<EventForm>(() => emptyForm(initialForm));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(day: number) {
    set(
      "recurrence_days",
      form.recurrence_days.includes(day)
        ? form.recurrence_days.filter((d) => d !== day)
        : [...form.recurrence_days, day].sort()
    );
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Le titre est requis."); return; }
    setLoading(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch {
      setError("Erreur lors de l'enregistrement. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: radii.lg,
    fontSize: 15,
    fontFamily: font.dm,
    color: colors.text1,
    background: colors.bg,
    border: `1.5px solid ${colors.border}`,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontFamily: font.dm,
    fontWeight: 600,
    color: colors.text2,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 6,
    display: "block",
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(22,22,42,0.5)" }} onClick={onClose} />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nouveau créneau"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
        style={{
          background: colors.surface,
          maxWidth: 720,
          margin: "0 auto",
          maxHeight: "90vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          boxShadow: shadows.lg,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
        </div>

        <div className="px-5 pt-2 pb-4 flex flex-col gap-5">
          <h2 className="text-[18px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}>
            Nouveau créneau
          </h2>

          {/* Domaine */}
          <div>
            <label style={labelStyle}>Domaine</label>
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => {
                const selected = form.domain_id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      set("domain_id", selected ? null : d.id);
                      set("domain_color", selected ? null : d.color);
                      set("domain_icon", selected ? null : d.icon);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] transition-all"
                    style={{
                      background: selected ? d.bg_color : colors.bg,
                      border: `1.5px solid ${selected ? d.color : colors.border}`,
                      color: selected ? d.color : colors.text2,
                      fontFamily: font.dm,
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    <span>{d.icon}</span>
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label style={labelStyle}>Titre</label>
            <input
              type="text"
              placeholder="Ex : Mesurer mes pas"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = colors.primary)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
          </div>

          {/* Date + Heure — en colonne pour éviter la superposition du picker iOS */}
          <div className="flex flex-col gap-3">
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => set("event_date", e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                onBlur={(e) => (e.target.style.borderColor = colors.border)}
              />
            </div>
            <div>
              <label style={labelStyle}>Heure de début</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                onBlur={(e) => (e.target.style.borderColor = colors.border)}
              />
            </div>
          </div>

          {/* Durée */}
          <div>
            <label style={labelStyle}>Durée</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => {
                const selected = form.duration_minutes === d;
                const label = d < 60 ? `${d}min` : d === 60 ? "1h" : d === 90 ? "1h30" : "2h";
                return (
                  <button
                    key={d}
                    onClick={() => set("duration_minutes", d)}
                    className="px-3 py-1.5 rounded-full text-[13px] transition-all"
                    style={{
                      background: selected ? colors.primary : colors.bg,
                      border: `1.5px solid ${selected ? colors.primary : colors.border}`,
                      color: selected ? "#fff" : colors.text2,
                      fontFamily: font.dm,
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Récurrence */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label style={{ ...labelStyle, marginBottom: 0 }}>Récurrence</label>
              <div className="flex gap-2">
                {(["Ponctuel", "Régulier"] as const).map((opt) => {
                  const isRec = opt === "Régulier";
                  const selected = form.is_recurring === isRec;
                  return (
                    <button
                      key={opt}
                      onClick={() => set("is_recurring", isRec)}
                      className="px-3 py-1 rounded-full text-[12px] transition-all"
                      style={{
                        background: selected ? colors.primary : colors.bg,
                        border: `1.5px solid ${selected ? colors.primary : colors.border}`,
                        color: selected ? "#fff" : colors.text2,
                        fontFamily: font.dm,
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {form.is_recurring && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((lbl, idx) => {
                    const day = idx + 1; // 1=Lun…7=Dim
                    const selected = form.recurrence_days.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className="flex-1 py-2 rounded-xl text-[12px] transition-all"
                        style={{
                          background: selected ? colors.primary : colors.bg,
                          border: `1.5px solid ${selected ? colors.primary : colors.border}`,
                          color: selected ? "#fff" : colors.text2,
                          fontFamily: font.dm,
                          fontWeight: selected ? 700 : 400,
                        }}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Jusqu'au</label>
                  <input
                    type="date"
                    value={form.recurrence_end_date ?? ""}
                    onChange={(e) => set("recurrence_end_date", e.target.value || null)}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                    onBlur={(e) => (e.target.style.borderColor = colors.border)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rappel */}
          <div>
            <div className="flex items-center justify-between">
              <label style={{ ...labelStyle, marginBottom: 0 }}>Rappel in-app</label>
              <button
                onClick={() => set("has_reminder", !form.has_reminder)}
                className="w-11 h-6 rounded-full transition-all relative"
                style={{ background: form.has_reminder ? colors.primary : colors.border }}
                role="switch"
                aria-checked={form.has_reminder}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: form.has_reminder ? "calc(100% - 22px)" : 2 }}
                />
              </button>
            </div>

            {form.has_reminder && (
              <div className="mt-3">
                <label style={{ ...labelStyle, marginBottom: 4 }}>Minutes avant</label>
                <select
                  value={form.reminder_minutes_before}
                  onChange={(e) => set("reminder_minutes_before", Number(e.target.value))}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value={0}>À l&apos;heure de l&apos;événement</option>
                  {[5, 10, 15, 30, 60].map((m) => (
                    <option key={m} value={m}>{m} min avant</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <p className="text-[13px]" style={{ color: colors.danger, fontFamily: font.dm }}>
              {error}
            </p>
          )}

          <Btn
            variant="primary"
            fullWidth
            disabled={loading || !form.title.trim()}
            style={{ borderRadius: radii.xl, padding: "16px 24px", fontSize: 16 }}
            onClick={handleSave}
          >
            {loading ? "Enregistrement…" : "Enregistrer le créneau ✓"}
          </Btn>
        </div>
      </div>
    </>
  );
}
