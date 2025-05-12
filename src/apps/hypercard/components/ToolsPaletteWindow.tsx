import React, { useState } from "react";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { AppProps } from "../../base/types";
import { useWindowManager } from "@/hooks/useWindowManager";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Tool categories and their tools
const TOOLS = [
  // Basic Tools
  { id: "browse", name: "Browse", icon: "👆" },
  { id: "button", name: "Button", icon: "🔘" },
  { id: "field", name: "Field", icon: "📝" },
  // Drawing
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

interface ToolsPaletteWindowProps extends Omit<AppProps, "appId"> {
  selectedTool: ToolId | null;
  onToolSelect: (tool: ToolId) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function ToolsPaletteWindow({
  selectedTool,
  onToolSelect,
  isVisible,
  onClose,
  isForeground = true,
  skipInitialSound = false,
}: ToolsPaletteWindowProps) {
  // Use window manager hook to handle window state
  useWindowManager({ appId: "hypercard" });

  if (!isVisible) return null;

  return (
    <WindowFrame
      title="Tools"
      onClose={onClose}
      isForeground={isForeground}
      appId="hypercard"
      skipInitialSound={skipInitialSound}
      windowConstraints={{
        minWidth: 144,
        minHeight: 192,
        maxWidth: 144,
        maxHeight: 192,
      }}
    >
      <div className="grid grid-cols-3 gap-1 p-1 h-full w-full bg-[#c0c0c0]">
        {TOOLS.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 flex items-center justify-center bg-white border border-black hover:bg-gray-100 active:bg-gray-200",
              selectedTool === tool.id && "bg-gray-200"
            )}
            onClick={() => onToolSelect(tool.id)}
            title={tool.name}
          >
            {tool.icon}
          </Button>
        ))}
      </div>
    </WindowFrame>
  );
} 