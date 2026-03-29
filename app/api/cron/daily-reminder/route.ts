import { NextRequest, NextResponse } from "next/server";

// ─── GET /api/cron/daily-reminder ─────────────────────────────────────────────
// Appelé par Vercel Cron tous les jours à 7h UTC (8h Paris hiver, 9h été)
// Envoie un rappel push à tous les abonnés actifs
// Protégé par CRON_SECRET pour éviter les appels non autorisés

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");

  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Pas de userId → broadcast à tous les abonnés
        title: "MaPyramide 🌅",
        body:  "Tes défis du jour t'attendent !",
        url:   "/app/defis",
      }),
    });

    const data = await res.json();
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    console.error("[cron/daily-reminder]", err);
    return NextResponse.json({ error: "Erreur cron" }, { status: 500 });
  }
}
