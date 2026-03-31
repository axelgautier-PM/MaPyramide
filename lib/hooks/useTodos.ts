"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import type { TodoList, TodoItem, CreateTodoItem } from "@/types/todo";

/** Listes par défaut créées au premier lancement */
const DEFAULT_LISTS: Array<{ name: string; icon: string; color: string }> = [
  { name: "Inbox",    icon: "📥", color: "#6C63FF" },
  { name: "Perso",   icon: "🌱", color: "#3EC98A" },
  { name: "Travail", icon: "💼", color: "#4A90D9" },
];

export interface UseTodosReturn {
  lists:          TodoList[];
  items:          TodoItem[];
  loading:        boolean;
  selectedListId: string | null;
  setSelectedListId: (id: string | null) => void;

  addItem:           (payload: CreateTodoItem) => Promise<void>;
  toggleComplete:    (id: string)              => Promise<void>;
  toggleStar:        (id: string)              => Promise<void>;
  updateItem:        (id: string, patch: Partial<Pick<TodoItem, "title" | "description" | "due_date" | "calendar_event_id">>) => Promise<void>;
  deleteItem:        (id: string)              => Promise<void>;
  reorderItems:      (listId: string, orderedIds: string[]) => Promise<void>;

  createList:        (name: string, icon?: string, color?: string) => Promise<TodoList>;
  deleteList:        (id: string) => Promise<void>;

  /** Tâches étoilées non terminées (max 5) pour le widget Ma journée */
  starredItems:      TodoItem[];
}

export function useTodos(): UseTodosReturn {
  const { profile } = useAppStore();

  const [lists,          setLists]          = useState<TodoList[]>([]);
  const [items,          setItems]          = useState<TodoItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // ── Chargement initial ───────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!profile) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: listsData }, { data: itemsData }] = await Promise.all([
        supabase.from("todo_lists").select("*").eq("user_id", profile.id).order("position"),
        supabase.from("todo_items").select("*").eq("user_id", profile.id).order("position"),
      ]);

      const loadedLists = listsData ?? [];

      // Créer les listes par défaut si l'utilisateur n'en a aucune
      if (loadedLists.length === 0) {
        const toInsert = DEFAULT_LISTS.map((l, i) => ({
          ...l, user_id: profile.id, position: i,
        }));
        const { data: created } = await supabase.from("todo_lists").insert(toInsert).select();
        const newLists = created ?? [];
        setLists(newLists);
        if (newLists.length > 0) setSelectedListId(newLists[0].id);
      } else {
        setLists(loadedLists);
        if (!selectedListId) setSelectedListId(loadedLists[0].id);
      }

      setItems(itemsData ?? []);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Mutations tâches ─────────────────────────────────────────────────────

  /** Ajoute une tâche en tête de liste (position 0, les autres décalent) */
  const addItem = useCallback(async (payload: CreateTodoItem) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("todo_items")
      .insert({ ...payload, user_id: profile.id, position: 0 })
      .select()
      .single();
    if (error || !data) return;
    setItems((prev) => [data as TodoItem, ...prev]);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleComplete = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const now = new Date().toISOString();
    const patch = {
      is_completed: !item.is_completed,
      completed_at: !item.is_completed ? now : null,
    };
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
    await supabase.from("todo_items").update(patch).eq("id", id);
  }, [items]);

  const toggleStar = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const patch = { is_starred: !item.is_starred };
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
    await supabase.from("todo_items").update(patch).eq("id", id);
  }, [items]);

  const updateItem = useCallback(async (
    id: string,
    patch: Partial<Pick<TodoItem, "title" | "description" | "due_date" | "calendar_event_id">>
  ) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
    await supabase.from("todo_items").update(patch).eq("id", id);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("todo_items").delete().eq("id", id);
  }, []);

  /** Réordonne les tâches d'une liste après drag & drop */
  const reorderItems = useCallback(async (listId: string, orderedIds: string[]) => {
    // Mise à jour optimiste
    setItems((prev) => {
      const listItems    = orderedIds.map((id, pos) => ({ id, pos }));
      const posMap       = Object.fromEntries(listItems.map(({ id, pos }) => [id, pos]));
      return prev.map((item) =>
        item.list_id === listId && posMap[item.id] !== undefined
          ? { ...item, position: posMap[item.id] }
          : item
      );
    });
    // Persistance
    const updates = orderedIds.map((id, position) => ({ id, position }));
    for (const u of updates) {
      await supabase.from("todo_items").update({ position: u.position }).eq("id", u.id);
    }
  }, []);

  // ── Mutations listes ─────────────────────────────────────────────────────

  const createList = useCallback(async (
    name: string,
    icon  = "📝",
    color = "#6C63FF",
  ): Promise<TodoList> => {
    const position = lists.length;
    const { data, error } = await supabase
      .from("todo_lists")
      .insert({ name, icon, color, position, user_id: profile!.id })
      .select()
      .single();
    if (error || !data) throw error;
    const newList = data as TodoList;
    setLists((prev) => [...prev, newList]);
    return newList;
  }, [lists.length, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteList = useCallback(async (id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    setItems((prev) => prev.filter((i) => i.list_id !== id));
    await supabase.from("todo_lists").delete().eq("id", id);
    // Sélectionner la première liste restante
    setSelectedListId((prev) => {
      if (prev !== id) return prev;
      const remaining = lists.filter((l) => l.id !== id);
      return remaining[0]?.id ?? null;
    });
  }, [lists]);

  // ── Dérivés ─────────────────────────────────────────────────────────────

  const starredItems = items
    .filter((i) => i.is_starred && !i.is_completed)
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);

  return {
    lists,
    items,
    loading,
    selectedListId,
    setSelectedListId,
    addItem,
    toggleComplete,
    toggleStar,
    updateItem,
    deleteItem,
    reorderItems,
    createList,
    deleteList,
    starredItems,
  };
}
