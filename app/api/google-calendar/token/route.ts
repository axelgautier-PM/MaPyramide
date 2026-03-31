import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Retourne un access token Google valide pour l'utilisateur courant.
// Rafraîchit automatiquement le token via le refresh_token si expiré.
export async function POST() {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: tokenRow, error: dbErr } = await supabase
    .from("google_oauth_tokens")
    .select("provider_token, provider_refresh_token, token_expires_at")
    .eq("user_id", user.id)
    .single();

  if (dbErr || !tokenRow) {
    return NextResponse.json({ error: "Compte Google non connecté" }, { status: 404 });
  }

  // Token encore valide (avec 5 min de marge)
  const expiresAt = tokenRow.token_expires_at
    ? new Date(tokenRow.token_expires_at).getTime()
    : 0;
  const now = Date.now();
  if (expiresAt > now + 5 * 60 * 1000) {
    return NextResponse.json({ access_token: tokenRow.provider_token });
  }

  // Token expiré — rafraîchir via le refresh_token
  if (!tokenRow.provider_refresh_token) {
    return NextResponse.json({ error: "refresh_token manquant, reconnexion Google requise" }, { status: 401 });
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokenRow.provider_refresh_token,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Google token refresh failed:", err);
    return NextResponse.json({ error: "Impossible de rafraîchir le token Google" }, { status: 502 });
  }

  const { access_token, expires_in } = await res.json() as { access_token: string; expires_in: number };
  const newExpiry = new Date(Date.now() + expires_in * 1000).toISOString();

  // Mettre à jour le token en base
  await supabase.from("google_oauth_tokens").update({
    provider_token: access_token,
    token_expires_at: newExpiry,
    updated_at: new Date().toISOString(),
  }).eq("user_id", user.id);

  return NextResponse.json({ access_token });
}
