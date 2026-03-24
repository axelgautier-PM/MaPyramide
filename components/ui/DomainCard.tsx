"use client";

import Link from "next/link";
import type { DomainWithData } from "@/lib/hooks/useDashboard";
import { colors, shadows, font } from "@/lib/tokens";

interface DomainCardProps {
  data: DomainWithData;
}

export function DomainCard({ data }: DomainCardProps) {
  const { domain, progress, totalChallenges, completedCount, nextChallenge } = data;
  const currentLevel   = progress?.current_level ?? 0;
  const progressPercent = totalChallenges > 0
    ? Math.round((completedCount / totalChallenges) * 100)
    : 0;
  const isNew = completedCount === 0;

  return (
    <Link
      href={`/app/${domain.slug}`}
      className="block rounded-2xl bg-white transition-all active:scale-[0.98]"
      style={{
        border:      `1.5px solid ${colors.border}`,
        borderLeft:  `4px solid ${domain.color}`,
        boxShadow:   shadows.sm,
      }}
    >
      <div className="p-4 flex flex-col gap-3">

        {/* Icône + nom + badge niveau */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[22px] leading-none">{domain.icon}</span>
            <span
              className="text-[14px] leading-tight"
              style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}
            >
              {domain.label}
            </span>
          </div>
          {/* Badge niveau — cercle */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{
              background: isNew ? colors.text3 : domain.color,
              fontSize:   12,
              fontWeight: 700,
              fontFamily: font.dm,
            }}
          >
            {isNew ? "·" : currentLevel}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>
              {completedCount}/{totalChallenges} défis
            </span>
            <span className="text-[11px]" style={{ color: domain.color, fontFamily: font.dm, fontWeight: 600 }}>
              {progressPercent}%
            </span>
          </div>
          <div className="h-[5px] rounded-full" style={{ background: colors.border }}>
            <div
              className="h-[5px] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, background: domain.color }}
            />
          </div>
        </div>

        {/* Prochain défi */}
        <div className="rounded-xl px-3 py-2" style={{ background: domain.bg_color }}>
          {nextChallenge ? (
            <div className="flex items-start gap-2">
              <span className="text-[11px] shrink-0 mt-0.5" style={{ color: domain.color }}>⚡</span>
              <p
                className="text-[12px] leading-snug line-clamp-2"
                style={{ color: domain.color, fontFamily: font.dm, fontWeight: 500 }}
              >
                {nextChallenge.title}
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-center" style={{ color: domain.color, fontFamily: font.dm, fontWeight: 600 }}>
              ✓ Niveau complété !
            </p>
          )}
        </div>

      </div>
    </Link>
  );
}

export function DomainCardSkeleton() {
  return (
    <div
      className="rounded-2xl bg-white p-4 flex flex-col gap-3 animate-pulse"
      style={{ border: `1.5px solid ${colors.border}`, borderLeft: `4px solid ${colors.border}`, boxShadow: shadows.sm }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded" style={{ background: colors.border }} />
          <div className="h-4 w-24 rounded" style={{ background: colors.border }} />
        </div>
        <div className="w-7 h-7 rounded-full" style={{ background: colors.border }} />
      </div>
      <div className="h-[5px] rounded-full" style={{ background: colors.border }} />
      <div className="h-9 rounded-xl" style={{ background: colors.border }} />
    </div>
  );
}
