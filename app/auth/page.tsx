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
      className="min-h-screen flex items-center justify-center"
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

              {/* Séparateur */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: colors.border }} />
                <span className="text-[12px]" style={{ color: colors.text3, fontFamily: font.dm }}>ou</span>
                <div className="flex-1 h-px" style={{ background: colors.border }} />
              </div>

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
