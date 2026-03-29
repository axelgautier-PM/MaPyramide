import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Configuration VAPID — clés serveur uniquement
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Client Supabase service role — bypasse le RLS pour lire tous les abonnements
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Abstraction multi-plateforme ─────────────────────────────────────────────
//
// Architecture conçue pour être compatible App Store natif (futur).
//
// Aujourd'hui : Web Push (VAPID) — PWA installée depuis Safari (iOS 16.4+)
//
// Demain, si passage natif via Capacitor ou React Native :
//   1. Ajouter platform='apns' dans push_subscriptions (colonne device_token)
//   2. Implémenter le cas "apns" ici dans sendToSubscription() avec node-apn
//      ou le SDK Firebase Admin pour FCM Android
//   3. Toute la logique métier (quand envoyer, quoi envoyer, cron quotidien)
//      reste intacte — seul le transport change dans cette fonction
//
// La table push_subscriptions supporte déjà platform='web'|'apns'|'fcm'.

interface PushSubscriptionRow {
  platform: string;
  endpoint: string | null;
  p256dh:   string | null;
  auth:     string | null;
}

async function sendToSubscription(
  sub: PushSubscriptionRow,
  payload: string
): Promise<{ success: boolean; endpoint?: string }> {
  if (sub.platform === "web" && sub.endpoint && sub.p256dh && sub.auth) {
    // Transport Web Push (VAPID) — actif maintenant
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    );
    return { success: true, endpoint: sub.endpoint };
  }

  // Transport APNs (iOS natif via Capacitor) — à implémenter si App Store
  // if (sub.platform === "apns" && sub.device_token) { ... }

  // Transport FCM (Android natif) — à implémenter si Google Play
  // if (sub.platform === "fcm" && sub.device_token) { ... }

  return { success: false };
}

// ─── POST /api/push/send ──────────────────────────────────────────────────────
// body: { userId?: string, title: string, body: string, url?: string }
// Si userId → envoie aux appareils de cet user uniquement
// Si pas de userId → broadcast (usage cron uniquement)

export async function POST(req: NextRequest) {
  // Protection minimale : endpoint interne uniquement
  // Les crons Vercel et la page profil (bouton test) appellent cette route
  const body = await req.json();
  const { userId, title, body: notifBody, url } = body;

  if (!title) {
    return NextResponse.json({ error: "title requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Récupérer les abonnements ciblés
  let query = supabase
    .from("push_subscriptions")
    .select("platform, endpoint, p256dh, auth");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: subscriptions, error } = await query;

  if (error) {
    console.error("[push/send] fetch subscriptions:", error);
    return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const payload = JSON.stringify({ title, body: notifBody ?? "", url: url ?? "/app" });

  // Envoyer en parallèle, collecter les résultats
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendToSubscription(sub, payload))
  );

  const sent  = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - sent;

  // Nettoyer les abonnements expirés (410 Gone = appareil désinscrit)
  const expiredEndpoints: string[] = [];
  results.forEach((result, i) => {
    if (
      result.status === "rejected" &&
      result.reason?.statusCode === 410 &&
      subscriptions[i].endpoint
    ) {
      expiredEndpoints.push(subscriptions[i].endpoint!);
    }
  });

  if (expiredEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  return NextResponse.json({ ok: true, sent, failed });
}
