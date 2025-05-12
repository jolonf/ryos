import { create } from "zustand";
import { 
  StackStore, 
  HyperCardStack, 
  StackState, 
  StackOperations 
} from "../types/stack";

const MAX_RECENT_STACKS = 10;
let idCounter = 0;

const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}`;
};

const createDefaultStack = (name: string): HyperCardStack => ({
  id: generateId("stack"),
  name,
  cards: [{
    id: generateId("card"),
    name: "Card 1",
    background: {
      id: generateId("bg"),
      name: "Background 1",
      patterns: [],
      buttons: [],
      fields: []
    },
    foreground: {
      patterns: [],
      buttons: [],
      fields: []
    }
  }],
  currentCardIndex: 0,
  background: {
    id: generateId("bg"),
    name: "Background 1",
    patterns: [],
    buttons: [],
    fields: []
  },
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  version: "1.0.0"
});

export const useStackStore = create<StackStore>((set, get) => ({
  // Initial state
  currentStack: null,
  recentStacks: [],
  isModified: false,
  lastSavedPath: null,

  // Operations that don't require file system access
  operations: {
    newStack: async (name: string) => {
      const stack = createDefaultStack(name);
      set({
        currentStack: stack,
        isModified: true,
        lastSavedPath: null
      });
      return stack;
    },

    closeStack: () => {
      set({
        currentStack: null,
        isModified: false,
        lastSavedPath: null
      });
    },

    getRecentStacks: () => {
      return get().recentStacks;
    },

    addToRecentStacks: (path: string) => {
      set((state) => {
        const recentStacks = [path, ...state.recentStacks.filter(p => p !== path)]
          .slice(0, MAX_RECENT_STACKS);
        return { recentStacks };
      });
    },

    // These operations will be implemented in the component
    saveStack: async (stack: HyperCardStack, path?: string) => {
      throw new Error("saveStack must be implemented in the component");
    },

    loadStack: async (path: string) => {
      throw new Error("loadStack must be implemented in the component");
    }
  }
})); 