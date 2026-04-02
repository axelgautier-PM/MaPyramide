"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PyramidLogoSvg } from "@/components/ui/PyramidIcon";
import { colors, font, radii, shadows } from "@/lib/tokens";

// ─── Configuration des étapes ────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const Q1_OPTIONS = [
  { emoji: "🚀", label: "Immédiatement" },
  { emoji: "⏳", label: "Plus tard (1–3 jours)" },
  { emoji: "📅", label: "Quand le moment est venu" },
  { emoji: "🔔", label: "Avec des rappels" },
  { emoji: "⏰", label: "À la dernière minute" },
];

const Q2_OPTIONS = [
  { emoji: "🧠", label: "Pas suffisamment préparé(e)" },
  { emoji: "❌", label: "Peur de l'échec" },
  { emoji: "🐾", label: "Aucune première étape claire" },
  { emoji: "👀", label: "Besoin d'accompagnement" },
  { emoji: "💔", label: "Motivation insuffisante" },
];

const Q3_OPTIONS = [
  { emoji: "✅", label: "Pour atteindre mes objectifs" },
  { emoji: "🤔", label: "Me sentir mieux au quotidien" },
  { emoji: "🌿", label: "Améliorer ma santé" },
  { emoji: "🌱", label: "Devenir qui je veux être" },
];

// ─── Composants réutilisables ────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / (total - 1)) * 100);
  return (
    <div
      className="w-full h-1 rounded-full overflow-hidden"
      style={{ background: colors.border }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: colors.primary }}
      />
    </div>
  );
}

