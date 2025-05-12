import React from 'react';
import { HyperCardCard } from '../types/stack';

interface CardComponentProps {
  card: HyperCardCard;
  width: number;
  height: number;
  isActive?: boolean;
  onCardClick?: () => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  width,
  height,
  isActive = false,
  onCardClick
}) => {
  // Default card size if not specified (matches classic HyperCard)
  const cardWidth = width || 512;
  const cardHeight = height || 342;

  return (
    <div 
      className={`relative bg-white border-2 ${isActive ? 'border-blue-500' : 'border-gray-300'} shadow-md`}
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
        {card.background.patterns.map(pattern => (
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
        {card.background.buttons.map(button => (
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
        {card.background.fields.map(field => (
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
        {card.foreground.patterns.map(pattern => (
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
        {card.foreground.buttons.map(button => (
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
        {card.foreground.fields.map(field => (
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