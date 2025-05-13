import React, { useState } from "react";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { AppProps } from "../../base/types";
import { useWindowManager } from "@/hooks/useWindowManager";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Export the TOOLS constant
export const TOOLS = [
  // Basic Tools (Top Row)
  { id: "browse", name: "Browse", icon: "/icons/macpaint/hand.png" },
  { id: "button", name: "Button", icon: "/icons/hypercard/button.png" },
  { id: "field", name: "Field", icon: "/icons/hypercard/textfield.png" },
  // Drawing Tools
  { id: "pen", name: "Pen", icon: "/icons/macpaint/pencil.png" },
  { id: "eraser", name: "Eraser", icon: "/icons/macpaint/eraser.png" },
  { id: "spray", name: "Spray", icon: "/icons/macpaint/spray.png" },
  // Shapes
  { id: "rectangle", name: "Rectangle", icon: "/icons/macpaint/rectangle.png" },
  { id: "oval", name: "Oval", icon: "/icons/macpaint/oval.png" },
  { id: "line", name: "Line", icon: "/icons/macpaint/line.png" },
  // Objects
  { id: "image", name: "Image", icon: "/icons/hypercard/image.png" },
  { id: "text", name: "Text", icon: "/icons/macpaint/text.png" },
  { id: "pattern", name: "Pattern", icon: "/icons/hypercard/pattern.png" },
] as const;

export type ToolId = typeof TOOLS[number]["id"];

// Export the tool type for type safety
export type Tool = typeof TOOLS[number];

// Remove the window component since we're integrating it into the main window
export { TOOLS as default }; 