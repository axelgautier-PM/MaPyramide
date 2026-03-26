"use client";

import type { MetricConfig } from "@/lib/metrics-config";
import { computeMetricProgress, isGoalReached } from "@/lib/metrics-config";
import { colors, font, shadows } from "@/lib/tokens";

interface MetricCardProps {
  config:       MetricConfig;
  value:        number | undefined;
  domainColor:  string;
  colSpan2?:    boolean;
}

export function MetricCard({ config, value, domainColor, colSpan2 = false }: MetricCardProps) {
  const hasValue = value !== undefined && value !== null;
  const pct      = hasValue ? computeMetricProgress(value!, config) : 0;
  const good     = hasValue ? isGoalReached(value!, config) : false;

  const barColor = good ? domainColor : `${domainColor}70`;

  return (
    <div
      className={`rounded-xl p-3.5 flex flex-col gap-2 ${colSpan2 ? "col-span-2" : ""}`}
      style={{
        background: colors.surface,
        border:     `1.5px solid ${colors.border}`,
        boxShadow:  shadows.sm,
      }}
    >
      {/* Icône + label + badge objectif */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[17px] leading-none">{config.icon}</span>
          <span className="text-[11px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text2 }}>
            {config.label}
          </span>
        </div>
        {good && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{
              background: `${domainColor}18`,
              color:       domainColor,
              fontFamily:  font.dm,
              fontWeight:  700,
            }}
          >
            ✓ Objectif
          </span>
        )}
      </div>

      {/* Valeur */}
      <div className="flex items-baseline gap-1">
        <span
          className="text-[22px] leading-none"
          style={{
            fontFamily: font.dm,
            fontWeight: 700,
            color:      hasValue ? (good ? domainColor : colors.text1) : colors.text3,
          }}
        >
          {hasValue ? value : "—"}
        </span>
        <span className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>
          {config.unit}
        </span>
        {hasValue && config.goal !== null && (
          <span className="text-[10px] ml-auto" style={{ color: colors.text3, fontFamily: font.dm }}>
            obj. {config.goal}
          </span>
        )}
      </div>

      {/* Barre progression */}
      {config.goal !== null && (
        <div className="h-1.5 rounded-full" style={{ background: colors.border }}>
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      )}

      {!hasValue && (
        <p className="text-[10px]" style={{ color: colors.text3, fontFamily: font.dm }}>
          Complète un défi pour renseigner
        </p>
      )}
    </div>
  );
}
