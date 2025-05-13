import { HyperCardBackground, HyperCardLayer } from './stack';

// Card size constants (in pixels)
export const CARD_WIDTH = 512;
export const CARD_HEIGHT = 342;

// Card transition types
export type CardTransitionType = 
  | 'none'
  | 'fade'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'dissolve'
  | 'zoom-in'
  | 'zoom-out';

// Card transition options
export interface CardTransitionOptions {
  type: CardTransitionType;
  duration: number;  // in milliseconds
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// Card metadata
export interface CardMetadata {
  id: string;
  name: string;
  createdAt: number;
  modifiedAt: number;
  transition?: CardTransitionOptions;
  notes?: string;
  tags?: string[];
}

// Main card type
export interface Card {
  id: string;
  name: string;
  background: HyperCardBackground;
  foreground: HyperCardLayer;
  metadata: CardMetadata;
  isBackground?: boolean;  // Whether this card is a background
  backgroundId?: string;   // Reference to background if not a background card
  script?: string;
  // Bitmap reference
  bitmap?: string;  // Path to card's bitmap, relative to stack resources directory
}

// Card object base interface
export interface CardObject {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  locked: boolean;
  script?: string;
}

// Card object types
export type CardObjectType = 'button' | 'field' | 'pattern' | 'image' | 'shape';

// Card object style options
export interface CardObjectStyle {
  borderColor?: string;
  borderWidth?: number;
  fillColor?: string;
  shadowColor?: string;
  shadowOffset?: { x: number; y: number };
  shadowBlur?: number;
  opacity?: number;
}

// Utility functions
export const createEmptyCard = (name: string, background: HyperCardBackground): Card => ({
  id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name,
  background,
  foreground: {
    patterns: [],
    buttons: [],
    fields: []
  },
  metadata: {
    id: `meta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: Date.now(),
    modifiedAt: Date.now()
  }
});

export const createBackgroundCard = (name: string): Card => {
  const background: HyperCardBackground = {
    id: `bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${name} Background`,
    patterns: [],
    buttons: [],
    fields: []
  };

  return {
    ...createEmptyCard(name, background),
    isBackground: true
  };
};

// Type guards
export const isCardObject = (obj: any): obj is CardObject => {
  return obj 
    && typeof obj.id === 'string'
    && typeof obj.name === 'string'
    && typeof obj.position === 'object'
    && typeof obj.size === 'object'
    && typeof obj.visible === 'boolean'
    && typeof obj.locked === 'boolean';
};

export const isCard = (card: any): card is Card => {
  return card 
    && typeof card.id === 'string'
    && typeof card.name === 'string'
    && typeof card.background === 'object'
    && typeof card.foreground === 'object'
    && typeof card.metadata === 'object';
};

// Card validation
export const validateCard = (card: Card): string[] => {
  const errors: string[] = [];

  if (!card.id) errors.push('Card must have an ID');
  if (!card.name) errors.push('Card must have a name');
  if (!card.background) errors.push('Card must have a background');
  if (!card.foreground) errors.push('Card must have a foreground');
  if (!card.metadata) errors.push('Card must have metadata');
  
  // Validate background
  if (!card.background.id) errors.push('Background must have an ID');
  if (!card.background.name) errors.push('Background must have a name');
  
  // Validate metadata
  if (!card.metadata.id) errors.push('Metadata must have an ID');
  if (!card.metadata.createdAt) errors.push('Metadata must have a creation date');
  if (!card.metadata.modifiedAt) errors.push('Metadata must have a modification date');

  return errors;
};

// Card transition utilities
export const getDefaultTransition = (): CardTransitionOptions => ({
  type: 'none',
  duration: 0
});

export const createTransition = (
  type: CardTransitionType,
  duration: number = 300,
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' = 'ease-in-out'
): CardTransitionOptions => ({
  type,
  duration,
  easing
}); 