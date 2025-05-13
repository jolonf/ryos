import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Card } from '../types/card';
import { HyperCardPattern, HyperCardButton, HyperCardField } from '../types/stack';
import { ToolId } from '../components/ToolsPaletteWindow';
import { useStackStore } from '../stores/useStackStore';

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
  onUpdateButton?: (button: HyperCardButton, isBackground: boolean) => void;
  onTogglePropertyInspector?: () => void;
  onNavigateToCard?: (cardId: string) => void;
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  lineWidth: number;
  pattern: HyperCardPattern;
  fillStyle: string;
  strokeStyle: string;
  isShiftPressed: boolean;
}

interface DragState {
  isDragging: boolean;
  buttonId: string | null;
  startPosition: { x: number; y: number } | null;
  offset: { x: number; y: number } | null;
}

interface ResizeState {
  isResizing: boolean;
  buttonId: string | null;
  handle: 'nw' | 'ne' | 'sw' | 'se' | null;
  startSize: { width: number; height: number } | null;
  startPosition: { x: number; y: number } | null;
  isCompleting?: boolean;
}

// Add global styles for button selection
const buttonStyles = `
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
  selectedButtonId,
  onUpdateButton,
  onTogglePropertyInspector,
  onNavigateToCard
}: CardComponentProps): JSX.Element => {
  // Canvas refs
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing state
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    lineWidth: 1,
    pattern: {
      id: 'default',
      type: 'solid',
      value: 'black',
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 }
    },
    fillStyle: 'black',
    strokeStyle: 'black',
    isShiftPressed: false
  });

  // Get bitmap operations from store
  const bitmapOperations = useStackStore(state => state.operations.bitmaps);

  // Load and render background bitmap
  useEffect(() => {
    const loadBackground = async () => {
      if (!backgroundCanvasRef.current || !card.background.bitmap) return;

      try {
        const ctx = backgroundCanvasRef.current.getContext('2d');
        if (!ctx) return;

        const imageData = await bitmapOperations.loadBitmap(card.background.bitmap);
        ctx.putImageData(imageData, 0, 0);
      } catch (error) {
        console.error('Error loading background bitmap:', error);
      }
    };

    loadBackground();
  }, [card.background.bitmap, bitmapOperations]);

  // Load and render card bitmap
  useEffect(() => {
    const loadCard = async () => {
      if (!cardCanvasRef.current || !card.bitmap) return;

      try {
        const ctx = cardCanvasRef.current.getContext('2d');
        if (!ctx) return;

        const imageData = await bitmapOperations.loadBitmap(card.bitmap);
        ctx.putImageData(imageData, 0, 0);
      } catch (error) {
        console.error('Error loading card bitmap:', error);
      }
    };

    loadCard();
  }, [card.bitmap, bitmapOperations]);

  // Add keyboard event handlers for modifier keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setDrawingState(prev => ({ ...prev, isShiftPressed: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setDrawingState(prev => ({ ...prev, isShiftPressed: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Helper function to draw shapes
  const drawShape = (ctx: CanvasRenderingContext2D, shape: 'rectangle' | 'oval' | 'line', start: { x: number; y: number }, end: { x: number; y: number }, isShiftPressed: boolean) => {
    const width = end.x - start.x;
    const height = end.y - start.y;

    if (isShiftPressed) {
      // Make shape perfect (square/circle/45° line)
      const size = Math.max(Math.abs(width), Math.abs(height));
      const signX = Math.sign(width);
      const signY = Math.sign(height);

      if (shape === 'line') {
        // Snap to 45° angles
        const angle = Math.atan2(height, width);
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const length = Math.sqrt(width * width + height * height);
        end.x = start.x + Math.cos(snappedAngle) * length;
        end.y = start.y + Math.sin(snappedAngle) * length;
      } else {
        end.x = start.x + size * signX;
        end.y = start.y + size * signY;
      }
    }

    ctx.beginPath();
    if (shape === 'rectangle') {
      ctx.rect(
        Math.min(start.x, end.x),
        Math.min(start.y, end.y),
        Math.abs(end.x - start.x),
        Math.abs(end.y - start.y)
      );
    } else if (shape === 'oval') {
      const centerX = (start.x + end.x) / 2;
      const centerY = (start.y + end.y) / 2;
      const radiusX = Math.abs(end.x - start.x) / 2;
      const radiusY = Math.abs(end.y - start.y) / 2;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    } else if (shape === 'line') {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
    }
    ctx.stroke();
  };

  // Handle mouse events for drawing
  const handleDrawingMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Drawing mouse down:', {
      tool: selectedTool,
      canvasRef: !!drawingCanvasRef.current,
      coords: {
        clientX: e.clientX,
        clientY: e.clientY,
        rect: drawingCanvasRef.current?.getBoundingClientRect()
      }
    });

    if (!drawingCanvasRef.current || !selectedTool || selectedTool === 'button') return;

    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Set up drawing context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawingState.strokeStyle;
    ctx.lineWidth = drawingState.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // For pen tool, start a new path
    if (selectedTool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    setDrawingState(prev => ({
      ...prev,
      isDrawing: true,
      startPoint: { x, y },
      currentPoint: { x, y }
    }));
  }, [selectedTool, drawingState.strokeStyle, drawingState.lineWidth]);

  const handleDrawingMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Drawing mouse move:', {
      isDrawing: drawingState.isDrawing,
      tool: selectedTool,
      canvasRef: !!drawingCanvasRef.current,
      startPoint: drawingState.startPoint,
      coords: {
        clientX: e.clientX,
        clientY: e.clientY,
        rect: drawingCanvasRef.current?.getBoundingClientRect()
      }
    });

    if (!drawingCanvasRef.current || !drawingState.isDrawing || !selectedTool || selectedTool === 'button') return;

    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx || !drawingState.startPoint) return;

    // Set drawing styles
    ctx.strokeStyle = drawingState.strokeStyle;
    ctx.lineWidth = drawingState.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (selectedTool) {
      case 'pen':
        // For pen tool, continue the path without clearing
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case 'rectangle':
      case 'oval':
      case 'line':
        // For shape tools, clear and redraw preview
        ctx.clearRect(0, 0, width, height);
        drawShape(ctx, selectedTool, drawingState.startPoint, { x, y }, drawingState.isShiftPressed);
        break;
    }

    setDrawingState(prev => ({
      ...prev,
      currentPoint: { x, y }
    }));
  }, [drawingState, selectedTool, width, height]);

  const handleDrawingMouseUp = useCallback(async () => {
    console.log('Drawing mouse up:', {
      isDrawing: drawingState.isDrawing,
      tool: selectedTool,
      canvasRef: !!drawingCanvasRef.current,
      targetCanvasRef: isEditingBackground ? !!backgroundCanvasRef.current : !!cardCanvasRef.current
    });

    if (!drawingCanvasRef.current || !cardCanvasRef.current || !drawingState.isDrawing) return;

    // Get the target canvas based on whether we're editing background
    const targetCanvas = isEditingBackground ? backgroundCanvasRef.current : cardCanvasRef.current;
    if (!targetCanvas) return;

    const targetCtx = targetCanvas.getContext('2d');
    const drawingCtx = drawingCanvasRef.current.getContext('2d');
    
    if (!targetCtx || !drawingCtx) return;

    // Transfer drawing to target canvas
    targetCtx.drawImage(drawingCanvasRef.current, 0, 0);

    // Clear drawing canvas
    drawingCtx.clearRect(0, 0, width, height);

    setDrawingState(prev => ({
      ...prev,
      isDrawing: false,
      startPoint: null,
      currentPoint: null
    }));

    // Save the bitmap
    try {
      const imageData = targetCtx.getImageData(0, 0, width, height);
      const bitmapPath = isEditingBackground ? card.background.bitmap : card.bitmap;
      
      if (bitmapPath) {
        console.log('Saving bitmap:', {
          bitmapPath,
          imageData: {
            width: imageData.width,
            height: imageData.height
          }
        });
        await bitmapOperations.saveBitmap(bitmapPath, imageData);
      }
    } catch (error) {
      console.error('Error saving bitmap:', error);
    }
  }, [width, height, isEditingBackground, card, bitmapOperations, drawingState.isDrawing, selectedTool]);

  // Default card size if not specified (matches classic HyperCard)
  const cardWidth = width || 512;
  const cardHeight = height || 342;

  // Drawing state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    buttonId: null,
    startPosition: null,
    offset: null
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    buttonId: null,
    handle: null,
    startSize: null,
    startPosition: null
  });

  // Add a state to track if we just created a button
  const [justCreatedButton, setJustCreatedButton] = useState(false);

  // Get the current layer (background or foreground)
  const currentLayer = isEditingBackground ? card.background : card.foreground;

  // Helper to find a button by ID
  const findButton = useCallback((id: string) => {
    return [...currentLayer.buttons].find(b => b.id === id);
  }, [currentLayer.buttons]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    console.log('Card click event triggered:', {
      target: e.target,
      currentTarget: e.currentTarget,
      selectedTool,
      selectedButtonId,
      isDrawing: drawingState.isDrawing,
      isDragging: dragState.isDragging,
      isResizing: resizeState.isResizing,
      isCreatingButton: drawingState.isDrawing,
      isCompletingResize: resizeState.isCompleting
    });

    // Skip card click if we're in the middle of creating a button or completing a resize
    if (drawingState.isDrawing || resizeState.isCompleting) {
      console.log('Skipping card click during operation:', {
        isCreatingButton: drawingState.isDrawing,
        isCompletingResize: resizeState.isCompleting
      });
      return;
    }

    // Check if we clicked directly on the card (not on a button)
    const target = e.target as HTMLElement;
    const buttonElement = target.closest('[data-button-id]');
    const cardContainer = e.currentTarget as HTMLElement;
    const isCardBackgroundClick = !buttonElement && (
      target === cardContainer || 
      target.closest('.card-container') === cardContainer
    );
    
    console.log('Click analysis:', {
      clickedOnButton: !!buttonElement,
      isCardBackgroundClick,
      targetElement: target.tagName,
      targetClasses: target.className,
      currentTargetElement: cardContainer.tagName,
      currentTargetClasses: cardContainer.className,
      selectedTool,
      currentSelection: selectedButtonId
    });

    // If we clicked on the card background and we're in button tool mode, deselect
    if (isCardBackgroundClick && selectedTool === 'button' && onSelectButton) {
      console.log('Attempting to deselect button:', {
        previousSelection: selectedButtonId,
        isButtonTool: selectedTool === 'button',
        hasSelectHandler: !!onSelectButton
      });
      onSelectButton(null, isEditingBackground);
    }

    // Only handle card clicks if we're not in the middle of an operation
    if (!drawingState.isDrawing && !dragState.isDragging && !resizeState.isResizing) {
      // Call the original onCardClick if provided
      if (onCardClick) {
        onCardClick();
      }
    }
  }, [drawingState, dragState.isDragging, resizeState, selectedTool, onSelectButton, isEditingBackground, onCardClick, selectedButtonId]);

  // Helper function to determine if mouse is near an edge
  const getResizeHandle = (e: React.MouseEvent, buttonElement: Element): 'nw' | 'ne' | 'sw' | 'se' | null => {
    const rect = buttonElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const edgeSize = 8; // Size of the corner detection area

    // Check if mouse is near a corner, centered on the corner point
    const isNearCorner = (cornerX: number, cornerY: number) => {
      const dx = Math.abs(x - cornerX);
      const dy = Math.abs(y - cornerY);
      return dx < edgeSize && dy < edgeSize;
    };

    if (isNearCorner(0, 0)) return 'nw';
    if (isNearCorner(rect.width, 0)) return 'ne';
    if (isNearCorner(0, rect.height)) return 'sw';
    if (isNearCorner(rect.width, rect.height)) return 'se';
    
    return null;
  };

  const handleMouseDownButton = useCallback((e: React.MouseEvent) => {
    // Only handle button operations in button tool mode
    if (selectedTool !== 'button') return;

    const target = e.target as HTMLElement;
    const buttonElement = target.closest('[data-button-id]');
    
    if (buttonElement && onSelectButton) {
      const buttonId = buttonElement.getAttribute('data-button-id');
      const button = findButton(buttonId!);
      
      console.log('Button mouse down:', {
        buttonId,
        currentSelection: selectedButtonId,
        isDrawing: drawingState.isDrawing,
        isDragging: dragState.isDragging,
        isResizing: resizeState.isResizing
      });

      if (button) {
        // First select the button
        onSelectButton(button, isEditingBackground);

        // Check if we're near an edge for resizing
        const handle = getResizeHandle(e, buttonElement);
        if (handle) {
          console.log('Starting resize:', { buttonId, handle });
          setResizeState({
            isResizing: true,
            buttonId: button.id,
            handle,
            startSize: { ...button.size },
            startPosition: { ...button.position }
          });
          e.stopPropagation();
          return;
        }

        // Otherwise, start dragging
        console.log('Starting drag:', { buttonId });
        const rect = buttonElement.getBoundingClientRect();
        const offset = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        
        setDragState({
          isDragging: true,
          buttonId: button.id,
          startPosition: { x: button.position.x, y: button.position.y },
          offset
        });
        
        e.stopPropagation();
        return;
      }
    }

    // If we didn't click on a button and we're not in the middle of an operation, start drawing
    if (onAddButton && !drawingState.isDrawing && !dragState.isDragging && !resizeState.isResizing) {
      console.log('Starting to draw new button');
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

        setDrawingState(prev => ({
    ...prev,
    isDrawing: true,
    startPoint: { x, y },
    currentPoint: { x, y }
  }));
    }
  }, [selectedTool, onAddButton, onSelectButton, findButton, isEditingBackground, selectedButtonId, drawingState.isDrawing, dragState.isDragging, resizeState.isResizing]);

  // Add a separate click handler for deselection
  const handleCardBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only handle deselection in button tool mode
    if (selectedTool !== 'button' || !onSelectButton) return;

    // Don't deselect if we just created a button
    if (justCreatedButton) {
      console.log('Skipping deselection - button just created');
      setJustCreatedButton(false);
      return;
    }

    // Check if we clicked on the card background (not a button)
    const target = e.target as HTMLElement;
    const buttonElement = target.closest('[data-button-id]');
    const cardContainer = e.currentTarget as HTMLElement;
    const isCardBackgroundClick = !buttonElement && (
      target === cardContainer || 
      target.closest('.card-container') === cardContainer
    );

    console.log('Card background click:', {
      isCardBackgroundClick,
      selectedTool,
      currentSelection: selectedButtonId,
      justCreatedButton,
      targetElement: target.tagName,
      targetClasses: target.className
    });

    if (isCardBackgroundClick && selectedButtonId) {
      console.log('Deselecting button on card background click');
      onSelectButton(null, isEditingBackground);
    }
  }, [selectedTool, onSelectButton, selectedButtonId, isEditingBackground, justCreatedButton]);

  const handleMouseMoveButton = useCallback((e: React.MouseEvent) => {
    if (resizeState.isResizing && resizeState.buttonId && resizeState.startSize && resizeState.startPosition && onUpdateButton) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Find the button being resized
      const button = [...currentLayer.buttons].find(b => b.id === resizeState.buttonId);
      if (!button) return;

      let newSize = { ...resizeState.startSize };
      let newPosition = { ...resizeState.startPosition };

      // Calculate new size and position based on the handle being dragged
      switch (resizeState.handle) {
        case 'se':
          newSize = {
            width: Math.max(20, mouseX - resizeState.startPosition.x),
            height: Math.max(20, mouseY - resizeState.startPosition.y)
          };
          break;
        case 'sw':
          newSize = {
            width: Math.max(20, resizeState.startPosition.x + resizeState.startSize.width - mouseX),
            height: Math.max(20, mouseY - resizeState.startPosition.y)
          };
          newPosition = {
            x: mouseX,
            y: resizeState.startPosition.y
          };
          break;
        case 'ne':
          newSize = {
            width: Math.max(20, mouseX - resizeState.startPosition.x),
            height: Math.max(20, resizeState.startPosition.y + resizeState.startSize.height - mouseY)
          };
          newPosition = {
            x: resizeState.startPosition.x,
            y: mouseY
          };
          break;
        case 'nw':
          newSize = {
            width: Math.max(20, resizeState.startPosition.x + resizeState.startSize.width - mouseX),
            height: Math.max(20, resizeState.startPosition.y + resizeState.startSize.height - mouseY)
          };
          newPosition = {
            x: mouseX,
            y: mouseY
          };
          break;
      }

      // Update the button
      onUpdateButton({
        ...button,
        size: newSize,
        position: newPosition
      }, isEditingBackground);
      return;
    }

    if (dragState.isDragging && dragState.buttonId && dragState.offset && onUpdateButton) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - dragState.offset.x;
      const y = e.clientY - rect.top - dragState.offset.y;

      // Find the button being dragged
      const button = [...currentLayer.buttons].find(b => b.id === dragState.buttonId);
      if (button) {
        // Update the button position
        onUpdateButton({
          ...button,
          position: { x, y }
        }, isEditingBackground);
      }
      return;
    }

    if (drawingState.isDrawing && drawingState.startPoint) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDrawingState(prev => ({
        ...prev,
        currentPoint: { x, y }
      }));
    }
  }, [resizeState, dragState, drawingState, onUpdateButton, currentLayer.buttons, isEditingBackground]);

  const handleMouseUpButton = useCallback((e: React.MouseEvent) => {
    // Handle resizing completion
    if (resizeState.isResizing) {
      console.log('Finishing resize:', { 
        buttonId: resizeState.buttonId,
        currentSelection: selectedButtonId 
      });

      // Set flag to prevent card click from firing
      setResizeState(prev => ({ 
        ...prev, 
        isResizing: false,
        isCompleting: true 
      }));

      // Reset resize state after a short delay
      setTimeout(() => {
        setResizeState({
          isResizing: false,
          buttonId: null,
          handle: null,
          startSize: null,
          startPosition: null,
          isCompleting: false
        });
      }, 0);
      return;
    }

    // Handle dragging completion
    if (dragState.isDragging) {
      console.log('Finishing drag:', { 
        buttonId: dragState.buttonId,
        currentSelection: selectedButtonId 
      });
      setDragState({
        isDragging: false,
        buttonId: null,
        startPosition: null,
        offset: null
      });
      return;
    }

    // Handle drawing completion
    if (drawingState.isDrawing && drawingState.startPoint && drawingState.currentPoint && onAddButton) {
      console.log('Finishing draw:', { 
        currentSelection: selectedButtonId,
        startPoint: drawingState.startPoint,
        currentPoint: drawingState.currentPoint
      });

      // Set flag to prevent card click from firing
      setDrawingState(prev => ({ ...prev, isDrawing: false }));

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

        console.log('Creating new button:', { 
          buttonId: newButton.id,
          currentSelection: selectedButtonId 
        });

        onAddButton(newButton, isEditingBackground);
        // Set flag to prevent deselection
        setJustCreatedButton(true);
      }

      // Reset drawing state after a short delay to ensure card click doesn't fire
      setTimeout(() => {
            setDrawingState(prev => ({
      ...prev,
      isDrawing: false,
      startPoint: null,
      currentPoint: null
    }));
      }, 0);
    }
  }, [resizeState, dragState, drawingState, onAddButton, isEditingBackground, currentLayer.buttons.length, selectedButtonId]);

  // Calculate the preview rectangle when drawing
  const getPreviewStyle = () => {
    if (!drawingState.isDrawing || !drawingState.startPoint || !drawingState.currentPoint) return null;

    // Only show preview for buttons and shape tools
    if (selectedTool !== 'button' && selectedTool !== 'rectangle' && selectedTool !== 'oval' && selectedTool !== 'line') return null;

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
      backgroundColor: selectedTool === 'button' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
      pointerEvents: 'none' as const
    };
  };

  // Update the cursor style based on state and mouse position
  const getCursorStyle = (e?: React.MouseEvent) => {
    if (selectedTool === 'button') {
      if (resizeState.isResizing) {
        switch (resizeState.handle) {
          case 'nw': return 'nwse-resize';
          case 'ne': return 'nesw-resize';
          case 'sw': return 'nesw-resize';
          case 'se': return 'nwse-resize';
          default: return 'crosshair';
        }
      }

      // If we're hovering over a selected button, check for resize cursor
      if (e && selectedButtonId) {
        const target = e.target as Element;
        const buttonElement = target.closest('[data-button-id]');
        if (buttonElement && buttonElement.getAttribute('data-button-id') === selectedButtonId) {
          const handle = getResizeHandle(e, buttonElement);
          if (handle) {
            switch (handle) {
              case 'nw': return 'nwse-resize';
              case 'ne': return 'nesw-resize';
              case 'sw': return 'nesw-resize';
              case 'se': return 'nwse-resize';
            }
          }
        }
      }

      if (dragState.isDragging) return 'grabbing';
      return 'crosshair';
    }
    return onCardClick ? 'pointer' : 'default';
  };

  // Add double-click handler for buttons
  const handleButtonDoubleClick = useCallback((e: React.MouseEvent, button: HyperCardButton) => {
    e.stopPropagation(); // Prevent card click from firing
    
    console.log('Button double-click:', {
      buttonId: button.id,
      currentSelection: selectedButtonId
    });

    // Only show property inspector if we're in button tool mode
    if (selectedTool === 'button' && onTogglePropertyInspector) {
      // Make sure the button is selected
      if (onSelectButton && selectedButtonId !== button.id) {
        onSelectButton(button, isEditingBackground);
      }
      onTogglePropertyInspector();
    }
  }, [selectedTool, onTogglePropertyInspector, onSelectButton, selectedButtonId, isEditingBackground]);

  // Add button click handler for browse mode
  const handleButtonClick = useCallback((e: React.MouseEvent, button: HyperCardButton) => {
    e.stopPropagation(); // Prevent card click from firing

    // If we're in button tool mode, don't handle clicks
    if (selectedTool === 'button') return;

    console.log('Button click in browse mode:', {
      buttonId: button.id,
      linkToCardId: button.linkToCardId,
      selectedTool
    });

    // If the button has a linked card and we have a navigation handler, navigate to it
    if (button.linkToCardId && onNavigateToCard) {
      onNavigateToCard(button.linkToCardId);
    }
  }, [selectedTool, onNavigateToCard]);

  // Render a button with selection state
  const renderButton = (button: HyperCardButton, isBackground: boolean) => {
    const isSelected = selectedButtonId === button.id;
    const showSelection = isSelected && selectedTool === 'button';
    const isButtonTool = selectedTool === 'button';
    const isBrowseTool = selectedTool === 'browse';

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
          cursor: isButtonTool 
            ? 'pointer' 
            : (isBrowseTool && button.linkToCardId) 
              ? 'pointer' 
              : 'default'
        }}
        onClick={(e) => handleButtonClick(e, button)}
        onDoubleClick={(e) => handleButtonDoubleClick(e, button)}
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
      <style>{buttonStyles}</style>
      <div 
        className={`relative bg-white border-2 ${isEditingBackground ? 'border-blue-500' : 'border-black'} shadow-md ${isEditingBackground ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h10v10H0zM10 10h10v10H10z\' fill=\'%23f0f0f0\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]' : ''} card-container`}
        style={{ 
          width: cardWidth, 
          height: cardHeight,
          cursor: getCursorStyle()
        }}
        onClick={handleCardBackgroundClick}
        onMouseDown={(e) => {
          if (selectedTool === 'button') {
            handleMouseDownButton(e);
          }
        }}
        onMouseMove={(e) => {
          // Update cursor based on mouse position
          const cursor = getCursorStyle(e);
          if (e.currentTarget.style.cursor !== cursor) {
            e.currentTarget.style.cursor = cursor;
          }
          if (selectedTool === 'button') {
            handleMouseMoveButton(e);
          }
        }}
        onMouseUp={(e) => {
          if (selectedTool === 'button') {
            handleMouseUpButton(e);
          }
        }}
        onMouseLeave={(e) => {
          if (selectedTool === 'button') {
            handleMouseUpButton(e);
          }
        }}
      >
        {/* Canvas Layers */}
        <canvas
          ref={backgroundCanvasRef}
          className="absolute inset-0"
          width={cardWidth}
          height={cardHeight}
        />
        <canvas
          ref={cardCanvasRef}
          className="absolute inset-0"
          width={cardWidth}
          height={cardHeight}
        />
        <canvas
          ref={drawingCanvasRef}
          className="absolute inset-0"
          width={cardWidth}
          height={cardHeight}
          style={{ 
            pointerEvents: selectedTool && selectedTool !== 'button' && selectedTool !== 'browse' ? 'auto' : 'none',
            cursor: selectedTool && selectedTool !== 'button' && selectedTool !== 'browse' ? 'crosshair' : 'inherit'
          }}
          onMouseDown={handleDrawingMouseDown}
          onMouseMove={handleDrawingMouseMove}
          onMouseUp={handleDrawingMouseUp}
          onMouseLeave={handleDrawingMouseUp}
        />

        {/* Drawing Preview */}
        {drawingState.isDrawing && (
          <div style={getPreviewStyle() || {}} />
        )}

        {/* Background Layer */}
        <div className="absolute inset-0" style={{ 
          pointerEvents: selectedTool === 'button' || selectedTool === 'browse' ? 'auto' : 'none' 
        }}>
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
        <div className="absolute inset-0" style={{ 
          pointerEvents: selectedTool === 'button' || selectedTool === 'browse' ? 'auto' : 'none' 
        }}>
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