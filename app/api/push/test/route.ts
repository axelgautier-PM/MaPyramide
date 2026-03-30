import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getClient } from "@/lib/qstash";

// POST /api/push/test — Planifie une notification test via QStash (délai 5s)
// Permet de valider toute la chaîne QStash → /api/push/send → push VAPID
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: "QSTASH_TOKEN manquant — configure la variable dans Vercel" },
      { status: 500 }
    );
  }

  const host    = req.headers.get("host") ?? "localhost:3000";
  const appUrl  = `${host.includes("localhost") ? "http" : "https"}://${host}`;

  try {
    await client.publishJSON({
      url:     `${appUrl}/api/push/send`,
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
      body: {
        userId: user.id,
        title:  "MaPyramide 🔔",
        body:   "Les notifications fonctionnent !",
        url:    "/app",
      },
      delay: 5, // livraison dans 5 secondes
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[push/test] QStash error:", message);
    return NextResponse.json({ error: `Erreur QStash : ${message}` }, { status: 500 });
  }
}
