import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGoogleAccessToken } from "@/lib/google-token";
import type { GoogleCalendarEventOverlay } from "@/types/calendar";

const GOOGLE_API = "https://www.googleapis.com/calendar/v3";

// Convertit un datetime RFC3339 (ex: "2026-03-27T09:00:00+01:00") en HH:MM local
function toHHMM(dateTime: string): string {
  const d = new Date(dateTime);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Extrait la date locale YYYY-MM-DD depuis un dateTime ou date Google
function toDateStr(dateTime: string | undefined, date: string | undefined): string {
  if (date) return date;
  if (!dateTime) return "";
  const d = new Date(dateTime);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** GET /api/google-calendar/events?weekStart=YYYY-MM-DD
 * Retourne les événements Google Calendar pour tous les calendriers sélectionnés,
 * enrichis de la couleur et du nom de calendrier choisis par l'utilisateur. */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const weekStart = request.nextUrl.searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "weekStart requis" }, { status: 400 });

  // Calculer weekEnd (weekStart + 6 jours)
  const startDate = new Date(weekStart + "T00:00:00");
  const endDate   = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  endDate.setHours(23, 59, 59, 999);

  const accessToken = await getGoogleAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "Token Google non disponible" }, { status: 401 });

  // Récupère les calendriers sélectionnés par l'utilisateur
  const { data: savedCals } = await supabase
    .from("google_calendars")
    .select("google_calendar_id, name, color, is_selected")
    .eq("user_id", user.id)
    .eq("is_selected", true);

  // Si aucun calendrier sauvegardé → utilise le calendrier principal par défaut
  const calList: Array<{ id: string; name: string; color: string }> =
    (savedCals ?? []).length > 0
      ? (savedCals ?? []).map((c: { google_calendar_id: string; name: string; color: string }) => ({
          id:    c.google_calendar_id,
          name:  c.name,
          color: c.color,
        }))
      : [{ id: "primary", name: "Principal", color: "#4285F4" }];

  // Récupère les IDs Google déjà poussés depuis MaPyramide (pour éviter doublons)
  const { data: syncMap } = await supabase
    .from("calendar_sync_map")
    .select("google_event_id")
    .eq("user_id", user.id);

  const mpGoogleIds = new Set(
    (syncMap ?? []).map((r: { google_event_id: string }) => r.google_event_id)
  );

  const params = new URLSearchParams({
    timeMin:      startDate.toISOString(),
    timeMax:      endDate.toISOString(),
    singleEvents: "true",
    orderBy:      "startTime",
    maxResults:   "250",
  });

  const overlays: GoogleCalendarEventOverlay[] = [];

  // Parcourt chaque calendrier sélectionné
  for (const cal of calList) {
    const calId = cal.id === "primary" ? "primary" : encodeURIComponent(cal.id);
    const res   = await fetch(`${GOOGLE_API}/calendars/${calId}/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) continue; // Calendrier inaccessible — on ignore silencieusement

    const data = await res.json() as {
      items?: Array<{
        id: string;
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?:   { dateTime?: string; date?: string };
      }>;
    };

    for (const item of data.items ?? []) {
      if (mpGoogleIds.has(item.id)) continue;  // déjà dans MaPyramide — évite les doublons
      if (!item.start?.dateTime)    continue;  // journée entière sans heure

      const startDt = item.start.dateTime;
      const endDt   = item.end?.dateTime;
      const durationMinutes = endDt
        ? Math.round((new Date(endDt).getTime() - new Date(startDt).getTime()) / 60000)
        : 30;

      overlays.push({
        id:                   item.id,
        title:                item.summary ?? "(Sans titre)",
        event_date:           toDateStr(startDt, item.start.date),
        start_time:           toHHMM(startDt),
        duration_minutes:     durationMinutes,
        google_calendar_id:   cal.id,
        google_calendar_name: cal.name,
        calendar_color:       cal.color,
        is_google_overlay:    true,
      });
    }
  }

  // Tri par heure de début
  overlays.sort((a, b) => a.start_time.localeCompare(b.start_time));

  return NextResponse.json({ events: overlays });
}
