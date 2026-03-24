import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, Domain, UserDomainProgress, ChallengeCompletion } from "@/types";

interface AppState {
  // Profil utilisateur
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  // Domaines (chargés une fois, mis en cache)
  domains: Domain[];
  setDomains: (domains: Domain[]) => void;

  // Progression par domaine
  progress: Record<string, UserDomainProgress>;
  setProgress: (progress: Record<string, UserDomainProgress>) => void;

  // Complétions (cache local pour éviter les rechargements)
  completions: ChallengeCompletion[];
  setCompletions: (completions: ChallengeCompletion[]) => void;
  addCompletion: (completion: ChallengeCompletion) => void;

  // Reset (déconnexion)
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),

      domains: [],
      setDomains: (domains) => set({ domains }),

      progress: {},
      setProgress: (progress) => set({ progress }),

      completions: [],
      setCompletions: (completions) => set({ completions }),
      addCompletion: (completion) =>
        set((state) => ({
          completions: [...state.completions, completion],
        })),

      reset: () =>
        set({
          profile: null,
          progress: {},
          completions: [],
        }),
    }),
    {
      name: "mapyramide-store",
      // Profile exclu : rechargé depuis Supabase au montage + évite l'email en localStorage
      // Domaines exclus : données statiques rechargées depuis Supabase
      partialize: (state) => ({
        progress: state.progress,
        completions: state.completions,
      }),
    }
  )
);
