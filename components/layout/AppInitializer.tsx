"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { useRouter } from "next/navigation";

// Retourne la date locale au format YYYY-MM-DD
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Retourne hier au format YYYY-MM-DD
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// Composant client qui charge le profil au montage et écoute les changements d'auth
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { setProfile, reset } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      // Mise à jour du streak quotidien
      const today = todayStr();
      const yesterday = yesterdayStr();

      if (profile.last_active_date !== today) {
        // Streak continue si la dernière activité était hier, sinon repart à 1
        const newStreak =
          profile.last_active_date === yesterday
            ? profile.streak_count + 1
            : 1;

        const { data: updated } = await supabase
          .from("profiles")
          .update({ streak_count: newStreak, last_active_date: today })
          .eq("id", user.id)
          .select()
          .single();

        setProfile(updated ?? { ...profile, streak_count: newStreak, last_active_date: today });
      } else {
        setProfile(profile);
      }
    }

    loadProfile();

    // Écouter les changements de session (déconnexion, expiration)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        reset();
        router.push("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile, reset, router]);

  return <>{children}</>;
}
