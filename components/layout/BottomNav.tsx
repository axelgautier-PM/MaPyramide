"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  matchPaths?: string[];
}

function TargetIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? "currentColor" : "none"} opacity={active ? 0.12 : 1} />
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth={active ? 2 : 1.5} fill="none" />
      <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth={active ? 2 : 1.5} fill="none" />
      <circle cx="11" cy="11" r="1.5" fill="currentColor" />
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

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="5" width="16" height="15" rx="2"
        fill={active ? "currentColor" : "none"} opacity={active ? 0.12 : 1}
        stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
      <rect x="3" y="5" width="16" height="15" rx="2"
        fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
      <path d="M7 3v4M15 3v4M3 10h16"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <circle cx="8" cy="15" r="1" fill="currentColor" />
      <circle cx="14" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

// Icône Concentration — sablier / focus
function ConcentrationIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {/* Cercle extérieur */}
      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? "currentColor" : "none"} opacity={active ? 0.1 : 1} />
      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth={active ? 2 : 1.5} fill="none" />
      {/* Aiguille / progression */}
      <path d="M11 6v5l3 2" stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: "/app",
      label: "Objectifs",
      icon: (active: boolean) => <TargetIcon active={active} />,
      matchPaths: ["/app"],
    },
    {
      href: "/app/defis",
      label: "Défis",
      icon: (active: boolean) => <BoltIcon active={active} />,
      matchPaths: ["/app/defis"],
    },
    {
      href: "/app/calendrier",
      label: "Calendrier",
      icon: (active: boolean) => <CalendarIcon active={active} />,
      matchPaths: ["/app/calendrier"],
    },
    {
      href: "/app/concentration",
      label: "Concentration",
      icon: (active: boolean) => <ConcentrationIcon active={active} />,
      matchPaths: ["/app/concentration"],
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
              style={{ color: isActive ? "#6C63FF" : "#B0B0C8" }}
            >
              <div
                className="px-4 py-1 rounded-xl transition-all"
                style={{ background: isActive ? "#EEF0FF" : "transparent" }}
              >
                {item.icon(isActive)}
              </div>
              <span
                className="text-[10px] leading-none"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: isActive ? 600 : 400,
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
