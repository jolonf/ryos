# HyperCard PRD (Product Requirements Document)

## Overview
HyperCard is a new app for RyOS that brings the classic Macintosh HyperCard experience to the modern web. It maintains the core concepts of the original HyperCard while adapting to modern web technologies and the RyOS environment.

## Core Concepts

### Cards and Stacks
- Cards are the fundamental unit of organization
- Each stack has a configurable card size (stored in stack metadata)
- Cards can have backgrounds and foreground objects
- Cards support bitmap-based drawing on backgrounds
- Navigation between cards (first, last, next, previous, go to card)
- Card transitions (fade, wipe, etc.)

### Objects
- Buttons (rectangle, round, shadow styles)
- Text fields (transparent, opaque styles)
- Images
- Basic shapes (drawn as bitmaps)
- Object properties:
  - Position and size
  - Style (border, fill, shadow)
  - Text formatting
  - Visibility
  - Locking

### Drawing Tools
- Pen tool
- Spray paint (with patterns)
- Eraser
- Color picker
- Pattern picker
- All drawing is bitmap-based (no vector support)

### Modes
- Browse mode (for running stacks)
- Edit mode (for creating/editing stacks)

### Scripting (Future Phase)
- Simplified HyperTalk language
- Message box for command entry
- Basic commands:
  - Navigation (go, next, previous)
  - Object manipulation (show, hide)
  - Text processing
  - Basic arithmetic
  - Sound playback
- Message handlers (on mouseUp, on openCard, etc.)
- Variables and simple expressions
- Basic control structures

## Technical Requirements

### Rendering
- Pixel-perfect rendering (no anti-aliasing)
- CSS `image-rendering: pixelated` for bitmap images
- Canvas-based drawing tools
- Fixed card sizes (configurable per stack)

### File Format
- JSON-based stack format
- Stores:
  - Card content (objects, properties)
  - Backgrounds
  - Stack properties
  - Scripts (for future implementation)
- Support for "Save As" in different formats

### Integration with RyOS
- File operations through Finder
- Drag-and-drop support for images
- Undo/redo system
- Home stack as a regular stack with examples

### User Interface
- Tools palette
- Properties inspector
- Card navigation controls
- Toggleable message box
- Menu system:
  - File (New, Open, Save, Save As, Close)
  - Edit (Undo, Redo, Cut, Copy, Paste)
  - Tools (Browse/Edit mode, Message box)
  - Objects (Button, Field, etc.)
  - Card (New, Delete, Background)
  - Help

## Development Phases

### Phase 1: MVP
- Basic card/stack structure
- Object creation and manipulation
- Drawing tools
- Navigation system
- File operations
- Basic UI implementation

### Phase 2: Enhanced Features
- Card transitions
- Additional object types
- Advanced drawing tools
- Properties inspector
- Undo/redo system
- Drag-and-drop support

### Phase 3: Scripting
- Simplified HyperTalk implementation
- Message box
- Basic commands and handlers
- Script editor
- Error handling

## Asset Requirements

### UI Assets
- App icon
- Tool palette icons
- Button styles
- Field styles
- Pattern fills
- Menu icons

### Home Stack
- Welcome card
- Basic examples
- Tutorial cards
- Template cards

## Future Considerations
- Multiple stack support
- Advanced scripting features
- Card browser
- Search functionality
- Export to other formats
- Integration with other RyOS apps

## Software Engineering Requirements
- Follow TypeScript best practices and maintain strict type safety
- Use React best practices and patterns
- Implement clean architecture principles:
  - Separation of concerns
  - Single responsibility principle
  - Dependency injection where appropriate
- Maintain high code quality:
  - Comprehensive unit tests
  - Integration tests for critical paths
  - Clear and consistent code style
  - Meaningful documentation
  - Descriptive variable and function names
- Use modern React patterns:
  - Functional components
  - Custom hooks for reusable logic
  - Context for state management
  - Memoization where beneficial
- Follow RyOS project conventions:
  - Directory structure
  - Naming conventions
  - Component organization
  - State management patterns
- Ensure code is:
  - Readable and self-documenting
  - Well-factored and modular
  - Easy to maintain and extend
  - Performant and optimized
  - Free of technical debt

## Technical Notes
- All bitmap assets should be created at their intended display size
- No anti-aliasing should be used for bitmap assets
- Card sizes should be configurable but fixed within a stack
- Drawing tools should work directly on card backgrounds
- Stack format should be extensible for future features 