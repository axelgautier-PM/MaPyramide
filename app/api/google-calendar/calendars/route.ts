import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGoogleAccessToken } from "@/lib/google-token";

const GOOGLE_API = "https://www.googleapis.com/calendar/v3";

/** GET /api/google-calendar/calendars
 * Retourne la liste des calendriers Google de l'utilisateur
 * enrichie des préférences sauvegardées (couleur, is_selected) */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const accessToken = await getGoogleAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "Token Google non disponible — reconnecte Google Calendar dans ton profil" }, { status: 401 });

  // Récupère la liste des calendriers depuis Google
  const res = await fetch(`${GOOGLE_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return NextResponse.json({ error: "Erreur Google Calendar (calendarList)" }, { status: 502 });

  const data = await res.json() as {
    items?: Array<{ id: string; summary: string; backgroundColor?: string }>;
  };
  const googleCals = data.items ?? [];

  // Récupère les préférences sauvegardées (couleur choisie, is_selected)
  const { data: savedPrefs } = await supabase
    .from("google_calendars")
    .select("google_calendar_id, color, is_selected")
    .eq("user_id", user.id);

  const prefsMap = new Map(
    (savedPrefs ?? []).map((r: { google_calendar_id: string; color: string; is_selected: boolean }) => [
      r.google_calendar_id,
      { color: r.color, is_selected: r.is_selected },
    ])
  );

  // Fusionne : liste Google + prefs sauvegardées
  const calendars = googleCals.map((cal) => {
    const saved = prefsMap.get(cal.id);
    return {
      id:          cal.id,
      name:        cal.summary,
      color:       saved?.color ?? cal.backgroundColor ?? "#4285F4",
      is_selected: saved?.is_selected ?? true,
    };
  });

  return NextResponse.json({ calendars });
}

/** POST /api/google-calendar/calendars
 * Body: { calendars: Array<{ id, name, color, is_selected }> }
 * Sauvegarde les préférences de sélection + couleur pour chaque calendrier */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { calendars: Array<{ id: string; name: string; color: string; is_selected: boolean }> };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  if (!Array.isArray(body.calendars)) {
    return NextResponse.json({ error: "calendars requis" }, { status: 400 });
  }

  // Upsert chaque calendrier
  const rows = body.calendars.map((cal) => ({
    user_id:            user.id,
    google_calendar_id: cal.id,
    name:               cal.name,
    color:              cal.color,
    is_selected:        cal.is_selected,
    updated_at:         new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("google_calendars")
    .upsert(rows, { onConflict: "user_id,google_calendar_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
