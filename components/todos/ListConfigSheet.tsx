"use client";

import { useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { colors, font, shadows } from "@/lib/tokens";
import type { TodoList } from "@/types/todo";

// ─── Émojis communs pour les listes ──────────────────────────────────────────
const COMMON_EMOJIS = [
  "📝","🎯","🌱","💼","🏠","❤️","🏃","📚","🎨","💡",
  "🛒","✈️","💪","🎵","🍎","💊","💰","🧘","🌍","⭐",
  "🔑","🎮","🐾","🌸","🍕","📱","💻","🏋️","🎓","🎁",
];

interface ListConfigSheetProps {
  lists:          TodoList[];
  onClose:        () => void;
  onDeleteList:   (id: string) => Promise<void>;
  onUpdateList:   (id: string, patch: Partial<Pick<TodoList, "name" | "icon" | "color">>) => Promise<void>;
  onReorderLists: (orderedIds: string[]) => Promise<void>;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function ListConfigSheet({
  lists,
  onClose,
  onDeleteList,
  onUpdateList,
  onReorderLists,
}: ListConfigSheetProps) {
  // Local copy of lists for live editing
  const [localLists, setLocalLists] = useState<TodoList[]>([...lists]);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [editingNameFor, setEditingNameFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Touch swipe to close
  const touchStartY = useRef<number | null>(null);
  const sheetRef    = useRef<HTMLDivElement>(null);

  function onHandleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function onHandleTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && sheetRef.current) {
      sheetRef.current.style.transform  = `translateY(${Math.min(dy, 300)}px)`;
      sheetRef.current.style.transition = "none";
    }
  }
  function onHandleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (sheetRef.current) {
      sheetRef.current.style.transform  = "";
      sheetRef.current.style.transition = "";
    }
    if (dy > 80) onClose();
  }

  // ── Drag & drop reorder ─────────────────────────────────────────────────────
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;
    const reordered = [...localLists];
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    setLocalLists(reordered);
  }

  // ── Emoji pick ──────────────────────────────────────────────────────────────
  function handlePickEmoji(listId: string, emoji: string) {
    setLocalLists((prev) => prev.map((l) => l.id === listId ? { ...l, icon: emoji } : l));
    setEmojiPickerFor(null);
  }

  // ── Name edit ───────────────────────────────────────────────────────────────
  function handleNameChange(listId: string, name: string) {
    setLocalLists((prev) => prev.map((l) => l.id === listId ? { ...l, name } : l));
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(listId: string) {
    if (localLists.length <= 1) return; // Garder au moins 1 liste
    setLocalLists((prev) => prev.filter((l) => l.id !== listId));
    await onDeleteList(listId);
  }

  // ── Sauvegarder ─────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      // Reorder + update each list
      await onReorderLists(localLists.map((l) => l.id));
      for (const list of localLists) {
        const original = lists.find((l) => l.id === list.id);
        if (!original) continue;
        if (original.name !== list.name || original.icon !== list.icon) {
          await onUpdateList(list.id, { name: list.name, icon: list.icon });
        }
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(22,22,42,0.5)" }} onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
        style={{
          background:    colors.surface,
          maxWidth:      720,
          margin:        "0 auto",
          maxHeight:     "80vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          boxShadow:     shadows.lg,
        }}
      >
        {/* Handle */}
        <div
          className="flex justify-center pt-3 cursor-grab touch-none"
          style={{ paddingBottom: 8 }}
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
        </div>

        <div className="px-5 pt-2 pb-4 flex flex-col gap-4">
          <h2
            className="text-[18px]"
            style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}
          >
            Gérer les listes
          </h2>

          {/* ── Liste draggable ── */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="list-config">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-1"
                >
                  {localLists.map((list, index) => (
                    <Draggable key={list.id} draggableId={list.id} index={index}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          className="flex items-center gap-3 px-3 py-3 rounded-2xl"
                          style={{
                            background: snap.isDragging ? colors.primaryLight : colors.bg,
                            border:     `1.5px solid ${snap.isDragging ? colors.primary : colors.border}`,
                          }}
                        >
                          {/* Drag handle */}
                          <div
                            {...prov.dragHandleProps}
                            className="shrink-0 flex items-center justify-center w-5 cursor-grab touch-none"
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

                          {/* Emoji button */}
                          <div className="relative">
                            <button
                              onClick={() => setEmojiPickerFor(emojiPickerFor === list.id ? null : list.id)}
                              className="text-[22px] w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                              style={{ background: emojiPickerFor === list.id ? colors.primaryLight : colors.surface }}
                              aria-label="Changer l'émoji"
                            >
                              {list.icon}
                            </button>

                            {/* Emoji picker popover */}
                            {emojiPickerFor === list.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setEmojiPickerFor(null)} />
                                <div
                                  className="absolute left-0 top-full mt-2 rounded-2xl p-3 z-20 grid gap-1"
                                  style={{
                                    background:  colors.surface,
                                    border:      `1.5px solid ${colors.border}`,
                                    boxShadow:   "0 8px 24px rgba(0,0,0,0.12)",
                                    gridTemplateColumns: "repeat(6, 1fr)",
                                    width: 228,
                                  }}
                                >
                                  {COMMON_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handlePickEmoji(list.id, emoji)}
                                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] transition-all active:scale-90 hover:bg-gray-100"
                                      style={{
                                        background: list.icon === emoji ? colors.primaryLight : "transparent",
                                      }}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Name input */}
                          {editingNameFor === list.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={list.name}
                              onChange={(e) => handleNameChange(list.id, e.target.value)}
                              onBlur={() => setEditingNameFor(null)}
                              onKeyDown={(e) => e.key === "Enter" && setEditingNameFor(null)}
                              className="flex-1 bg-transparent outline-none text-[15px]"
                              style={{
                                fontFamily: font.dm,
                                fontWeight: 600,
                                color:      colors.text1,
                                borderBottom: `1.5px solid ${colors.primary}`,
                                paddingBottom: 2,
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingNameFor(list.id)}
                              className="flex-1 text-left text-[15px] transition-all active:opacity-70"
                              style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}
                            >
                              {list.name}
                            </button>
                          )}

                          {/* Delete button (disabled if only 1 list) */}
                          <button
                            onClick={() => handleDelete(list.id)}
                            disabled={localLists.length <= 1}
                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                            style={{ background: colors.dangerLight }}
                            aria-label="Supprimer la liste"
                          >
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                              <path d="M2 2l9 9M11 2l-9 9" stroke={colors.danger} strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* ── Boutons bas ── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-[15px] transition-all active:opacity-70"
              style={{
                background: colors.bg,
                border:     `1.5px solid ${colors.border}`,
                color:      colors.text2,
                fontFamily: font.dm,
                fontWeight: 600,
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl text-[15px] transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: colors.primary,
                color:      "#fff",
                fontFamily: font.dm,
                fontWeight: 700,
              }}
            >
              {saving ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
