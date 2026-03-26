"use client";

import { useDashboard } from "@/lib/hooks/useDashboard";
import { DomainCard, DomainCardSkeleton } from "@/components/ui/DomainCard";
import { colors, font } from "@/lib/tokens";

export default function DefisPage() {
  const { data, loading, error } = useDashboard();

  return (
    <div className="flex flex-col gap-5">

      {/* En-tête */}
      <div>
        <h1
          className="text-[22px]"
          style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.4px" }}
        >
          Mes défis ⚡
        </h1>
        <p className="text-[14px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
          Choisis un domaine et progresse niveau par niveau.
        </p>
      </div>

      {/* Grille des domaines */}
      {error ? (
        <div
          className="rounded-xl p-4 text-[14px] text-center"
          style={{ background: "#FFF0F0", color: colors.danger, border: "1px solid #FFB0B0", fontFamily: font.dm }}
        >
          {error}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DomainCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {data.map((item) => (
            <DomainCard key={item.domain.id} data={item} />
          ))}
        </div>
      )}

    </div>
  );
}
