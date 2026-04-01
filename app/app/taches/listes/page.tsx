"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { colors, font } from "@/lib/tokens";
import { useTodos } from "@/lib/hooks/useTodos";
import { SwipeableRow } from "@/components/todos/SwipeableRow";

// ─── Émojis disponibles pour les listes ──────────────────────────────────────
const COMMON_EMOJIS = [
  "📝","🎯","🌱","💼","🏠","❤️","🏃","📚","🎨","💡",
  "🛒","✈️","💪","🎵","🍎","💊","💰","🧘","🌍","⭐",
  "🔑","🎮","🐾","🌸","🍕","📱","💻","🏋️","🎓","🎁",
];

// ─── Page administration des listes ──────────────────────────────────────────
export default function TachesListesPage() {
  const router = useRouter();
  const todos  = useTodos();

  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [editingNameFor, setEditingNameFor] = useState<string | null>(null);
  const [showNewList,    setShowNewList]    = useState(false);
  const [newListName,    setNewListName]    = useState("");

  // ── Réordonner les listes ─────────────────────────────────────────────────
  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const reordered = [...todos.lists];
    const [moved]   = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    await todos.reorderLists(reordered.map((l) => l.id));
  }

  // ── Changer l'emoji ────────────────────────────────────────────────────────
  async function handlePickEmoji(listId: string, emoji: string) {
    setEmojiPickerFor(null);
    await todos.updateList(listId, { icon: emoji });
  }

  // ── Renommer ──────────────────────────────────────────────────────────────
  async function handleNameBlur(listId: string, value: string) {
    setEditingNameFor(null);
    const trimmed = value.trim();
    const original = todos.lists.find((l) => l.id === listId);
    if (trimmed && trimmed !== original?.name) {
      await todos.updateList(listId, { name: trimmed });
    }
  }

  // ── Créer une liste ───────────────────────────────────────────────────────
  async function handleCreateList() {
    if (!newListName.trim()) return;
    await todos.createList(newListName.trim());
    setNewListName("");
    setShowNewList(false);
  }

  return (
    <div className="flex flex-col gap-4 pb-6">

      {/* ── En-tête ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
          aria-label="Retour"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke={colors.text2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h1 className="text-[22px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.4px" }}>
            Gérer les listes
          </h1>
          <p className="text-[13px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
            Glisse pour réordonner · swipe gauche pour supprimer
          </p>
        </div>
      </div>

      {/* ── Listes (chargement) ── */}
      {todos.loading ? (
        <div className="flex items-center justify-center py-10">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${colors.primary}40`, borderTopColor: colors.primary }}
          />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="lists-admin">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-col gap-2"
              >
                {todos.lists.map((list, index) => {
                  const taskCount = todos.items.filter((i) => i.list_id === list.id && !i.is_completed).length;

                  return (
                    <Draggable key={list.id} draggableId={list.id} index={index}>
                      {(prov, snap) => (
                        <div ref={prov.innerRef} {...prov.draggableProps}>
                          <SwipeableRow
                            onRightAction={todos.lists.length > 1 ? () => void todos.deleteList(list.id) : undefined}
                            rightAction={
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M2 5h14M6 5V3h6v2M7 8v7M11 8v7M4 5l1 10h8l1-10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            }
                            rightActionColor={colors.danger}
                            contentBg={snap.isDragging ? colors.primaryLight : colors.surface}
                            disabled={snap.isDragging}
                          >
                            <div
                              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                              style={{
                                background: snap.isDragging ? colors.primaryLight : colors.surface,
                                border:     `1.5px solid ${snap.isDragging ? colors.primary : colors.border}`,
                              }}
                            >
                              {/* Drag handle */}
                              <div
                                {...prov.dragHandleProps}
                                className="shrink-0 w-5 flex items-center justify-center cursor-grab touch-none"
                                aria-label="Réordonner"
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

                              {/* Bouton emoji */}
                              <div className="relative">
                                <button
                                  onClick={() => setEmojiPickerFor(emojiPickerFor === list.id ? null : list.id)}
                                  className="text-[22px] w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                                  style={{ background: emojiPickerFor === list.id ? colors.primaryLight : colors.bg }}
                                  aria-label="Changer l'émoji"
                                >
                                  {list.icon}
                                </button>

                                {/* Picker émoji */}
                                {emojiPickerFor === list.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setEmojiPickerFor(null)} />
                                    <div
                                      className="absolute left-0 top-full mt-2 rounded-2xl p-2.5 z-20 grid gap-1"
                                      style={{
                                        background:          colors.surface,
                                        border:              `1.5px solid ${colors.border}`,
                                        boxShadow:           "0 8px 24px rgba(0,0,0,0.12)",
                                        gridTemplateColumns: "repeat(6, 1fr)",
                                        width:               222,
                                      }}
                                    >
                                      {COMMON_EMOJIS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          onClick={() => handlePickEmoji(list.id, emoji)}
                                          className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] transition-all active:scale-90"
                                          style={{ background: list.icon === emoji ? colors.primaryLight : "transparent" }}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Nom (éditable au tap) */}
                              {editingNameFor === list.id ? (
                                <input
                                  autoFocus
                                  type="text"
                                  defaultValue={list.name}
                                  onBlur={(e) => handleNameBlur(list.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleNameBlur(list.id, (e.target as HTMLInputElement).value);
                                  }}
                                  className="flex-1 bg-transparent outline-none text-[15px]"
                                  style={{
                                    fontFamily:    font.dm,
                                    fontWeight:    600,
                                    color:         colors.text1,
                                    borderBottom:  `1.5px solid ${colors.primary}`,
                                    paddingBottom: 1,
                                  }}
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingNameFor(list.id)}
                                  className="flex-1 text-left transition-all active:opacity-70"
                                >
                                  <span
                                    className="text-[15px] block"
                                    style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}
                                  >
                                    {list.name}
                                  </span>
                                  {taskCount > 0 && (
                                    <span
                                      className="text-[11px]"
                                      style={{ fontFamily: font.dm, color: colors.text3 }}
                                    >
                                      {taskCount} tâche{taskCount > 1 ? "s" : ""}
                                    </span>
                                  )}
                                </button>
                              )}

                              {/* Pastille couleur */}
                              <div
                                className="shrink-0 w-3 h-3 rounded-full"
                                style={{ background: list.color }}
                              />
                            </div>
                          </SwipeableRow>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* ── Créer une nouvelle liste ── */}
      {showNewList ? (
        <div
          className="flex items-center gap-2 p-3 rounded-xl"
          style={{ background: colors.surface, border: `1.5px solid ${colors.primary}` }}
        >
          <input
            autoFocus
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
            placeholder="Nom de la liste…"
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ fontFamily: font.dm, color: colors.text1 }}
          />
          <button
            onClick={handleCreateList}
            className="px-3 py-1.5 rounded-xl text-[13px] transition-all active:scale-95"
            style={{ background: colors.primary, color: "#fff", fontFamily: font.dm, fontWeight: 600 }}
          >
            Créer
          </button>
          <button
            onClick={() => { setShowNewList(false); setNewListName(""); }}
            className="text-[20px] leading-none transition-all active:opacity-60"
            style={{ color: colors.text3 }}
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewList(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl text-[14px] transition-all active:opacity-70"
          style={{
            background: colors.surface,
            border:     `1.5px dashed ${colors.border2}`,
            color:      colors.text2,
            fontFamily: font.dm,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke={colors.text2} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Nouvelle liste
        </button>
      )}
    </div>
  );
}
