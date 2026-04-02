"use client";

import { useState } from "react";
import { colors, font } from "@/lib/tokens";
import { TodoItemRow } from "@/components/todos/TodoItemRow";
import type { TodoItem } from "@/types/todo";

// ─── Props ────────────────────────────────────────────────────────────────────
interface DayWidgetProps {
  /** Max 5 tâches étoilées non terminées (fournies par useTodos) */
  starredItems:     TodoItem[];
  onToggleComplete: (id: string) => void;
  onToggleStar:     (id: string) => void;
  onTap:            (item: TodoItem) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function DayWidget({ starredItems, onToggleComplete, onToggleStar, onTap }: DayWidgetProps) {
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
          <div className="px-2 py-1">
            <p className="text-[10px] uppercase tracking-widest px-2 pt-1 pb-0.5" style={{ fontFamily: font.dm, color: colors.text3, fontWeight: 600 }}>
              Top 3 du jour
            </p>
            {top3.map((item) => (
              <TodoItemRow
                key={item.id}
                item={item}
                isDragging={false}
                onToggleComplete={() => onToggleComplete(item.id)}
                onToggleStar={() => onToggleStar(item.id)}
                onTap={() => onTap(item)}
              />
            ))}
          </div>

          {/* Autres prioritaires (4e et 5e) */}
          {others.length > 0 && (
            <div className="px-2 pb-1" style={{ borderTop: `1px dashed ${colors.border}` }}>
              <p className="text-[10px] uppercase tracking-widest px-2 pt-2 pb-0.5" style={{ fontFamily: font.dm, color: colors.text3, fontWeight: 600 }}>
                Aussi prioritaires
              </p>
              {others.map((item) => (
                <TodoItemRow
                  key={item.id}
                  item={item}
                  isDragging={false}
                  onToggleComplete={() => onToggleComplete(item.id)}
                  onToggleStar={() => onToggleStar(item.id)}
                  onTap={() => onTap(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
