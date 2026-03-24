"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { colors, shadows, font } from "@/lib/tokens";

export function Header() {
  const { profile } = useAppStore();
  const initial = profile?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: colors.surface, borderBottom: `1.5px solid ${colors.border}` }}
    >
      <div className="app-shell px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/app" className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px]"
            style={{ background: colors.primary, boxShadow: shadows.primary }}
          >
            🔺
          </div>
          <span
            className="text-[16px]"
            style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.3px" }}
          >
            MaPyramide
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Streak */}
          {profile && profile.streak_count > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px]"
              style={{
                background: "#FFF3EB",
                border:     "1px solid #FFD0AA",
                color:      "#FF8C42",
                fontFamily: font.dm,
                fontWeight: 700,
              }}
            >
              🔥 {profile.streak_count}
            </div>
          )}

          {/* Avatar */}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
            style={{ background: colors.text1 }}
            aria-label="Se déconnecter"
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