interface RadioOptionProps {
  emoji: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function RadioOption({ emoji, label, selected, onSelect }: RadioOptionProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        background: selected ? colors.primaryLight : colors.surface,
        border: `1.5px solid ${selected ? colors.primary : colors.border}`,
        boxShadow: selected ? shadows.primary : shadows.sm,
      }}
    >
      <span className="text-[20px] shrink-0">{emoji}</span>
      <span
        className="text-[15px] flex-1"
        style={{
          fontFamily: font.dm,
          fontWeight: selected ? 600 : 400,
          color: selected ? colors.primary : colors.text1,
        }}
      >
        {label}
      </span>
      <div
        className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
        style={{
          borderColor: selected ? colors.primary : colors.border,
          background: selected ? colors.primary : "transparent",
        }}
      >
        {selected && (
          <div className="w-2 h-2 rounded-full bg-white" />
        )}
      </div>
    </button>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [q3, setQ3] = useState<number | null>(null);

  function next() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function finish() {
    if (typeof window !== "undefined") {
      localStorage.setItem("mp_onboarding_done", "true");
      // Marque la redirection vers /app/taches après connexion
      localStorage.setItem("mp_redirect_defis", "true");
    }
    router.push("/auth");
  }

  function skip() {
    if (typeof window !== "undefined") {
      localStorage.setItem("mp_onboarding_done", "true");
      // Pas de redirection spécifique : on atterrira sur /app (dashboard)
    }
    router.push("/auth");
  }

  const canContinue =
    step === 0 ? true
    : step === 1 ? q1 !== null
    : step === 2 ? q2 !== null
    : step === 3 ? q3 !== null
    : true;

  // Styles communs
  const pageStyle: React.CSSProperties = {
    minHeight: "100dvh",
    background: colors.bg,
    display: "flex",
    flexDirection: "column",
    fontFamily: font.dm,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "0 24px 120px",
  };

  return (
    <div style={pageStyle}>

      {/* ── Header avec navigation et progress ── */}
      {/* safe-top pousse le contenu sous la barre de statut iOS (Dynamic Island / notch) */}
      <div className="safe-top flex items-center gap-3 px-4 pt-4 pb-4">
        {step > 0 ? (
          <button
            onClick={back}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
            style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
          >
            <span style={{ fontSize: 16, color: colors.text2 }}>←</span>
          </button>
        ) : (
          <div className="w-9" />
        )}

        <div className="flex-1">
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>

        <button
          onClick={skip}
          className="text-[13px] shrink-0"
          style={{ color: colors.text3, fontFamily: font.dm }}
        >
          Passer l'onboarding
        </button>
      </div>

      {/* ── Contenu par étape ── */}
      <div style={contentStyle}>

        {/* Étape 0 — Bienvenue */}
        {step === 0 && (
          <div className="flex flex-col items-center gap-6 pt-8">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: colors.primary, boxShadow: shadows.primary }}
            >
              <PyramidLogoSvg size={44} />
            </div>

            <div className="text-center">
              <h1
                className="text-[30px] leading-tight"
                style={{ fontWeight: 800, color: colors.text1, letterSpacing: "-0.6px" }}
              >
                Bienvenue sur<br />MaPyramide 🎯
              </h1>
              <p
                className="mt-3 text-[16px] leading-relaxed"
                style={{ color: colors.text2, fontWeight: 400 }}
              >
                L'app qui transforme tes intentions en habitudes durables — domaine par domaine.
              </p>
            </div>

            {/* 3 piliers */}
            <div className="w-full flex flex-col gap-3">
              {[
                { icon: "🏆", title: "Défis progressifs", desc: "Avance à ton rythme, niveau par niveau" },
                { icon: "📅", title: "Calendrier de progression", desc: "Planifie tes habitudes et pilote ton temps" },
                { icon: "📊", title: "Métriques clés", desc: "Mesure ce qui compte vraiment pour toi" },
              ].map((item) => (
                <div
                  key={item.icon}
                  className="flex items-center gap-4 px-4 py-4 rounded-2xl"
                  style={{ background: colors.surface, border: `1.5px solid ${colors.border}`, boxShadow: shadows.sm }}
                >
                  <span className="text-[26px]">{item.icon}</span>
                  <div>
                    <p className="text-[14px]" style={{ fontWeight: 700, color: colors.text1 }}>{item.title}</p>
                    <p className="text-[13px] mt-0.5" style={{ color: colors.text2 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Étape 1 — Q1 : Quand agissez-vous ? */}
        {step === 1 && (
          <div className="flex flex-col gap-5 pt-6">
            <div>
              <p className="text-[13px] uppercase tracking-widest mb-2" style={{ color: colors.text3, fontWeight: 600 }}>
                Question 1 / 3
              </p>
              <h2
                className="text-[24px] leading-tight"
                style={{ fontWeight: 800, color: colors.text1, letterSpacing: "-0.4px" }}
              >
                Quand agissez-vous après avoir fixé un objectif ?
              </h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {Q1_OPTIONS.map((opt, i) => (
                <RadioOption
                  key={i}
                  emoji={opt.emoji}
                  label={opt.label}
                  selected={q1 === i}
                  onSelect={() => setQ1(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Étape 2 — Q2 : Pourquoi pas immédiatement ? */}
        {step === 2 && (
          <div className="flex flex-col gap-5 pt-6">
            <div>
              <p className="text-[13px] uppercase tracking-widest mb-2" style={{ color: colors.text3, fontWeight: 600 }}>
                Question 2 / 3
              </p>
              <h2
                className="text-[24px] leading-tight"
                style={{ fontWeight: 800, color: colors.text1, letterSpacing: "-0.4px" }}
              >
                Si vous n'agissez pas immédiatement, pourquoi ?
              </h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {Q2_OPTIONS.map((opt, i) => (
                <RadioOption
                  key={i}
                  emoji={opt.emoji}
                  label={opt.label}
                  selected={q2 === i}
                  onSelect={() => setQ2(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Étape 3 — Q3 : Motivation */}
        {step === 3 && (
          <div className="flex flex-col gap-5 pt-6">
            <div>
              <p className="text-[13px] uppercase tracking-widest mb-2" style={{ color: colors.text3, fontWeight: 600 }}>
                Question 3 / 3
              </p>
              <h2
                className="text-[24px] leading-tight"
                style={{ fontWeight: 800, color: colors.text1, letterSpacing: "-0.4px" }}
              >
                Qu'est-ce qui vous motive à adopter de bonnes habitudes ?
              </h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {Q3_OPTIONS.map((opt, i) => (
                <RadioOption
                  key={i}
                  emoji={opt.emoji}
                  label={opt.label}
                  selected={q3 === i}
                  onSelect={() => setQ3(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Étape 4 — Insight : la science des habitudes */}
        {step === 4 && (
          <div className="flex flex-col gap-6 pt-6">
            <h2
              className="text-[26px] leading-tight text-center"
              style={{ fontWeight: 800, color: colors.text1, letterSpacing: "-0.5px" }}
            >
              Développer de bonnes habitudes augmente le bonheur 💚
            </h2>

            {/* Courbe de formation */}
            <div
              className="rounded-2xl p-5"
              style={{ background: colors.surface, border: `1.5px solid ${colors.border}`, boxShadow: shadows.sm }}
            >
              {/* Représentation visuelle simplifiée */}
              <div className="flex justify-between items-end mb-3" style={{ height: 100 }}>
                {[
                  { label: "7j", pct: 10, color: "#E0E0F0" },
                  { label: "21j", pct: 28, color: "#C4BEFF" },
                  { label: "66j", pct: 58, color: "#9B91FF" },
                  { label: "90j+", pct: 82, color: colors.primary },
                ].map((bar) => (
                  <div key={bar.label} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-[10px]" style={{ color: colors.text3, fontWeight: 600 }}>
                      {Math.round(bar.pct)}%
                    </span>
                    <div
                      className="w-full mx-1 rounded-t-lg transition-all"
                      style={{
                        height: `${bar.pct}%`,
                        background: bar.color,
                        minHeight: 8,
                        maxWidth: 56,
                      }}
                    />
                    <span className="text-[11px]" style={{ color: colors.text2, fontWeight: 600 }}>{bar.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-center" style={{ color: colors.text3 }}>
                Courbe de bonheur subjectif selon la durée d'une habitude
              </p>
            </div>

            {/* 3 règles d'or */}
            <div className="flex flex-col gap-3">
              {[
                { emoji: "🐢", title: "Commencer petit", desc: "10 min de sport vaut mieux que 0. Réduire la friction est clé." },
                { emoji: "📆", title: "La régularité bat l'intensité", desc: "3 séances courtes / semaine > 1 longue session intensive." },
                { emoji: "📈", title: "66 jours pour ancrer une habitude", desc: "La recherche montre 66 jours en moyenne (pas 21 !)." },
              ].map((item) => (
                <div
                  key={item.emoji}
                  className="flex gap-3 px-4 py-4 rounded-2xl"
                  style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
                >
                  <span className="text-[22px] shrink-0 mt-0.5">{item.emoji}</span>
                  <div>
                    <p className="text-[14px]" style={{ fontWeight: 700, color: colors.text1 }}>{item.title}</p>
                    <p className="text-[13px] mt-0.5 leading-snug" style={{ color: colors.text2 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Étape 5 — Prêt à commencer */}
        {step === 5 && (
          <div className="flex flex-col items-center gap-6 pt-8 text-center">
            {/* Illustration */}
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-[52px]"
              style={{ background: colors.primaryLight }}
            >
              🏔️
            </div>

            <div>
              <h2
                className="text-[28px] leading-tight"
                style={{ fontWeight: 800, color: colors.text1, letterSpacing: "-0.5px" }}
              >
                Votre plan est prêt !
              </h2>
              <p
                className="mt-3 text-[16px] leading-relaxed"
                style={{ color: colors.text2 }}
              >
                Commencez avec un seul domaine, quelques minutes par jour. Construisez votre pyramide pierre par pierre.
              </p>
            </div>

            {/* Rappel des 6 domaines */}
            <div className="grid grid-cols-3 gap-2 w-full">
              {[
                { icon: "🌿", label: "Santé" },
                { icon: "💰", label: "Finances" },
                { icon: "💼", label: "Travail" },
                { icon: "🚀", label: "Entrepreneuriat" },
                { icon: "🧘", label: "Bien-être" },
                { icon: "♻️", label: "Écologie" },
              ].map((d) => (
                <div
                  key={d.label}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                  style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
                >
                  <span className="text-[22px]">{d.icon}</span>
                  <span className="text-[11px]" style={{ color: colors.text2, fontWeight: 600 }}>{d.label}</span>
                </div>
              ))}
            </div>

            <p className="text-[13px]" style={{ color: colors.text3 }}>
              Vous pouvez modifier vos domaines à tout moment dans l'application.
            </p>
          </div>
        )}

      </div>

      {/* ── CTA fixé en bas ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 py-5"
        style={{
          background: `linear-gradient(to top, ${colors.bg} 80%, transparent)`,
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={step === TOTAL_STEPS - 1 ? finish : next}
          disabled={!canContinue}
          className="w-full py-4 rounded-2xl text-[16px] transition-all active:scale-[0.97]"
          style={{
            maxWidth: 480,
            margin: "0 auto",
            display: "block",
            background: canContinue ? colors.primary : colors.border,
            color: canContinue ? "#fff" : colors.text3,
            fontFamily: font.dm,
            fontWeight: 700,
            boxShadow: canContinue ? shadows.primary : "none",
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          {step === 0
            ? "Commencer →"
            : step === TOTAL_STEPS - 1
            ? "Créer mon compte 🚀"
            : "Continuer"}
        </button>
      </div>

    </div>
  );
}
