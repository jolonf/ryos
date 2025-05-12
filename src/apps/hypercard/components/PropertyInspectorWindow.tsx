import React from "react";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { AppProps } from "../../base/types";
import { useWindowManager } from "@/hooks/useWindowManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HyperCardStack } from "../types/stack";
import { Card } from "../types/card";

// Types for what can be selected in the property inspector
export type InspectorSelectionType = "stack" | "background" | "card" | "button" | "field";

export interface InspectorSelection {
  type: InspectorSelectionType;
  id: string;
}

interface PropertyInspectorWindowProps extends Omit<AppProps, "appId"> {
  isVisible: boolean;
  onClose: () => void;
  selection: InspectorSelection | null;
  currentStack: HyperCardStack | null;
  currentCard: Card | null;
  isEditingBackground: boolean;
  onUpdateStack?: (updates: Partial<HyperCardStack>) => void;
  onUpdateCard?: (cardId: string, updates: Partial<Card>) => void;
}

// Stack Properties Panel
const StackPropertiesPanel: React.FC<{
  stack: HyperCardStack;
  onUpdate: (updates: Partial<HyperCardStack>) => void;
}> = ({ stack, onUpdate }) => {
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="stackName">Stack Name</Label>
        <Input
          id="stackName"
          value={stack.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-6 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label>Card Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="cardWidth" className="text-xs">Width</Label>
            <Input
              id="cardWidth"
              type="number"
              value={stack.metadata.cardSize.width}
              onChange={(e) => onUpdate({
                metadata: {
                  ...stack.metadata,
                  cardSize: {
                    ...stack.metadata.cardSize,
                    width: parseInt(e.target.value) || 512
                  }
                }
              })}
              className="h-6 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="cardHeight" className="text-xs">Height</Label>
            <Input
              id="cardHeight"
              type="number"
              value={stack.metadata.cardSize.height}
              onChange={(e) => onUpdate({
                metadata: {
                  ...stack.metadata,
                  cardSize: {
                    ...stack.metadata.cardSize,
                    height: parseInt(e.target.value) || 342
                  }
                }
              })}
              className="h-6 text-sm"
            />
          </div>
        </div>
      </div>
      {stack.metadata.description !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="stackDescription">Description</Label>
          <Input
            id="stackDescription"
            value={stack.metadata.description}
            onChange={(e) => onUpdate({
              metadata: {
                ...stack.metadata,
                description: e.target.value
              }
            })}
            className="h-6 text-sm"
          />
        </div>
      )}
    </div>
  );
};

// Card Properties Panel
const CardPropertiesPanel: React.FC<{
  card: Card;
  onUpdate: (cardId: string, updates: Partial<Card>) => void;
}> = ({ card, onUpdate }) => {
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="cardName">Card Name</Label>
        <Input
          id="cardName"
          value={card.name}
          onChange={(e) => onUpdate(card.id, { name: e.target.value })}
          className="h-6 text-sm"
        />
      </div>
      {card.script !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="cardScript">Script</Label>
          <Input
            id="cardScript"
            value={card.script}
            onChange={(e) => onUpdate(card.id, { script: e.target.value })}
            className="h-6 text-sm"
          />
        </div>
      )}
    </div>
  );
};

// Empty Panel (shown when nothing is selected)
const EmptyPanel: React.FC = () => {
  return (
    <div className="p-4 text-center text-gray-500">
      No object selected
      <br />
      Select a stack, card, or object to view its properties
    </div>
  );
};

export function PropertyInspectorWindow({
  isVisible,
  onClose,
  selection,
  currentStack,
  currentCard,
  isEditingBackground,
  onUpdateStack,
  onUpdateCard,
  isForeground = true,
  skipInitialSound = false,
}: PropertyInspectorWindowProps) {
  // Use window manager hook to handle window state
  useWindowManager({ appId: "hypercard" });

  if (!isVisible) return null;

  // Determine what to show in the inspector
  const renderContent = () => {
    if (!selection) return <EmptyPanel />;

    switch (selection.type) {
      case "stack":
        if (!currentStack || !onUpdateStack) return <EmptyPanel />;
        return <StackPropertiesPanel stack={currentStack} onUpdate={onUpdateStack} />;
      
      case "card":
        if (!currentCard || !onUpdateCard) return <EmptyPanel />;
        return <CardPropertiesPanel card={currentCard} onUpdate={onUpdateCard} />;
      
      case "background":
        // For now, treat background the same as stack
        if (!currentStack || !onUpdateStack) return <EmptyPanel />;
        return <StackPropertiesPanel stack={currentStack} onUpdate={onUpdateStack} />;
      
      case "button":
      case "field":
        // These will be implemented later
        return (
          <div className="p-4 text-center text-gray-500">
            {selection.type === "button" ? "Button" : "Field"} properties
            <br />
            Coming soon
          </div>
        );
    }
  };

  return (
    <WindowFrame
      title="Properties"
      onClose={onClose}
      isForeground={isForeground}
      appId="hypercard"
      skipInitialSound={skipInitialSound}
      windowConstraints={{
        minWidth: 240,
        minHeight: 300,
        maxWidth: 240,
        maxHeight: 600,
      }}
    >
      <div className="flex flex-col h-full w-full bg-[#c0c0c0]">
        {renderContent()}
      </div>
    </WindowFrame>
  );
} 