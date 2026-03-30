/**
 * Utilitaires QStash (Upstash) pour planifier les rappels push à l'heure exacte.
 * Remplace le polling cron toutes les minutes — QStash appelle le webhook une seule fois.
 * QSTASH_TOKEN doit être défini dans les variables d'environnement Vercel.
 */
import { Client } from "@upstash/qstash";

// Initialisation lazy — ne plante pas si la variable est absente (dev sans QStash)
let _client: Client | null = null;
function getClient(): Client | null {
  if (!process.env.QSTASH_TOKEN) return null;
  if (!_client) _client = new Client({ token: process.env.QSTASH_TOKEN });
  return _client;
}

/**
 * Convertit une heure locale Paris (YYYY-MM-DD + HH:MM) en Date UTC précise.
 * Gère automatiquement CET (UTC+1) et CEST (UTC+2) via une itération de Newton.
 */
export function parisToUTC(dateStr: string, timeStr: string): Date {
  // Point de départ : lire comme UTC (Paris est en avance de 1-2h)
  let utcMs = new Date(`${dateStr}T${timeStr}:00Z`).getTime();

  for (let i = 0; i < 3; i++) {
    // Formater la date UTC courante en heure locale Paris (format sv = YYYY-MM-DD HH:MM)
    const parisStr = new Intl.DateTimeFormat("sv", {
      timeZone: "Europe/Paris",
      year:     "numeric",
      month:    "2-digit",
      day:      "2-digit",
      hour:     "2-digit",
      minute:   "2-digit",
    }).format(new Date(utcMs));

    const diff = new Date(`${dateStr} ${timeStr}Z`).getTime() - new Date(`${parisStr}Z`).getTime();
    if (diff === 0) break;
    utcMs += diff;
  }

  return new Date(utcMs);
}

function minutesLabel(minutes: number): string {
  return minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)}h`;
}

export interface ScheduleReminderParams {
  /** URL de base de l'app (https://xxx.vercel.app) pour construire le webhook */
  appUrl:        string;
  userId:        string;
  eventTitle:    string;
  eventDate:     string;   // YYYY-MM-DD (heure locale Paris)
  startTime:     string;   // HH:MM (heure locale Paris)
  minutesBefore: number;
}

/**
 * Planifie un rappel push via QStash.
 * QStash appellera POST /api/push/send à l'heure exacte calculée.
 * Retourne le messageId (pour annulation future) ou null si :
 *   - l'heure est déjà passée
 *   - QSTASH_TOKEN absent (dev local)
 *   - erreur réseau QStash
 */
export async function scheduleReminder(p: ScheduleReminderParams): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const startUTC    = parisToUTC(p.eventDate, p.startTime);
  const reminderUTC = new Date(startUTC.getTime() - p.minutesBefore * 60_000);

  // Ignorer les rappels déjà passés (marge de 30 secondes)
  if (reminderUTC.getTime() <= Date.now() + 30_000) return null;

  try {
    const result = await client.publishJSON({
      url:     `${p.appUrl}/api/push/send`,
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
      body: {
        userId: p.userId,
        title:  `⏰ ${p.eventTitle}`,
        body:   `Dans ${minutesLabel(p.minutesBefore)}`,
        url:    "/app/calendrier",
      },
      // notBefore = timestamp Unix en secondes (livraison à l'heure exacte)
      notBefore: Math.floor(reminderUTC.getTime() / 1000),
    });
    return result.messageId;
  } catch (err) {
    console.error("[qstash] scheduleReminder:", err);
    return null;
  }
}

/**
 * Annule un rappel QStash précédemment planifié.
 * Silencieux si le message est déjà consommé, expiré ou inexistant.
 */
export async function cancelReminder(messageId: string | null | undefined): Promise<void> {
  if (!messageId) return;
  const client = getClient();
  if (!client) return;

  try {
    await client.messages.delete(messageId);
  } catch {
    // Message déjà traité ou ID invalide — ignoré silencieusement
  }
}
