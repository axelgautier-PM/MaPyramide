"use client";

import { useState } from "react";
import { use } from "react";
import { useDomain } from "@/lib/hooks/useDomain";
import { DomainHero } from "@/components/domain/DomainHero";
import { ChallengeCard } from "@/components/domain/ChallengeCard";
import { CompleteSheet } from "@/components/domain/CompleteSheet";
import { MetricDashboard } from "@/components/sante/MetricDashboard";
import type { Challenge } from "@/types";
import { useAppStore } from "@/store/app-store";
import { LEVEL_NAMES } from "@/lib/constants";
import { useToastStore } from "@/lib/hooks/useToast";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function DomainPage({ params }: PageProps) {
  const { slug } = use(params);
  const { completions } = useAppStore();
  const {
    domain,
    levelGroups,
    progress,
    metrics,
    loading,
    error,
    justUnlocked,
    completeChallenge,
  } = useDomain(slug);

  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const { showToast } = useToastStore();

  const completedIds = new Set(completions.map((c) => c.challenge_id));

  const totalChallenges = levelGroups.reduce((sum, g) => sum + g.totalCount, 0);
  const completedCount = levelGroups.reduce((sum, g) => sum + g.completedCount, 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-36 bg-off2 rounded-2xl" />
        <div className="h-48 bg-off2 rounded-2xl" />
        <div className="h-24 bg-off2 rounded-xl" />
        <div className="h-24 bg-off2 rounded-xl" />
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div
        className="rounded-xl p-4 text-[14px] text-center"
        style={{ background: "#FFF0F0", color: "#FF6B6B", border: "1px solid #FFB0B0", fontFamily: "var(--font-dm-sans)" }}
      >
        {error ?? "Domaine introuvable"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Bannière déverrouillage */}
      {justUnlocked && (
        <div
          className="rounded-xl px-4 py-3 text-[14px] text-center"
          style={{
            background: domain.bg_color,
            color:      domain.color,
            border:     `1.5px solid ${domain.border_color}`,
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 700,
          }}
        >
          🎉 Niveau suivant débloqué !
        </div>
      )}

      {/* Hero */}
      <DomainHero
        domain={domain}
        progress={progress}
        totalChallenges={totalChallenges}
        completedCount={completedCount}
      />

      {/* Dashboard métriques Santé */}
      {slug === "sante" && (
        <MetricDashboard metrics={metrics} />
      )}

      {/* Niveaux et défis */}
      {levelGroups.map((group) => (
        <div key={group.level}>
          {/* En-tête du niveau */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {!group.isUnlocked && (
                <span className="text-[14px]">🔒</span>
              )}
              <h2
                className="text-[14px]"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 600,
                  color: group.isUnlocked ? "#16162A" : "#B0B0C8",
                }}
              >
                Niveau {group.level} — {LEVEL_NAMES[group.level] ?? `Niveau ${group.level}`}
              </h2>
            </div>
            <span
              className="text-[12px]"
              style={{
                fontFamily: "var(--font-dm-sans)",
                color: group.isUnlocked ? "#7B7B99" : "#B0B0C8",
              }}
            >
              {group.completedCount}/{group.totalCount}
            </span>
          </div>

          {/* Défis du niveau */}
          <div className="flex flex-col gap-2">
            {group.challenges.map((challenge) => {
              const done = completedIds.has(challenge.id);
              const status = done
                ? "done"
                : group.isUnlocked
                ? "available"
                : "locked";

              return (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  status={status}
                  domain={domain}
                  onTap={(c) => {
                    if (status !== "locked") setActiveChallenge(c);
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Bottom sheet */}
      {activeChallenge && (
        <CompleteSheet
          challenge={activeChallenge}
          domain={domain}
          isDone={completedIds.has(activeChallenge.id)}
          onClose={() => setActiveChallenge(null)}
          onComplete={async (val) => {
            await completeChallenge(activeChallenge, val);
            showToast("Défi complété ! 🎯");
          }}
        />
      )}

    </div>
  );
}
