"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Btn } from "@/components/ui/Btn";
import { PyramidLogoSvg } from "@/components/ui/PyramidIcon";
import { colors, shadows, radii, font } from "@/lib/tokens";

type View = "login" | "signup" | "confirmation";

export default function AuthPage() {
  const [view, setView]         = useState<View>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ─── Connexion Google ─────────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/calendar",
        queryParams: {
          access_type: "offline",
          prompt: "consent", // force le consentement pour toujours obtenir un refresh_token
        },
      },
    });
    if (error) {
      setError("Erreur lors de la connexion Google. Réessaie.");
      setLoading(false);
    }
    // En cas de succès : le navigateur redirige vers Google, puis /auth/callback
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function goToLogin(prefillEmail?: string) {
    setView("login");
    setError(null);
    setPassword("");
    if (prefillEmail !== undefined) setEmail(prefillEmail);
  }

  function goToSignup() {
    setView("signup");
    setError(null);
    setPassword("");
  }

  // ─── Soumission connexion ──────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message.toLowerCase().includes("email not confirmed")
          ? "Ton compte n'est pas encore confirmé. Vérifie ta boite mail."
          : "Email ou mot de passe incorrect."
      );
      setLoading(false);
    } else {
      // Redirection selon flag onboarding
      const redirectDefis =
        typeof window !== "undefined" &&
        localStorage.getItem("mp_redirect_defis") === "true";
      if (redirectDefis) {
        localStorage.removeItem("mp_redirect_defis");
        window.location.href = "/app/defis";
      } else {
        window.location.href = "/app";
      }
    }
  }

  // ─── Soumission inscription ────────────────────────────────────────────────

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Cet email est déjà utilisé. Connecte-toi."
          : "Erreur lors de l'inscription. Réessaie."
      );
      setLoading(false);
    } else if (data.session) {
      // Compte déjà confirmé (mode dev sans email) → redirection directe
      const redirectDefis =
        typeof window !== "undefined" &&
        localStorage.getItem("mp_redirect_defis") === "true";
      if (redirectDefis) {
        localStorage.removeItem("mp_redirect_defis");
        window.location.href = "/app/defis";
      } else {
        window.location.href = "/app";
      }
    } else {
      // Email de confirmation envoyé
      setLoading(false);
      setView("confirmation");
    }
  }

  // ─── Style input commun ────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width:        "100%",
    padding:      "13px 16px",
    borderRadius: radii.lg,
    fontSize:     15,
    fontFamily:   font.dm,
    color:        colors.text1,
    background:   colors.bg,
    border:       `1.5px solid ${colors.border}`,
    outline:      "none",
    transition:   "border-color 150ms",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center safe-top"
      style={{ background: colors.bg }}
    >
      <div className="w-full max-w-sm mx-auto px-4 py-10 flex flex-col gap-0">

        {/* ── Bandeau logo violet ── */}
        <div
          className="flex flex-col items-center justify-center pt-10 pb-8 px-6 rounded-t-3xl"
          style={{ background: colors.primary }}
        >
          <PyramidLogoSvg size={52} />
          <h1
            className="mt-4 text-[28px] text-white text-center"
            style={{ fontFamily: font.dm, fontWeight: 700, letterSpacing: "-0.6px", lineHeight: 1 }}
          >
            MaPyramide
          </h1>
          <p
            className="mt-2 text-[11px] text-center tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.55)", fontFamily: font.dm, fontWeight: 500 }}
          >
            Développement personnel
          </p>
        </div>

        {/* ── Formulaire ── */}
        <div
          className="rounded-b-3xl p-6"
          style={{
            background: colors.surface,
            boxShadow:  shadows.lg,
            border:     `1.5px solid ${colors.border}`,
            borderTop:  "none",
          }}
        >

          {/* ════════ VUE CONNEXION ════════ */}
          {view === "login" && (
            <>
              <p
                className="text-[18px] mb-5"
                style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}
              >
                Connexion
              </p>

              {/* Bouton Google — CTA principal */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[15px] transition-all active:scale-[0.98] mb-4"
                style={{
                  background: colors.surface,
                  border: `1.5px solid ${colors.border}`,
                  color: colors.text1,
                  fontFamily: font.dm,
                  fontWeight: 600,
                  boxShadow: shadows.sm,
                }}
              >
                {/* Logo Google SVG */}
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                  <path d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/>
                  <path d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
                  <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.3 44 24 44z" fill="#4CAF50"/>
                  <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.2 5.2C36.9 36.9 44 32 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/>
                </svg>
                Continuer avec Google
              </button>

              {/* Séparateur */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: colors.border }} />
                <span className="text-[12px]" style={{ color: colors.text3, fontFamily: font.dm }}>ou</span>
                <div className="flex-1 h-px" style={{ background: colors.border }} />
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                  onBlur={(e)  => (e.target.style.borderColor = colors.border)}
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  minLength={6}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                  onBlur={(e)  => (e.target.style.borderColor = colors.border)}
                />

                {error && (
                  <p className="text-[13px]" style={{ color: colors.danger, fontFamily: font.dm }}>
                    {error}
                  </p>
                )}

                <Btn
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={loading || !email.trim() || !password.trim()}
                  style={{ marginTop: 8, borderRadius: radii.xl, padding: "16px 24px", fontSize: 16 }}
                >
                  {loading ? "Connexion…" : "Se connecter →"}
                </Btn>
              </form>

              {/* Bouton secondaire Créer un compte */}
              <button
                onClick={goToSignup}
                className="w-full py-3.5 rounded-2xl text-[15px] transition-all active:scale-[0.98]"
                style={{
                  background: colors.bg,
                  border:     `1.5px solid ${colors.border}`,
                  color:      colors.text1,
                  fontFamily: font.dm,
                  fontWeight: 500,
                }}
              >
                Créer un compte
              </button>
            </>
          )}

          {/* ════════ VUE INSCRIPTION ════════ */}
          {view === "signup" && (
            <>
              <button
                onClick={() => goToLogin(email)}
                className="flex items-center gap-1.5 mb-5 transition-all"
                style={{ color: colors.text3, fontFamily: font.dm, fontSize: 14 }}
              >
                <span>←</span>
                <span>Retour à la connexion</span>
              </button>

              <p
                className="text-[18px] mb-5"
                style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}
              >
                Créer un compte
              </p>

              {/* Bouton Google — CTA principal */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[15px] transition-all active:scale-[0.98] mb-4"
                style={{
                  background: colors.surface,
                  border: `1.5px solid ${colors.border}`,
                  color: colors.text1,
                  fontFamily: font.dm,
                  fontWeight: 600,
                  boxShadow: shadows.sm,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                  <path d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/>
                  <path d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
                  <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.3 44 24 44z" fill="#4CAF50"/>
                  <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.2 5.2C36.9 36.9 44 32 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/>
                </svg>
                Continuer avec Google
              </button>

              {/* Séparateur */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: colors.border }} />
                <span className="text-[12px]" style={{ color: colors.text3, fontFamily: font.dm }}>ou</span>
                <div className="flex-1 h-px" style={{ background: colors.border }} />
              </div>

              <form onSubmit={handleSignup} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                  onBlur={(e)  => (e.target.style.borderColor = colors.border)}
                />
                <input
                  type="password"
                  placeholder="Mot de passe (6 caractères min.)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                  onBlur={(e)  => (e.target.style.borderColor = colors.border)}
                />

                {error && (
                  <p className="text-[13px]" style={{ color: colors.danger, fontFamily: font.dm }}>
                    {error}
                  </p>
                )}

                <Btn
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={loading || !email.trim() || !password.trim()}
                  style={{ marginTop: 8, borderRadius: radii.xl, padding: "16px 24px", fontSize: 16 }}
                >
                  {loading ? "Création…" : "Créer mon compte →"}
                </Btn>
              </form>
            </>
          )}

          {/* ════════ VUE CONFIRMATION EMAIL ════════ */}
          {view === "confirmation" && (
            <div className="flex flex-col items-center gap-5 py-2">
              {/* Icône */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-[32px]"
                style={{ background: colors.successLight }}
              >
                ✉️
              </div>

              <div className="text-center">
                <p
                  className="text-[18px]"
                  style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}
                >
                  Vérifie ta boite mail !
                </p>
                <p
                  className="mt-2 text-[14px] leading-relaxed"
                  style={{ fontFamily: font.dm, color: colors.text2 }}
                >
                  Un email de confirmation a été envoyé à{" "}
                  <span style={{ fontWeight: 600, color: colors.text1 }}>{email}</span>.
                  Clique sur le lien pour activer ton compte.
                </p>
                <p
                  className="mt-2 text-[12px]"
                  style={{ fontFamily: font.dm, color: colors.text3 }}
                >
                  Pense à vérifier tes spams si tu ne le vois pas.
                </p>
              </div>

              <button
                onClick={() => goToLogin(email)}
                className="w-full py-3.5 rounded-2xl text-[15px] transition-all active:scale-[0.98]"
                style={{
                  background: colors.bg,
                  border:     `1.5px solid ${colors.border}`,
                  color:      colors.text1,
                  fontFamily: font.dm,
                  fontWeight: 500,
                }}
              >
                ← Retour à la connexion
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
