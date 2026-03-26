"use client";

import { colors, font, radii, shadows } from "@/lib/tokens";
import { Btn } from "@/components/ui/Btn";

interface CalendarOnboardingProps {
  onClose: () => void;
}

// Slides de l'onboarding calendrier
const SLIDES = [
  {
    emoji: "🧠",
    title: "Ton calendrier, ton coach",
    desc: "Décharge ta charge mentale ici. Inscris toutes les bonnes habitudes que tu veux ancrer dans le temps — le calendrier s'en souvient pour toi.",
  },
  {
    emoji: "🔄",
    title: "Les défis génèrent des actions",
    desc: "Quand tu réalises un défi, tu peux le planifier directement en agenda. Petit à petit, ton calendrier devient le reflet de ta progression.",
  },
  {
    emoji: "⏱️",
    title: "Pilote ton temps hebdomadaire",
    desc: "Le compteur en haut mesure ton temps de développement personnel chaque semaine. Des objectifs modestes mais tenus valent mieux que des plans impossibles.",
  },
  {
    emoji: "🌱",
    title: "Sessions courtes mais régulières",
    desc: "La régularité bat l'intensité. 3 × 20 min par semaine créent une habitude. Une séance marathon occasion­nelle non. Sois modeste — et dure longtemps.",
  },
];

export function CalendarOnboarding({ onClose }: CalendarOnboardingProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(22,22,42,0.55)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Onboarding Calendrier"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{
          background:    colors.surface,
          maxWidth:      720,
          margin:        "0 auto",
          maxHeight:     "88vh",
          overflowY:     "auto",
          paddingBottom: "calc(32px + env(safe-area-inset-bottom))",
          boxShadow:     shadows.lg,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
        </div>

        <div className="px-5 pb-4 flex flex-col gap-5">
          {/* En-tête */}
          <div className="text-center pt-2">
            <p
              className="text-[11px] uppercase tracking-widest mb-1"
              style={{ color: colors.primary, fontWeight: 700, fontFamily: font.dm }}
            >
              Calendrier de progression
            </p>
            <h2
              className="text-[22px] leading-tight"
              style={{ fontFamily: font.dm, fontWeight: 800, color: colors.text1, letterSpacing: "-0.4px" }}
            >
              Comment ça marche ? 📅
            </h2>
          </div>

          {/* Slides */}
          <div className="flex flex-col gap-3">
            {SLIDES.map((slide, idx) => (
              <div
                key={idx}
                className="flex gap-4 px-4 py-4 rounded-2xl"
                style={{
                  background: idx === 0 ? colors.primaryLight : colors.bg,
                  border: `1.5px solid ${idx === 0 ? colors.primary + "40" : colors.border}`,
                }}
              >
                <span className="text-[26px] shrink-0 mt-0.5">{slide.emoji}</span>
                <div>
                  <p
                    className="text-[14px]"
                    style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}
                  >
                    {slide.title}
                  </p>
                  <p
                    className="text-[13px] mt-1 leading-snug"
                    style={{ fontFamily: font.dm, color: colors.text2 }}
                  >
                    {slide.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Conseil du coach */}
          <div
            className="rounded-2xl px-4 py-4 flex gap-3 items-start"
            style={{ background: "#FFF9E6", border: "1.5px solid #FFE580" }}
          >
            <span className="text-[22px] shrink-0">💡</span>
            <p
              className="text-[13px] leading-snug"
              style={{ fontFamily: font.dm, color: "#8A7200", fontWeight: 500 }}
            >
              <strong>Conseil coach :</strong> commence par planifier une seule habitude cette semaine. Une réussie en appelle une autre.
            </p>
          </div>

          {/* CTA */}
          <Btn
            variant="primary"
            fullWidth
            style={{ borderRadius: radii.xl, padding: "16px 24px", fontSize: 16 }}
            onClick={onClose}
          >
            C'est parti ! ✓
          </Btn>
        </div>
      </div>
    </>
  );
}
