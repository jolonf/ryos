import { AppId } from "@/config/appIds";
import { Card, CARD_WIDTH, CARD_HEIGHT } from './card';

// Stack metadata
export interface StackMetadata {
  id: string;
  name: string;
  description?: string;
  author?: string;
  createdAt: number;
  modifiedAt: number;
  version: string;
  cardSize: {
    width: number;
    height: number;
  };
  defaultTransition?: {
    type: string;
    duration: number;
  };
  tags?: string[];
  resourcesPath?: string;  // Path to the resources directory
}

export interface HyperCardStack {
  id: string;
  name: string;
  path?: string;  // Path in the file system
  cards: Card[];
  currentCardIndex: number;
  background: HyperCardBackground;
  metadata: StackMetadata;
  script?: string;  // Stack-level script
}

export interface HyperCardBackground {
  id: string;
  name: string;
  patterns: HyperCardPattern[];
  buttons: HyperCardButton[];
  fields: HyperCardField[];
  bitmap?: string;  // Path to stack background bitmap, relative to stack resources directory
}

export interface HyperCardLayer {
  patterns: HyperCardPattern[];
  buttons: HyperCardButton[];
  fields: HyperCardField[];
}

export interface HyperCardPattern {
  id: string;
  type: "solid" | "pattern" | "image";
  value: string;  // Color, pattern ID, or image URL
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface HyperCardButton {
  id: string;
  name: string;
  type: "rectangular" | "round" | "oval" | "checkbox" | "radio";
  style: "transparent" | "opaque" | "rectangle" | "shadow" | "round" | "standard";
  position: { x: number; y: number };
  size: { width: number; height: number };
  text?: string;
  icon?: string;
  script?: string;
  enabled: boolean;
  visible: boolean;
  linkToCardId?: string;  // ID of the card this button links to
}

export interface HyperCardField {
  id: string;
  name: string;
  type: "text" | "number" | "date";
  style: "transparent" | "opaque" | "rectangle" | "shadow" | "scrolling";
  position: { x: number; y: number };
  size: { width: number; height: number };
  text: string;
  script?: string;
  enabled: boolean;
  visible: boolean;
  locked: boolean;
}

export interface StackState {
  currentStack: HyperCardStack | null;
  recentStacks: string[];  // Array of stack paths
  isModified: boolean;
  lastSavedPath: string | null;
  metadata?: StackMetadata;  // Current stack metadata
  isEditingBackground: boolean;  // Whether we're in background editing mode
}

// Add a type for managing bitmaps
export interface BitmapOperations {
  createBitmap: (width: number, height: number) => Promise<string>;  // Returns path to new bitmap
  saveBitmap: (bitmapPath: string, imageData: ImageData) => Promise<void>;
  loadBitmap: (bitmapPath: string) => Promise<ImageData>;
  deleteBitmap: (bitmapPath: string) => Promise<void>;
  serializeBitmap: (bitmapPath: string) => Promise<string | null>;  // Returns base64 string or null if bitmap not found
  deserializeBitmap: (bitmapPath: string, base64Data: string) => Promise<void>;  // Loads bitmap from base64 string
}

// Update StackOperations to include bitmap operations
export interface StackOperations {
  newStack: (name: string) => Promise<HyperCardStack>;
  saveStack: (stack: HyperCardStack, path?: string) => Promise<string>;
  loadStack: (path: string) => Promise<HyperCardStack>;
  closeStack: () => void;
  getRecentStacks: () => string[];
  addToRecentStacks: (path: string) => void;
  
  // Card Management Operations
  addCard: (name: string, position?: number) => Promise<Card>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCard: (cardId: string, newPosition: number) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  navigateToCard: (cardId: string) => Promise<void>;
  navigateToNextCard: () => Promise<void>;
  navigateToPreviousCard: () => Promise<void>;

  // Metadata operations
  updateStackMetadata: (metadata: Partial<StackMetadata>) => Promise<void>;
  getStackMetadata: () => StackMetadata | null;
  
  // Bitmap operations
  bitmaps: BitmapOperations;
  
  // Background operations
  createBackground: (name: string) => Promise<HyperCardBackground>;
  updateBackground: (backgroundId: string, updates: Partial<HyperCardBackground>) => Promise<void>;
  deleteBackground: (backgroundId: string) => Promise<void>;
}

// Store types
export interface StackStore extends StackState {
  operations: StackOperations;
}

// Add utility functions
export const createDefaultStackMetadata = (name: string): StackMetadata => ({
  id: `stack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  version: "1.0.0",
  cardSize: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT
  }
});

export const validateStack = (stack: HyperCardStack): string[] => {
  const errors: string[] = [];

  if (!stack.id) errors.push('Stack must have an ID');
  if (!stack.name) errors.push('Stack must have a name');
  if (!stack.cards || !Array.isArray(stack.cards)) errors.push('Stack must have cards array');
  if (typeof stack.currentCardIndex !== 'number') errors.push('Stack must have a current card index');
  if (!stack.background) errors.push('Stack must have a background');
  if (!stack.metadata) errors.push('Stack must have metadata');

  // Validate metadata
  if (!stack.metadata.id) errors.push('Stack metadata must have an ID');
  if (!stack.metadata.name) errors.push('Stack metadata must have a name');
  if (!stack.metadata.createdAt) errors.push('Stack metadata must have a creation date');
  if (!stack.metadata.modifiedAt) errors.push('Stack metadata must have a modification date');
  if (!stack.metadata.version) errors.push('Stack metadata must have a version');
  if (!stack.metadata.cardSize) errors.push('Stack metadata must have card size');

  // Validate cards
  if (stack.cards.length === 0) errors.push('Stack must have at least one card');
  stack.cards.forEach((card, index) => {
    const cardErrors = validateCard(card);
    if (cardErrors.length > 0) {
      errors.push(`Card ${index + 1} (${card.name}): ${cardErrors.join(', ')}`);
    }
  });

  return errors;
};

// Import validateCard from card.ts
import { validateCard } from './card'; 