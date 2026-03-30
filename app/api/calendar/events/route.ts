import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { scheduleReminder } from "@/lib/qstash";
import type { EventForm } from "@/types/calendar";

/** Construit l'URL de base de l'app à partir de la requête entrante */
function getAppUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${host.includes("localhost") ? "http" : "https"}://${host}`;
}

// POST /api/calendar/events — Créer un événement et planifier ses rappels QStash
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let form: EventForm;
  try {
    form = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  // Insérer l'événement en base
  const { data: created, error } = await supabase
    .from("calendar_events")
    .insert({ user_id: user.id, ...form })
    .select()
    .single();

  if (error || !created) {
    console.error("[calendar/events POST]", error);
    return NextResponse.json({ error: error?.message ?? "Erreur création" }, { status: 500 });
  }

  // Planifier les rappels QStash — uniquement pour les événements ponctuels
  if (!form.is_recurring && form.has_reminder) {
    const appUrl = getAppUrl(req);
    const base = {
      appUrl,
      userId:     user.id,
      eventTitle: form.title,
      eventDate:  form.event_date,
      startTime:  form.start_time,
    };

    const jobId = await scheduleReminder({ ...base, minutesBefore: form.reminder_minutes_before });
    const jobId2 = form.has_reminder_2
      ? await scheduleReminder({ ...base, minutesBefore: form.reminder_minutes_before_2 })
      : null;

    if (jobId || jobId2) {
      await supabase
        .from("calendar_events")
        .update({ reminder_job_id: jobId, reminder_2_job_id: jobId2 })
        .eq("id", created.id as string);
    }
  }

  return NextResponse.json({ event: created });
}
