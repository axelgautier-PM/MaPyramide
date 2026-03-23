"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function PyramidIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
      <polygon points="14,3 26,24 2,24" fill="currentColor" opacity="0.15" />
      <polygon points="14,3 26,24 2,24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="14,9 22,24 6,24" fill="currentColor" opacity="0.3" />
      <polygon points="14,15 18,24 10,24" fill="currentColor" />
    </svg>
  );
}

type Tab = "login" | "signup";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Email ou mot de passe incorrect.");
      } else {
        router.push("/app");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(
          error.message.includes("already registered")
            ? "Cet email est déjà utilisé. Connecte-toi."
            : "Erreur lors de l'inscription. Réessaie."
        );
      } else {
        router.push("/app");
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-off px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="text-ink mb-3">
            <PyramidIcon />
          </div>
          <h1
            className="text-[28px] text-ink text-center"
            style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}
          >
            MaPyramide
          </h1>
          <p className="text-ink3 text-[14px] text-center mt-1">
            Construis ta meilleure version, un niveau à la fois.
          </p>
        </div>

        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #E0DDD6", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          {/* Onglets */}
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ background: "#F7F6F3" }}
          >
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className="flex-1 py-2 rounded-lg text-[14px] transition-all"
                style={{
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "#1A1916" : "#A8A5A0",
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
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
              className="w-full px-4 py-3 rounded-xl text-[15px] text-ink outline-none transition-all"
              style={{
                background: "#F7F6F3",
                border: "1px solid #E0DDD6",
                fontFamily: "var(--font-dm-sans)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1A1916")}
              onBlur={(e) => (e.target.style.borderColor = "#E0DDD6")}
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              minLength={6}
              className="w-full px-4 py-3 rounded-xl text-[15px] text-ink outline-none transition-all"
              style={{
                background: "#F7F6F3",
                border: "1px solid #E0DDD6",
                fontFamily: "var(--font-dm-sans)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1A1916")}
              onBlur={(e) => (e.target.style.borderColor = "#E0DDD6")}
            />

            {tab === "signup" && (
              <p
                className="text-[12px]"
                style={{ color: "#A8A5A0", fontFamily: "var(--font-dm-sans)" }}
              >
                Minimum 6 caractères.
              </p>
            )}

            {error && (
              <p className="text-[13px]" style={{ color: "#B84020" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full py-3 rounded-xl text-white text-[15px] transition-opacity disabled:opacity-50"
              style={{
                background: "#1A1916",
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
              }}
            >
              {loading
                ? "Chargement…"
                : tab === "login"
                ? "Se connecter →"
                : "Créer mon compte →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
