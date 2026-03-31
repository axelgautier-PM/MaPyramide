"use client";

import { useState, useEffect } from "react";
import { useCalendar, toDateStr } from "@/lib/hooks/useCalendar";
import { useGoogleCalendar } from "@/lib/hooks/useGoogleCalendar";
import { useAppStore } from "@/store/app-store";
import { WeekStrip } from "@/components/calendar/WeekStrip";
import { WeeklyCounter } from "@/components/calendar/WeeklyCounter";
import { DayEventList } from "@/components/calendar/DayEventList";
import { AddEventSheet } from "@/components/calendar/AddEventSheet";
import { TomorrowBanner } from "@/components/calendar/TomorrowBanner";
import { CalendarOnboarding } from "@/components/calendar/CalendarOnboarding";
import { GoogleCalendarPicker } from "@/components/calendar/GoogleCalendarPicker";
import type { GoogleCalendarItem } from "@/components/calendar/GoogleCalendarPicker";
import { colors, font } from "@/lib/tokens";
import type { CalendarEvent, EventForm, GoogleCalendarEventOverlay } from "@/types/calendar";
import { emptyForm } from "@/types/calendar";
import { DebugZone } from "@/components/ui/DebugZone";

export default function CalendrierPage() {
  const { domains, isGoogleConnected } = useAppStore();

  const {
    selectedDate,
    setSelectedDate,
    weekStart,
    weekDays,
    events,
    weeklyMinutes,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useCalendar();

  const { googleEvents } = useGoogleCalendar(weekStart);

  // ── Filtres actifs ─────────────────────────────────────────────────────────
  // null = aucun filtre (tout affiché), sinon tableau d'IDs actifs
  const [activeDomains,    setActiveDomains]    = useState<string[]>([]);
  const [activeGoogleCals, setActiveGoogleCals] = useState<string[]>([]);

  // Liste dédupliquée des calendriers Google présents cette semaine
  const googleCalendarsThisWeek = Array.from(
    new Map(
      googleEvents.map((e) => [
        e.google_calendar_id,
        { id: e.google_calendar_id, name: e.google_calendar_name, color: e.calendar_color },
      ])
    ).values()
  );

  // Filtre les événements MP par domaine sélectionné
  const selectedStr       = toDateStr(selectedDate);
  const eventsForDay      = events.filter((e) => {
    const dateMatch = e.event_date === selectedStr ||
      (e.is_recurring && e.recurrence_days.includes(selectedDate.getDay() === 0 ? 7 : selectedDate.getDay()));
    if (!dateMatch) return false;
    if (activeDomains.length === 0) return true;
    return e.domain_id !== null && activeDomains.includes(e.domain_id);
  });

  // Filtre les événements Google pour le jour sélectionné + filtre calendrier
  const googleEventsForDay: GoogleCalendarEventOverlay[] = googleEvents.filter((e) => {
    if (e.event_date !== selectedStr) return false;
    if (activeGoogleCals.length === 0) return true;
    return activeGoogleCals.includes(e.google_calendar_id);
  });

  // Toggle filtre domaine
  function toggleDomainFilter(domainId: string) {
    setActiveDomains((prev) =>
      prev.includes(domainId) ? prev.filter((d) => d !== domainId) : [...prev, domainId]
    );
  }

  // Toggle filtre calendrier Google
  function toggleGoogleCalFilter(calId: string) {
    setActiveGoogleCals((prev) =>
      prev.includes(calId) ? prev.filter((c) => c !== calId) : [...prev, calId]
    );
  }

  // ── Sheet + onboarding ─────────────────────────────────────────────────────
  const [sheetOpen,       setSheetOpen]       = useState(false);
  const [initialForm,     setInitialForm]     = useState<Partial<EventForm>>({});
  const [activeEvent,     setActiveEvent]     = useState<CalendarEvent | null>(null);
  const [calOnboardingOpen, setCalOnboardingOpen] = useState(false);
  // GoogleCalendarPicker — affiché à la première connexion si aucun calendrier sauvegardé
  const [showCalPicker,   setShowCalPicker]   = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("mp_cal_welcome_done") === "true";
    if (!seen) setCalOnboardingOpen(true);
  }, []);

  // À la première connexion Google, proposer de choisir les calendriers
  useEffect(() => {
    if (!isGoogleConnected) return;
    const pickerSeen = localStorage.getItem("mp_google_cal_picker_done") === "true";
    if (!pickerSeen) setShowCalPicker(true);
  }, [isGoogleConnected]);

  function closeCalOnboarding() {
    localStorage.setItem("mp_cal_welcome_done", "true");
    setCalOnboardingOpen(false);
  }

  async function handleSaveCalendars(calendars: GoogleCalendarItem[]) {
    await fetch("/api/google-calendar/calendars", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ calendars }),
    });
    localStorage.setItem("mp_google_cal_picker_done", "true");
  }

  // Vérifie si "aujourd'hui" est sélectionné → afficher bannière "Préparer demain"
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = selectedDate.getTime() === today.getTime();

  function handlePrevWeek() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  }

  function handleNextWeek() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  }

  function openAddSheet(defaults?: Partial<EventForm>) {
    setInitialForm({ event_date: toDateStr(selectedDate), ...defaults });
    setActiveEvent(null);
    setSheetOpen(true);
  }

  function handlePrepareTomorrow() {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
  }

  function handleTapEvent(evt: CalendarEvent) {
    setActiveEvent(evt);
    setInitialForm({
      title:                   evt.title,
      domain_id:               evt.domain_id,
      domain_color:            evt.domain_color,
      domain_icon:             evt.domain_icon,
      challenge_id:            evt.challenge_id,
      event_date:              evt.event_date,
      start_time:              evt.start_time,
      duration_minutes:        evt.duration_minutes,
      is_recurring:            evt.is_recurring,
      recurrence_days:         evt.recurrence_days,
      recurrence_end_date:     evt.recurrence_end_date,
      has_reminder:            evt.has_reminder,
      reminder_minutes_before: evt.reminder_minutes_before,
      has_reminder_2:          evt.has_reminder_2,
      reminder_minutes_before_2: evt.reminder_minutes_before_2,
    });
    setSheetOpen(true);
  }

  async function handleSave(form: EventForm) {
    if (activeEvent) {
      await updateEvent(activeEvent.id, form);
    } else {
      await addEvent(form);
    }
  }

  // ── Pilule filtre ──────────────────────────────────────────────────────────
  function FilterPill({
    label, color, active, onClick,
  }: { label: string; color: string; active: boolean; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-all active:scale-95 shrink-0"
        style={{
          background: active ? color + "22" : colors.surface,
          border:     `1.5px solid ${active ? color : colors.border}`,
          color:      active ? color : colors.text3,
          fontFamily: font.dm,
          fontWeight: active ? 700 : 400,
        }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: color }}
        />
        {label}
      </button>
    );
  }

  const hasDomainFilters    = domains.length > 0;
  const hasGoogleCalFilters = isGoogleConnected && googleCalendarsThisWeek.length > 0;

  return (
    <div className="flex flex-col gap-4">

      {/* En-tête page */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-[22px]"
            style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.4px" }}
          >
            📅 Calendrier
          </h1>
          <p className="text-[14px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
            Planifie tes créneaux de développement personnel
          </p>
        </div>
        {/* Bulle info — rouvre l'onboarding calendrier */}
        <button
          onClick={() => setCalOnboardingOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all active:scale-90"
          style={{ background: colors.primaryLight, border: `1.5px solid ${colors.primary}40` }}
          aria-label="Comment fonctionne le calendrier ?"
        >
          <span style={{ fontSize: 14, color: colors.primary, fontWeight: 700, fontFamily: font.dm }}>?</span>
        </button>
      </div>

      {/* ── Filtres domaines ── */}
      {hasDomainFilters && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {domains.map((d) => (
            <FilterPill
              key={d.id}
              label={d.label}
              color={d.color}
              active={activeDomains.includes(d.id)}
              onClick={() => toggleDomainFilter(d.id)}
            />
          ))}
        </div>
      )}

      {/* ── Filtres Google Calendar (si connecté et calendriers présents cette semaine) ── */}
      {hasGoogleCalFilters && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {googleCalendarsThisWeek.map((cal) => (
            <FilterPill
              key={cal.id}
              label={cal.name}
              color={cal.color}
              active={activeGoogleCals.includes(cal.id)}
              onClick={() => toggleGoogleCalFilter(cal.id)}
            />
          ))}
        </div>
      )}

      {/* Sélecteur de semaine */}
      <WeekStrip
        weekStart={weekStart}
        weekDays={weekDays}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
      />

      {/* Compteur hebdomadaire */}
      <WeeklyCounter weeklyMinutes={weeklyMinutes} />

      {/* Erreur */}
      {error && (
        <div
          className="rounded-xl p-3 text-[13px] text-center"
          style={{ background: "#FFF0F0", color: colors.danger, border: "1px solid #FFB0B0", fontFamily: font.dm }}
        >
          {error}
        </div>
      )}

      {/* Skeleton chargement */}
      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl" style={{ background: colors.border }} />
          ))}
        </div>
      ) : (
        <DayEventList
          date={selectedDate}
          events={eventsForDay}
          googleEvents={googleEventsForDay}
          onTapEvent={handleTapEvent}
          onAddEvent={() => openAddSheet()}
        />
      )}

      {/* Bannière "Préparer demain" */}
      {isToday && (
        <TomorrowBanner onPrepareTomorrow={handlePrepareTomorrow} />
      )}

      {/* Onboarding calendrier */}
      {calOnboardingOpen && (
        <CalendarOnboarding onClose={closeCalOnboarding} />
      )}

      {/* Bottom sheet création/édition */}
      {sheetOpen && (
        <AddEventSheet
          initialForm={initialForm}
          onClose={() => { setSheetOpen(false); setActiveEvent(null); }}
          onSave={handleSave}
        />
      )}

      {/* Sélecteur calendriers Google (première connexion) */}
      {showCalPicker && (
        <GoogleCalendarPicker
          onClose={() => {
            localStorage.setItem("mp_google_cal_picker_done", "true");
            setShowCalPicker(false);
          }}
          onSave={handleSaveCalendars}
        />
      )}

      <DebugZone pageId="calendrier" />
    </div>
  );
}
