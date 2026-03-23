"use client";

import type { Challenge, Domain } from "@/types";

type ChallengeStatus = "done" | "available" | "locked";

interface ChallengeCardProps {
  challenge: Challenge;
  status: ChallengeStatus;
  domain: Domain;
  onTap: (challenge: Challenge) => void;
}

export function ChallengeCard({
  challenge,
  status,
  domain,
  onTap,
}: ChallengeCardProps) {
  const isDone = status === "done";
  const isLocked = status === "locked";

  return (
    <button
      onClick={() => onTap(challenge)}
      disabled={isLocked}
      aria-disabled={isLocked}
      className="w-full text-left rounded-xl p-4 transition-all active:scale-[0.98]"
      style={{
        background: isDone
          ? domain.bg_color
          : isLocked
          ? "#F7F6F3"
          : "white",
        border: `1px solid ${
          isDone ? domain.border_color : isLocked ? "#E0DDD6" : "#E0DDD6"
        }`,
        opacity: isLocked ? 0.6 : 1,
        boxShadow: isDone || isLocked
          ? "none"
          : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icône statut */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: isDone
              ? domain.color
              : isLocked
              ? "#E0DDD6"
              : `${domain.color}18`,
          }}
        >
          {isDone ? (
            <span className="text-white text-[13px]">✓</span>
          ) : isLocked ? (
            <span className="text-[12px]" style={{ color: "#A8A5A0" }}>🔒</span>
          ) : (
            <span className="text-[13px]" style={{ color: domain.color }}>⚡</span>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] leading-snug"
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              color: isDone ? domain.color : isLocked ? "#A8A5A0" : "#1A1916",
              textDecoration: isDone ? "line-through" : "none",
            }}
          >
            {challenge.title}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[11px] px-1.5 py-0.5 rounded"
              style={{
                background: isDone ? `${domain.color}15` : "#F0EDE8",
                color: isDone ? domain.color : "#6B6860",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              {challenge.duration}
            </span>
            <span
              className="text-[11px]"
              style={{
                color: isDone ? domain.color : "#A8A5A0",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              {challenge.type}
            </span>
          </div>

          {/* Étiquette métrique si is_measure et disponible */}
          {challenge.is_measure && !isLocked && (
            <p
              className="text-[11px] mt-1.5"
              style={{
                color: isDone ? domain.color : "#6B6860",
                fontFamily: "var(--font-dm-sans)",
                opacity: 0.85,
              }}
            >
              📊 {challenge.metric_label}
            </p>
          )}
        </div>

        {/* Flèche si disponible */}
        {status === "available" && (
          <span
            className="text-[16px] shrink-0 self-center"
            style={{ color: domain.color }}
          >
            →
          </span>
        )}
      </div>
    </button>
  );
}
