import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Route appelée par Supabase après clic sur le magic link ou après OAuth Google
// Elle échange le token contre une session et écrit les cookies dans la réponse
// Param optionnel ?next=/chemin pour rediriger vers une page spécifique après auth
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code        = searchParams.get("code");
  const token_hash  = searchParams.get("token_hash");
  const type        = searchParams.get("type");
  const next        = searchParams.get("next") ?? "/app"; // destination après auth

  // Valider le type OTP — liste blanche explicite
  const VALID_OTP_TYPES = ["email", "magiclink", "signup", "email_change", "recovery"] as const;
  type ValidOtpType = (typeof VALID_OTP_TYPES)[number];
  const isValidType = (t: string | null): t is ValidOtpType =>
    VALID_OTP_TYPES.includes(t as ValidOtpType);

  // createSupabaseServerClient utilise @supabase/ssr — écrit les cookies dans la réponse
  const supabase = await createSupabaseServerClient();

  // Magic link via token_hash
  if (token_hash && isValidType(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code flow : OAuth Google ou fallback PKCE
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const { provider_token, provider_refresh_token, user } = data.session;

      // Persister les tokens Google si c'est une connexion OAuth Google
      // C'est le seul moment où provider_token et provider_refresh_token sont disponibles ensemble
      if (provider_token && user) {
        await supabase.from("google_oauth_tokens").upsert(
          {
            user_id: user.id,
            provider_token,
            provider_refresh_token: provider_refresh_token ?? null,
            token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        // Erreur ignorée volontairement : l'auth elle-même a réussi, la sync peut dégrader silencieusement
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}
