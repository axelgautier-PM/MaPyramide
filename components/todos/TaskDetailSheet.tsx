"use client";

import { useState } from "react";
import { colors, font } from "@/lib/tokens";
import type { TodoItem } from "@/types/todo";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TodoList {
  id:    string;
  name:  string;
  icon:  string;
  color: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TaskDetailSheetProps {
  item:               TodoItem;
  onClose:            () => void;
  onUpdate:           (patch: Partial<Pick<TodoItem, "title" | "description" | "due_date">>) => void;
  onDelete:           () => void;
  onToggleStar:       () => void;
  onToggleComplete:   () => void;
  /** Demande à la page parente d'ouvrir AddEventSheet pour cette tâche */
  onScheduleRequest:  () => void;
  /** Listes disponibles pour le déplacement */
  lists?:             TodoList[];
  /** Appelé quand l'utilisateur déplace la tâche vers une autre liste */
  onMoveToList?:      (listId: string) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function TaskDetailSheet({
  item,
  onClose,
  onUpdate,
  onDelete,
  onToggleStar,
  onToggleComplete,
  onScheduleRequest,
  lists,
  onMoveToList,
}: TaskDetailSheetProps) {
  const [title,       setTitle]       = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [dueDate,     setDueDate]     = useState(item.due_date ?? "");
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSave() {
    const patch: Partial<Pick<TodoItem, "title" | "description" | "due_date">> = {};
    if (title.trim() !== item.title)             patch.title       = title.trim();
    if (description !== (item.description ?? "")) patch.description = description || null as unknown as string;
    if (dueDate !== (item.due_date ?? ""))        patch.due_date    = dueDate || null as unknown as string;
    if (Object.keys(patch).length > 0) onUpdate(patch);
    onClose();
  }

  // Autres listes (pas la liste courante)
  const otherLists = lists?.filter((l) => l.id !== item.list_id) ?? [];
  const currentList = lists?.find((l) => l.id === item.list_id);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={handleSave}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
        style={{
          background:    colors.surface,
          maxHeight:     "85vh",
          paddingBottom: "max(32px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
        </div>

        {/* Barre d'actions haute */}
        <div className="flex items-center justify-between px-5 py-2">
          {/* Checkbox */}
          <button
            onClick={onToggleComplete}
            className="flex items-center gap-2 transition-all active:opacity-70"
          >
            <div
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: item.is_completed ? colors.success : colors.border2,
                background:  item.is_completed ? colors.success : "transparent",
              }}
            >
              {item.is_completed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-[13px]" style={{ fontFamily: font.dm, color: colors.text2 }}>
              {item.is_completed ? "Terminée" : "Marquer terminée"}
            </span>
          </button>

          {/* Étoile */}
          <button
            onClick={onToggleStar}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
            style={{ background: item.is_starred ? colors.warningLight : colors.bg }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
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

        <div className="overflow-y-auto px-5 flex flex-col gap-4 pb-4">
          {/* ── Titre ── */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-[20px] w-full bg-transparent outline-none"
            style={{
              fontFamily:     font.dm,
              fontWeight:     700,
              color:          colors.text1,
              letterSpacing:  "-0.3px",
              textDecoration: item.is_completed ? "line-through" : "none",
            }}
          />

          {/* ── Déplacer vers ── */}
          {lists && lists.length > 1 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest mb-2" style={{ fontFamily: font.dm, color: colors.text3, fontWeight: 600 }}>
                Liste
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Liste courante */}
                {currentList && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px]"
                    style={{
                      background: currentList.color,
                      color:      "#fff",
                      fontFamily: font.dm,
                      fontWeight: 600,
                    }}
                  >
                    <span>{currentList.icon}</span>
                    <span>{currentList.name}</span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-0.5">
                      <path d="M1.5 5l3 3 4-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                {/* Autres listes */}
                {otherLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => {
                      onMoveToList?.(list.id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] transition-all active:scale-95"
                    style={{
                      background: colors.bg,
                      border:     `1.5px solid ${colors.border}`,
                      color:      colors.text2,
                      fontFamily: font.dm,
                    }}
                  >
                    <span>{list.icon}</span>
                    <span>{list.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Description ── */}
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ fontFamily: font.dm, color: colors.text3, fontWeight: 600 }}>
              Description
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Comment faire cette tâche…"
              rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none resize-none"
              style={{
                fontFamily: font.dm,
                color:      colors.text1,
                background: colors.bg,
                border:     `1.5px solid ${colors.border}`,
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* ── Échéance ── */}
          <div className="flex items-center justify-between">
            <p className="text-[13px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text2 }}>
              📅 Échéance
            </p>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                padding:      "6px 10px",
                borderRadius: 10,
                fontSize:     13,
                fontFamily:   font.dm,
                color:        colors.text1,
                background:   colors.bg,
                border:       `1.5px solid ${colors.border}`,
                outline:      "none",
              }}
            />
          </div>

          {/* ── Planification calendrier ── */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: colors.primaryLight, border: `1px solid ${colors.primary}30` }}
          >
            <div>
              <p className="text-[13px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.primary }}>
                {item.calendar_event_id ? "📆 Déjà planifié" : "📆 Planifier dans le calendrier"}
              </p>
              <p className="text-[11px] mt-0.5" style={{ fontFamily: font.dm, color: colors.primary, opacity: 0.7 }}>
                {item.calendar_event_id
                  ? "Cette tâche est liée à un créneau"
                  : "Ajouter un créneau horaire pour cette tâche"}
              </p>
            </div>
            {!item.calendar_event_id && (
              <button
                onClick={() => { handleSave(); onScheduleRequest(); }}
                className="ml-3 px-3 py-1.5 rounded-xl text-[12px] transition-all active:scale-90"
                style={{ background: colors.primary, color: "#fff", fontFamily: font.dm, fontWeight: 600 }}
              >
                Planifier →
              </button>
            )}
          </div>

          {/* ── Zone danger ── */}
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-[13px] transition-all active:opacity-60 text-left"
              style={{ fontFamily: font.dm, color: colors.danger }}
            >
              🗑 Supprimer cette tâche
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onDelete(); onClose(); }}
                className="px-4 py-2 rounded-xl text-[13px] transition-all active:scale-95"
                style={{ background: colors.danger, color: "#fff", fontFamily: font.dm, fontWeight: 600 }}
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-[13px] transition-all active:opacity-70"
                style={{ background: colors.bg, border: `1.5px solid ${colors.border}`, color: colors.text2, fontFamily: font.dm }}
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
