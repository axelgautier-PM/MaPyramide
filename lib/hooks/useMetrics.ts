"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";

/** Charge toutes les métriques de l'utilisateur (dernière valeur par metric_key) */
export function useMetrics() {
  const { profile } = useAppStore();
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("user_metrics")
        .select("metric_key, value, recorded_at")
        .eq("user_id", profile.id)
        .order("recorded_at", { ascending: false });

      const latest: Record<string, number> = {};
      for (const row of data ?? []) {
        if (!(row.metric_key in latest)) {
          latest[row.metric_key] = row.value;
        }
      }
      setMetrics(latest);
    } catch (e) {
      console.error("useMetrics:", e);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  return { metrics, loading, refresh: load };
}
