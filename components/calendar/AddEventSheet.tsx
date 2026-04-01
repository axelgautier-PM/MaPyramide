"use client";

import { useState, useRef } from "react";
import type { EventForm } from "@/types/calendar";
import { emptyForm } from "@/types/calendar";
import { Btn } from "@/components/ui/Btn";
import { colors, font, radii, shadows } from "@/lib/tokens";
import { useAppStore } from "@/store/app-store";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { PushNotifModal } from "./PushNotifModal";

const DURATIONS  = [5, 10, 15, 20, 30, 45, 60, 90, 120];
const DAY_LABELS = ["L", "M", "Me", "J", "V", "S", "D"];
const REMINDER_OPTIONS = [
  { value: 0,  label: "À l'heure de l'événement" },
  { value: 5,  label: "5 min avant"  },
  { value: 10, label: "10 min avant" },
  { value: 15, label: "15 min avant" },
  { value: 30, label: "30 min avant" },
  { value: 60, label: "1h avant"     },
];

interface AddEventSheetProps {
  initialForm?: Partial<EventForm>;
  isEditing?: boolean;
  onClose: () => void;
  onSave:  (form: EventForm) => Promise<void>;
}

export function AddEventSheet({ initialForm, isEditing, onClose, onSave }: AddEventSheetProps) {
  const { domains, notifPrefs, setNotifPrefs } = useAppStore();
  const push = usePushNotifications();

  const touchStartY = useRef<number | null>(null);
  const sheetRef    = useRef<HTMLDivElement>(null);

  function onHandleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function onHandleTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && sheetRef.current) {
      sheetRef.current.style.transform  = `translateY(${Math.min(dy, 300)}px)`;
      sheetRef.current.style.transition = "none";
    }
  }
  function onHandleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (sheetRef.current) {
      sheetRef.current.style.transform  = "";
      sheetRef.current.style.transition = "";
    }
    if (dy > 80) onClose();
  }

  const [form,    setForm]    = useState<EventForm>(() => emptyForm(initialForm));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  // Affiche la pop-in d'activation push quand l'utilisateur active un rappel sans abo push
  const [showPushModal, setShowPushModal] = useState(false);
  // Champ ciblé par la vérification push ("1" = première notif, "2" = seconde)
  const [pendingReminderField, setPendingReminderField] = useState<"1" | "2" | null>(null);

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

  /** Active/désactive un rappel en vérifiant d'abord si les notifications push sont actives */
  function handleToggleReminder(field: "1" | "2") {
    const isFirst  = field === "1";
    const currentVal = isFirst ? form.has_reminder : form.has_reminder_2;

    if (currentVal) {
      // Désactivation — directe, pas besoin de vérif push
      if (isFirst) {
        set("has_reminder", false);
        set("has_reminder_2", false); // désactive aussi la seconde si on désactive la première
      } else {
        set("has_reminder_2", false);
      }
      return;
    }

    // Activation : vérifier si push est disponible et activé
    if (!push.isSupported || !push.isSubscribed) {
      // L'utilisateur n'a pas de subscription push active → afficher la pop-in
      setPendingReminderField(field);
      setShowPushModal(true);
      return;
    }

    // Push OK → activer directement
    if (isFirst) {
      set("has_reminder", true);
    } else {
      set("has_reminder_2", true);
    }
  }

  /** Appelé quand l'utilisateur confirme l'activation dans la pop-in */
  async function handlePushActivate() {
    setShowPushModal(false);
    // Active le toggle push si possible
    if (push.isSupported && !push.isSubscribed) {
      await push.subscribe();
    }
    // Marque la préférence "Notifications calendrier" dans le store
    setNotifPrefs({ notifCalendar: true });
    // Active le champ de rappel concerné
    if (pendingReminderField === "1") set("has_reminder", true);
    if (pendingReminderField === "2") set("has_reminder_2", true);
    setPendingReminderField(null);
  }

  /** Appelé quand l'utilisateur refuse la pop-in — on active quand même la notif dans le form */
  function handlePushDismiss() {
    setShowPushModal(false);
    // On active quand même le champ (la notification sera peut-être fonctionnelle plus tard)
    if (pendingReminderField === "1") set("has_reminder", true);
    if (pendingReminderField === "2") set("has_reminder_2", true);
    setPendingReminderField(null);
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
    width:        "100%",
    padding:      "12px 14px",
    borderRadius: radii.lg,
    fontSize:     15,
    fontFamily:   font.dm,
    color:        colors.text1,
    background:   colors.bg,
    border:       `1.5px solid ${colors.border}`,
    outline:      "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize:      12,
    fontFamily:    font.dm,
    fontWeight:    600,
    color:         colors.text2,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom:  6,
    display:       "block",
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(22,22,42,0.5)" }} onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Modifier le créneau" : "Nouveau créneau"}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
        style={{
          background:   colors.surface,
          maxWidth:     720,
          margin:       "0 auto",
          maxHeight:    "90vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          boxShadow:    shadows.lg,
        }}
      >
        {/* Handle */}
        <div
          className="flex justify-center pt-3 cursor-grab touch-none"
          style={{ paddingBottom: 8 }}
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
        </div>

        <div className="px-5 pt-2 pb-4 flex flex-col gap-5">
          <h2
            className="text-[18px]"
            style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, wordBreak: "break-word", overflowWrap: "anywhere" }}
          >
            {isEditing ? "Modifier le créneau" : "Nouveau créneau"}
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
                      set("domain_id",    selected ? null : d.id);
                      set("domain_color", selected ? null : d.color);
                      set("domain_icon",  selected ? null : d.icon);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] transition-all"
                    style={{
                      background: selected ? d.bg_color : colors.bg,
                      border:     `1.5px solid ${selected ? d.color : colors.border}`,
                      color:      selected ? d.color : colors.text2,
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
              onBlur={(e)  => (e.target.style.borderColor = colors.border)}
            />
          </div>

          {/* Date + Heure en colonne pour éviter la superposition du picker iOS */}
          <div className="flex flex-col gap-3">
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => set("event_date", e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                onBlur={(e)  => (e.target.style.borderColor = colors.border)}
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
                onBlur={(e)  => (e.target.style.borderColor = colors.border)}
              />
            </div>
          </div>

          {/* Durée */}
          <div>
            <label style={labelStyle}>Durée</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => {
                const selected = form.duration_minutes === d;
                const label    = d < 60 ? `${d}min` : d === 60 ? "1h" : d === 90 ? "1h30" : "2h";
                return (
                  <button
                    key={d}
                    onClick={() => set("duration_minutes", d)}
                    className="px-3 py-1.5 rounded-full text-[13px] transition-all"
                    style={{
                      background: selected ? colors.primary : colors.bg,
                      border:     `1.5px solid ${selected ? colors.primary : colors.border}`,
                      color:      selected ? "#fff" : colors.text2,
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
                  const isRec  = opt === "Régulier";
                  const selected = form.is_recurring === isRec;
                  return (
                    <button
                      key={opt}
                      onClick={() => set("is_recurring", isRec)}
                      className="px-3 py-1 rounded-full text-[12px] transition-all"
                      style={{
                        background: selected ? colors.primary : colors.bg,
                        border:     `1.5px solid ${selected ? colors.primary : colors.border}`,
                        color:      selected ? "#fff" : colors.text2,
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
                    const day      = idx + 1; // 1=Lun…7=Dim
                    const selected = form.recurrence_days.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className="flex-1 py-2 rounded-xl text-[12px] transition-all"
                        style={{
                          background: selected ? colors.primary : colors.bg,
                          border:     `1.5px solid ${selected ? colors.primary : colors.border}`,
                          color:      selected ? "#fff" : colors.text2,
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
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Jusqu&apos;au</label>
                  <input
                    type="date"
                    value={form.recurrence_end_date ?? ""}
                    onChange={(e) => set("recurrence_end_date", e.target.value || null)}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                    onBlur={(e)  => (e.target.style.borderColor = colors.border)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Notifications ── */}
          <div className="flex flex-col gap-3">
            {/* Première notification */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: `1.5px solid ${colors.border}`, background: colors.bg }}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Notification</label>
                <button
                  onClick={() => handleToggleReminder("1")}
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
                <div
                  className="px-4 pb-3"
                  style={{ borderTop: `1px solid ${colors.border}` }}
                >
                  <select
                    value={form.reminder_minutes_before}
                    onChange={(e) => set("reminder_minutes_before", Number(e.target.value))}
                    style={{ ...inputStyle, marginTop: 10, cursor: "pointer" }}
                  >
                    {REMINDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Seconde notification — visible uniquement si la première est active */}
            {form.has_reminder && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1.5px solid ${colors.border}`, background: colors.bg }}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Seconde notification
                  </label>
                  <button
                    onClick={() => handleToggleReminder("2")}
                    className="w-11 h-6 rounded-full transition-all relative"
                    style={{ background: form.has_reminder_2 ? colors.primary : colors.border }}
                    role="switch"
                    aria-checked={form.has_reminder_2}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                      style={{ left: form.has_reminder_2 ? "calc(100% - 22px)" : 2 }}
                    />
                  </button>
                </div>

                {form.has_reminder_2 && (
                  <div
                    className="px-4 pb-3"
                    style={{ borderTop: `1px solid ${colors.border}` }}
                  >
                    <select
                      value={form.reminder_minutes_before_2}
                      onChange={(e) => set("reminder_minutes_before_2", Number(e.target.value))}
                      style={{ ...inputStyle, marginTop: 10, cursor: "pointer" }}
                    >
                      {REMINDER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}
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

      {/* Pop-in activation notifications push */}
      {showPushModal && (
        <PushNotifModal
          onActivate={handlePushActivate}
          onDismiss={handlePushDismiss}
        />
      )}
    </>
  );
}
