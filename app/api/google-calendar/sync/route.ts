import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGoogleAccessToken } from "@/lib/google-token";
import type { CalendarEvent } from "@/types/calendar";

const TIMEZONE = "Europe/Paris";
const GOOGLE_API = "https://www.googleapis.com/calendar/v3";

// Convertit un CalendarEvent MP en payload Google Calendar API
function toGoogleEvent(event: CalendarEvent) {
  const [hour, minute] = event.start_time.split(":").map(Number);
  const startDt = new Date(event.event_date + "T00:00:00");
  startDt.setHours(hour, minute, 0, 0);
  const endDt = new Date(startDt.getTime() + event.duration_minutes * 60 * 1000);

  function toIso(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  }

  return {
    summary: event.title,
    description: `Créé par MaPyramide${event.domain_icon ? " " + event.domain_icon : ""}`,
    start: { dateTime: toIso(startDt), timeZone: TIMEZONE },
    end:   { dateTime: toIso(endDt),   timeZone: TIMEZONE },
  };
}

// Récupère ou crée le calendrier "MaPyramide" dans Google Calendar
async function getOrCreateCalendar(accessToken: string, supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string): Promise<string | null> {
  // 1. Vérifier si l'ID est déjà stocké
  const { data } = await supabase
    .from("google_oauth_tokens")
    .select("google_calendar_id")
    .eq("user_id", userId)
    .single();

  if (data?.google_calendar_id) return data.google_calendar_id;

  // 2. Créer le calendrier "MaPyramide" dans Google Calendar
  const res = await fetch(`${GOOGLE_API}/calendars`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ summary: "MaPyramide", description: "Créneaux planifiés dans MaPyramide", timeZone: TIMEZONE }),
  });

  if (!res.ok) return null;
  const { id: calendarId } = await res.json() as { id: string };

  // 3. Stocker l'ID pour les prochains appels
  await supabase.from("google_oauth_tokens").update({ google_calendar_id: calendarId }).eq("user_id", userId);
  return calendarId;
}

// POST /api/google-calendar/sync
// Body: { action: "create"|"update"|"delete", event?: CalendarEvent, google_event_id?: string, mp_event_id?: string }
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: {
    action: "create" | "update" | "delete";
    event?: CalendarEvent;
    google_event_id?: string;
    mp_event_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  // Ignorer les événements récurrents (RRULE non implémenté en MVP)
  if (body.event?.is_recurring) {
    return NextResponse.json({ skipped: true, reason: "recurring_not_supported" });
  }

  const accessToken = await getGoogleAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "Token Google non disponible" }, { status: 401 });

  const calendarId = await getOrCreateCalendar(accessToken, supabase, user.id);
  if (!calendarId) return NextResponse.json({ error: "Impossible d'accéder au calendrier Google" }, { status: 502 });

  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  // ── CREATE ──
  if (body.action === "create" && body.event && body.mp_event_id) {
    const res = await fetch(`${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      headers,
      body: JSON.stringify(toGoogleEvent(body.event)),
    });
    if (!res.ok) return NextResponse.json({ error: "Erreur Google Calendar (create)" }, { status: 502 });
    const { id: googleEventId } = await res.json() as { id: string };

    await supabase.from("calendar_sync_map").upsert({
      user_id: user.id,
      mp_event_id: body.mp_event_id,
      google_event_id: googleEventId,
      synced_at: new Date().toISOString(),
    }, { onConflict: "user_id,mp_event_id" });

    return NextResponse.json({ google_event_id: googleEventId });
  }

  // ── UPDATE ──
  if (body.action === "update" && body.event && body.google_event_id) {
    const res = await fetch(
      `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events/${body.google_event_id}`,
      { method: "PATCH", headers, body: JSON.stringify(toGoogleEvent(body.event)) }
    );
    if (res.status === 404) {
      // Entrée obsolète — nettoyage silencieux
      await supabase.from("calendar_sync_map")
        .delete()
        .eq("user_id", user.id)
        .eq("google_event_id", body.google_event_id);
      return NextResponse.json({ ok: true, stale: true });
    }
    if (!res.ok) return NextResponse.json({ error: "Erreur Google Calendar (update)" }, { status: 502 });
    await supabase.from("calendar_sync_map")
      .update({ synced_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("google_event_id", body.google_event_id);
    return NextResponse.json({ ok: true });
  }

  // ── DELETE ──
  if (body.action === "delete" && body.google_event_id) {
    const res = await fetch(
      `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events/${body.google_event_id}`,
      { method: "DELETE", headers }
    );
    // 404 = déjà supprimé — OK silencieux
    if (!res.ok && res.status !== 404) {
      return NextResponse.json({ error: "Erreur Google Calendar (delete)" }, { status: 502 });
    }
    await supabase.from("calendar_sync_map")
      .delete()
      .eq("user_id", user.id)
      .eq("google_event_id", body.google_event_id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
