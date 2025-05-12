import React, { useState } from "react";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { AppProps } from "../../base/types";
import { useWindowManager } from "@/hooks/useWindowManager";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Export the TOOLS constant
export const TOOLS = [
  // Basic Tools (Top Row)
  { id: "browse", name: "Browse", icon: "👆" },
  { id: "button", name: "Button", icon: "🔘" },
  { id: "field", name: "Field", icon: "📝" },
  // Drawing Tools
  { id: "pen", name: "Pen", icon: "✏️" },
  { id: "eraser", name: "Eraser", icon: "🧹" },
  { id: "spray", name: "Spray", icon: "🎨" },
  // Shapes
  { id: "rectangle", name: "Rectangle", icon: "⬜" },
  { id: "oval", name: "Oval", icon: "⭕" },
  { id: "line", name: "Line", icon: "📏" },
  // Objects
  { id: "image", name: "Image", icon: "🖼️" },
  { id: "text", name: "Text", icon: "📄" },
  { id: "pattern", name: "Pattern", icon: "🎯" },
] as const;

export type ToolId = typeof TOOLS[number]["id"];

// Export the tool type for type safety
export type Tool = typeof TOOLS[number];

// Remove the window component since we're integrating it into the main window
export { TOOLS as default }; 