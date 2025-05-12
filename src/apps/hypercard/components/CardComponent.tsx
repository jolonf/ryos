import React, { useCallback, useRef, useState } from 'react';
import { Card } from '../types/card';
import { HyperCardPattern, HyperCardButton, HyperCardField } from '../types/stack';
import { ToolId } from '../components/ToolsPaletteWindow';

interface CardComponentProps {
  card: Card;
  width: number;
  height: number;
  isActive?: boolean;
  onCardClick?: () => void;
  isEditingBackground?: boolean;
  selectedTool: ToolId | null;
  onAddButton?: (button: HyperCardButton, isBackground: boolean) => void;
  onSelectButton?: (button: HyperCardButton | null, isBackground: boolean) => void;
  selectedButtonId?: string | null;
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
}

// Add global styles for button selection
const buttonSelectionStyles = `
  @keyframes dash {
    to {
      background-position: 20px 0;
    }
  }

  .button-selection {
    animation: dash 1s linear infinite;
    background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px);
  }
`;

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  width,
  height,
  isActive = false,
  onCardClick,
  isEditingBackground = false,
  selectedTool,
  onAddButton,
  onSelectButton,
  selectedButtonId
}) => {
  // Default card size if not specified (matches classic HyperCard)
  const cardWidth = width || 512;
  const cardHeight = height || 342;

  // Drawing state
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null
  });

  // Get the current layer (background or foreground)
  const currentLayer = isEditingBackground ? card.background : card.foreground;

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Only handle card clicks if we're not drawing
    if (!drawingState.isDrawing && onSelectButton) {
      // Check if we clicked directly on the card (not on a button)
      const target = e.target as HTMLElement;
      const buttonElement = target.closest('[data-button-id]');
      
      // If we didn't click on a button, deselect
      if (!buttonElement) {
        onSelectButton(null, isEditingBackground);
      }
    }

    // Call the original onCardClick if provided
    if (onCardClick) {
      onCardClick();
    }
  }, [drawingState.isDrawing, onSelectButton, isEditingBackground, onCardClick]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // If we're in button tool mode
    if (selectedTool === 'button') {
      // Check if we clicked on an existing button
      const target = e.target as HTMLElement;
      const buttonElement = target.closest('[data-button-id]');
      
      if (buttonElement && onSelectButton) {
        const buttonId = buttonElement.getAttribute('data-button-id');
        const button = [...currentLayer.buttons].find(b => b.id === buttonId);
        if (button) {
          onSelectButton(button, isEditingBackground);
          e.stopPropagation(); // Prevent card click
          return;
        }
      }

      // If we didn't click on a button, start drawing a new one
      if (onAddButton) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setDrawingState({
          isDrawing: true,
          startPoint: { x, y },
          currentPoint: { x, y }
        });
        return;
      }
    }

    // If we're in browse mode, don't allow selection
    if (selectedTool === 'browse') {
      return;
    }
  }, [selectedTool, onAddButton, onSelectButton, currentLayer.buttons, isEditingBackground]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingState.isDrawing || !drawingState.startPoint) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawingState(prev => ({
      ...prev,
      currentPoint: { x, y }
    }));
  }, [drawingState.isDrawing, drawingState.startPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!drawingState.isDrawing || !drawingState.startPoint || !drawingState.currentPoint || !onAddButton) return;

    const startX = Math.min(drawingState.startPoint.x, drawingState.currentPoint.x);
    const startY = Math.min(drawingState.startPoint.y, drawingState.currentPoint.y);
    const width = Math.abs(drawingState.currentPoint.x - drawingState.startPoint.x);
    const height = Math.abs(drawingState.currentPoint.y - drawingState.startPoint.y);

    // Only create button if it has a reasonable size
    if (width > 10 && height > 10) {
      const newButton: HyperCardButton = {
        id: `btn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `Button ${currentLayer.buttons.length + 1}`,
        type: 'rectangular',
        style: 'standard',
        position: { x: startX, y: startY },
        size: { width, height },
        text: '',
        enabled: true,
        visible: true
      };

      onAddButton(newButton, isEditingBackground);
    }

    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentPoint: null
    });
  }, [drawingState, onAddButton, isEditingBackground, currentLayer.buttons.length]);

  // Calculate the preview rectangle when drawing
  const getPreviewStyle = () => {
    if (!drawingState.isDrawing || !drawingState.startPoint || !drawingState.currentPoint) return null;

    const startX = Math.min(drawingState.startPoint.x, drawingState.currentPoint.x);
    const startY = Math.min(drawingState.startPoint.y, drawingState.currentPoint.y);
    const width = Math.abs(drawingState.currentPoint.x - drawingState.startPoint.x);
    const height = Math.abs(drawingState.currentPoint.y - drawingState.startPoint.y);

    return {
      position: 'absolute' as const,
      left: startX,
      top: startY,
      width,
      height,
      border: '1px dashed #000',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      pointerEvents: 'none' as const
    };
  };

  // Render a button with selection state
  const renderButton = (button: HyperCardButton, isBackground: boolean) => {
    const isSelected = selectedButtonId === button.id;
    const showSelection = isSelected && selectedTool === 'button';

    return (
      <div
        key={button.id}
        data-button-id={button.id}
        className={`absolute ${button.visible ? '' : 'hidden'}`}
        style={{
          left: button.position.x,
          top: button.position.y,
          width: button.size.width,
          height: button.size.height,
        }}
      >
        <div 
          className={`w-full h-full border ${showSelection ? 'border-dashed border-black button-selection' : 'border-gray-400'} bg-gray-100 flex items-center justify-center`}
        >
          {button.text}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{buttonSelectionStyles}</style>
      <div 
        className={`relative bg-white border-2 ${isEditingBackground ? 'border-blue-500' : 'border-black'} shadow-md ${isEditingBackground ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h10v10H0zM10 10h10v10H10z\' fill=\'%23f0f0f0\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]' : ''} card-container`}
        style={{ 
          width: cardWidth, 
          height: cardHeight,
          cursor: selectedTool === 'button' ? 'crosshair' : (onCardClick ? 'pointer' : 'default')
        }}
        onClick={handleCardClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Drawing Preview */}
        {drawingState.isDrawing && (
          <div style={getPreviewStyle() || {}} />
        )}

        {/* Background Layer */}
        <div className="absolute inset-0">
          {/* Background Patterns */}
          {(card.background.patterns as HyperCardPattern[]).map(pattern => (
            <div
              key={pattern.id}
              className="absolute"
              style={{
                left: pattern.position.x,
                top: pattern.position.y,
                width: pattern.size.width,
                height: pattern.size.height,
                backgroundColor: pattern.type === 'solid' ? pattern.value : undefined,
              }}
            />
          ))}
          
          {/* Background Buttons */}
          {(card.background.buttons as HyperCardButton[]).map(button => 
            renderButton(button, true)
          )}
          
          {/* Background Fields */}
          {(card.background.fields as HyperCardField[]).map(field => (
            <div
              key={field.id}
              className={`absolute ${field.visible ? '' : 'hidden'}`}
              style={{
                left: field.position.x,
                top: field.position.y,
                width: field.size.width,
                height: field.size.height,
              }}
            >
              <div className="w-full h-full border border-gray-400 bg-white p-1">
                {field.text}
              </div>
            </div>
          ))}
        </div>

        {/* Foreground Layer */}
        <div className="absolute inset-0">
          {/* Foreground Patterns */}
          {(card.foreground.patterns as HyperCardPattern[]).map(pattern => (
            <div
              key={pattern.id}
              className="absolute"
              style={{
                left: pattern.position.x,
                top: pattern.position.y,
                width: pattern.size.width,
                height: pattern.size.height,
                backgroundColor: pattern.type === 'solid' ? pattern.value : undefined,
              }}
            />
          ))}
          
          {/* Foreground Buttons */}
          {(card.foreground.buttons as HyperCardButton[]).map(button => 
            renderButton(button, false)
          )}
          
          {/* Foreground Fields */}
          {(card.foreground.fields as HyperCardField[]).map(field => (
            <div
              key={field.id}
              className={`absolute ${field.visible ? '' : 'hidden'}`}
              style={{
                left: field.position.x,
                top: field.position.y,
                width: field.size.width,
                height: field.size.height,
              }}
            >
              <div className="w-full h-full border border-gray-400 bg-white p-1">
                {field.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}; 