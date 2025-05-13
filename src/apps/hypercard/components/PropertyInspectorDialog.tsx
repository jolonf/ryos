import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HyperCardStack, HyperCardButton } from "../types/stack";
import { Card } from "../types/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types for what can be selected in the property inspector
export type InspectorSelectionType = "stack" | "background" | "card" | "button" | "field";

export interface InspectorSelection {
  type: InspectorSelectionType;
  id: string;
}

interface PropertyInspectorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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

// Button Properties Panel
const ButtonPropertiesPanel: React.FC<{
  button: HyperCardButton;
  isBackground: boolean;
  onUpdate: (button: HyperCardButton, isBackground: boolean) => void;
  currentStack: HyperCardStack;
}> = ({ button, isBackground, onUpdate, currentStack }) => {
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="buttonText">Button Text</Label>
        <Input
          id="buttonText"
          value={button.text || ''}
          onChange={(e) => onUpdate({
            ...button,
            text: e.target.value
          }, isBackground)}
          className="h-6 text-sm"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="linkToCard"
            checked={!!button.linkToCardId}
            onCheckedChange={(checked: boolean) => {
              onUpdate({
                ...button,
                linkToCardId: checked ? currentStack.cards[0]?.id : undefined
              }, isBackground);
            }}
          />
          <Label htmlFor="linkToCard" className="text-sm">Link to Card</Label>
        </div>
        
        {button.linkToCardId && (
          <Select
            value={button.linkToCardId}
            onValueChange={(cardId) => {
              onUpdate({
                ...button,
                linkToCardId: cardId
              }, isBackground);
            }}
          >
            <SelectTrigger className="h-6 text-sm">
              <SelectValue placeholder="Select a card" />
            </SelectTrigger>
            <SelectContent>
              {currentStack.cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name || `Card ${currentStack.cards.indexOf(card) + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
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

export function PropertyInspectorDialog({
  isOpen,
  onOpenChange,
  selection,
  currentStack,
  currentCard,
  isEditingBackground,
  onUpdateStack,
  onUpdateCard,
}: PropertyInspectorDialogProps) {
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
        if (!currentCard || !currentStack || !onUpdateCard) return <EmptyPanel />;
        // Find the button in either foreground or background
        const layer = isEditingBackground ? currentCard.background : currentCard.foreground;
        const button = layer.buttons.find(b => b.id === selection.id);
        if (!button) return <EmptyPanel />;
        return (
          <ButtonPropertiesPanel
            button={button}
            isBackground={isEditingBackground}
            currentStack={currentStack}
            onUpdate={(updatedButton, isBackground) => {
              // Update the button in the card
              const updatedCard = {
                ...currentCard,
                foreground: isBackground ? currentCard.foreground : {
                  ...currentCard.foreground,
                  buttons: currentCard.foreground.buttons.map(b => 
                    b.id === updatedButton.id ? updatedButton : b
                  )
                },
                background: isBackground ? {
                  ...currentCard.background,
                  buttons: currentCard.background.buttons.map(b => 
                    b.id === updatedButton.id ? updatedButton : b
                  )
                } : currentCard.background
              };
              onUpdateCard(currentCard.id, updatedCard);
            }}
          />
        );
      
      case "field":
        // These will be implemented later
        return (
          <div className="p-4 text-center text-gray-500">
            Field properties
            <br />
            Coming soon
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-system7-window-bg border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] w-[240px]">
        <DialogHeader>
          <DialogTitle className="font-normal text-[16px]">Properties</DialogTitle>
          <DialogDescription className="sr-only">Property Inspector</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-full w-full bg-[#c0c0c0]">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 