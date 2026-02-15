import { create } from "zustand";

interface EditorState {
  isDraggingObject: boolean;
  setDraggingObject: (value: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  isDraggingObject: false,
  setDraggingObject: (value) => set({ isDraggingObject: value }),
}));
