"use client";

import { useState } from "react";
import { useCalendar, toDateStr } from "@/lib/hooks/useCalendar";
import { WeekStrip } from "@/components/calendar/WeekStrip";
import { WeeklyCounter } from "@/components/calendar/WeeklyCounter";
import { DayEventList } from "@/components/calendar/DayEventList";
import { AddEventSheet } from "@/components/calendar/AddEventSheet";
import { TomorrowBanner } from "@/components/calendar/TomorrowBanner";
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

  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialForm, setInitialForm] = useState<Partial<EventForm>>({});
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

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
          onTapEvent={handleTapEvent}
          onAddEvent={() => openAddSheet()}
        />
      )}

      {/* Bannière "Préparer demain" — visible uniquement si aujourd'hui sélectionné */}
      {isToday && (
        <TomorrowBanner onPrepareTomorrow={handlePrepareTomorrow} />
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
