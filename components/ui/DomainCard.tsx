"use client";

import Link from "next/link";
import type { DomainWithData } from "@/lib/hooks/useDashboard";

interface DomainCardProps {
  data: DomainWithData;
}

export function DomainCard({ data }: DomainCardProps) {
  const { domain, progress, totalChallenges, completedCount, nextChallenge } = data;
  const currentLevel = progress?.current_level ?? 0;
  const progressPercent = totalChallenges > 0
    ? Math.round((completedCount / totalChallenges) * 100)
    : 0;
  const isNew = completedCount === 0;

  return (
    <Link
      href={`/app/${domain.slug}`}
      className="block rounded-xl bg-white transition-all active:scale-[0.98]"
      style={{
        border: "1px solid #E0DDD6",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div className="p-4 flex flex-col gap-3">

        {/* Header : icône + nom + badge niveau */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[22px] leading-none">{domain.icon}</span>
            <span
              className="text-[15px] text-ink leading-tight"
              style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}
            >
              {domain.label}
            </span>
          </div>
          {/* Badge niveau */}
          <span
            className="text-[11px] px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: domain.bg_color,
              color: domain.color,
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              border: `1px solid ${domain.border_color}`,
            }}
          >
            {isNew ? "Nouveau" : `Niv. ${currentLevel}`}
          </span>
        </div>

        {/* Barre de progression */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-ink3" style={{ fontFamily: "var(--font-dm-sans)" }}>
              {completedCount}/{totalChallenges} défis
            </span>
            <span className="text-[11px]" style={{ color: domain.color, fontFamily: "var(--font-syne)", fontWeight: 700 }}>
              {progressPercent}%
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "#F0F0F0" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: domain.color,
              }}
            />
          </div>
        </div>

        {/* Défi du jour */}
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: domain.bg_color }}
        >
          {nextChallenge ? (
            <div className="flex items-start gap-2">
              <span className="text-[12px] shrink-0 mt-0.5" style={{ color: domain.color }}>⚡</span>
              <p
                className="text-[12px] leading-snug line-clamp-2"
                style={{ color: domain.color, fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
              >
                {nextChallenge.title}
              </p>
            </div>
          ) : (
            <p
              className="text-[12px] text-center"
              style={{ color: domain.color, fontFamily: "var(--font-syne)", fontWeight: 700 }}
            >
              ✓ Niveau complété !
            </p>
          )}
        </div>

      </div>
    </Link>
  );
}

// Squelette de chargement
export function DomainCardSkeleton() {
  return (
    <div
      className="rounded-xl bg-white p-4 flex flex-col gap-3 animate-pulse"
      style={{ border: "1px solid #E0DDD6" }}
    >
      <div className="flex items-start justify-between">
        <div className="h-5 w-32 bg-off2 rounded" />
        <div className="h-5 w-14 bg-off2 rounded-full" />
      </div>
      <div className="h-1.5 bg-off2 rounded-full" />
      <div className="h-10 bg-off2 rounded-lg" />
    </div>
  );
}
