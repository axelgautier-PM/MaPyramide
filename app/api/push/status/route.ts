/**
 * GET /api/push/status — diagnostic push notifications (usage dev/admin uniquement)
 * Retourne l'état des variables d'environnement et des abonnements de l'utilisateur courant.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(_req: NextRequest) {
  // Vérification des variables d'environnement
  const envCheck = {
    SUPABASE_URL:             !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY:        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VAPID_PUBLIC_KEY:         !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY:        !!process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT:            !!process.env.VAPID_SUBJECT,
    CRON_SECRET:              !!process.env.CRON_SECRET,
    QSTASH_TOKEN:             !!process.env.QSTASH_TOKEN,
    QSTASH_URL:               !!process.env.QSTASH_URL,
  };

  // Vérifier la session utilisateur
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list) { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ env: envCheck, user: null, subscriptions: [] });
  }

  // Lire les abonnements push de l'utilisateur
  let subscriptions: Array<{ platform: string; endpoint_prefix: string; created_at: string }> = [];
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await admin
      .from("push_subscriptions")
      .select("platform, endpoint, created_at")
      .eq("user_id", user.id);

    subscriptions = (data ?? []).map((s) => ({
      platform:       s.platform,
      // Tronquer l'endpoint pour ne pas exposer la clé complète
      endpoint_prefix: (s.endpoint as string)?.slice(0, 80) + "...",
      created_at:     s.created_at,
    }));
  }

  return NextResponse.json({
    env: envCheck,
    user: { id: user.id, email: user.email },
    subscriptions,
  });
}
