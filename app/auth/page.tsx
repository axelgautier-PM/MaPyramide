"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Btn } from "@/components/ui/Btn";
import { PyramidLogoSvg } from "@/components/ui/PyramidIcon";
import { colors, shadows, radii, font } from "@/lib/tokens";

type Tab = "login" | "signup";

export default function AuthPage() {
  const [tab, setTab]           = useState<Tab>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [info, setInfo]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    setInfo(null);

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.message.toLowerCase().includes("email not confirmed")
            ? "Ton compte n'est pas encore confirmé. Vérifie ta boite mail."
            : "Email ou mot de passe incorrect."
        );
      } else {
        window.location.href = "/app";
        return;
      }
    } else {
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
      } else if (data.session) {
        window.location.href = "/app";
        return;
      } else {
        setInfo("Un email de confirmation t'a été envoyé. Clique sur le lien pour activer ton compte.");
      }
    }
    setLoading(false);
  }

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
    /* Fond global + centrage vertical/horizontal */
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: colors.bg }}
    >
      {/* Carte centrée, max-width mobile */}
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
          {/* Onglets */}
          <div className="flex rounded-xl p-1 mb-5" style={{ background: colors.bg }}>
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setInfo(null); }}
                className="flex-1 py-2.5 rounded-xl text-[14px] transition-all"
                style={{
                  background: tab === t ? colors.surface : "transparent",
                  color:      tab === t ? colors.text1   : colors.text3,
                  fontFamily: font.dm,
                  fontWeight: tab === t ? 600 : 400,
                  boxShadow:  tab === t ? shadows.sm : "none",
                }}
              >
                {t === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              minLength={6}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = colors.primary)}
              onBlur={(e)  => (e.target.style.borderColor = colors.border)}
            />

            {tab === "signup" && (
              <p className="text-[12px]" style={{ color: colors.text3, fontFamily: font.dm }}>
                Minimum 6 caractères.
              </p>
            )}

            {info && (
              <div
                className="rounded-xl px-3 py-2.5 text-[13px]"
                style={{
                  background: colors.successLight,
                  border:     `1px solid ${colors.success}40`,
                  color:      colors.success,
                  fontFamily: font.dm,
                }}
              >
                ✉️ {info}
              </div>
            )}

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
              {loading
                ? "Chargement…"
                : tab === "login"
                ? "Se connecter →"
                : "Créer mon compte →"}
            </Btn>
          </form>
        </div>

      </div>
    </div>
  );
}
