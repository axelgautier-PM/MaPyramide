"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Btn } from "@/components/ui/Btn";
import { colors, shadows, radii, font } from "@/lib/tokens";

function PyramidIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
      <polygon points="14,3 26,24 2,24" fill="currentColor" opacity="0.15" />
      <polygon points="14,3 26,24 2,24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="14,9 22,24 6,24" fill="currentColor" opacity="0.3" />
      <polygon points="14,15 18,24 10,24" fill="currentColor" />
    </svg>
  );
}

type Tab = "login" | "signup";

export default function AuthPage() {
  const [tab, setTab]       = useState<Tab>("login");
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [info, setInfo]         = useState<string | null>(null);
  const router = useRouter();

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
        router.push("/app");
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
        router.push("/app");
      } else {
        setInfo("Un email de confirmation t'a été envoyé. Clique sur le lien pour activer ton compte.");
      }
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: radii.lg,
    fontSize: 15,
    fontFamily: font.dm,
    color: colors.text1,
    background: colors.bg,
    border: `1.5px solid ${colors.border}`,
    outline: "none",
    transition: "border-color 150ms",
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: colors.bg }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div style={{ color: colors.primary }} className="mb-3">
            <PyramidIcon />
          </div>
          <h1
            className="text-[26px] text-center"
            style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.5px" }}
          >
            MaPyramide
          </h1>
          <p className="text-[14px] text-center mt-1" style={{ color: colors.text2, fontFamily: font.dm }}>
            Construis ta meilleure version, un niveau à la fois.
          </p>
        </div>

        {/* Carte */}
        <div
          className="rounded-2xl p-6"
          style={{ background: colors.surface, border: `1.5px solid ${colors.border}`, boxShadow: shadows.sm }}
        >
          {/* Onglets */}
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ background: colors.bg }}
          >
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setInfo(null); }}
                className="flex-1 py-2 rounded-xl text-[14px] transition-all"
                style={{
                  background:  tab === t ? colors.surface : "transparent",
                  color:       tab === t ? colors.text1    : colors.text3,
                  fontFamily:  font.dm,
                  fontWeight:  tab === t ? 600 : 400,
                  boxShadow:   tab === t ? shadows.sm : "none",
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
              onFocus={(e)  => (e.target.style.borderColor = colors.primary)}
              onBlur={(e)   => (e.target.style.borderColor = colors.border)}
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
              onFocus={(e)  => (e.target.style.borderColor = colors.primary)}
              onBlur={(e)   => (e.target.style.borderColor = colors.border)}
            />

            {tab === "signup" && (
              <p className="text-[12px]" style={{ color: colors.text3, fontFamily: font.dm }}>
                Minimum 6 caractères.
              </p>
            )}

            {info && (
              <p
                className="text-[13px] rounded-xl px-3 py-2"
                style={{
                  color:      colors.success,
                  background: colors.successLight,
                  border:     `1px solid ${colors.success}40`,
                  fontFamily: font.dm,
                }}
              >
                ✉️ {info}
              </p>
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
              style={{ marginTop: 4, borderRadius: radii.lg }}
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
