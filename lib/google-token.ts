/**
 * Utilitaire partagé pour récupérer un access token Google valide.
 * Lit directement depuis Supabase (pas de fetch HTTP interne) et rafraîchit
 * automatiquement le token si expiré.
 * À utiliser dans les Route Handlers côté serveur uniquement.
 */
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const { data: tokenRow, error } = await supabase
    .from("google_oauth_tokens")
    .select("provider_token, provider_refresh_token, token_expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !tokenRow) return null;

  // Token encore valide (marge de 5 minutes)
  const expiresAt = tokenRow.token_expires_at
    ? new Date(tokenRow.token_expires_at).getTime()
    : 0;

  if (expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenRow.provider_token;
  }

  // Token expiré — rafraîchir via le refresh_token
  if (!tokenRow.provider_refresh_token) return null;

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[getGoogleAccessToken] GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET manquant");
    return null;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      grant_type:    "refresh_token",
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: tokenRow.provider_refresh_token,
    }),
  });

  if (!res.ok) {
    console.error("[getGoogleAccessToken] Refresh échoué:", await res.text());
    return null;
  }

  const { access_token, expires_in } = await res.json() as {
    access_token: string;
    expires_in:   number;
  };

  // Persister le nouveau token
  await supabase
    .from("google_oauth_tokens")
    .update({
      provider_token:   access_token,
      token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      updated_at:       new Date().toISOString(),
    })
    .eq("user_id", userId);

  return access_token;
}
