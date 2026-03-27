import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { GoogleCalendarEventOverlay } from "@/types/calendar";

const GOOGLE_API = "https://www.googleapis.com/calendar/v3";

async function getAccessToken(origin: string, cookie: string): Promise<string | null> {
  const res = await fetch(`${origin}/api/google-calendar/token`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  if (!res.ok) return null;
  const { access_token } = await res.json() as { access_token: string };
  return access_token ?? null;
}

// Convertit un datetime RFC3339 (ex: "2026-03-27T09:00:00+01:00") en HH:MM local
function toHHMM(dateTime: string): string {
  const d = new Date(dateTime);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Extrait la date locale YYYY-MM-DD depuis un dateTime ou date Google
function toDateStr(dateTime: string | undefined, date: string | undefined): string {
  if (date) return date; // événement "journée entière"
  if (!dateTime) return "";
  const d = new Date(dateTime);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// GET /api/google-calendar/events?weekStart=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const weekStart = request.nextUrl.searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "weekStart requis" }, { status: 400 });

  // Calculer weekEnd (weekStart + 6 jours)
  const startDate = new Date(weekStart + "T00:00:00");
  const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  endDate.setHours(23, 59, 59, 999);

  const origin = new URL(request.url).origin;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = await getAccessToken(origin, cookieHeader);
  if (!accessToken) return NextResponse.json({ error: "Token Google non disponible" }, { status: 401 });

  // Récupérer les événements Google Calendar (calendrier principal)
  const params = new URLSearchParams({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const res = await fetch(`${GOOGLE_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Erreur Google Calendar (events)" }, { status: 502 });
  }

  const data = await res.json() as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  const googleItems = data.items ?? [];

  // Récupérer les IDs Google déjà poussés depuis MP (pour les exclure de l'overlay)
  const { data: syncMap } = await supabase
    .from("calendar_sync_map")
    .select("google_event_id")
    .eq("user_id", user.id);

  const mpGoogleIds = new Set((syncMap ?? []).map((r: { google_event_id: string }) => r.google_event_id));

  // Construire l'overlay en excluant les événements MP et les journées entières sans heure
  const overlays: GoogleCalendarEventOverlay[] = [];

  for (const item of googleItems) {
    if (mpGoogleIds.has(item.id)) continue; // déjà dans MP — évite les doublons
    if (!item.start?.dateTime) continue;    // événements journée entière — pas de start_time

    const startDt = item.start.dateTime;
    const endDt = item.end?.dateTime;
    const durationMinutes = endDt
      ? Math.round((new Date(endDt).getTime() - new Date(startDt).getTime()) / 60000)
      : 30;

    overlays.push({
      id: item.id,
      title: item.summary ?? "(Sans titre)",
      event_date: toDateStr(startDt, item.start.date),
      start_time: toHHMM(startDt),
      duration_minutes: durationMinutes,
      is_google_overlay: true,
    });
  }

  return NextResponse.json({ events: overlays });
}
