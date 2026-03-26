"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMetrics } from "@/lib/hooks/useMetrics";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { getMetricsForDomain } from "@/lib/metrics-config";
import { MetricCard } from "@/components/objectifs/MetricCard";
import { useAppStore } from "@/store/app-store";
import { colors, font } from "@/lib/tokens";

// Composant interne pour accéder aux searchParams
function ObjectifsContent() {
  const searchParams = useSearchParams();
  const initialDomain = searchParams.get("domain") ?? "all";

  const { profile } = useAppStore();
  const { data: domainData, loading: domainsLoading } = useDashboard();
  const { metrics, loading: metricsLoading } = useMetrics();
  const [activeSlug, setActiveSlug] = useState<string>(initialDomain);

  // Sync si le paramètre URL change (ex: navigation depuis [slug])
  useEffect(() => {
    const d = searchParams.get("domain");
    if (d) setActiveSlug(d);
  }, [searchParams]);

  const loading = domainsLoading || metricsLoading;
  const firstName = profile?.email?.split("@")[0] ?? "";

  // Domaines filtrés selon l'onglet actif
  const filteredDomains = activeSlug === "all"
    ? domainData
    : domainData.filter((d) => d.domain.slug === activeSlug);

  // Bannière intro — vrai tant qu'au moins un domaine avec métriques configurées
  // a encore des métriques sans valeur enregistrée
  const hasMissingMetrics = !loading && domainData.some(({ domain }) => {
    const configs = getMetricsForDomain(domain.slug);
    return configs.length > 0 && configs.some((cfg) => metrics[cfg.key] === undefined);
  });

  return (
    <div className="flex flex-col gap-5">

      {/* En-tête */}
      <div>
        <h1
          className="text-[22px]"
          style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.4px" }}
        >
          Mes objectifs 🎯
        </h1>
        <p className="text-[14px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
          {firstName ? `Tes indicateurs clés, ${firstName}.` : "Tes indicateurs clés."}
        </p>
      </div>

      {/* ── Bannière intro métriques ── */}
      {hasMissingMetrics && (
        <div
          className="flex gap-3 px-4 py-4 rounded-2xl"
          style={{
            background: colors.primaryLight,
            border: `1.5px solid ${colors.primary}30`,
          }}
        >
          <span className="text-[22px] shrink-0">📊</span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[14px] leading-snug"
              style={{ fontFamily: font.dm, fontWeight: 700, color: colors.primary }}
            >
              Tes premières métriques t'attendent !
            </p>
            <p
              className="text-[13px] mt-1 leading-snug"
              style={{ fontFamily: font.dm, color: colors.text2 }}
            >
              Complète tes premiers défis pour valoriser tes indicateurs clés domaine par domaine.
            </p>
            <a
              href="/app/defis"
              className="inline-block mt-2 text-[13px]"
              style={{
                fontFamily: font.dm,
                fontWeight: 600,
                color: colors.primary,
                textDecoration: "none",
              }}
            >
              Voir les défis →
            </a>
          </div>
        </div>
      )}

      {/* Onglets domaines — scrollables */}
      <div className="-mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Onglet "Tous" */}
          <button
            onClick={() => setActiveSlug("all")}
            className="shrink-0 px-3 py-1.5 rounded-full text-[13px] transition-all"
            style={{
              background: activeSlug === "all" ? colors.primary : colors.bg,
              color:      activeSlug === "all" ? "#fff" : colors.text2,
              border:     `1.5px solid ${activeSlug === "all" ? colors.primary : colors.border}`,
              fontFamily: font.dm,
              fontWeight: activeSlug === "all" ? 600 : 400,
            }}
          >
            Tous
          </button>

          {domainData.map(({ domain }) => (
            <button
              key={domain.slug}
              onClick={() => setActiveSlug(domain.slug)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] transition-all"
              style={{
                background: activeSlug === domain.slug ? domain.bg_color : colors.bg,
                color:      activeSlug === domain.slug ? domain.color   : colors.text2,
                border:     `1.5px solid ${activeSlug === domain.slug ? domain.color : colors.border}`,
                fontFamily: font.dm,
                fontWeight: activeSlug === domain.slug ? 600 : 400,
              }}
            >
              <span>{domain.icon}</span>
              <span>{domain.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu — métriques par domaine */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl" style={{ background: colors.border }} />
          ))}
        </div>
      ) : filteredDomains.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center text-[14px]"
          style={{ background: colors.bg, color: colors.text3, fontFamily: font.dm }}
        >
          Aucun domaine disponible
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredDomains.map(({ domain, progress }) => {
            const domainMetrics = getMetricsForDomain(domain.slug);
            if (domainMetrics.length === 0) return null;

            const currentLevel = progress?.current_level ?? 0;

            return (
              <div key={domain.slug}>
                {/* En-tête domaine (masqué si filtre actif sur un seul domaine) */}
                {activeSlug === "all" && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[18px]">{domain.icon}</span>
                    <div className="flex-1">
                      <span
                        className="text-[14px]"
                        style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}
                      >
                        {domain.label}
                      </span>
                      <span
                        className="ml-2 text-[12px] px-2 py-0.5 rounded-full"
                        style={{
                          background: domain.bg_color,
                          color:      domain.color,
                          fontFamily: font.dm,
                          fontWeight: 600,
                        }}
                      >
                        Niv. {currentLevel}
                      </span>
                    </div>
                  </div>
                )}

                {activeSlug !== "all" && (
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
                      style={{ background: domain.color }}
                    >
                      {currentLevel}
                    </div>
                    <span
                      className="text-[15px]"
                      style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}
                    >
                      {domain.label}
                    </span>
                  </div>
                )}

                {/* Grille métriques */}
                <div className="grid grid-cols-2 gap-2.5">
                  {domainMetrics.map((config, idx) => {
                    const isOdd = domainMetrics.length % 2 !== 0;
                    const isLast = isOdd && idx === domainMetrics.length - 1;
                    return (
                      <MetricCard
                        key={config.key}
                        config={config}
                        value={metrics[config.key]}
                        domainColor={domain.color}
                        colSpan2={isLast}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// Page principale — enveloppe ObjectifsContent dans Suspense (requis par useSearchParams)
export default function ObjectifsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: 200 }} />}>
      <ObjectifsContent />
    </Suspense>
  );
}
