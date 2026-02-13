import { create } from "zustand";

interface EditorState {
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedObjectId: null,
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
}));
