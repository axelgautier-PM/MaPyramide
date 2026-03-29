import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ─── POST /api/push/subscribe — enregistrer un abonnement Web Push ────────────
export async function POST(req: NextRequest) {
  const { supabase, user } = await getSupabaseUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { endpoint, p256dh, auth } = body;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Champs manquants (endpoint, p256dh, auth)" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id:  user.id,
      platform: "web",
      endpoint,
      p256dh,
      auth,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    console.error("[push/subscribe POST]", error);
    return NextResponse.json({ error: "Erreur d'enregistrement" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ─── DELETE /api/push/subscribe — supprimer un abonnement ─────────────────────
export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getSupabaseUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { endpoint } = body;

  if (!endpoint) {
    return NextResponse.json({ error: "endpoint manquant" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("[push/subscribe DELETE]", error);
    return NextResponse.json({ error: "Erreur de suppression" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
