"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import type { CalendarEvent, EventForm } from "@/types/calendar";

/** Retourne le lundi de la semaine contenant la date donnée */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dim
  const diff = day === 0 ? -6 : 1 - day; // ramène au lundi
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Retourne les 7 dates de la semaine (Lun → Dim) */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Formate une Date en YYYY-MM-DD en heure LOCALE (pas UTC) pour éviter le décalage d'un jour */
export function toDateStr(date: Date): string {
  const y   = date.getFullYear();
  const m   = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Expanse les événements récurrents sur une plage de dates.
 * Un événement récurrent avec recurrence_days=[1,3] génère
 * une instance virtuelle pour chaque Lun et Mer de la semaine affichée.
 */
function expandRecurring(events: CalendarEvent[], weekDays: Date[]): CalendarEvent[] {
  const expanded: CalendarEvent[] = [];

  for (const evt of events) {
    if (!evt.is_recurring || evt.recurrence_days.length === 0) {
      expanded.push(evt);
      continue;
    }

    for (const day of weekDays) {
      const isoDay = toDateStr(day);
      // 1=Lun … 7=Dim (getDay() retourne 0=dim, 1=lun…)
      const jsDay = day.getDay();
      const isoWeekDay = jsDay === 0 ? 7 : jsDay;

      if (!evt.recurrence_days.includes(isoWeekDay)) continue;
      if (evt.recurrence_end_date && isoDay > evt.recurrence_end_date) continue;

      expanded.push({ ...evt, id: `${evt.id}-${isoDay}`, event_date: isoDay });
    }
  }

  return expanded;
}

export interface UseCalendarReturn {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  weekStart: Date;
  weekDays: Date[];
  events: CalendarEvent[];        // événements du jour sélectionné (expansés)
  weekEvents: CalendarEvent[];    // tous les événements de la semaine (expansés)
  weeklyMinutes: number;          // total minutes de la semaine
  loading: boolean;
  error: string | null;
  addEvent: (form: EventForm) => Promise<void>;
  updateEvent: (id: string, form: Partial<EventForm>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

/** Déclenche une sync MP → Google Calendar de façon non bloquante */
async function triggerGoogleSync(action: "create" | "update" | "delete", payload: {
  event?: import("@/types/calendar").CalendarEvent;
  google_event_id?: string;
  mp_event_id?: string;
}) {
  try {
    await fetch("/api/google-calendar/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    // Sync non bloquant — on n'interrompt pas l'UX si Google échoue
  }
}

export function useCalendar(): UseCalendarReturn {
  const { profile, isGoogleConnected } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [rawEvents, setRawEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStart = getWeekStart(selectedDate);
  const weekDays = getWeekDays(weekStart);
  const weekEnd = weekDays[6];
  const weekStartStr = toDateStr(weekStart);

  // Charge les événements de la semaine (+ récurrents pouvant tomber dans la semaine)
  const load = useCallback(async () => {
    if (!profile) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", profile.id)
        .or(
          `is_recurring.eq.true,and(event_date.gte.${weekStartStr},event_date.lte.${toDateStr(weekEnd)})`
        )
        .order("start_time");

      if (err) throw err;
      setRawEvents(data ?? []);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger le calendrier.");
    } finally {
      setLoading(false);
    }
  }, [profile?.id, weekStartStr]);

  useEffect(() => { load(); }, [load]);

  // Expansion des récurrents sur la semaine affichée
  const weekEvents = expandRecurring(rawEvents, weekDays);

  const selectedStr = toDateStr(selectedDate);
  const events = weekEvents
    .filter((e) => e.event_date === selectedStr)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const weeklyMinutes = weekEvents.reduce((sum, e) => sum + e.duration_minutes, 0);

  const addEvent = useCallback(async (form: EventForm) => {
    if (!profile) return;
    const { data: created, error: err } = await supabase
      .from("calendar_events")
      .insert({ user_id: profile.id, ...form })
      .select()
      .single();
    if (err) throw err;
    await load();

    // Sync MP → Google (non récurrents uniquement)
    if (isGoogleConnected && created && !form.is_recurring) {
      await triggerGoogleSync("create", {
        event: created as import("@/types/calendar").CalendarEvent,
        mp_event_id: created.id as string,
      });
    }
  }, [profile?.id, load, isGoogleConnected]);

  const updateEvent = useCallback(async (id: string, form: Partial<EventForm>) => {
    // Les IDs virtuels (récurrents expansés) contiennent un "-YYYY-MM-DD" — on extrait l'UUID de base
    const baseId = id.length > 36 ? id.slice(0, 36) : id;
    const { data: updated, error: err } = await supabase
      .from("calendar_events")
      .update(form)
      .eq("id", baseId)
      .select()
      .single();
    if (err) throw err;
    await load();

    // Sync MP → Google : chercher le google_event_id dans calendar_sync_map
    if (isGoogleConnected && updated && !form.is_recurring) {
      const { data: syncRow } = await supabase
        .from("calendar_sync_map")
        .select("google_event_id")
        .eq("user_id", profile?.id ?? "")
        .eq("mp_event_id", baseId)
        .maybeSingle();
      if (syncRow?.google_event_id) {
        await triggerGoogleSync("update", {
          event: updated as import("@/types/calendar").CalendarEvent,
          google_event_id: syncRow.google_event_id,
        });
      }
    }
  }, [load, isGoogleConnected, profile?.id]);

  const deleteEvent = useCallback(async (id: string) => {
    const baseId = id.length > 36 ? id.slice(0, 36) : id;

    // Récupérer le google_event_id avant suppression (la cascade supprimera la ligne sync_map)
    let googleEventId: string | null = null;
    if (isGoogleConnected) {
      const { data: syncRow } = await supabase
        .from("calendar_sync_map")
        .select("google_event_id")
        .eq("user_id", profile?.id ?? "")
        .eq("mp_event_id", baseId)
        .maybeSingle();
      googleEventId = syncRow?.google_event_id ?? null;
    }

    const { error: err } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", baseId);
    if (err) throw err;
    await load();

    if (isGoogleConnected && googleEventId) {
      await triggerGoogleSync("delete", { google_event_id: googleEventId });
    }
  }, [load, isGoogleConnected, profile?.id]);

  return {
    selectedDate,
    setSelectedDate,
    weekStart,
    weekDays,
    events,
    weekEvents,
    weeklyMinutes,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
