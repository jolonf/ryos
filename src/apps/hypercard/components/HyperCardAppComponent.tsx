import React, { useState, useEffect, useCallback, useRef } from "react";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { AppProps } from "../../base/types";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { InputDialog } from "@/components/dialogs/InputDialog";
import { helpItems, appMetadata } from "..";
import { HyperCardMenuBar } from "./HyperCardMenuBar";
import { useStackStore } from "../stores/useStackStore";
import { useFileSystem } from "@/apps/finder/hooks/useFileSystem";
import { useLaunchApp } from "@/hooks/useLaunchApp";
import { toast } from "sonner";
import { HyperCardStack } from "../types/stack";
import { Card } from "../types/card";
import { useFilesStore } from "@/stores/useFilesStore";
import { useAppStore } from "@/stores/useAppStore";
import { CardComponent } from './CardComponent';
import { ToolId, TOOLS, Tool } from "./ToolsPaletteWindow";
import { PropertyInspectorDialog, InspectorSelection } from "./PropertyInspectorDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HYPERCARD_STACKS_DIR = "/HyperCard Stacks";

interface HyperCardMenuBarProps {
  onClose: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
  onNewStack: () => void;
  onOpenStack: () => void;
  onSaveStack: () => void;
  onSaveStackAs: () => void;
  onCloseStack: () => void;
  onNextCard: () => void;
  onPreviousCard: () => void;
  onAddCard: () => void;
  onDeleteCard: () => void;
  hasUnsavedChanges: boolean;
  currentStackPath: string | null;
  canNavigateCards: boolean;
  isWindowOpen: boolean;
  isForeground: boolean;
  onToggleBackground: () => void;
  isEditingBackground: boolean;
  isPropertyInspectorVisible: boolean;
  onTogglePropertyInspector: () => void;
}

interface CardComponentProps {
  card: Card;
  width: number;
  height: number;
  isActive: boolean;
  isEditingBackground: boolean;
  selectedTool: ToolId | null;
}

