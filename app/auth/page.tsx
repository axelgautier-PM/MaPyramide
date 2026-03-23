"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Icône pyramide SVG (identique au header)
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

type Step = "form" | "sent";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Envoi du magic link via Supabase Auth
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(
        error.message.includes("rate limit")
          ? "Trop de tentatives. Attends quelques minutes et réessaie."
          : "Une erreur est survenue. Vérifie ton email et réessaie."
      );
    } else {
      setStep("sent");
    }
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

        {step === "form" ? (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #E0DDD6", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <h2
              className="text-[18px] text-ink mb-1"
              style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}
            >
              Connexion
            </h2>
            <p className="text-ink3 text-[13px] mb-5">
              On t'envoie un lien magique — pas de mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-[15px] text-ink outline-none transition-all"
                style={{
                  background: "#F7F6F3",
                  border: "1px solid #E0DDD6",
                  fontFamily: "var(--font-dm-sans)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1A1916")}
                onBlur={(e) => (e.target.style.borderColor = "#E0DDD6")}
                autoComplete="email"
                autoFocus
              />

              {error && (
                <p className="text-[13px] text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 rounded-xl text-white text-[15px] transition-opacity disabled:opacity-50"
                style={{
                  background: "#1A1916",
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                }}
              >
                {loading ? "Envoi en cours…" : "Recevoir mon lien ✉️"}
              </button>
            </form>
          </div>
        ) : (
          /* Étape 2 : lien envoyé */
          <div
            className="bg-white rounded-2xl p-6 text-center"
            style={{ border: "1px solid #E0DDD6", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div className="text-4xl mb-4">📬</div>
            <h2
              className="text-[18px] text-ink mb-2"
              style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}
            >
              Vérifie ta boîte mail
            </h2>
            <p className="text-ink2 text-[14px] mb-1">
              On a envoyé un lien à
            </p>
            <p
              className="text-ink text-[14px] mb-5"
              style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}
            >
              {email}
            </p>
            <p className="text-ink3 text-[13px] mb-5">
              Clique sur le lien dans l'email pour accéder à ton compte. Vérifie aussi tes spams.
            </p>
            <button
              onClick={() => setStep("form")}
              className="text-ink3 text-[13px] underline"
            >
              Changer d'adresse email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
