"use client";

import { METRICS_CONFIG } from "@/types";

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
          color: "#6B6860",
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
          if (hasValue) {
            if (config.direction === "up") {
              pct = Math.min(100, Math.round((value / config.goal) * 100));
            } else {
              // "down" = plus bas = mieux (masse grasse)
              pct = value <= config.goal ? 100 : Math.max(0, Math.round((1 - (value - config.goal) / config.goal) * 100));
            }
          }

          const isGood = hasValue && (
            config.direction === "up" ? value >= config.goal : value <= config.goal
          );

          // Si nombre impair d'items, le dernier prend toute la largeur
          const isOddTotal = METRICS_CONFIG.length % 2 !== 0;
          const isLast = isOddTotal && idx === METRICS_CONFIG.length - 1;

          return (
            <div
              key={config.key}
              className={`rounded-xl p-3.5 ${isLast ? "col-span-2" : ""}`}
              style={{
                background: "white",
                border: "1px solid #E0DDD6",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[18px] leading-none">{config.icon}</span>
                  <span
                    className="text-[12px]"
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontWeight: 700,
                      color: "#1A1916",
                    }}
                  >
                    {config.label}
                  </span>
                </div>
                {isGood && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "#EEF7E6",
                      color: "#2E7D0E",
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
                    color: hasValue ? (isGood ? "#2E7D0E" : "#1A1916") : "#C8C5BC",
                  }}
                >
                  {hasValue ? value : "—"}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: "#A8A5A0", fontFamily: "var(--font-dm-sans)" }}
                >
                  {config.unit}
                </span>
                {hasValue && (
                  <span
                    className="text-[11px] ml-auto"
                    style={{ color: "#A8A5A0", fontFamily: "var(--font-dm-sans)" }}
                  >
                    obj. {config.goal} {config.unit}
                  </span>
                )}
              </div>

              {/* Barre de progression */}
              <div
                className="h-1.5 rounded-full"
                style={{ background: "#F0EDE8" }}
              >
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: isGood ? "#2E7D0E" : "#AAD8A0",
                  }}
                />
              </div>

              {/* Message si pas encore de données */}
              {!hasValue && (
                <p
                  className="text-[11px] mt-1.5"
                  style={{ color: "#A8A5A0", fontFamily: "var(--font-dm-sans)" }}
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
