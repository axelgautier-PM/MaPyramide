"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import type { GoogleCalendarEventOverlay } from "@/types/calendar";
import { toDateStr } from "@/lib/hooks/useCalendar";

export interface UseGoogleCalendarReturn {
  googleEvents: GoogleCalendarEventOverlay[];
  loadingGoogle: boolean;
}

/**
 * Charge les événements Google Calendar pour la semaine en cours (overlay lecture seule).
 * Non bloquant — si Google échoue, retourne un tableau vide sans erreur visible.
 */
export function useGoogleCalendar(weekStart: Date): UseGoogleCalendarReturn {
  const { isGoogleConnected } = useAppStore();
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEventOverlay[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const weekStartStr = toDateStr(weekStart);

  useEffect(() => {
    if (!isGoogleConnected) {
      setGoogleEvents([]);
      return;
    }

    let cancelled = false;
    setLoadingGoogle(true);

    fetch(`/api/google-calendar/events?weekStart=${weekStartStr}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { events: GoogleCalendarEventOverlay[] }) => {
        if (!cancelled) setGoogleEvents(data.events ?? []);
      })
      .catch(() => {
        if (!cancelled) setGoogleEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGoogle(false);
      });

    return () => { cancelled = true; };
  }, [isGoogleConnected, weekStartStr]);

  return { googleEvents, loadingGoogle };
}
