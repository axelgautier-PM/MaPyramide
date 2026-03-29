"use client";

import { colors, font, radii, shadows } from "@/lib/tokens";

// ─── ToggleRow ────────────────────────────────────────────────────────────────

export interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  first?: boolean;
}

export function ToggleRow({ label, description, value, onToggle, first = true }: ToggleRowProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderTop: first ? "none" : `1px solid ${colors.border}` }}
    >
      <div className="flex-1 pr-4">
        <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
          {label}
        </p>
        <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
          {description}
        </p>
      </div>
      <button
        onClick={onToggle}
        className="w-12 h-7 rounded-full transition-all relative shrink-0"
        style={{ background: value ? colors.primary : colors.border }}
        role="switch"
        aria-checked={value}
      >
        <span
          className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all"
          style={{ left: value ? "calc(100% - 25px)" : 3 }}
        />
      </button>
    </div>
  );
}

// ─── ActionRow ────────────────────────────────────────────────────────────────

export interface ActionRowProps {
  icon: string;
  label: string;
  description?: string;
  color?: string;
  onClick: () => void;
  first?: boolean;
}

export function ActionRow({ icon, label, description, color, onClick, first = true }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-4 transition-all active:opacity-60 text-left"
      style={{ borderTop: first ? "none" : `1px solid ${colors.border}` }}
    >
      <span className="text-[18px] shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className="text-[15px]"
          style={{ fontFamily: font.dm, fontWeight: 500, color: color ?? colors.text1 }}
        >
          {label}
        </p>
        {description && (
          <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text3 }}>
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

export function SectionLabel({ label, color }: { label: string; color?: string }) {
  return (
    <p
      className="text-[11px] uppercase tracking-widest px-1"
      style={{ fontFamily: font.dm, fontWeight: 600, color: color ?? colors.text3 }}
    >
      {label}
    </p>
  );
}

// ─── GroupCard ────────────────────────────────────────────────────────────────

export function GroupCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: colors.surface,
        border: `1.5px solid ${colors.border}`,
        boxShadow: shadows.sm,
      }}
    >
      {children}
    </div>
  );
}
