import React, { useCallback, useEffect, memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ColumnSelectorPanel } from './panels/ColumnSelectorPanel';
import { PropertyEditorPanel } from './panels/PropertyEditorPanel';
import { BulkActionsPanel } from './panels/BulkActionsPanel';
import { ColDef, ColumnState } from 'ag-grid-community';
import { useColumnCustomizationStore } from './store/column-customization.store';
import { Undo2, Redo2, Settings2, Volume2, VolumeX, Columns, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useButtonFeedback, useProgressIndicator } from './utils/feedback';
import { useSoundPreference } from './hooks/useSoundPreference';
import './column-customization-dialog.css';

interface ColumnCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnDefs: ColDef[];
  columnState?: ColumnState[]; // AG-Grid column state
  onApply: (updatedColumns: ColDef[]) => void;
}

export const ColumnCustomizationDialog: React.FC<ColumnCustomizationDialogProps> = memo(({
  open,
  onOpenChange,
  columnDefs,
  columnState,
  onApply
}) => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    bulkActionsPanelCollapsed,
    setOpen,
    setColumnDefinitions,
    setColumnState,
    applyChanges,
    resetChanges,
    uiMode,
    setUiMode,
    showColumnDrawer,
    setShowColumnDrawer,
    showPreviewPane,
    setShowPreviewPane
  } = useColumnCustomizationStore();
  const { toast } = useToast();
  const { soundEnabled, toggleSound } = useSoundPreference();
  const { buttonRef: applyCloseButtonRef, triggerFeedback } = useButtonFeedback();
  const { progressRef, showProgress, hideProgress } = useProgressIndicator();
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize column definitions when dialog opens
  useEffect(() => {
    if (open) {
      // Only update if columnDefs have actually changed
      const needsUpdate = columnDefs.length !== columnDefinitions.size ||
        columnDefs.some(col => {
          const colId = col.field || col.colId || '';
          const existing = columnDefinitions.get(colId);
          return !existing || existing !== col;
        });
      
      if (needsUpdate && columnDefs.length > 0) {
        const columnMap = new Map<string, ColDef>();
        columnDefs.forEach(col => {
          const colId = col.field || col.colId || '';
          if (colId) {
            columnMap.set(colId, col);
          }
        });
        setColumnDefinitions(columnMap);
      }
      
      // Also set column state if provided
      if (columnState) {
        console.log('[ColumnCustomizationDialog] Setting column state:', {
          columnStateLength: columnState.length,
          sampleState: columnState.slice(0, 3).map(cs => ({
            colId: cs.colId,
            hide: cs.hide,
            width: cs.width
          }))
        });
        setColumnState(columnState);
      } else {
        console.log('[ColumnCustomizationDialog] No column state provided');
      }
    }
    setOpen(open);
  }, [open, columnDefs, columnState, columnDefinitions.size, setColumnDefinitions, setColumnState, setOpen]);

  const selectedCount = selectedColumns.size;
  const totalColumns = columnDefinitions.size;

  // Apply changes
  const handleApplyChanges = useCallback(() => {
    console.log('[ColumnCustomizationDialog] handleApplyChanges called');
    // Use requestAnimationFrame for smooth UI updates
    requestAnimationFrame(() => {
      const updatedColumns = applyChanges();
      console.log('[ColumnCustomizationDialog] Columns after applyChanges:', {
        count: updatedColumns.length,
        hasCustomizations: updatedColumns.some(col => 
          col.cellStyle || col.valueFormatter || col.cellClass
        )
      });
      onApply(updatedColumns);
    });
  }, [applyChanges, onApply]);

  // Apply and close in a single operation
  const handleApplyAndClose = useCallback(() => {
    console.log('[ColumnCustomizationDialog] handleApplyAndClose called');
    
    // Use requestAnimationFrame to defer UI updates
    requestAnimationFrame(() => {
      // Show processing state
      setIsProcessing(true);
      showProgress();
      
      // Apply changes immediately
      const updatedColumns = applyChanges();
      console.log('[ColumnCustomizationDialog] Columns after applyChanges:', {
        count: updatedColumns.length,
        hasCustomizations: updatedColumns.some(col => 
          col.cellStyle || col.valueFormatter || col.cellClass
        )
      });
      
      // Count customizations once
      const customizationCount = updatedColumns.filter(col => 
        col.cellStyle || col.headerStyle || col.valueFormatter || col.cellClass || col.headerClass
      ).length;
      
      // Apply changes to grid immediately
      onApply(updatedColumns);
      
      // Close dialog immediately for perceived performance
      onOpenChange(false);
      
      // Defer non-critical operations
      requestAnimationFrame(() => {
        // Hide processing state
        hideProgress();
        setIsProcessing(false);
        
        // Defer feedback to next tick
        Promise.resolve().then(() => {
          // Trigger feedback asynchronously
          triggerFeedback({
            sound: soundEnabled,
            haptic: true,
            visual: true
          });
          
          // Show toast if customizations were applied
          if (customizationCount > 0) {
            toast({
              title: 'Column customizations applied',
              description: `Updated ${customizationCount} column${customizationCount !== 1 ? 's' : ''} with custom styles and formatting`,
            });
          }
        });
        
        // Use aria-live region instead of creating/removing elements
        const announcement = customizationCount > 0 
          ? `Success! Applied customizations to ${customizationCount} column${customizationCount !== 1 ? 's' : ''}`
          : 'Settings applied successfully';
        
        // Announce to screen readers using existing aria-live region
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
          liveRegion.textContent = announcement;
          // Clear after announcement
          setTimeout(() => { liveRegion.textContent = ''; }, 3000);
        }
      });
    });
  }, [applyChanges, onApply, onOpenChange, toast, soundEnabled, triggerFeedback, showProgress, hideProgress]);

  // Discard changes
  const handleDiscardChanges = useCallback(() => {
    const changeCount = Array.from(pendingChanges.values()).reduce((acc, changes) => acc + Object.keys(changes).length, 0);
    resetChanges();
    toast({
      title: 'Changes discarded',
      description: `${changeCount} pending change${changeCount !== 1 ? 's' : ''} discarded`,
    });
  }, [resetChanges, pendingChanges, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="column-dialog-content max-w-[90vw] w-[1100px] h-[80vh] p-0 flex flex-col bg-background fade-in">
        {/* Clean, Professional Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Settings2 className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-lg font-semibold">
                  Column Settings
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Configure column properties, styling, and behavior for the data grid
                </DialogDescription>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="modern-badge text-xs px-2 py-0.5">
                    {selectedCount} selected
                  </Badge>
                  <Badge variant="outline" className="modern-badge text-xs px-2 py-0.5">
                    {totalColumns} total
                  </Badge>
                  {pendingChanges.size > 0 && (
                    <Badge variant="default" className="modern-badge text-xs px-2 py-0.5">
                      {Array.from(pendingChanges.values()).reduce((acc, changes) => acc + Object.keys(changes).length, 0)} changes
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* UI Controls */}
            <div className="flex items-center gap-4">
              {/* UI Mode Toggle */}
              <div className="flex items-center gap-2">
                <Label htmlFor="ui-mode" className="text-xs text-muted-foreground">
                  Simple
                </Label>
                <Switch
                  id="ui-mode"
                  checked={uiMode === 'advanced'}
                  onCheckedChange={(checked) => setUiMode(checked ? 'advanced' : 'simple')}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="ui-mode" className="text-xs text-muted-foreground">
                  Advanced
                </Label>
              </div>
              
              {/* Preview Pane Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreviewPane(!showPreviewPane)}
                className="h-8 px-2"
                title={showPreviewPane ? 'Hide preview' : 'Show preview'}
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              {/* Sound toggle button */}
              <button
                onClick={toggleSound}
                className={`sound-toggle ${soundEnabled ? 'sound-enabled' : ''}`}
                aria-label={soundEnabled ? 'Disable sound feedback' : 'Enable sound feedback'}
                title={soundEnabled ? 'Sound feedback enabled' : 'Sound feedback disabled'}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Clean Body Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Column Selector - Mobile Drawer or Desktop Panel */}
          {showColumnDrawer ? (
            <>
              {/* Mobile-style column selector button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColumnDrawer(true)}
                className="fixed left-4 bottom-20 z-50 h-10 px-3 shadow-lg bg-background border"
              >
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
              <Sheet open={showColumnDrawer} onOpenChange={setShowColumnDrawer}>
                <SheetContent side="left" className="w-[300px] p-0">
                  <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle>Select Columns</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden">
                    <ColumnSelectorPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <div className="w-[260px] border-r bg-muted/30 overflow-hidden flex flex-col">
              <ColumnSelectorPanel />
            </div>
          )}

          {/* Property Editor Panel - With Preview Pane */}
          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 overflow-hidden flex flex-col min-w-0 bg-background ${showPreviewPane ? 'border-r' : ''}`}>
              <PropertyEditorPanel uiMode={uiMode} />
            </div>
            
            {/* Preview Pane */}
            {showPreviewPane && (
              <div className="w-[300px] bg-muted/10 overflow-hidden flex flex-col p-4">
                <h3 className="text-sm font-semibold mb-3">Live Preview</h3>
                <div className="flex-1 overflow-auto">
                  <div className="space-y-3">
                    {/* Preview content will be implemented later */}
                    <div className="text-xs text-muted-foreground">
                      Preview of changes will appear here
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions Panel - Contextual */}
          {selectedColumns.size > 0 && !bulkActionsPanelCollapsed && (
            <div className="w-[260px] border-l bg-muted/30 overflow-hidden flex flex-col">
              <BulkActionsPanel />
            </div>
          )}
        </div>

        {/* Professional Footer */}
        <DialogFooter className="px-6 py-3 border-t flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={true}
              className="modern-button h-8 px-3 gap-1.5 text-muted-foreground"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="text-sm">Undo</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={true}
              className="modern-button h-8 px-3 gap-1.5 text-muted-foreground"
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span className="text-sm">Redo</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardChanges}
              className="modern-button h-8 px-4 text-sm"
            >
              Reset
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleApplyChanges}
              className="modern-button h-8 px-4 text-sm"
            >
              Apply
            </Button>
            <div className="relative">
              <Button
                ref={applyCloseButtonRef}
                variant="default"
                size="sm"
                onClick={handleApplyAndClose}
                disabled={isProcessing}
                className="modern-button h-8 px-4 text-sm relative overflow-visible"
              >
                {isProcessing ? 'Applying...' : 'Apply & Close'}
              </Button>
              <div ref={progressRef} className="progress-indicator" />
            </div>
          </div>
        </DialogFooter>
      {/* Aria live region for screen reader announcements */}
      <div id="aria-live-region" className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
      </DialogContent>
    </Dialog>
  );
});

ColumnCustomizationDialog.displayName = 'ColumnCustomizationDialog';