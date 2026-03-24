"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import type { Domain, UserDomainProgress, Challenge } from "@/types";

export interface DomainWithData {
  domain: Domain;
  progress: UserDomainProgress | null;
  totalChallenges: number;
  completedCount: number;
  nextChallenge: Challenge | null;
}

// Calcule le nombre de défis complétés pour un domaine donné
function countCompleted(
  challenges: Challenge[],
  completedIds: Set<string>
): number {
  return challenges.filter((c) => completedIds.has(c.id)).length;
}

// Trouve le prochain défi non complété du niveau actuel
function findNextChallenge(
  challenges: Challenge[],
  currentLevel: number,
  completedIds: Set<string>
): Challenge | null {
  const levelChallenges = challenges
    .filter((c) => c.level_index === currentLevel && c.is_active)
    .sort((a, b) => a.order_index - b.order_index);

  return levelChallenges.find((c) => !completedIds.has(c.id)) ?? null;
}

export function useDashboard() {
  const { profile, setDomains, setCompletions } = useAppStore();
  const [data, setData] = useState<DomainWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Charger les domaines actifs
        const { data: domains, error: domainsError } = await supabase
          .from("domains")
          .select("*")
          .eq("is_active", true)
          .order("order_index");

        if (domainsError) throw domainsError;
        if (!domains) throw new Error("Aucun domaine trouvé");
        setDomains(domains);

        // Charger tous les défis actifs
        const { data: challenges, error: challengesError } = await supabase
          .from("challenges")
          .select("*")
          .eq("is_active", true);

        if (challengesError) throw challengesError;

        const allChallenges: Challenge[] = challenges ?? [];

        // Si pas connecté, afficher les domaines sans progression
        if (!profile) {
          setData(
            domains.map((domain) => {
              const domainChallenges = allChallenges.filter(
                (c) => c.domain_id === domain.id
              );
              return {
                domain,
                progress: null,
                totalChallenges: domainChallenges.length,
                completedCount: 0,
                nextChallenge: findNextChallenge(domainChallenges, 0, new Set()),
              };
            })
          );
          setLoading(false);
          return;
        }

        // Charger la progression de l'utilisateur par domaine
        const { data: progressData } = await supabase
          .from("user_domain_progress")
          .select("*")
          .eq("user_id", profile.id);

        const progressMap: Record<string, UserDomainProgress> = {};
        (progressData ?? []).forEach((p) => {
          progressMap[p.domain_id] = p;
        });

        // Charger toutes les complétions (une seule requête)
        const { data: fullCompletions } = await supabase
          .from("challenge_completions")
          .select("*")
          .eq("user_id", profile.id);

        if (fullCompletions) setCompletions(fullCompletions);

        const completedIds = new Set(
          (fullCompletions ?? []).map((c) => c.challenge_id)
        );

        // Assembler les données par domaine
        const result: DomainWithData[] = domains.map((domain) => {
          const domainChallenges = allChallenges.filter(
            (c) => c.domain_id === domain.id
          );
          const progress = progressMap[domain.id] ?? null;
          const currentLevel = progress?.current_level ?? 0;

          return {
            domain,
            progress,
            totalChallenges: domainChallenges.length,
            completedCount: countCompleted(domainChallenges, completedIds),
            nextChallenge: findNextChallenge(
              domainChallenges,
              currentLevel,
              completedIds
            ),
          };
        });

        setData(result);
      } catch (err) {
        setError("Impossible de charger les données. Réessaie.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [profile?.id]);

  return { data, loading, error };
}
