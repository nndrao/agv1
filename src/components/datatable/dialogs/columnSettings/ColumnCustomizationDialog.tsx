import React, { useCallback, useEffect, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColumnSelectorPanel } from './panels/ColumnSelectorPanel';
import { PropertyEditorPanel } from './panels/PropertyEditorPanel';
import { BulkActionsPanel } from './panels/BulkActionsPanel';
import { ColDef } from 'ag-grid-community';
import { useColumnCustomizationStore } from './store/column-customization.store';
import { Undo2, Redo2, Settings2 } from 'lucide-react';
import './column-customization-dialog.css';

interface ColumnCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnDefs: ColDef[];
  onApply: (updatedColumns: ColDef[]) => void;
}

export const ColumnCustomizationDialog: React.FC<ColumnCustomizationDialogProps> = memo(({
  open,
  onOpenChange,
  columnDefs,
  onApply
}) => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    bulkActionsPanelCollapsed,
    setOpen,
    setColumnDefinitions,
    applyChanges,
    resetChanges,
    setOnImmediateApply
  } = useColumnCustomizationStore();

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
      
      setOnImmediateApply(onApply);
    }
    setOpen(open);
    
    // Cleanup on unmount
    return () => {
      if (!open) {
        setOnImmediateApply(undefined);
      }
    };
  }, [open, columnDefs, columnDefinitions.size, setColumnDefinitions, setOpen, setOnImmediateApply, onApply]);

  const selectedCount = selectedColumns.size;
  const totalColumns = columnDefinitions.size;

  // Apply changes
  const handleApplyChanges = useCallback(() => {
    const updatedColumns = applyChanges();
    onApply(updatedColumns);
  }, [applyChanges, onApply]);

  // Apply and close in a single operation
  const handleApplyAndClose = useCallback(() => {
    const updatedColumns = applyChanges();
    onApply(updatedColumns);
    onOpenChange(false);
  }, [applyChanges, onApply, onOpenChange]);

  // Discard changes
  const handleDiscardChanges = useCallback(() => {
    resetChanges();
  }, [resetChanges]);

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
          </div>
        </DialogHeader>

        {/* Clean Body Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Column Selector Panel */}
          <div className="w-[260px] border-r bg-muted/30 overflow-hidden flex flex-col">
            <ColumnSelectorPanel />
          </div>

          {/* Property Editor Panel */}
          <div className="flex-1 overflow-hidden flex flex-col min-w-0 bg-background">
            <PropertyEditorPanel />
          </div>

          {/* Bulk Actions Panel */}
          {!bulkActionsPanelCollapsed && (
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
            <Button
              variant="default"
              size="sm"
              onClick={handleApplyAndClose}
              className="modern-button h-8 px-4 text-sm"
            >
              Apply & Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ColumnCustomizationDialog.displayName = 'ColumnCustomizationDialog';