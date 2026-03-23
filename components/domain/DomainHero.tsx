"use client";

import type { Domain, UserDomainProgress } from "@/types";
import { LEVEL_NAMES } from "@/lib/constants";

interface DomainHeroProps {
  domain: Domain;
  progress: UserDomainProgress | null;
  totalChallenges: number;
  completedCount: number;
}

export function DomainHero({
  domain,
  progress,
  totalChallenges,
  completedCount,
}: DomainHeroProps) {
  const currentLevel = progress?.current_level ?? 0;
  const progressPercent =
    totalChallenges > 0
      ? Math.round((completedCount / totalChallenges) * 100)
      : 0;
  const levelName = LEVEL_NAMES[currentLevel] ?? `Niveau ${currentLevel}`;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: domain.bg_color,
        border: `1px solid ${domain.border_color}`,
      }}
    >
      {/* Icône + nom + badge niveau */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[32px] leading-none">{domain.icon}</span>
          <div>
            <h1
              className="text-[20px] leading-tight"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 800,
                color: domain.color,
              }}
            >
              {domain.label}
            </h1>
            <p
              className="text-[12px] mt-0.5"
              style={{
                fontFamily: "var(--font-dm-sans)",
                color: domain.color,
                opacity: 0.75,
              }}
            >
              {domain.tagline}
            </p>
          </div>
        </div>

        {/* Badge niveau */}
        <span
          className="text-[11px] px-2.5 py-1 rounded-full shrink-0"
          style={{
            background: "white",
            color: domain.color,
            fontFamily: "var(--font-syne)",
            fontWeight: 700,
            border: `1px solid ${domain.border_color}`,
          }}
        >
          Niv. {currentLevel}
        </span>
      </div>

      {/* Nom du niveau + progression */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span
            className="text-[12px]"
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              color: domain.color,
            }}
          >
            {levelName}
          </span>
          <span
            className="text-[12px]"
            style={{
              fontFamily: "var(--font-dm-sans)",
              color: domain.color,
              opacity: 0.75,
            }}
          >
            {completedCount}/{totalChallenges} défis · {progressPercent}%
          </span>
        </div>

        {/* Barre de progression globale */}
        <div
          className="h-2 rounded-full"
          style={{ background: `${domain.color}20` }}
        >
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              background: domain.color,
            }}
          />
        </div>
      </div>

      {/* Stat inspirante */}
      {domain.stat_quote && (
        <p
          className="mt-3 text-[11px] italic"
          style={{
            fontFamily: "var(--font-dm-sans)",
            color: domain.color,
            opacity: 0.65,
          }}
        >
          💡 {domain.stat_quote}
        </p>
      )}
    </div>
  );
}
