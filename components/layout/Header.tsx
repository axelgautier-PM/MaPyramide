"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";

// Icône pyramide SVG
function PyramidIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <polygon points="14,3 26,24 2,24" fill="currentColor" opacity="0.15" />
      <polygon points="14,3 26,24 2,24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="14,9 22,24 6,24" fill="currentColor" opacity="0.3" />
      <polygon points="14,15 18,24 10,24" fill="currentColor" />
    </svg>
  );
}

export function Header() {
  const { profile } = useAppStore();

  // Initiale de l'utilisateur pour l'avatar
  const initial = profile?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="app-shell px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/app" className="flex items-center gap-2 text-ink">
          <PyramidIcon />
          <span
            className="text-[17px] leading-none"
            style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}
          >
            MaPyramide
          </span>
        </Link>

        {/* Streak + Avatar */}
        <div className="flex items-center gap-3">
          {/* Streak pill */}
          {profile && profile.streak_count > 0 && (
            <div
              className="flex items-center gap-1 px-3 py-1 rounded-full text-[13px]"
              style={{
                background: "#FFF8EC",
                border: "1px solid #F5D48A",
                color: "#B87A10",
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
              }}
            >
              🔥 {profile.streak_count} jours
            </div>
          )}

          {/* Avatar — clic pour se déconnecter */}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
            style={{ background: "#1A1916" }}
            aria-label="Profil utilisateur"
            onClick={() => { supabase.auth.signOut().catch(console.error); }}
            title="Se déconnecter"
          >
            {initial}
          </button>
        </div>
      </div>
    </header>
  );
}
