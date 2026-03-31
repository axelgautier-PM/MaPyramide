"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { colors, font } from "@/lib/tokens";
import { useTodos } from "@/lib/hooks/useTodos";
import { CaptureBar } from "@/components/todos/CaptureBar";
import { DayWidget } from "@/components/todos/DayWidget";
import { TodoItemRow } from "@/components/todos/TodoItemRow";
import { TaskDetailSheet } from "@/components/todos/TaskDetailSheet";
import { AddEventSheet } from "@/components/calendar/AddEventSheet";
import { useCalendar } from "@/lib/hooks/useCalendar";
import type { TodoItem } from "@/types/todo";
import type { EventForm } from "@/types/calendar";
import { emptyForm } from "@/types/calendar";

// ─── Page Tâches ──────────────────────────────────────────────────────────────

export default function TachesPage() {
  const todos   = useTodos();
  const calendar = useCalendar();

  const [selectedItem,   setSelectedItem]   = useState<TodoItem | null>(null);
  const [schedulingItem, setSchedulingItem] = useState<TodoItem | null>(null);
  const [showNewList,    setShowNewList]    = useState(false);
  const [newListName,    setNewListName]    = useState("");

  // ── Tâches de la liste sélectionnée (non terminées en tête, terminées en bas) ──
  const listItems = todos.items
    .filter((i) => i.list_id === todos.selectedListId)
    .sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      return a.position - b.position;
    });

  const selectedList = todos.lists.find((l) => l.id === todos.selectedListId);
  const incompleteCount = listItems.filter((i) => !i.is_completed).length;

  // ── Capture rapide ──────────────────────────────────────────────────────────
  function handleCapture(text: string) {
    const listId = todos.selectedListId ?? todos.lists[0]?.id;
    if (!listId) return;
    todos.addItem({ title: text, list_id: listId });
  }

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  function handleDragEnd(result: DropResult) {
    if (!result.destination || !todos.selectedListId) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const incomplete = listItems.filter((i) => !i.is_completed);
    const reordered  = [...incomplete];
    const [moved]    = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    todos.reorderItems(todos.selectedListId, reordered.map((i) => i.id));
  }

  // ── Planification tâche → calendrier ────────────────────────────────────────
  async function handleScheduleSave(form: EventForm) {
    if (!schedulingItem) return;
    await calendar.addEvent(form);
    // Récupérer l'event créé depuis les données locales (dernier ajouté)
    // On n'a pas l'ID directement, mais on peut chercher par titre + date
    // Pour simplifier : on marque la tâche avec un flag sans l'ID exact
    await todos.updateItem(schedulingItem.id, { calendar_event_id: "linked" });
    setSchedulingItem(null);
  }

  // ── Création liste ──────────────────────────────────────────────────────────
  async function handleCreateList() {
    if (!newListName.trim()) return;
    const list = await todos.createList(newListName.trim());
    todos.setSelectedListId(list.id);
    setNewListName("");
    setShowNewList(false);
  }

  if (todos.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${colors.primary}40`, borderTopColor: colors.primary }} />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 pb-6">

        {/* ── En-tête ── */}
        <div>
          <h1 className="text-[22px]" style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.4px" }}>
            Tâches
          </h1>
          <p className="text-[14px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
            {incompleteCount > 0 ? `${incompleteCount} tâche${incompleteCount > 1 ? "s" : ""} à faire` : "Tout est à jour 🎉"}
          </p>
        </div>

        {/* ── Capture rapide ── */}
        <CaptureBar
          onCapture={handleCapture}
          placeholder={selectedList ? `Ajouter dans ${selectedList.icon} ${selectedList.name}…` : "Capture rapide…"}
        />

        {/* ── Widget Ma journée (top 5 étoilées) ── */}
        <DayWidget
          starredItems={todos.starredItems}
          onToggleComplete={todos.toggleComplete}
          onTap={setSelectedItem}
        />

        {/* ── Sélecteur de listes ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {todos.lists.map((list) => {
            const isActive = list.id === todos.selectedListId;
            const count = todos.items.filter((i) => i.list_id === list.id && !i.is_completed).length;
            return (
              <button
                key={list.id}
                onClick={() => todos.setSelectedListId(list.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] transition-all"
                style={{
                  background:  isActive ? list.color : colors.surface,
                  border:      `1.5px solid ${isActive ? list.color : colors.border}`,
                  color:       isActive ? "#fff" : colors.text2,
                  fontFamily:  font.dm,
                  fontWeight:  isActive ? 600 : 400,
                }}
              >
                <span>{list.icon}</span>
                <span>{list.name}</span>
                {count > 0 && (
                  <span
                    className="px-1 py-0.5 rounded-full text-[10px] min-w-[16px] text-center leading-none"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.25)" : colors.border,
                      color:      isActive ? "#fff" : colors.text3,
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Bouton nouvelle liste */}
          <button
            onClick={() => setShowNewList(true)}
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-[13px] transition-all active:opacity-70"
            style={{ background: colors.surface, border: `1.5px dashed ${colors.border2}`, color: colors.text3, fontFamily: font.dm }}
          >
            <span>+</span>
            <span>Nouvelle liste</span>
          </button>
        </div>

        {/* ── Création liste inline ── */}
        {showNewList && (
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
        )}

        {/* ── Liste des tâches avec Drag & Drop ── */}
        {selectedList && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
          >
            {listItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <span className="text-[32px]">{selectedList.icon}</span>
                <p className="text-[14px]" style={{ fontFamily: font.dm, color: colors.text3 }}>
                  Aucune tâche — capture quelque chose ci-dessus !
                </p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="todo-list">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="px-2 py-2">
                      {/* Tâches non terminées (draggables) */}
                      {listItems
                        .filter((i) => !i.is_completed)
                        .map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(prov, snap) => (
                              <div ref={prov.innerRef} {...prov.draggableProps}>
                                <TodoItemRow
                                  item={item}
                                  dragHandleProps={prov.dragHandleProps}
                                  isDragging={snap.isDragging}
                                  onToggleComplete={() => todos.toggleComplete(item.id)}
                                  onToggleStar={() => todos.toggleStar(item.id)}
                                  onTap={() => setSelectedItem(item)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      }
                      {provided.placeholder}

                      {/* Séparateur + tâches terminées */}
                      {listItems.some((i) => i.is_completed) && (
                        <>
                          <div
                            className="flex items-center gap-2 px-2 py-2 my-1"
                          >
                            <div className="flex-1 h-px" style={{ background: colors.border }} />
                            <span className="text-[11px]" style={{ fontFamily: font.dm, color: colors.text3 }}>
                              Terminées
                            </span>
                            <div className="flex-1 h-px" style={{ background: colors.border }} />
                          </div>
                          {listItems
                            .filter((i) => i.is_completed)
                            .map((item) => (
                              <TodoItemRow
                                key={item.id}
                                item={item}
                                dragHandleProps={null}
                                isDragging={false}
                                onToggleComplete={() => todos.toggleComplete(item.id)}
                                onToggleStar={() => todos.toggleStar(item.id)}
                                onTap={() => setSelectedItem(item)}
                              />
                            ))
                          }
                        </>
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        )}
      </div>

      {/* ── Sheet détail tâche ── */}
      {selectedItem && (
        <TaskDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={(patch) => todos.updateItem(selectedItem.id, patch)}
          onDelete={() => todos.deleteItem(selectedItem.id)}
          onToggleStar={() => { todos.toggleStar(selectedItem.id); setSelectedItem((prev) => prev ? { ...prev, is_starred: !prev.is_starred } : null); }}
          onToggleComplete={() => { todos.toggleComplete(selectedItem.id); setSelectedItem((prev) => prev ? { ...prev, is_completed: !prev.is_completed } : null); }}
          onScheduleRequest={() => { setSchedulingItem(selectedItem); setSelectedItem(null); }}
        />
      )}

      {/* ── AddEventSheet pour planifier une tâche ── */}
      {schedulingItem && (
        <AddEventSheet
          initialForm={emptyForm({ title: schedulingItem.title })}
          onClose={() => setSchedulingItem(null)}
          onSave={handleScheduleSave}
        />
      )}
    </>
  );
}
