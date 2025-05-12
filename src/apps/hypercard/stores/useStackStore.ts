import { create } from "zustand";
import { 
  StackStore, 
  HyperCardStack, 
  StackState, 
  StackOperations,
  HyperCardCard,
  HyperCardBackground
} from "../types/stack";

const MAX_RECENT_STACKS = 10;
let idCounter = 0;

const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}`;
};

const createDefaultCard = (name: string, background: HyperCardBackground): HyperCardCard => ({
  id: generateId("card"),
  name,
  background,
  foreground: {
    patterns: [],
    buttons: [],
    fields: []
  }
});

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
    },

    // Card Management Operations
    addCard: async (name: string, position?: number) => {
      const state = get();
      if (!state.currentStack) throw new Error("No stack is currently open");

      const newCard = createDefaultCard(name, state.currentStack.background);
      const cards = [...state.currentStack.cards];
      
      // Insert at position or append to end
      if (typeof position === 'number' && position >= 0 && position <= cards.length) {
        cards.splice(position, 0, newCard);
      } else {
        cards.push(newCard);
      }

      set({
        currentStack: {
          ...state.currentStack,
          cards,
          modifiedAt: Date.now()
        },
        isModified: true
      });

      return Promise.resolve(newCard);
    },

    deleteCard: async (cardId: string) => {
      const state = get();
      if (!state.currentStack) throw new Error("No stack is currently open");

      const cardIndex = state.currentStack.cards.findIndex(card => card.id === cardId);
      if (cardIndex === -1) throw new Error("Card not found");

      const cards = [...state.currentStack.cards];
      cards.splice(cardIndex, 1);

      // Update current card index if needed
      let currentCardIndex = state.currentStack.currentCardIndex;
      if (currentCardIndex >= cards.length) {
        currentCardIndex = Math.max(0, cards.length - 1);
      }

      set({
        currentStack: {
          ...state.currentStack,
          cards,
          currentCardIndex,
          modifiedAt: Date.now()
        },
        isModified: true
      });

      return Promise.resolve();
    },

    moveCard: async (cardId: string, newPosition: number) => {
      const state = get();
      if (!state.currentStack) throw new Error("No stack is currently open");

      const cards = [...state.currentStack.cards];
      const currentIndex = cards.findIndex(card => card.id === cardId);
      if (currentIndex === -1) throw new Error("Card not found");

      const [card] = cards.splice(currentIndex, 1);
      cards.splice(newPosition, 0, card);

      // Update current card index if needed
      let currentCardIndex = state.currentStack.currentCardIndex;
      if (currentCardIndex === currentIndex) {
        currentCardIndex = newPosition;
      } else if (currentIndex < currentCardIndex && newPosition >= currentCardIndex) {
        currentCardIndex--;
      } else if (currentIndex > currentCardIndex && newPosition <= currentCardIndex) {
        currentCardIndex++;
      }

      set({
        currentStack: {
          ...state.currentStack,
          cards,
          currentCardIndex,
          modifiedAt: Date.now()
        },
        isModified: true
      });

      return Promise.resolve();
    },

    updateCard: async (cardId: string, updates: Partial<HyperCardCard>) => {
      const state = get();
      if (!state.currentStack) throw new Error("No stack is currently open");

      const cards = state.currentStack.cards.map(card => 
        card.id === cardId 
          ? { ...card, ...updates, modifiedAt: Date.now() }
          : card
      );

      set({
        currentStack: {
          ...state.currentStack,
          cards,
          modifiedAt: Date.now()
        },
        isModified: true
      });

      return Promise.resolve();
    },

    navigateToCard: async (cardId: string) => {
      const state = get();
      if (!state.currentStack) throw new Error("No stack is currently open");

      const cardIndex = state.currentStack.cards.findIndex(card => card.id === cardId);
      if (cardIndex === -1) throw new Error("Card not found");

      set({
        currentStack: {
          ...state.currentStack,
          currentCardIndex: cardIndex
        }
      });

      return Promise.resolve();
    },

    navigateToNextCard: async () => {
      const state = get();
      if (!state.currentStack) throw new Error("No stack is currently open");

      const nextIndex = (state.currentStack.currentCardIndex + 1) % state.currentStack.cards.length;
      set({
        currentStack: {
          ...state.currentStack,
          currentCardIndex: nextIndex
        }
      });

      return Promise.resolve();
    },

    navigateToPreviousCard: async () => {
      const state = get();
      if (!state.currentStack) throw new Error("No stack is currently open");

      const prevIndex = (state.currentStack.currentCardIndex - 1 + state.currentStack.cards.length) % state.currentStack.cards.length;
      set({
        currentStack: {
          ...state.currentStack,
          currentCardIndex: prevIndex
        }
      });

      return Promise.resolve();
    },
  }
})); 