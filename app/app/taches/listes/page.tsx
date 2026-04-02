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

  const [emojiPickerFor,  setEmojiPickerFor]  = useState<string | null>(null);
  const [editingNameFor,  setEditingNameFor]  = useState<string | null>(null);
  const [showNewList,     setShowNewList]     = useState(false);
  const [newListName,     setNewListName]     = useState("");
  // Confirmation suppression d'une liste avec tâches
  const [deleteConfirm,   setDeleteConfirm]   = useState<{ listId: string; listName: string; taskCount: number } | null>(null);
  const [moveTargetId,    setMoveTargetId]    = useState<string>("");

  // ── Supprimer une liste (avec confirmation si elle contient des tâches) ──
  function handleDeleteList(listId: string) {
    const list      = todos.lists.find((l) => l.id === listId);
    if (!list) return;
    const taskCount = todos.items.filter((i) => i.list_id === listId).length;
    if (taskCount > 0) {
      const others = todos.lists.filter((l) => l.id !== listId);
      setMoveTargetId(others[0]?.id ?? "");
      setDeleteConfirm({ listId, listName: list.name, taskCount });
    } else {
      void todos.deleteList(listId);
    }
  }

  async function confirmDeleteAndMove() {
    if (!deleteConfirm) return;
    if (moveTargetId) {
      // Déplacer toutes les tâches vers la liste cible
      const tasks = todos.items.filter((i) => i.list_id === deleteConfirm.listId);
      await Promise.all(tasks.map((t) => todos.moveItemToList(t.id, moveTargetId)));
    }
    await todos.deleteList(deleteConfirm.listId);
    setDeleteConfirm(null);
  }

  async function confirmDeleteAndPurge() {
    if (!deleteConfirm) return;
    const tasks = todos.items.filter((i) => i.list_id === deleteConfirm.listId);
    await Promise.all(tasks.map((t) => todos.deleteItem(t.id)));
    await todos.deleteList(deleteConfirm.listId);
    setDeleteConfirm(null);
  }

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
  async function handlePickEmoji(emoji: string) {
    if (!emojiPickerFor) return;
    setEmojiPickerFor(null);
    await todos.updateList(emojiPickerFor, { icon: emoji });
  }

  // ── Renommer ──────────────────────────────────────────────────────────────
  async function handleNameBlur(listId: string, value: string) {
    setEditingNameFor(null);
    const trimmed  = value.trim();
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

  const activeListForPicker = todos.lists.find((l) => l.id === emojiPickerFor);

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
                        <div ref={prov.innerRef} {...prov.draggableProps} className="rounded-2xl overflow-hidden">
                          <SwipeableRow
                            onRightAction={todos.lists.length > 1 ? () => handleDeleteList(list.id) : undefined}
                            rightAction={
                              <div className="flex flex-col items-center gap-1">
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                                  <path d="M4 7h14M8 7V5h6v2M9 10v6M13 10v6M5 7l1 12h10L17 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span style={{ color: "white", fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>Supprimer</span>
                              </div>
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
                                className="shrink-0 w-5 flex items-center justify-center cursor-grab touch-none select-none"
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

                              {/* Bouton emoji — ouvre le picker en bottom sheet */}
                              <button
                                onClick={() => setEmojiPickerFor(emojiPickerFor === list.id ? null : list.id)}
                                className="shrink-0 text-[22px] w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                                style={{ background: emojiPickerFor === list.id ? colors.primaryLight : colors.bg }}
                                aria-label="Changer l'émoji"
                              >
                                {list.icon}
                              </button>

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
          className="flex items-center gap-3 px-4 rounded-2xl text-[15px] transition-all active:opacity-70"
          style={{
            background: colors.surface,
            border:     `1.5px dashed ${colors.border2}`,
            color:      colors.text2,
            fontFamily: font.dm,
            minHeight:  "64px",
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.bg }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke={colors.text2} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 500 }}>Nouvelle liste</span>
        </button>
      )}

      {/* ── Confirmation suppression liste avec tâches ── */}
      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setDeleteConfirm(null)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5"
            style={{
              background:    colors.surface,
              paddingBottom: "max(28px, env(safe-area-inset-bottom))",
              boxShadow:     "0 -8px 32px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex justify-center pb-3">
              <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
            </div>
            <p className="text-[17px] mb-1" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}>
              Supprimer « {deleteConfirm.listName} » ?
            </p>
            <p className="text-[14px] mb-4" style={{ fontFamily: font.dm, color: colors.text2 }}>
              Cette liste contient {deleteConfirm.taskCount} tâche{deleteConfirm.taskCount > 1 ? "s" : ""}. Que faire avec elles ?
            </p>

            {/* Sélecteur de liste cible */}
            {todos.lists.filter((l) => l.id !== deleteConfirm.listId).length > 0 && (
              <div className="mb-4">
                <p className="text-[12px] uppercase tracking-widest mb-2" style={{ fontFamily: font.dm, color: colors.text3, fontWeight: 600 }}>
                  Déplacer vers
                </p>
                <div className="flex flex-wrap gap-2">
                  {todos.lists
                    .filter((l) => l.id !== deleteConfirm.listId)
                    .map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setMoveTargetId(l.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] transition-all active:scale-95"
                        style={{
                          background: moveTargetId === l.id ? l.color : colors.surface,
                          border:     `1.5px solid ${moveTargetId === l.id ? l.color : colors.border}`,
                          color:      moveTargetId === l.id ? "#fff" : colors.text2,
                          fontFamily: font.dm,
                          fontWeight: moveTargetId === l.id ? 600 : 400,
                        }}
                      >
                        <span>{l.icon}</span><span>{l.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={confirmDeleteAndMove}
                disabled={!moveTargetId}
                className="w-full py-3.5 rounded-2xl text-[15px] transition-all active:scale-95 disabled:opacity-40"
                style={{ background: colors.primary, color: "#fff", fontFamily: font.dm, fontWeight: 600 }}
              >
                Déplacer les tâches
              </button>
              <button
                onClick={confirmDeleteAndPurge}
                className="w-full py-3.5 rounded-2xl text-[15px] transition-all active:scale-95"
                style={{ background: colors.dangerLight, color: colors.danger, fontFamily: font.dm, fontWeight: 600 }}
              >
                Supprimer les tâches aussi
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full py-3 text-[14px]"
                style={{ color: colors.text3, fontFamily: font.dm }}
              >
                Annuler
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Picker émoji — bottom sheet fixe, hors du DOM de la liste ── */}
      {emojiPickerFor && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setEmojiPickerFor(null)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{
              background:    colors.surface,
              paddingBottom: "max(28px, env(safe-area-inset-bottom))",
              boxShadow:     "0 -8px 32px rgba(0,0,0,0.12)",
            }}
          >
            {/* Poignée */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
            </div>

            <div className="px-4 pb-2 flex items-center justify-between">
              <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
                Émoji de la liste
              </p>
              {activeListForPicker && (
                <span className="text-[13px]" style={{ fontFamily: font.dm, color: colors.text2 }}>
                  {activeListForPicker.icon} {activeListForPicker.name}
                </span>
              )}
            </div>

            <div className="px-4 pb-4 grid gap-2" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handlePickEmoji(emoji)}
                  className="h-12 rounded-xl flex items-center justify-center text-[24px] transition-all active:scale-90"
                  style={{
                    background: activeListForPicker?.icon === emoji ? colors.primaryLight : colors.bg,
                    border:     activeListForPicker?.icon === emoji ? `1.5px solid ${colors.primary}` : "none",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
