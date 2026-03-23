import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-server";

const PROTECTED_PREFIX = "/app";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  // Créer la réponse de base en transmettant la requête
  const response = NextResponse.next({ request });

  // createServerClient avec cookie adapter — vérifie le JWT côté Supabase
  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Retourner la réponse avec les cookies de session éventuellement rafraîchis
  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
