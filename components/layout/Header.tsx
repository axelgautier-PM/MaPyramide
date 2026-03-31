"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { colors, font } from "@/lib/tokens";
import { PyramidMiniIcon } from "@/components/ui/PyramidIcon";

export function Header() {
  const { profile } = useAppStore();
  const initial = profile?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 safe-top"
      style={{ background: colors.surface, borderBottom: `1.5px solid ${colors.border}` }}
    >
      <div className="app-shell px-4 h-11 flex items-center justify-between">

        {/* Logo */}
        <Link href="/app" className="flex items-center gap-2.5">
          <PyramidMiniIcon size={34} />
          <span
            className="text-[16px]"
            style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.3px" }}
          >
            MaPyramide
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Streak — "🔥 3j de suite" pour la lisibilité */}
          {profile && profile.streak_count > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px]"
              style={{
                background: colors.warningLight,
                border:     `1px solid ${colors.warningBorder}`,
                color:      colors.warning,
                fontFamily: font.dm,
                fontWeight: 700,
              }}
              title={`${profile.streak_count} jour${profile.streak_count > 1 ? "s" : ""} de suite`}
            >
              🔥 <span>{profile.streak_count}j</span>
            </div>
          )}

          {/* Avatar → lien vers le Profil */}
          <Link
            href="/app/profil"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold transition-opacity active:opacity-70"
            style={{ background: colors.text1 }}
            aria-label="Mon profil"
          >
            {initial}
          </Link>
        </div>
      </div>
    </header>
  );
}
