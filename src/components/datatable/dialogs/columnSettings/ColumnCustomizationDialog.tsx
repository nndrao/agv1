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
    resetChanges
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
    }
    setOpen(open);
  }, [open, columnDefs, setColumnDefinitions, setOpen]);

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
      <DialogContent className="max-w-[95vw] w-[1100px] h-[80vh] p-0 flex flex-col bg-background/95 backdrop-blur-sm border-0 shadow-2xl">
        {/* Compact Header */}
        <DialogHeader className="px-4 py-3 border-b border-border/50 shrink-0 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Settings2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Column Settings
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Configure column properties, styling, and behavior for the data grid
                </DialogDescription>
                <div className="flex items-center gap-2 mt-0.5">
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

        {/* Compact Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Column Selector Panel */}
          <div className="w-[260px] border-r border-border/50 bg-muted/10 overflow-hidden flex flex-col">
            <ColumnSelectorPanel />
          </div>

          {/* Property Editor Panel */}
          <div className="flex-1 overflow-hidden flex flex-col min-w-0 bg-background/50">
            <PropertyEditorPanel />
          </div>

          {/* Bulk Actions Panel */}
          {!bulkActionsPanelCollapsed && (
            <div className="w-[260px] border-l border-border/50 bg-muted/10 overflow-hidden flex flex-col">
              <BulkActionsPanel />
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <DialogFooter className="px-4 py-3 border-t border-border/50 flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={true} className="h-8 px-3 gap-1.5">
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </Button>
            <Button variant="ghost" size="sm" disabled={true} className="h-8 px-3 gap-1.5">
              <Redo2 className="h-3.5 w-3.5" />
              Redo
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDiscardChanges} className="h-8 px-3">
              Reset
            </Button>
            <Button variant="default" size="sm" onClick={handleApplyChanges} className="h-8 px-3">
              Apply
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => {
                handleApplyChanges();
                onOpenChange(false);
              }}
              className="h-8 px-3"
            >
              Apply & Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};