"use client";

import { colors, font } from "@/lib/tokens";
import { formatDuration } from "@/types/calendar";

interface WeeklyCounterProps {
  weeklyMinutes: number;
}

export function WeeklyCounter({ weeklyMinutes }: WeeklyCounterProps) {
  if (weeklyMinutes === 0) {
    return (
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-2"
        style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
      >
        <span className="text-[16px]">📅</span>
        <p className="text-[13px]" style={{ fontFamily: font.dm, color: colors.text3 }}>
          Aucun créneau planifié cette semaine
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: colors.primaryLight, border: `1.5px solid ${colors.primary}30` }}
    >
      <span className="text-[20px]">⏱️</span>
      <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.primary }}>
        {formatDuration(weeklyMinutes)} planifiées cette semaine
      </p>
    </div>
  );
}
