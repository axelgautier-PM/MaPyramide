"use client";

import { useState } from "react";
import { colors, font } from "@/lib/tokens";
import type { TodoItem } from "@/types/todo";

// ─── Props ────────────────────────────────────────────────────────────────────
interface DayWidgetProps {
  /** Max 5 tâches étoilées non terminées (fournies par useTodos) */
  starredItems:     TodoItem[];
  onToggleComplete: (id: string) => void;
  onTap:            (item: TodoItem) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function DayWidget({ starredItems, onToggleComplete, onTap }: DayWidgetProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (starredItems.length === 0) return null;

  const top3   = starredItems.slice(0, 3);
  const others = starredItems.slice(3);  // 2 tâches max (5 - 3)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
    >
      {/* ── En-tête ── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-all active:opacity-70"
      >
        <div className="flex items-center gap-2">
          <span className="text-[16px]">⭐</span>
          <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}>
            Ma journée
          </p>
          <span
            className="px-1.5 py-0.5 rounded-full text-[11px]"
            style={{ background: colors.warningLight, color: colors.warning, fontFamily: font.dm, fontWeight: 600 }}
          >
            {starredItems.length}
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <path d="M2 5l5 5 5-5" stroke={colors.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Contenu (collapsible) ── */}
      {!collapsed && (
        <div style={{ borderTop: `1px solid ${colors.border}` }}>

          {/* Top 3 du jour */}
          <div className="px-4 py-2">
            <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: font.dm, color: colors.text3, fontWeight: 600 }}>
              Top 3 du jour
            </p>
            {top3.map((item) => (
              <WidgetItem key={item.id} item={item} onToggleComplete={onToggleComplete} onTap={onTap} highlight />
            ))}
          </div>

          {/* Autres prioritaires (4e et 5e) */}
          {others.length > 0 && (
            <div className="px-4 pb-3" style={{ borderTop: `1px dashed ${colors.border}` }}>
              <p className="text-[10px] uppercase tracking-widest mt-2 mb-1.5" style={{ fontFamily: font.dm, color: colors.text3, fontWeight: 600 }}>
                Aussi prioritaires
              </p>
              {others.map((item) => (
                <WidgetItem key={item.id} item={item} onToggleComplete={onToggleComplete} onTap={onTap} highlight={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Item inline du widget ────────────────────────────────────────────────────
function WidgetItem({
  item,
  onToggleComplete,
  onTap,
  highlight,
}: {
  item:             TodoItem;
  onToggleComplete: (id: string) => void;
  onTap:            (item: TodoItem) => void;
  highlight:        boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(item.id)}
        className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
        style={{
          borderColor: item.is_completed ? colors.success : (highlight ? colors.warning : colors.border2),
          background:  item.is_completed ? colors.success : "transparent",
        }}
      >
        {item.is_completed && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Titre */}
      <button
        onClick={() => onTap(item)}
        className="flex-1 text-left text-[13px] leading-snug truncate"
        style={{
          fontFamily:     font.dm,
          fontWeight:     highlight ? 600 : 400,
          color:          item.is_completed ? colors.text3 : colors.text1,
          textDecoration: item.is_completed ? "line-through" : "none",
        }}
      >
        {item.title}
      </button>

      {/* Badge calendrier */}
      {item.calendar_event_id && (
        <span className="text-[11px] shrink-0" style={{ color: colors.primary }}>📆</span>
      )}
    </div>
  );
}
