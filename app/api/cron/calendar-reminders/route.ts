import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Configuration VAPID — identique à /api/push/send
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// Client service role — bypasse le RLS pour lire tous les events et abonnements
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Calcule l'offset UTC → Paris en millisecondes.
 * Gère automatiquement CET (UTC+1) et CEST (UTC+2).
 * Suffit pour la fenêtre de 7 jours (DST ne change pas en milieu de semaine).
 */
function parisOffsetMs(): number {
  const now = new Date();
  const parisHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Paris",
      hour:     "numeric",
      hour12:   false,
    }).format(now),
  );
  // Différence pondérée pour éviter les sauts de minuit
  const diff = ((parisHour - now.getUTCHours() + 36) % 24) - 12;
  return diff * 3_600_000;
}

// ─── GET /api/cron/calendar-reminders ─────────────────────────────────────────
// Appelé par Vercel Cron toutes les minutes.
// Pour chaque event avec un rappel en attente dont l'heure approche,
// envoie une notification push et marque le rappel comme envoyé.

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase   = getServiceClient();
  const now        = new Date();
  const offsetMs   = parisOffsetMs();

  // Fenêtre de ±90 s pour absorber la latence du cron (déclenché chaque minute)
  const WINDOW_MS = 90_000;

  // Limite la recherche à hier → 7 jours pour éviter de scanner toute la table
  const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  const nextWeek  = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);

  type EventRow = {
    id:                       string;
    user_id:                  string;
    title:                    string;
    event_date:               string;
    start_time:               string;
    has_reminder:             boolean;
    reminder_minutes_before:  number;
    reminder_sent_at:         string | null;
    has_reminder_2:           boolean;
    reminder_minutes_before_2: number;
    reminder_2_sent_at:       string | null;
  };

  const { data: rawEvents, error: fetchErr } = await supabase
    .from("calendar_events")
    .select("id, user_id, title, event_date, start_time, has_reminder, reminder_minutes_before, reminder_sent_at, has_reminder_2, reminder_minutes_before_2, reminder_2_sent_at")
    .gte("event_date", yesterday)
    .lte("event_date", nextWeek)
    .or("has_reminder.eq.true,has_reminder_2.eq.true");

  const events = rawEvents as EventRow[] | null;

  if (fetchErr) {
    console.error("[cron/calendar-reminders] fetch events:", fetchErr);
    return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
  }

  type PendingReminder = {
    eventId: string;
    userId:  string;
    title:   string;
    minutesBefore: number;
    field: "reminder_sent_at" | "reminder_2_sent_at";
  };

  const pending: PendingReminder[] = [];

  for (const ev of events ?? []) {
    // Conversion heure locale Paris → UTC
    const [y, mo, d] = (ev.event_date as string).split("-").map(Number);
    const [h, m]     = (ev.start_time  as string).split(":").map(Number);
    const startUtcMs = Date.UTC(y, mo - 1, d, h, m, 0) - offsetMs;

    // Rappel 1
    if (ev.has_reminder && !ev.reminder_sent_at) {
      const fireAt = startUtcMs - (ev.reminder_minutes_before ?? 15) * 60_000;
      if (Math.abs(fireAt - now.getTime()) <= WINDOW_MS) {
        pending.push({
          eventId:       ev.id,
          userId:        ev.user_id,
          title:         ev.title,
          minutesBefore: ev.reminder_minutes_before ?? 15,
          field:         "reminder_sent_at",
        });
      }
    }

    // Rappel 2
    if (ev.has_reminder_2 && !ev.reminder_2_sent_at) {
      const fireAt2 = startUtcMs - (ev.reminder_minutes_before_2 ?? 15) * 60_000;
      if (Math.abs(fireAt2 - now.getTime()) <= WINDOW_MS) {
        pending.push({
          eventId:       ev.id,
          userId:        ev.user_id,
          title:         ev.title,
          minutesBefore: ev.reminder_minutes_before_2 ?? 15,
          field:         "reminder_2_sent_at",
        });
      }
    }
  }

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // Récupère les abonnements Web Push pour tous les users concernés
  const userIds = [...new Set(pending.map((p) => p.userId))];
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds)
    .eq("platform", "web");

  // Indexe par user_id pour accès rapide
  const subsByUser = new Map<string, Array<{ endpoint: string; p256dh: string; auth: string }>>();
  for (const sub of subs ?? []) {
    if (!sub.endpoint || !sub.p256dh || !sub.auth) continue;
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth });
    subsByUser.set(sub.user_id, list);
  }

  let sent = 0;

  for (const item of pending) {
    const userSubs = subsByUser.get(item.userId) ?? [];

    // Libellé humain du délai (ex: "15 min" ou "1h")
    const label = item.minutesBefore < 60
      ? `${item.minutesBefore} min`
      : `${Math.round(item.minutesBefore / 60)}h`;

    const payload = JSON.stringify({
      title: `⏰ ${item.title}`,
      body:  `Dans ${label}`,
      url:   "/app/calendrier",
    });

    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent++;
      } catch (err: unknown) {
        // 410 Gone = abonnement expiré → nettoyage silencieux
        if ((err as { statusCode?: number }).statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        } else {
          console.error("[cron/calendar-reminders] sendNotification:", err);
        }
      }
    }

    // Marque le rappel comme envoyé pour éviter les doublons
    await supabase
      .from("calendar_events")
      .update({ [item.field]: now.toISOString() })
      .eq("id", item.eventId);
  }

  console.log(`[cron/calendar-reminders] ${sent} notifications envoyées, ${pending.length} rappels traités`);
  return NextResponse.json({ ok: true, processed: pending.length, sent });
}