export function HyperCardAppComponent({
  onClose,
  isWindowOpen,
  isForeground = true,
  skipInitialSound,
  initialData,
}: AppProps) {
  // Dialog states
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isNewStackDialogOpen, setIsNewStackDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  // Input states
  const [newStackName, setNewStackName] = useState("Untitled Stack");
  const [saveStackName, setSaveStackName] = useState("");

  // Stack operations
  const { 
    currentStack, 
    isModified, 
    operations,
    lastSavedPath,
    isEditingBackground 
  } = useStackStore();

  // Get file system operations
  const { saveFile, handleFileOpen, createFolder } = useFileSystem();
  const fileStore = useFilesStore();

  const launchApp = useLaunchApp();

  const confirmHandlerRef = useRef<() => void>(() => {
    operations.closeStack();
    setIsConfirmCloseDialogOpen(false);
  });

  // Add state to track if current file exists
  const [currentFileExists, setCurrentFileExists] = useState(false);

  // Update file existence check when stack or path changes
  useEffect(() => {
    if (currentStack?.path) {
      const fileItem = fileStore.getItem(currentStack.path);
      setCurrentFileExists(!!fileItem && !fileItem.isDirectory);
    } else {
      setCurrentFileExists(false);
    }
  }, [currentStack?.path, fileStore]);

  // Initialize HyperCard Stacks directory and create default stack
  useEffect(() => {
    const initializeHyperCardDirectory = () => {
      // Check if directory exists
      const stacksDir = fileStore.getItem(HYPERCARD_STACKS_DIR);
      if (!stacksDir) {
        // Create the directory if it doesn't exist
        createFolder({
          path: HYPERCARD_STACKS_DIR,
          name: "HyperCard Stacks"
        });
      }
    };

    initializeHyperCardDirectory();

    // Create a default stack if no stack is open and no initial data
    if (!currentStack && !initialData) {
      operations.newStack("Untitled Stack");
    }
  }, [createFolder, fileStore, currentStack, initialData, operations]);

  // Implement file system operations
  const saveStackOperation = useCallback(async (stack: HyperCardStack, path?: string) => {
    try {
      // If no path is provided, construct one in the HyperCard Stacks directory
      const savePath = path || `${HYPERCARD_STACKS_DIR}/${stack.name}.stack`;
      const fileName = savePath.split("/").pop() || `${stack.name}.stack`;

      // Ensure the directory exists
      const dirPath = HYPERCARD_STACKS_DIR;
      const dir = fileStore.getItem(dirPath);
      if (!dir || !dir.isDirectory) {
        throw new Error(`Directory "${dirPath}" does not exist. Please save to the HyperCard Stacks folder.`);
      }

      // Save the file
      await saveFile({
        name: fileName,
        path: savePath,
        content: JSON.stringify(stack),
        type: "stack"
      });

      // Update store state after successful save
      operations.addToRecentStacks(savePath);
      useStackStore.setState({
        isModified: false,
        lastSavedPath: savePath,
        currentStack: {
          ...stack,
          path: savePath
        }
      });

      return savePath;
    } catch (error) {
      console.error("Error saving stack:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save stack";
      throw new Error(errorMessage);
    }
  }, [saveFile, fileStore, operations]);

  const loadStackOperation = useCallback(async (path: string) => {
    try {
      const fileItem = {
        name: path.split("/").pop() || "untitled.stack",
        path: path,
        isDirectory: false,
        type: "stack",
        appId: "hypercard"
      };

      await handleFileOpen(fileItem);
      return currentStack!;
    } catch (error) {
      console.error("Error loading stack:", error);
      throw error;
    }
  }, [handleFileOpen, currentStack]);

  // Override store operations with file system implementations
  useEffect(() => {
    if (operations) {
      operations.saveStack = saveStackOperation;
      operations.loadStack = loadStackOperation;
    }
  }, [operations, saveStackOperation, loadStackOperation]);

  // Handle initial data when loading a stack
  useEffect(() => {
    if (initialData?.path && initialData?.content) {
      try {
        const content = initialData.content;
        if (typeof content === 'string') {
          const stack = JSON.parse(content);
          
          // If we have a current stack and it's modified, show confirmation dialog
          if (currentStack && isModified) {
            setIsConfirmCloseDialogOpen(true);
            // Store the new stack data to load after confirmation
            const pendingStack = stack;
            confirmHandlerRef.current = () => {
              // Close current stack and load new one
              operations.closeStack();
              useStackStore.setState({
                currentStack: {
                  ...pendingStack,
                  path: initialData.path
                },
                isModified: false,
                lastSavedPath: initialData.path
              });
              setIsConfirmCloseDialogOpen(false);
              toast.success(`Loaded stack: ${pendingStack.name}`);
              // Clear initial data after successful load
              const clearInitialData = useAppStore.getState().clearInitialData;
              clearInitialData('hypercard');
              // Reset the handler back to default
              confirmHandlerRef.current = () => {
                operations.closeStack();
                setIsConfirmCloseDialogOpen(false);
              };
            };
          } else {
            // No current stack or no unsaved changes, load directly
            operations.closeStack();
            useStackStore.setState({
              currentStack: {
                ...stack,
                path: initialData.path
              },
              isModified: false,
              lastSavedPath: initialData.path
            });
            toast.success(`Loaded stack: ${stack.name}`);
            // Clear initial data after successful load
            const clearInitialData = useAppStore.getState().clearInitialData;
            clearInitialData('hypercard');
          }
        }
      } catch (error) {
        console.error("Error loading stack from initial data:", error);
        toast.error("Failed to load stack");
        // Clear initial data even on error to prevent retrying
        const clearInitialData = useAppStore.getState().clearInitialData;
        clearInitialData('hypercard');
      }
    }
  }, [initialData, operations, currentStack, isModified]);

  // Handle new stack
  const handleNewStack = async () => {
    if (isModified) {
      setIsConfirmCloseDialogOpen(true);
      return;
    }
    try {
      await operations.newStack("Untitled Stack");
      toast.success("Created new stack: Untitled Stack");
    } catch (error) {
      console.error("Error creating new stack:", error);
      toast.error("Failed to create new stack");
    }
  };

  const handleNewStackSubmit = async (name: string) => {
    try {
      await operations.newStack(name);
      setIsNewStackDialogOpen(false);
      toast.success(`Created new stack: ${name}`);
    } catch (error) {
      console.error("Error creating new stack:", error);
      toast.error("Failed to create new stack");
    }
  };

  // Handle save stack
  const handleSaveStack = async () => {
    if (!currentStack) return;

    try {
      // If we have a lastSavedPath, use it, otherwise construct a new path
      const savePath = currentStack.path || `${HYPERCARD_STACKS_DIR}/${currentStack.name}.stack`;
      await saveStackOperation(currentStack, savePath);
      toast.success(`Saved stack: ${currentStack.name}`);
    } catch (error) {
      // Show error in a dialog
      setErrorDialogMessage(error instanceof Error ? error.message : "Failed to save stack");
      setIsErrorDialogOpen(true);
    }
  };

  const handleSaveStackAs = async () => {
    if (!currentStack) return;
    setSaveStackName(currentStack.name);
    setIsSaveDialogOpen(true);
  };

  const handleSaveStackSubmit = async (name: string) => {
    if (!currentStack) return;

    try {
      // Construct the full path for the new file
      const savePath = `${HYPERCARD_STACKS_DIR}/${name}.stack`;
      
      // Create a new stack object with the updated name
      const updatedStack = {
        ...currentStack,
        name: name
      };
      
      await saveStackOperation(updatedStack, savePath);
      setIsSaveDialogOpen(false);
      toast.success(`Saved stack as: ${name}`);
    } catch (error) {
      // Show error in a dialog
      setErrorDialogMessage(error instanceof Error ? error.message : "Failed to save stack");
      setIsErrorDialogOpen(true);
    }
  };

  // Handle open stack
  const handleOpenStack = () => {
    launchApp("finder", { initialPath: "/HyperCard Stacks" });
  };

  // Handle close stack
  const handleCloseStack = () => {
    if (isModified) {
      setIsConfirmCloseDialogOpen(true);
      return;
    }
    operations.closeStack();
  };

  const handleConfirmCloseStack = () => {
    confirmHandlerRef.current();
  };

  // Card navigation handlers
  const handleNextCard = () => {
    if (currentStack) {
      operations.navigateToNextCard();
    }
  };

  const handlePreviousCard = () => {
    if (currentStack) {
      operations.navigateToPreviousCard();
    }
  };

  const handleAddCard = async () => {
    if (currentStack) {
      const cardNumber = currentStack.cards.length + 1;
      await operations.addCard(`Card ${cardNumber}`);
      toast.success(`Added Card ${cardNumber}`);
    }
  };

  const handleDeleteCard = async () => {
    if (currentStack && currentStack.cards.length > 1) {
      const currentCard = currentStack.cards[currentStack.currentCardIndex];
      await operations.deleteCard(currentCard.id);
      toast.success(`Deleted ${currentCard.name}`);
    } else {
      toast.error("Cannot delete the last card");
    }
  };

  // Add tools palette state
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);

  // Add property inspector state
  const [isPropertyInspectorVisible, setIsPropertyInspectorVisible] = useState(false);
  const [inspectorSelection, setInspectorSelection] = useState<InspectorSelection | null>(null);

  // Update selection when card changes or background mode changes
  useEffect(() => {
    if (currentStack) {
      if (isEditingBackground) {
        setInspectorSelection({ type: "background", id: currentStack.background.id });
      } else if (currentStack.cards[currentStack.currentCardIndex]) {
        setInspectorSelection({ 
          type: "card", 
          id: currentStack.cards[currentStack.currentCardIndex].id 
        });
      }
    } else {
      setInspectorSelection(null);
    }
  }, [currentStack, isEditingBackground]);

  // Handle stack updates
  const handleStackUpdate = async (updates: Partial<HyperCardStack>) => {
    if (!currentStack) return;
    
    try {
      // Update the stack in the store
      useStackStore.setState({
        currentStack: {
          ...currentStack,
          ...updates,
          metadata: {
            ...currentStack.metadata,
            ...(updates.metadata || {}),
          }
        },
        isModified: true
      });
    } catch (error) {
      console.error("Error updating stack:", error);
      toast.error("Failed to update stack");
    }
  };

  // Handle card updates
  const handleCardUpdate = async (cardId: string, updates: Partial<Card>) => {
    if (!currentStack) return;
    
    try {
      const cardIndex = currentStack.cards.findIndex(card => card.id === cardId);
      if (cardIndex === -1) return;

      const updatedCards = [...currentStack.cards];
      updatedCards[cardIndex] = {
        ...updatedCards[cardIndex],
        ...updates
      };

      // Update the stack in the store
      useStackStore.setState({
        currentStack: {
          ...currentStack,
          cards: updatedCards
        },
        isModified: true
      });
    } catch (error) {
      console.error("Error updating card:", error);
      toast.error("Failed to update card");
    }
  };

  if (!isWindowOpen) return null;

  return (
    <>
      <HyperCardMenuBar
        onClose={onClose}
        onShowHelp={() => setIsHelpDialogOpen(true)}
        onShowAbout={() => setIsAboutDialogOpen(true)}
        onNewStack={() => operations.newStack("Untitled Stack")}
        onOpenStack={handleOpenStack}
        onSaveStack={handleSaveStack}
        onSaveStackAs={handleSaveStackAs}
        onCloseStack={handleCloseStack}
        onNextCard={() => operations.navigateToNextCard()}
        onPreviousCard={() => operations.navigateToPreviousCard()}
        onAddCard={() => {
          if (currentStack) {
            const cardNumber = currentStack.cards.length + 1;
            operations.addCard(`Card ${cardNumber}`);
          }
        }}
        onDeleteCard={handleDeleteCard}
        hasUnsavedChanges={isModified}
        currentStackPath={currentFileExists ? currentStack?.path || null : null}
        canNavigateCards={!!currentStack && currentStack.cards.length > 1}
        isWindowOpen={isWindowOpen}
        isForeground={isForeground}
        onToggleBackground={operations.toggleBackgroundMode}
        isEditingBackground={isEditingBackground}
        isPropertyInspectorVisible={isPropertyInspectorVisible}
        onTogglePropertyInspector={() => setIsPropertyInspectorVisible(!isPropertyInspectorVisible)}
      />
      <WindowFrame
        title={
          currentStack
            ? `${currentStack.name}${isModified ? " •" : ""}`
            : "Untitled Stack"
        }
        onClose={onClose}
        isForeground={isForeground}
        appId="hypercard"
        skipInitialSound={skipInitialSound}
      >
        <div className="flex flex-col h-full w-full min-h-0 bg-[#c0c0c0]">
          {currentStack ? (
            <div className="flex-1 flex gap-2 p-2">
              {/* Tools Palette */}
              <div className="flex flex-col gap-2 w-[84px] shrink-0">
                <div className="bg-white border border-black w-full shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                  <div className="grid grid-cols-2 gap-0 p-1">
                    {TOOLS.map((tool: Tool) => (
                      <Button
                        key={tool.id}
                        variant="ghost"
                        className={cn(
                          "h-10 w-10 p-0 flex items-center justify-center bg-white border border-black hover:bg-gray-100 active:bg-gray-200",
                          selectedTool === tool.id && "bg-gray-200"
                        )}
                        onClick={() => setSelectedTool(tool.id)}
                        title={tool.name}
                      >
                        <span className="text-lg">{tool.icon}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="flex-1 flex items-center justify-center">
                {currentStack.cards[currentStack.currentCardIndex] && (
                  <CardComponent
                    card={currentStack.cards[currentStack.currentCardIndex]}
                    width={512}
                    height={342}
                    isActive={true}
                    isEditingBackground={isEditingBackground}
                    selectedTool={selectedTool}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center text-gray-500">
                No stack open
                <br />
                Choose New Stack or Open Stack from the File menu
              </div>
            </div>
          )}
        </div>
      </WindowFrame>

      {/* Property Inspector Dialog */}
      <PropertyInspectorDialog
        isOpen={isPropertyInspectorVisible}
        onOpenChange={setIsPropertyInspectorVisible}
        selection={inspectorSelection}
        currentStack={currentStack}
        currentCard={currentStack?.cards[currentStack.currentCardIndex] || null}
        isEditingBackground={isEditingBackground}
        onUpdateStack={handleStackUpdate}
        onUpdateCard={handleCardUpdate}
      />

      {/* Dialogs */}
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        helpItems={helpItems}
        appName="HyperCard"
      />
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onOpenChange={setIsAboutDialogOpen}
        metadata={appMetadata}
      />
      <InputDialog
        isOpen={isNewStackDialogOpen}
        onOpenChange={setIsNewStackDialogOpen}
        onSubmit={handleNewStackSubmit}
        title="New Stack"
        description="Enter a name for your new stack"
        value={newStackName}
        onChange={setNewStackName}
      />
      <InputDialog
        isOpen={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSubmit={handleSaveStackSubmit}
        title="Save Stack As"
        description="Enter a name for your stack"
        value={saveStackName}
        onChange={setSaveStackName}
      />
      <ConfirmDialog
        isOpen={isConfirmCloseDialogOpen}
        onOpenChange={setIsConfirmCloseDialogOpen}
        onConfirm={handleConfirmCloseStack}
        title="Close Stack"
        description="Are you sure you want to close this stack? Any unsaved changes will be lost."
      />
      <ConfirmDialog
        isOpen={isErrorDialogOpen}
        onOpenChange={setIsErrorDialogOpen}
        onConfirm={() => setIsErrorDialogOpen(false)}
        title="Error"
        description={errorDialogMessage}
      />
    </>
  );
}