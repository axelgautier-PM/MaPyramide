"use client";

import { DOMAIN_METRICS } from "@/lib/metrics-config";
import { colors, font } from "@/lib/tokens";

const METRICS_CONFIG = DOMAIN_METRICS["sante"] ?? [];

interface MetricDashboardProps {
  metrics: Record<string, number>;
}

export function MetricDashboard({ metrics }: MetricDashboardProps) {
  return (
    <div>
      <h2
        className="text-[13px] mb-3"
        style={{
          fontFamily: "var(--font-syne)",
          fontWeight: 700,
          color: colors.text2,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Mes métriques
      </h2>

      <div className="grid grid-cols-2 gap-2.5">
        {METRICS_CONFIG.map((config, idx) => {
          const value = metrics[config.key];
          const hasValue = value !== undefined && value !== null;

          // Calculer la progression vers l'objectif
          let pct = 0;
          const goal = config.goal;
          if (hasValue && goal !== null) {
            if (config.direction === "up") {
              pct = Math.min(100, Math.round((value / goal) * 100));
            } else {
              // "down" = plus bas = mieux (masse grasse)
              pct = value <= goal ? 100 : Math.max(0, Math.round((1 - (value - goal) / goal) * 100));
            }
          }

          const isGood = hasValue && goal !== null && (
            config.direction === "up" ? value >= goal : value <= goal
          );

          // Si nombre impair d'items, le dernier prend toute la largeur
          const isOddTotal = METRICS_CONFIG.length % 2 !== 0;
          const isLast = isOddTotal && idx === METRICS_CONFIG.length - 1;

          return (
            <div
              key={config.key}
              className={`rounded-xl p-3.5 ${isLast ? "col-span-2" : ""}`}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[18px] leading-none">{config.icon}</span>
                  <span
                    className="text-[12px]"
                    style={{ fontFamily: "var(--font-syne)", fontWeight: 700, color: colors.text1 }}
                  >
                    {config.label}
                  </span>
                </div>
                {isGood && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: colors.successLight,
                      color: colors.successDark,
                      fontFamily: "var(--font-syne)",
                      fontWeight: 700,
                    }}
                  >
                    ✓ Objectif
                  </span>
                )}
              </div>

              {/* Valeur */}
              <div className="flex items-baseline gap-1 mb-2">
                <span
                  className="text-[22px] leading-none"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 800,
                    color: hasValue ? (isGood ? colors.successDark : colors.text1) : colors.text3,
                  }}
                >
                  {hasValue ? value : "—"}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: colors.text3, fontFamily: font.dm }}
                >
                  {config.unit}
                </span>
                {hasValue && goal !== null && (
                  <span
                    className="text-[11px] ml-auto"
                    style={{ color: colors.text3, fontFamily: font.dm }}
                  >
                    obj. {goal} {config.unit}
                  </span>
                )}
              </div>

              {/* Barre de progression */}
              <div className="h-1.5 rounded-full" style={{ background: colors.bg }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: isGood ? colors.successDark : colors.successMid,
                  }}
                />
              </div>

              {/* Message si pas encore de données */}
              {!hasValue && (
                <p
                  className="text-[11px] mt-1.5"
                  style={{ color: colors.text3, fontFamily: font.dm }}
                >
                  Complète un défi pour renseigner
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
