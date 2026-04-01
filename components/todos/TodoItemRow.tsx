"use client";

import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { colors, font } from "@/lib/tokens";
import type { TodoItem } from "@/types/todo";

// ─── Props ────────────────────────────────────────────────────────────────────
interface TodoItemRowProps {
  item:            TodoItem;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
  isDragging:      boolean;
  onToggleComplete: () => void;
  onToggleStar:     () => void;
  onTap:            () => void;   // ouvre le détail
  onDelete?:        () => void;   // supprime la tâche (affiché si complétée)
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function TodoItemRow({
  item,
  dragHandleProps,
  isDragging,
  onToggleComplete,
  onToggleStar,
  onTap,
  onDelete,
}: TodoItemRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-3 rounded-xl transition-all"
      style={{
        background: isDragging ? colors.primaryLight : "transparent",
        boxShadow:  isDragging ? `0 4px 16px ${colors.primary}25` : "none",
        opacity:    item.is_completed ? 0.55 : 1,
      }}
    >
      {/* ── Handle drag ou bouton supprimer ── */}
      {item.is_completed && onDelete ? (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 flex items-center justify-center w-5 h-5 transition-all active:scale-90"
          aria-label="Supprimer la tâche"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 2l9 9M11 2l-9 9" stroke={colors.danger} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <div
          {...dragHandleProps}
          className="shrink-0 flex items-center justify-center w-5 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Déplacer"
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <circle cx="3" cy="3"  r="1.2" fill={colors.text3} />
            <circle cx="7" cy="3"  r="1.2" fill={colors.text3} />
            <circle cx="3" cy="7"  r="1.2" fill={colors.text3} />
            <circle cx="7" cy="7"  r="1.2" fill={colors.text3} />
            <circle cx="3" cy="11" r="1.2" fill={colors.text3} />
            <circle cx="7" cy="11" r="1.2" fill={colors.text3} />
          </svg>
        </div>
      )}

      {/* ── Checkbox ── */}
      <button
        onClick={onToggleComplete}
        className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
        style={{
          borderColor: item.is_completed ? colors.success : colors.border2,
          background:  item.is_completed ? colors.success : "transparent",
        }}
        aria-label={item.is_completed ? "Marquer non terminée" : "Marquer terminée"}
      >
        {item.is_completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* ── Titre + badges ── */}
      <button
        onClick={onTap}
        className="flex-1 flex flex-col items-start gap-0.5 min-w-0 text-left"
      >
        <span
          className="text-[14px] leading-snug truncate w-full"
          style={{
            fontFamily:      font.dm,
            fontWeight:      item.is_starred ? 600 : 400,
            color:           item.is_completed ? colors.text3 : colors.text1,
            textDecoration:  item.is_completed ? "line-through" : "none",
          }}
        >
          {item.title}
        </span>

        {/* Badges sous-titre */}
        {(item.description || item.calendar_event_id || item.due_date) && (
          <div className="flex items-center gap-1.5">
            {item.due_date && (
              <span className="text-[11px]" style={{ color: colors.warning, fontFamily: font.dm }}>
                📅 {new Date(item.due_date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            )}
            {item.calendar_event_id && (
              <span className="text-[11px]" style={{ color: colors.primary, fontFamily: font.dm }}>
                📆 Planifié
              </span>
            )}
            {item.description && (
              <span className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>
                📝
              </span>
            )}
          </div>
        )}
      </button>

      {/* ── Étoile ── */}
      <button
        onClick={onToggleStar}
        className="shrink-0 w-7 h-7 flex items-center justify-center transition-all active:scale-90"
        aria-label={item.is_starred ? "Retirer des priorités" : "Marquer prioritaire"}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1L2 5.3l4.2-.7z"
            stroke={item.is_starred ? colors.warning : colors.text3}
            strokeWidth="1.5"
            fill={item.is_starred ? colors.warning : "none"}
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
