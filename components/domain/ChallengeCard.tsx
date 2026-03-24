"use client";

import type { Challenge, Domain } from "@/types";
import { colors, shadows, radii, font } from "@/lib/tokens";

type ChallengeStatus = "done" | "available" | "locked";

interface ChallengeCardProps {
  challenge: Challenge;
  status:    ChallengeStatus;
  domain:    Domain;
  onTap:     (challenge: Challenge) => void;
}

export function ChallengeCard({ challenge, status, domain, onTap }: ChallengeCardProps) {
  const isDone   = status === "done";
  const isLocked = status === "locked";

  const cardStyle: React.CSSProperties = isDone
    ? {
        background:  domain.bg_color,
        border:      `1.5px solid ${domain.border_color}`,
        boxShadow:   "none",
      }
    : isLocked
    ? {
        background:  colors.bg,
        border:      `1.5px solid ${colors.border}`,
        opacity:     0.55,
        boxShadow:   "none",
      }
    : {
        background:  colors.surface,
        border:      `2px dashed ${domain.color}`,
        boxShadow:   shadows.sm,
      };

  const iconBg = isDone
    ? domain.color
    : isLocked
    ? colors.border
    : `${domain.color}22`;

  return (
    <button
      onClick={() => onTap(challenge)}
      disabled={isLocked}
      aria-disabled={isLocked}
      className="w-full text-left transition-all active:scale-[0.98]"
      style={{ borderRadius: radii.lg, padding: "14px 16px", ...cardStyle }}
    >
      <div className="flex items-start gap-3">

        {/* Icône statut */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: iconBg }}
        >
          {isDone ? (
            <span style={{ color: "#fff", fontSize: 14 }}>✓</span>
          ) : isLocked ? (
            <span style={{ color: colors.text3, fontSize: 13 }}>🔒</span>
          ) : (
            <span style={{ color: domain.color, fontSize: 14 }}>⚡</span>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] leading-snug"
            style={{
              fontFamily:     font.dm,
              fontWeight:     600,
              color:          isDone ? domain.color : isLocked ? colors.text3 : colors.text1,
              textDecoration: isDone ? "line-through" : "none",
            }}
          >
            {challenge.title}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: isDone ? `${domain.color}18` : colors.border,
                color:      isDone ? domain.color : colors.text2,
                fontFamily: font.dm,
                fontWeight: 500,
              }}
            >
              {challenge.duration}
            </span>
            <span className="text-[11px]" style={{ color: isDone ? domain.color : colors.text3, fontFamily: font.dm }}>
              {challenge.type}
            </span>
          </div>

          {challenge.is_measure && !isLocked && (
            <p className="text-[11px] mt-1.5" style={{ color: isDone ? domain.color : colors.text2, fontFamily: font.dm }}>
              📊 {challenge.metric_label}
            </p>
          )}
        </div>

        {/* Flèche disponible */}
        {status === "available" && (
          <span className="text-[16px] shrink-0 self-center" style={{ color: domain.color }}>→</span>
        )}
      </div>
    </button>
  );
}
