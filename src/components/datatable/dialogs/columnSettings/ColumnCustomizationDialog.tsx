import React, { useCallback, useEffect } from 'react';
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

export const ColumnCustomizationDialog: React.FC<ColumnCustomizationDialogProps> = ({
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
    if (open && columnDefs.length > 0) {
      const columnMap = new Map<string, ColDef>();
      columnDefs.forEach(col => {
        const colId = col.field || col.colId || '';
        if (colId) {
          columnMap.set(colId, col);
        }
      });
      setColumnDefinitions(columnMap);
      setOnImmediateApply(onApply);
    }
    setOpen(open);
    
    // Cleanup on unmount
    return () => {
      if (!open) {
        setOnImmediateApply(undefined);
      }
    };
  }, [open, columnDefs, setColumnDefinitions, setOpen, setOnImmediateApply, onApply]);

  const selectedCount = selectedColumns.size;
  const totalColumns = columnDefinitions.size;

  // Apply changes
  const handleApplyChanges = useCallback(() => {
    const updatedColumns = applyChanges();
    onApply(updatedColumns);
  }, [applyChanges, onApply]);

  // Discard changes
  const handleDiscardChanges = useCallback(() => {
    resetChanges();
  }, [resetChanges]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="column-dialog-content max-w-[92vw] w-[1000px] h-[75vh] p-0 flex flex-col bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-md border border-border/20 shadow-2xl rounded-xl overflow-hidden fade-in">
        {/* Modern Header with Gradient */}
        <DialogHeader className="px-5 py-4 border-b border-border/30 shrink-0 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-sm">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-semibold text-foreground tracking-tight">
                  Column Settings
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Configure column properties, styling, and behavior for the data grid
                </DialogDescription>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="modern-badge text-xs px-2.5 py-1 font-medium rounded-md bg-secondary/80 border border-secondary/40">
                    {selectedCount} selected
                  </Badge>
                  <Badge variant="outline" className="modern-badge text-xs px-2.5 py-1 font-medium rounded-md border-border/60">
                    {totalColumns} total
                  </Badge>
                  {pendingChanges.size > 0 && (
                    <Badge variant="default" className="modern-badge text-xs px-2.5 py-1 font-medium rounded-md bg-gradient-to-r from-primary to-primary/90 shadow-sm">
                      {Array.from(pendingChanges.values()).reduce((acc, changes) => acc + Object.keys(changes).length, 0)} changes
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Modern Body Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-gradient-to-b from-background/50 to-background">
          {/* Column Selector Panel - Enhanced */}
          <div className="w-[240px] border-r border-border/40 bg-gradient-to-b from-muted/20 to-muted/10 overflow-hidden flex flex-col backdrop-blur-sm">
            <ColumnSelectorPanel />
          </div>

          {/* Property Editor Panel - Enhanced */}
          <div className="flex-1 overflow-hidden flex flex-col min-w-0 bg-gradient-to-b from-background/80 to-background/60 backdrop-blur-sm">
            <PropertyEditorPanel />
          </div>

          {/* Bulk Actions Panel - Enhanced */}
          {!bulkActionsPanelCollapsed && (
            <div className="w-[240px] border-l border-border/40 bg-gradient-to-b from-muted/20 to-muted/10 overflow-hidden flex flex-col backdrop-blur-sm">
              <BulkActionsPanel />
            </div>
          )}
        </div>

        {/* Modern Professional Footer */}
        <DialogFooter className="px-5 py-4 border-t border-border/30 flex items-center justify-between shrink-0 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/10 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={true}
              className="modern-button modern-focus h-9 px-3 gap-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
              <Undo2 className="h-4 w-4" />
              <span className="text-sm font-medium">Undo</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={true}
              className="modern-button modern-focus h-9 px-3 gap-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
              <Redo2 className="h-4 w-4" />
              <span className="text-sm font-medium">Redo</span>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardChanges}
              className="modern-button modern-focus h-9 px-4 text-sm font-medium rounded-lg border-border/60 hover:border-border hover:bg-muted/50 transition-all duration-200"
            >
              Reset
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleApplyChanges}
              className="modern-button modern-focus h-9 px-4 text-sm font-medium rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm transition-all duration-200"
            >
              Apply
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                handleApplyChanges();
                onOpenChange(false);
              }}
              className="modern-button modern-focus h-9 px-4 text-sm font-medium rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm transition-all duration-200"
            >
              Apply & Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};