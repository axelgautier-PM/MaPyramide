import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, Domain, UserDomainProgress, ChallengeCompletion } from "@/types";

/** Préférences de notifications persistées localement */
export interface NotifPrefs {
  notifCalendar: boolean;    // Notifications rappels calendrier
  notifDefis:    boolean;    // Notifications nouveaux défis / encouragements
  notifDaily:    boolean;    // Notification quotidienne
  notifDailyTime: string;    // Heure HH:MM (ex: "08:00")
  notifDailyDays: number[];  // Jours actifs 1=Lun…7=Dim (vide = tous)
}

const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  notifCalendar:   true,
  notifDefis:      true,
  notifDaily:      false,
  notifDailyTime:  "08:00",
  notifDailyDays:  [1, 2, 3, 4, 5], // Lun-Ven par défaut
};

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

  // Google Calendar connecté (tokens présents en DB)
  isGoogleConnected: boolean;
  setGoogleConnected: (v: boolean) => void;

  // Préférences notifications
  notifPrefs: NotifPrefs;
  setNotifPrefs: (prefs: Partial<NotifPrefs>) => void;

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

      isGoogleConnected: false,
      setGoogleConnected: (v) => set({ isGoogleConnected: v }),

      notifPrefs: DEFAULT_NOTIF_PREFS,
      setNotifPrefs: (prefs) =>
        set((state) => ({
          notifPrefs: { ...state.notifPrefs, ...prefs },
        })),

      reset: () =>
        set({
          profile: null,
          progress: {},
          completions: [],
          isGoogleConnected: false,
        }),
    }),
    {
      name: "mapyramide-store",
      // Profile exclu : rechargé depuis Supabase au montage + évite l'email en localStorage
      // Domaines exclus : données statiques rechargées depuis Supabase
      partialize: (state) => ({
        progress:    state.progress,
        completions: state.completions,
        notifPrefs:  state.notifPrefs,
      }),
    }
  )
);
