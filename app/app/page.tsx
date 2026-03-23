"use client";

import { useDashboard } from "@/lib/hooks/useDashboard";
import { DomainCard, DomainCardSkeleton } from "@/components/ui/DomainCard";
import { useAppStore } from "@/store/app-store";

// Salutation selon l'heure
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function DashboardPage() {
  const { profile } = useAppStore();
  const { data, loading, error } = useDashboard();

  const firstName = profile?.email?.split("@")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">

      {/* Salutation */}
      <div>
        <h1
          className="text-[24px] text-ink"
          style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}
        >
          {getGreeting()}{firstName ? ` ${firstName}` : ""} 👋
        </h1>
        <p className="text-[14px] text-ink3 mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
          Quel domaine tu travailles aujourd'hui ?
        </p>
      </div>

      {/* Grille des domaines */}
      {error ? (
        <div
          className="rounded-xl p-4 text-[14px] text-center"
          style={{ background: "#FFF2EE", color: "#B84020", border: "1px solid #F5B8A8" }}
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
