import React, { useCallback, useEffect, memo, useState, useMemo } from 'react';
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
import { Undo2, Redo2, Settings2, Columns, ChevronLeft, ChevronRight, Zap, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useButtonFeedback, useProgressIndicator } from './utils/feedback';
import { cn } from '@/lib/utils';

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
    setOpen,
    setColumnDefinitions,
    setColumnState,
    applyChanges,
    resetChanges,
    clearAllCustomizations,
    showColumnDrawer,
    setShowColumnDrawer,
    bulkActionsPanelCollapsed,
    setBulkActionsPanelCollapsed
  } = useColumnCustomizationStore();
  const { toast } = useToast();
  const { buttonRef: applyCloseButtonRef, triggerFeedback } = useButtonFeedback();
  const { progressRef, showProgress, hideProgress } = useProgressIndicator();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearAllConfirmation, setShowClearAllConfirmation] = useState(false);

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

  // Check if there are any customizations to clear
  const hasAnyCustomizations = useMemo(() => {
    const customizationProperties = [
      'cellStyle', 'headerStyle', 'cellClass', 'headerClass',
      'valueFormatter', 'filter', 'filterParams',
      'cellEditor', 'cellEditorParams',
      'width', 'minWidth', 'maxWidth', 'pinned', 'lockPosition', 'lockVisible'
    ];
    
    for (const column of columnDefinitions.values()) {
      for (const prop of customizationProperties) {
        const value = (column as any)[prop];
        if (value !== undefined && value !== null && value !== false && value !== '') {
          return true;
        }
      }
    }
    
    // Also check for applied templates
    return false;
  }, [columnDefinitions]);

  // Count customized columns for confirmation dialog
  const customizedColumnsCount = useMemo(() => {
    const customizationProperties = [
      'cellStyle', 'headerStyle', 'cellClass', 'headerClass',
      'valueFormatter', 'filter', 'filterParams',
      'cellEditor', 'cellEditorParams',
      'width', 'minWidth', 'maxWidth', 'pinned', 'lockPosition', 'lockVisible'
    ];
    
    let count = 0;
    for (const column of columnDefinitions.values()) {
      let hasCustomizations = false;
      for (const prop of customizationProperties) {
        const value = (column as any)[prop];
        if (value !== undefined && value !== null && value !== false && value !== '') {
          hasCustomizations = true;
          break;
        }
      }
      if (hasCustomizations) count++;
    }
    
    return count;
  }, [columnDefinitions]);

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
  }, [applyChanges, onApply, onOpenChange, toast, triggerFeedback, showProgress, hideProgress]);

  // Discard changes
  const handleDiscardChanges = useCallback(() => {
    const changeCount = Array.from(pendingChanges.values()).reduce((acc, changes) => acc + Object.keys(changes).length, 0);
    resetChanges();
    toast({
      title: 'Changes discarded',
      description: `${changeCount} pending change${changeCount !== 1 ? 's' : ''} discarded`,
    });
  }, [resetChanges, pendingChanges, toast]);

  // Clear all customizations
  const handleClearAllCustomizations = useCallback(() => {
    setShowClearAllConfirmation(true);
  }, []);

  // Confirm clear all customizations
  const handleConfirmClearAll = useCallback(() => {
    const clearedCount = clearAllCustomizations();
    setShowClearAllConfirmation(false);
    toast({
      title: 'All columns cleared',
      description: `Removed customizations from ${clearedCount} column${clearedCount !== 1 ? 's' : ''}`,
    });
  }, [clearAllCustomizations, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[1100px] h-[80vh] p-0 flex flex-col bg-background overflow-hidden">
        {/* Clean, Professional Header */}
        <DialogHeader className="px-6 py-4 border-b bg-card/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                <Settings2 className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-lg font-semibold leading-none">
                  Column Settings
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Configure column properties, styling, and behavior for the data grid
                </DialogDescription>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {selectedCount} selected
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {totalColumns} total
                  </Badge>
                  {pendingChanges.size > 0 && (
                    <Badge variant="default" className="text-xs px-2 py-0.5">
                      {Array.from(pendingChanges.values()).reduce((acc, changes) => acc + Object.keys(changes).length, 0)} changes
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Clean Body Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative bg-background">
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

          {/* Property Editor Panel */}
          <div className="flex-1 overflow-hidden flex flex-col min-w-0">
            <PropertyEditorPanel uiMode="advanced" />
          </div>

          {/* Quick Actions Panel - Collapsible */}
          {selectedColumns.size > 0 && (
            <>
              {/* Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBulkActionsPanelCollapsed(!bulkActionsPanelCollapsed)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-20 h-16 w-6 px-0 py-2 rounded-l-md rounded-r-none border border-r-0 bg-background hover:bg-muted/50 shadow-sm transition-all duration-300",
                  bulkActionsPanelCollapsed ? "right-4" : "right-[336px]"
                )}
                title={bulkActionsPanelCollapsed ? "Show Quick Actions" : "Hide Quick Actions"}
              >
                {bulkActionsPanelCollapsed ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              
              {/* Collapsible Panel */}
              <div className={cn(
                "w-[320px] border-l bg-muted/30 overflow-hidden flex flex-col transition-all duration-300 mr-4",
                bulkActionsPanelCollapsed ? "w-0 mr-0" : "w-[320px] mr-4"
              )}>
                <div className="px-4 py-3 border-b bg-card/50">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Quick Actions</span>
                  </div>
                </div>
                <BulkActionsPanel />
              </div>
            </>
          )}
        </div>

        {/* Professional Footer */}
        <DialogFooter className="px-6 py-3 border-t flex items-center justify-between bg-card/50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={true}
              className="h-8 px-3 gap-1.5 text-muted-foreground"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="text-sm">Undo</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={true}
              className="h-8 px-3 gap-1.5 text-muted-foreground"
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span className="text-sm">Redo</span>
            </Button>
            
            {/* Clear All Customizations Button */}
            <div className="h-4 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllCustomizations}
              disabled={!hasAnyCustomizations}
              className="h-8 px-3 gap-1.5 font-bold text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:text-muted-foreground disabled:hover:text-muted-foreground disabled:hover:bg-transparent disabled:font-normal"
              title={hasAnyCustomizations ? "Remove all customizations from all columns" : "No customizations to clear"}
              style={{ color: hasAnyCustomizations ? 'tomato' : undefined }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="text-sm">Clear All Columns</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardChanges}
              className="h-8 px-4 text-sm"
              disabled={isProcessing}
            >
              Reset
            </Button>
            <div className="relative">
              <Button
                ref={applyCloseButtonRef}
                variant="default"
                size="sm"
                onClick={handleApplyAndClose}
                disabled={isProcessing}
                className="h-8 px-6 text-sm relative overflow-visible min-w-[120px]"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Applying...</span>
                  </div>
                ) : (
                  'Apply & Close'
                )}
              </Button>
              <div 
                ref={progressRef} 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent overflow-hidden transition-opacity duration-300"
                style={{ opacity: 0 }}
              >
                <div className="h-full w-full bg-primary animate-[slide_1.5s_ease-in-out_infinite]" 
                     style={{ 
                       background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.8), transparent)',
                       transform: 'translateX(-100%)'
                     }} 
                />
              </div>
            </div>
          </div>
        </DialogFooter>
        
        {/* Aria live region for screen reader announcements */}
        <div id="aria-live-region" className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
      </DialogContent>
      
      {/* Clear All Customizations Confirmation Dialog */}
      <Dialog open={showClearAllConfirmation} onOpenChange={setShowClearAllConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Clear All Columns
            </DialogTitle>
            <DialogDescription>
              This will remove all customizations from {customizedColumnsCount} column{customizedColumnsCount !== 1 ? 's' : ''}, including:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Cell and header styling</li>
                <li>Value formatters</li>
                <li>Filters and editors</li>
                <li>Column sizing and positioning</li>
                <li>Applied templates</li>
              </ul>
              <p className="mt-3 font-medium">This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearAllConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmClearAll}
            >
              Clear All Columns
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
});

ColumnCustomizationDialog.displayName = 'ColumnCustomizationDialog';