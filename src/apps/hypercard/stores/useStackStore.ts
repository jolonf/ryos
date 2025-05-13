import { create } from "zustand";
import { 
  HyperCardStack, 
  StackState, 
  StackOperations,
  HyperCardBackground,
  StackMetadata,
  createDefaultStackMetadata
} from "../types/stack";
import { Card, createEmptyCard, createBackgroundCard, CARD_WIDTH, CARD_HEIGHT } from "../types/card";
import { createBitmapOperations } from "./bitmapOperations";

const MAX_RECENT_STACKS = 10;
let idCounter = 0;

const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}`;
};

const createDefaultStack = (name: string): HyperCardStack => {
  const metadata = createDefaultStackMetadata(name);
  const background = createBackgroundCard('Default Background').background;
  
  return {
    id: `stack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    cards: [createEmptyCard('Home', background)],
    currentCardIndex: 0,
    background,
    metadata,
    script: ''
  };
};

export interface StackStore extends StackState {
  operations: StackOperations & {
    toggleBackgroundMode: () => Promise<void>;
  };
}

export const useStackStore = create<StackStore>((set, get) => {
  // Initialize bitmap operations with the stack ID
  const stackId = `stack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const bitmapOps = createBitmapOperations(stackId);

  // Helper to create a new card with initialized bitmaps
  const createNewCard = async (name: string, background: HyperCardBackground) => {
    const card = createEmptyCard(name, background);
    
    // Create bitmaps for the card
    const cardBitmap = await bitmapOps.createBitmap(CARD_WIDTH, CARD_HEIGHT);
    card.bitmap = cardBitmap;

    // Create background bitmap if it doesn't exist
    if (!background.bitmap) {
      const backgroundBitmap = await bitmapOps.createBitmap(CARD_WIDTH, CARD_HEIGHT);
      background.bitmap = backgroundBitmap;
    }

    return card;
  };

  return {
    // Initial state
    currentStack: null,
    recentStacks: [],
    isModified: false,
    lastSavedPath: null,
    metadata: undefined,
    isEditingBackground: false,

    // Operations that don't require file system access
    operations: {
      bitmaps: bitmapOps,

      newStack: async (name: string) => {
        const stack = createDefaultStack(name);
        
        // Initialize bitmaps for the first card and background
        const firstCard = stack.cards[0];
        const cardBitmap = await bitmapOps.createBitmap(CARD_WIDTH, CARD_HEIGHT);
        firstCard.bitmap = cardBitmap;

        const backgroundBitmap = await bitmapOps.createBitmap(CARD_WIDTH, CARD_HEIGHT);
        stack.background.bitmap = backgroundBitmap;

        set({
          currentStack: stack,
          isModified: true,
          lastSavedPath: null,
          metadata: stack.metadata
        });
        return stack;
      },

      closeStack: () => {
        set({
          currentStack: null,
          isModified: false,
          lastSavedPath: null,
          metadata: undefined
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

        const newCard = await createNewCard(name, state.currentStack.background);
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
            metadata: {
              ...state.currentStack.metadata,
              modifiedAt: Date.now()
            }
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
            metadata: {
              ...state.currentStack.metadata,
              modifiedAt: Date.now()
            }
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
            metadata: {
              ...state.currentStack.metadata,
              modifiedAt: Date.now()
            }
          },
          isModified: true
        });

        return Promise.resolve();
      },

      updateCard: async (cardId: string, updates: Partial<Card>) => {
        const state = get();
        if (!state.currentStack) throw new Error("No stack is currently open");

        const cards = state.currentStack.cards.map(card => 
          card.id === cardId 
            ? { 
                ...card, 
                ...updates,
                metadata: {
                  ...card.metadata,
                  modifiedAt: Date.now()
                }
              }
            : card
        );

        set({
          currentStack: {
            ...state.currentStack,
            cards,
            metadata: {
              ...state.currentStack.metadata,
              modifiedAt: Date.now()
            }
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

      // Metadata operations
      updateStackMetadata: async (metadata: Partial<StackMetadata>) => {
        const state = get();
        if (!state.currentStack) throw new Error("No stack is currently open");

        const updatedMetadata = {
          ...state.currentStack.metadata,
          ...metadata,
          modifiedAt: Date.now()
        };

        set({
          currentStack: {
            ...state.currentStack,
            metadata: updatedMetadata
          },
          metadata: updatedMetadata,
          isModified: true
        });

        return Promise.resolve();
      },

      getStackMetadata: () => {
        const state = get();
        return state.currentStack?.metadata || null;
      },

      // Background operations
      createBackground: async (name: string) => {
        const state = get();
        if (!state.currentStack) throw new Error("No stack is currently open");

        const background: HyperCardBackground = {
          id: generateId("bg"),
          name,
          patterns: [],
          buttons: [],
          fields: []
        };

        set({
          currentStack: {
            ...state.currentStack,
            background,
            metadata: {
              ...state.currentStack.metadata,
              modifiedAt: Date.now()
            }
          },
          isModified: true
        });

        return Promise.resolve(background);
      },

      updateBackground: async (backgroundId: string, updates: Partial<HyperCardBackground>) => {
        const state = get();
        if (!state.currentStack) throw new Error("No stack is currently open");

        if (state.currentStack.background.id !== backgroundId) {
          throw new Error("Background not found");
        }

        const updatedBackground = {
          ...state.currentStack.background,
          ...updates
        };

        set({
          currentStack: {
            ...state.currentStack,
            background: updatedBackground,
            metadata: {
              ...state.currentStack.metadata,
              modifiedAt: Date.now()
            }
          },
          isModified: true
        });

        return Promise.resolve();
      },

      deleteBackground: async (backgroundId: string) => {
        const state = get();
        if (!state.currentStack) throw new Error("No stack is currently open");

        if (state.currentStack.background.id !== backgroundId) {
          throw new Error("Background not found");
        }

        // Create a new default background
        const newBackground: HyperCardBackground = {
          id: generateId("bg"),
          name: "New Background",
          patterns: [],
          buttons: [],
          fields: []
        };

        set({
          currentStack: {
            ...state.currentStack,
            background: newBackground,
            metadata: {
              ...state.currentStack.metadata,
              modifiedAt: Date.now()
            }
          },
          isModified: true
        });

        return Promise.resolve();
      },

      toggleBackgroundMode: () => {
        const state = get();
        if (!state.currentStack) throw new Error("No stack is currently open");

        set({
          isEditingBackground: !state.isEditingBackground
        });

        return Promise.resolve();
      }
    }
  };
}); 