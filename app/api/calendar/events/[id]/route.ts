import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { scheduleReminder, cancelReminder } from "@/lib/qstash";
import type { EventForm } from "@/types/calendar";

function getAppUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${host.includes("localhost") ? "http" : "https"}://${host}`;
}

// PATCH /api/calendar/events/[id] — Mettre à jour un événement et replanifier les rappels
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const baseId = params.id.length > 36 ? params.id.slice(0, 36) : params.id;

  let form: Partial<EventForm>;
  try {
    form = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  // Récupérer l'événement existant pour annuler les anciens jobs et fusionner les valeurs
  const { data: existing } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", baseId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
  }

  // Annuler les anciens rappels QStash
  await Promise.all([
    cancelReminder(existing.reminder_job_id),
    cancelReminder(existing.reminder_2_job_id),
  ]);

  // Mettre à jour l'événement (réinitialiser les job IDs)
  const { data: updated, error } = await supabase
    .from("calendar_events")
    .update({ ...form, reminder_job_id: null, reminder_2_job_id: null })
    .eq("id", baseId)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Erreur mise à jour" }, { status: 500 });
  }

  // Replanifier les rappels avec les valeurs fusionnées
  const merged = { ...existing, ...form };
  if (!merged.is_recurring && merged.has_reminder) {
    const appUrl = getAppUrl(req);
    const base = {
      appUrl,
      userId:     user.id,
      eventTitle: merged.title as string,
      eventDate:  (merged.event_date as string),
      startTime:  (merged.start_time as string),
    };

    const jobId = await scheduleReminder({
      ...base,
      minutesBefore: merged.reminder_minutes_before as number,
    });
    const jobId2 = merged.has_reminder_2
      ? await scheduleReminder({
          ...base,
          minutesBefore: merged.reminder_minutes_before_2 as number,
        })
      : null;

    if (jobId || jobId2) {
      await supabase
        .from("calendar_events")
        .update({ reminder_job_id: jobId, reminder_2_job_id: jobId2 })
        .eq("id", baseId);
    }
  }

  return NextResponse.json({ event: updated });
}

// DELETE /api/calendar/events/[id] — Supprimer un événement et annuler ses rappels QStash
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const baseId = params.id.length > 36 ? params.id.slice(0, 36) : params.id;

  // Récupérer les job IDs avant suppression
  const { data: existing } = await supabase
    .from("calendar_events")
    .select("reminder_job_id, reminder_2_job_id")
    .eq("id", baseId)
    .eq("user_id", user.id)
    .single();

  // Annuler les rappels QStash en parallèle
  await Promise.all([
    cancelReminder(existing?.reminder_job_id),
    cancelReminder(existing?.reminder_2_job_id),
  ]);

  // Supprimer l'événement
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", baseId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
