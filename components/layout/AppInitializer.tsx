"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { useRouter } from "next/navigation";

// Composant client qui charge le profil au montage et écoute les changements d'auth
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { setProfile, reset } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // Charger le profil de l'utilisateur connecté
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) setProfile(profile);
    }

    loadProfile();

    // Écouter les changements de session (déconnexion, expiration)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          reset();
          router.push("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setProfile, reset, router]);

  return <>{children}</>;
}
