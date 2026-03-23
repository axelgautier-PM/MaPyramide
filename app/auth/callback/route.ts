import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Route appelée par Supabase après clic sur le magic link
// Elle échange le token contre une session et écrit les cookies dans la réponse
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Valider le type OTP — liste blanche explicite
  const VALID_OTP_TYPES = ["email", "magiclink"] as const;
  type ValidOtpType = (typeof VALID_OTP_TYPES)[number];
  const isValidType = (t: string | null): t is ValidOtpType =>
    VALID_OTP_TYPES.includes(t as ValidOtpType);

  // createSupabaseServerClient utilise @supabase/ssr — écrit les cookies dans la réponse
  const supabase = await createSupabaseServerClient();

  // Magic link via token_hash
  if (token_hash && isValidType(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}/app`);
    }
  }

  // Auth code flow (fallback PKCE)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/app`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}
