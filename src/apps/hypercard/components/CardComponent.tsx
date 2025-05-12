import React from 'react';
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
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  width,
  height,
  isActive = false,
  onCardClick,
  isEditingBackground = false,
  selectedTool
}) => {
  // Default card size if not specified (matches classic HyperCard)
  const cardWidth = width || 512;
  const cardHeight = height || 342;

  return (
    <div 
      className={`relative bg-white border-2 ${isEditingBackground ? 'border-blue-500' : 'border-black'} shadow-md ${isEditingBackground ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h10v10H0zM10 10h10v10H10z\' fill=\'%23f0f0f0\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]' : ''}`}
      style={{ 
        width: cardWidth, 
        height: cardHeight,
        cursor: onCardClick ? 'pointer' : 'default'
      }}
      onClick={onCardClick}
    >
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
              // TODO: Add pattern and image support
            }}
          />
        ))}
        
        {/* Background Buttons */}
        {(card.background.buttons as HyperCardButton[]).map(button => (
          <div
            key={button.id}
            className={`absolute ${button.visible ? '' : 'hidden'}`}
            style={{
              left: button.position.x,
              top: button.position.y,
              width: button.size.width,
              height: button.size.height,
            }}
          >
            {/* TODO: Implement button styles and interactions */}
            <div className="w-full h-full border border-gray-400 bg-gray-100 flex items-center justify-center">
              {button.text}
            </div>
          </div>
        ))}
        
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
            {/* TODO: Implement field styles and interactions */}
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
              // TODO: Add pattern and image support
            }}
          />
        ))}
        
        {/* Foreground Buttons */}
        {(card.foreground.buttons as HyperCardButton[]).map(button => (
          <div
            key={button.id}
            className={`absolute ${button.visible ? '' : 'hidden'}`}
            style={{
              left: button.position.x,
              top: button.position.y,
              width: button.size.width,
              height: button.size.height,
            }}
          >
            {/* TODO: Implement button styles and interactions */}
            <div className="w-full h-full border border-gray-400 bg-gray-100 flex items-center justify-center">
              {button.text}
            </div>
          </div>
        ))}
        
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
            {/* TODO: Implement field styles and interactions */}
            <div className="w-full h-full border border-gray-400 bg-white p-1">
              {field.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 