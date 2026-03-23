"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import type { Domain, Challenge, UserDomainProgress } from "@/types";

export interface LevelGroup {
  level: number;
  challenges: Challenge[];
  isUnlocked: boolean;
  completedCount: number;
  totalCount: number;
}

export interface DomainState {
  domain: Domain | null;
  levelGroups: LevelGroup[];
  progress: UserDomainProgress | null;
  metrics: Record<string, number>;
  loading: boolean;
  error: string | null;
  justUnlocked: boolean;
  completeChallenge: (challenge: Challenge, metricValue?: number) => Promise<void>;
}

const UNLOCK_THRESHOLD = 0.75;

export function useDomain(slug: string): DomainState {
  const { profile, domains, completions, addCompletion } = useAppStore();

  const [domain, setDomain] = useState<Domain | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<UserDomainProgress | null>(null);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);

  // Refs assignées directement au render (pas dans useEffect) — pattern correct
  const progressRef = useRef(progress);
  const challengesRef = useRef(challenges);
  progressRef.current = progress;
  challengesRef.current = challenges;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const storeD = domains.find((d) => d.slug === slug);
        let dom: Domain | null = storeD ?? null;

        if (!dom) {
          const { data, error: e } = await supabase
            .from("domains")
            .select("*")
            .eq("slug", slug)
            .single();
          if (e || !data) throw new Error("Domaine introuvable");
          dom = data;
        }
        setDomain(dom);

        const { data: ch, error: chE } = await supabase
          .from("challenges")
          .select("*")
          .eq("domain_id", dom.id)
          .eq("is_active", true)
          .order("level_index")
          .order("order_index");
        if (chE) throw chE;
        setChallenges(ch ?? []);

        if (!profile) return;

        const { data: prog } = await supabase
          .from("user_domain_progress")
          .select("*")
          .eq("user_id", profile.id)
          .eq("domain_id", dom.id)
          .maybeSingle();
        setProgress(prog ?? null);

        if (slug === "sante") {
          const { data: mData } = await supabase
            .from("user_metrics")
            .select("*")
            .eq("user_id", profile.id)
            .order("recorded_at", { ascending: false });

          const latest: Record<string, number> = {};
          for (const m of mData ?? []) {
            if (!(m.metric_key in latest)) {
              latest[m.metric_key] = m.value;
            }
          }
          setMetrics(latest);
        }
      } catch (err) {
        setError("Impossible de charger les données.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const completeChallenge = useCallback(
    async (challenge: Challenge, metricValue?: number) => {
      if (!profile || !domain) return;

      const currentProgress = progressRef.current;
      const allChallenges = challengesRef.current;

      // 1. Enregistrer la complétion
      const { data: comp, error: compE } = await supabase
        .from("challenge_completions")
        .insert({
          user_id: profile.id,
          challenge_id: challenge.id,
          metric_value: metricValue ?? null,
        })
        .select()
        .single();

      if (compE || !comp) throw compE ?? new Error("Erreur complétion");
      addCompletion(comp);

      // 2. Enregistrer la métrique — erreur tracée mais non bloquante
      if (challenge.metric_key && metricValue !== undefined && metricValue !== null) {
        const { error: metricE } = await supabase.from("user_metrics").insert({
          user_id: profile.id,
          metric_key: challenge.metric_key,
          value: metricValue,
          challenge_id: challenge.id,
        });
        if (metricE) {
          console.error("Erreur sauvegarde métrique :", metricE);
        } else {
          setMetrics((prev) => ({ ...prev, [challenge.metric_key!]: metricValue }));
        }
      }

      // 3. Vérifier le déverrouillage — uniquement pour le niveau actuel
      const currentLevel = currentProgress?.current_level ?? 0;
      if (challenge.level_index !== currentLevel) return;

      const levelChallenges = allChallenges.filter(
        (c) => c.level_index === currentLevel
      );
      const completedIds = new Set([
        ...useAppStore.getState().completions.map((c) => c.challenge_id),
        challenge.id,
      ]);
      const completedCount = levelChallenges.filter((c) =>
        completedIds.has(c.id)
      ).length;

      const shouldUnlock = completedCount / levelChallenges.length >= UNLOCK_THRESHOLD;
      // Jamais régresser le niveau : on prend le max entre l'actuel et le nouveau
      const newLevel = shouldUnlock
        ? Math.max(currentLevel + 1, currentProgress?.current_level ?? 0)
        : currentLevel;

      const { data: updatedProg } = await supabase
        .from("user_domain_progress")
        .upsert({
          user_id: profile.id,
          domain_id: domain.id,
          current_level: newLevel,
          // total_completed dérivé côté serveur via count — ici on incrémente au minimum
          total_completed: (currentProgress?.total_completed ?? 0) + 1,
          unlocked_at: shouldUnlock
            ? new Date().toISOString()
            : (currentProgress?.unlocked_at ?? null),
        })
        .select()
        .single();

      if (updatedProg) {
        setProgress(updatedProg);
        if (shouldUnlock) setJustUnlocked(true);
      }
    },
    [profile, domain, addCompletion]
  );

  // Nettoyer le timer justUnlocked avec cleanup
  useEffect(() => {
    if (!justUnlocked) return;
    const id = setTimeout(() => setJustUnlocked(false), 3000);
    return () => clearTimeout(id);
  }, [justUnlocked]);

  // Groupes de niveaux — calculés au render (pas de memoization nécessaire ici,
  // completions vient du store Zustand et change peu souvent)
  const completedIds = new Set(completions.map((c) => c.challenge_id));
  const currentLevel = progress?.current_level ?? 0;

  const levels = [...new Set(challenges.map((c) => c.level_index))].sort(
    (a, b) => a - b
  );

  const levelGroups: LevelGroup[] = levels.map((level) => {
    const lvlChallenges = challenges.filter((c) => c.level_index === level);
    const completedCount = lvlChallenges.filter((c) =>
      completedIds.has(c.id)
    ).length;
    return {
      level,
      challenges: lvlChallenges,
      isUnlocked: level <= currentLevel,
      completedCount,
      totalCount: lvlChallenges.length,
    };
  });

  return {
    domain,
    levelGroups,
    progress,
    metrics,
    loading,
    error,
    justUnlocked,
    completeChallenge,
  };
}
