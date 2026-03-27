/** Types pour le module Calendrier — MaPyramide V2 */

export interface CalendarEvent {
  id: string;
  user_id: string;
  challenge_id: string | null;
  domain_id: string | null;

  title: string;
  domain_color: string | null;
  domain_icon: string | null;

  event_date: string;        // format YYYY-MM-DD
  start_time: string;        // format HH:MM
  duration_minutes: number;

  is_recurring: boolean;
  recurrence_days: number[]; // [1..7] Lun=1…Dim=7
  recurrence_end_date: string | null;

  has_reminder: boolean;
  reminder_minutes_before: number;

  created_at: string;
}

/** Formulaire de création / édition d'un événement */
export interface EventForm {
  title: string;
  domain_id: string | null;
  domain_color: string | null;
  domain_icon: string | null;
  challenge_id: string | null;
  event_date: string;        // YYYY-MM-DD
  start_time: string;        // HH:MM
  duration_minutes: number;
  is_recurring: boolean;
  recurrence_days: number[];
  recurrence_end_date: string | null;
  has_reminder: boolean;
  reminder_minutes_before: number;
}

/** Retourne la date locale au format YYYY-MM-DD (sans décalage UTC) */
function localDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyForm(defaults?: Partial<EventForm>): EventForm {
  const today = localDateStr();
  return {
    title: "",
    domain_id: null,
    domain_color: null,
    domain_icon: null,
    challenge_id: null,
    event_date: today,
    start_time: "08:00",
    duration_minutes: 30,
    is_recurring: false,
    recurrence_days: [],
    recurrence_end_date: null,
    has_reminder: false,
    reminder_minutes_before: 15,
    ...defaults,
  };
}

/** Événement Google Calendar affiché en lecture seule dans la vue semaine */
export interface GoogleCalendarEventOverlay {
  id: string;
  title: string;
  event_date: string;        // YYYY-MM-DD
  start_time: string;        // HH:MM
  duration_minutes: number;
  is_google_overlay: true;   // discriminant — jamais éditable
}

/** Groupe horaire pour l'affichage */
export type TimeGroup = "Matin" | "Après-midi" | "Soir";

export function getTimeGroup(startTime: string): TimeGroup {
  const hour = parseInt(startTime.slice(0, 2), 10);
  if (hour < 12) return "Matin";
  if (hour < 18) return "Après-midi";
  return "Soir";
}

/** Formate une durée en Xh Ymin */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Formate le total de la semaine */
export function formatWeeklyTotal(minutes: number): string {
  if (minutes === 0) return "Aucun créneau cette semaine";
  return `⏱ ${formatDuration(minutes)} planifiées cette semaine`;
}
