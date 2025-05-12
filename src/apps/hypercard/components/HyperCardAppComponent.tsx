import React, { useState } from "react";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { AppProps } from "../../base/types";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { helpItems, appMetadata } from "..";
import { HyperCardMenuBar } from "./HyperCardMenuBar";

export function HyperCardAppComponent({
  onClose,
  isWindowOpen,
  isForeground = true,
  skipInitialSound,
  helpItems: propHelpItems,
}: AppProps) {
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentStackPath, setCurrentStackPath] = useState<string | null>(null);

  const handleNewStack = () => {
    if (hasUnsavedChanges) {
      setIsUnsavedChangesDialogOpen(true);
      return;
    }
    // TODO: Implement new stack
    setCurrentStackPath(null);
    setHasUnsavedChanges(false);
  };

  const handleOpenStack = () => {
    if (hasUnsavedChanges) {
      setIsUnsavedChangesDialogOpen(true);
      return;
    }
    // TODO: Implement open stack
  };

  const handleSaveStack = () => {
    if (!currentStackPath) {
      // TODO: Implement save as
      return;
    }
    // TODO: Implement save
    setHasUnsavedChanges(false);
  };

  return (
    <>
      <HyperCardMenuBar
        isWindowOpen={isWindowOpen}
        isForeground={isForeground}
        onClose={onClose}
        onShowHelp={() => setIsHelpDialogOpen(true)}
        onShowAbout={() => setIsAboutDialogOpen(true)}
        onNewStack={handleNewStack}
        onOpenStack={handleOpenStack}
        onSaveStack={handleSaveStack}
        hasUnsavedChanges={hasUnsavedChanges}
        currentStackPath={currentStackPath}
      />

      <WindowFrame
        title="HyperCard"
        onClose={onClose}
        isForeground={isForeground}
        appId="hypercard"
        skipInitialSound={skipInitialSound}
      >
        <div className="flex-1 bg-white p-4 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">HyperCard</h1>
            <p className="text-gray-600">Coming Soon</p>
          </div>
        </div>
      </WindowFrame>

      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        helpItems={propHelpItems || helpItems}
        appName="HyperCard"
      />

      <AboutDialog
        isOpen={isAboutDialogOpen}
        onOpenChange={setIsAboutDialogOpen}
        metadata={appMetadata}
      />

      <ConfirmDialog
        isOpen={isUnsavedChangesDialogOpen}
        onOpenChange={setIsUnsavedChangesDialogOpen}
        onConfirm={() => {
          handleSaveStack();
          setIsUnsavedChangesDialogOpen(false);
        }}
        title="Unsaved Changes"
        description="Do you want to save your changes before closing?"
      />
    </>
  );
} 