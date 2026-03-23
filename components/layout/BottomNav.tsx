"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  matchPaths?: string[];
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        fill={active ? "currentColor" : "none"}
        opacity={active ? 0.15 : 1}
      />
      <path
        d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        fill="none"
      />
    </svg>
  );
}

function BoltIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M13 2L4 13h7l-2 7 9-11h-7l2-7z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="12" width="4" height="7" rx="1" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} />
      <rect x="9" y="8" width="4" height="11" rx="1" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} />
      <rect x="15" y="4" width="4" height="15" rx="1" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5} fill={active ? "currentColor" : "none"} opacity={active ? 0.2 : 1} />
      <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5} fill="none" />
      <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: "/app",
      label: "Accueil",
      icon: (active: boolean) => <HomeIcon active={active} />,
      matchPaths: ["/app"],
    },
    {
      href: "/app/defi-du-jour",
      label: "Défi",
      icon: (active: boolean) => <BoltIcon active={active} />,
      matchPaths: ["/app/defi-du-jour"],
    },
    {
      href: "/app/progression",
      label: "Progression",
      icon: (active: boolean) => <ChartIcon active={active} />,
      matchPaths: ["/app/progression"],
    },
    {
      href: "/app/profil",
      label: "Profil",
      icon: (active: boolean) => <UserIcon active={active} />,
      matchPaths: ["/app/profil"],
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border safe-bottom"
      style={{ height: "calc(60px + env(safe-area-inset-bottom))" }}
    >
      <div className="app-shell h-[60px] flex items-center">
        {navItems.map((item) => {
          const isActive =
            item.matchPaths?.some((p) =>
              p === "/app" ? pathname === "/app" : pathname.startsWith(p)
            ) ?? false;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors"
              style={{ color: isActive ? "#1A1916" : "#A8A5A0" }}
            >
              {item.icon(isActive)}
              <span
                className="text-[10px] leading-none"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
