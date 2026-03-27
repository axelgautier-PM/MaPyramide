"use client";

import { useState, useEffect } from "react";
import { useCalendar, toDateStr } from "@/lib/hooks/useCalendar";
import { useGoogleCalendar } from "@/lib/hooks/useGoogleCalendar";
import { WeekStrip } from "@/components/calendar/WeekStrip";
import { WeeklyCounter } from "@/components/calendar/WeeklyCounter";
import { DayEventList } from "@/components/calendar/DayEventList";
import { AddEventSheet } from "@/components/calendar/AddEventSheet";
import { TomorrowBanner } from "@/components/calendar/TomorrowBanner";
import { CalendarOnboarding } from "@/components/calendar/CalendarOnboarding";
import { colors, font } from "@/lib/tokens";
import type { CalendarEvent, EventForm } from "@/types/calendar";
import { emptyForm } from "@/types/calendar";

export default function CalendrierPage() {
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
    deleteEvent,
  } = useCalendar();

  const { googleEvents } = useGoogleCalendar(weekStart);

  // Filtrer les événements Google pour le jour sélectionné
  const selectedStr = toDateStr(selectedDate);
  const googleEventsForDay = googleEvents.filter((e) => e.event_date === selectedStr);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialForm, setInitialForm] = useState<Partial<EventForm>>({});
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  // Onboarding calendrier — s'affiche à la première visite
  const [calOnboardingOpen, setCalOnboardingOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("mp_cal_welcome_done") === "true";
    if (!seen) setCalOnboardingOpen(true);
  }, []);

  function closeCalOnboarding() {
    localStorage.setItem("mp_cal_welcome_done", "true");
    setCalOnboardingOpen(false);
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
    setInitialForm({
      event_date: toDateStr(selectedDate),
      ...defaults,
    });
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
      title:           evt.title,
      domain_id:       evt.domain_id,
      domain_color:    evt.domain_color,
      domain_icon:     evt.domain_icon,
      challenge_id:    evt.challenge_id,
      event_date:      evt.event_date,
      start_time:      evt.start_time,
      duration_minutes:evt.duration_minutes,
      is_recurring:    evt.is_recurring,
      recurrence_days: evt.recurrence_days,
      recurrence_end_date: evt.recurrence_end_date,
      has_reminder:    evt.has_reminder,
      reminder_minutes_before: evt.reminder_minutes_before,
    });
    setSheetOpen(true);
  }

  async function handleSave(form: EventForm) {
    if (activeEvent) {
      // Mise à jour — supprime + recrée (simplifié pour V2)
      await deleteEvent(activeEvent.id);
    }
    await addEvent(form);
  }

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
          style={{
            background: colors.primaryLight,
            border: `1.5px solid ${colors.primary}40`,
          }}
          aria-label="Comment fonctionne le calendrier ?"
          title="Comment fonctionne le calendrier ?"
        >
          <span style={{ fontSize: 14, color: colors.primary, fontWeight: 700, fontFamily: font.dm }}>?</span>
        </button>
      </div>

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
          events={events}
          googleEvents={googleEventsForDay}
          onTapEvent={handleTapEvent}
          onAddEvent={() => openAddSheet()}
        />
      )}

      {/* Bannière "Préparer demain" — visible uniquement si aujourd'hui sélectionné */}
      {isToday && (
        <TomorrowBanner onPrepareTomorrow={handlePrepareTomorrow} />
      )}

      {/* Onboarding calendrier (première visite + bouton ?) */}
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

    </div>
  );
}
