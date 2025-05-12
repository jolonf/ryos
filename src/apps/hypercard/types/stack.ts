import { AppId } from "@/config/appIds";

export interface HyperCardStack {
  id: string;
  name: string;
  path?: string;  // Path in the file system
  cards: HyperCardCard[];
  currentCardIndex: number;
  background: HyperCardBackground;
  createdAt: number;
  modifiedAt: number;
  version: string;
}

export interface HyperCardCard {
  id: string;
  name: string;
  background: HyperCardBackground;
  foreground: HyperCardLayer;
  script?: string;
}

export interface HyperCardBackground {
  id: string;
  name: string;
  patterns: HyperCardPattern[];
  buttons: HyperCardButton[];
  fields: HyperCardField[];
  script?: string;
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
}

export interface StackOperations {
  newStack: (name: string) => Promise<HyperCardStack>;
  saveStack: (stack: HyperCardStack, path?: string) => Promise<string>;
  loadStack: (path: string) => Promise<HyperCardStack>;
  closeStack: () => void;
  getRecentStacks: () => string[];
  addToRecentStacks: (path: string) => void;
}

// Store types
export interface StackStore extends StackState {
  operations: StackOperations;
} 