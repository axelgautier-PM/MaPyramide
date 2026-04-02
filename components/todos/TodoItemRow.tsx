"use client";

import { useState, useRef, useEffect } from "react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { colors, font } from "@/lib/tokens";
import type { TodoItem } from "@/types/todo";

// ─── Props ────────────────────────────────────────────────────────────────────
interface TodoItemRowProps {
  item:             TodoItem;
  dragHandleProps:  DraggableProvidedDragHandleProps | null | undefined;
  isDragging:       boolean;
  onToggleComplete: () => void;
  onToggleStar:     () => void;
  onTap:            () => void;
  onDelete?:        () => void;   // bouton poubelle pour les tâches terminées
  onRename?:        (newTitle: string) => void; // renommage appui long
}

const LONG_PRESS_MS = 550; // durée appui long avant renommage

// ─── Composant ────────────────────────────────────────────────────────────────
export function TodoItemRow({
  item,
  dragHandleProps,
  isDragging,
  onToggleComplete,
  onToggleStar,
  onTap,
  onDelete,
  onRename,
}: TodoItemRowProps) {
  const [renaming,    setRenaming]    = useState(false);
  const [renameText,  setRenameText]  = useState("");
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef    = useRef(false);
  const renameInput = useRef<HTMLInputElement>(null);

  // Auto-focus + sélection au démarrage du renommage (déclenche le clavier mobile)
  useEffect(() => {
    if (!renaming) return;
    const t = setTimeout(() => {
      renameInput.current?.focus();
      renameInput.current?.select();
    }, 50);
    return () => clearTimeout(t);
  }, [renaming]);

  // ── Appui long → mode renommage ───────────────────────────────────────────
  function onTitleTouchStart() {
    if (!onRename) return;
    movedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (movedRef.current) return;
      setRenameText(item.title);
      setRenaming(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
      // Focus différé pour laisser le DOM se mettre à jour
      requestAnimationFrame(() => {
        renameInput.current?.focus();
        renameInput.current?.select();
      });
    }, LONG_PRESS_MS);
  }

  function onTitleTouchMove() {
    movedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function onTitleTouchEnd() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  // ── Valider le renommage ──────────────────────────────────────────────────
  function commitRename() {
    setRenaming(false);
    const trimmed = renameText.trim();
    if (trimmed && trimmed !== item.title) onRename?.(trimmed);
  }

  function onRenameKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") setRenaming(false);
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-3 rounded-xl transition-all select-none"
      style={{
        background: isDragging ? colors.primaryLight : "transparent",
        boxShadow:  isDragging ? `0 4px 16px ${colors.primary}25` : "none",
        opacity:    item.is_completed ? 0.55 : 1,
        userSelect: "none",
      }}
    >
      {/* ── Colonne gauche : handle drag / poubelle / vide ── */}
      {item.is_completed && onDelete ? (
        /* Bouton poubelle rouge plein pour les tâches terminées */
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: colors.danger }}
          aria-label="Supprimer la tâche"
        >
          <svg width="11" height="12" viewBox="0 0 11 13" fill="none">
            <path d="M1 3h9M4 3V2h3v1M2 3l.8 9h5.4L9 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : dragHandleProps !== null && dragHandleProps !== undefined ? (
        /* Handle drag — visible uniquement si dragHandleProps fourni */
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
      ) : null /* DayWidget : pas de handle, pas de poubelle → rien */}

      {/* ── Checkbox ── */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
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

      {/* ── Titre : tap = détail, appui long = renommage ── */}
      {renaming ? (
        <input
          ref={renameInput}
          autoFocus
          type="text"
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          onBlur={commitRename}
          onKeyDown={onRenameKey}
          className="flex-1 bg-transparent outline-none text-[14px]"
          style={{
            fontFamily:    font.dm,
            fontWeight:    item.is_starred ? 600 : 400,
            color:         colors.text1,
            borderBottom:  `1.5px solid ${colors.primary}`,
            paddingBottom: 1,
            minWidth:      0,
          }}
        />
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onTap(); }}
          onTouchStart={onTitleTouchStart}
          onTouchMove={onTitleTouchMove}
          onTouchEnd={onTitleTouchEnd}
          className="flex-1 flex flex-col items-start gap-0.5 min-w-0 text-left"
        >
          <span
            className="text-[14px] leading-snug truncate w-full"
            style={{
              fontFamily:     font.dm,
              fontWeight:     item.is_starred ? 600 : 400,
              color:          item.is_completed ? colors.text3 : colors.text1,
              textDecoration: item.is_completed ? "line-through" : "none",
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
      )}

      {/* ── Étoile ── */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
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
