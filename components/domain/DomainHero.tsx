"use client";

import type { Domain, UserDomainProgress } from "@/types";
import { LEVEL_NAMES } from "@/lib/constants";
import { colors, shadows, font } from "@/lib/tokens";

interface DomainHeroProps {
  domain: Domain;
  progress: UserDomainProgress | null;
  totalChallenges: number;
  completedCount: number;
}

export function DomainHero({ domain, progress, totalChallenges, completedCount }: DomainHeroProps) {
  const currentLevel    = progress?.current_level ?? 0;
  const progressPercent = totalChallenges > 0
    ? Math.round((completedCount / totalChallenges) * 100)
    : 0;
  const levelName = LEVEL_NAMES[currentLevel] ?? `Niveau ${currentLevel}`;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background:  colors.surface,
        border:      `1.5px solid ${colors.border}`,
        borderLeft:  `4px solid ${domain.color}`,
        boxShadow:   shadows.sm,
      }}
    >
      {/* Icône + nom + badge niveau */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[36px] leading-none">{domain.icon}</span>
          <div>
            <h1
              className="text-[20px] leading-tight"
              style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.4px" }}
            >
              {domain.label}
            </h1>
            <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
              {domain.tagline}
            </p>
          </div>
        </div>

        {/* Badge niveau cercle avec ombre colorée */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white"
          style={{
            background: domain.color,
            fontSize:   17,
            fontWeight: 700,
            fontFamily: font.dm,
            boxShadow:  `0 4px 14px ${domain.color}55`,
          }}
        >
          {currentLevel}
        </div>
      </div>

      {/* Nom du niveau + barre */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[13px]" style={{ fontFamily: font.dm, fontWeight: 600, color: domain.color }}>
            {levelName}
          </span>
          <span className="text-[12px]" style={{ fontFamily: font.dm, color: colors.text2 }}>
            {completedCount}/{totalChallenges} défis · {progressPercent}%
          </span>
        </div>

        <div className="h-[6px] rounded-full" style={{ background: colors.border }}>
          <div
            className="h-[6px] rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%`, background: domain.color }}
          />
        </div>
      </div>

      {domain.stat_quote && (
        <p className="mt-3 text-[11px] italic" style={{ fontFamily: font.dm, color: colors.text3 }}>
          💡 {domain.stat_quote}
        </p>
      )}
    </div>
  );
}
