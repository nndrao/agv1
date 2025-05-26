import React, { useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ColumnSelectorPanel } from './panels/ColumnSelectorPanel';
import { PropertyEditorPanel } from './panels/PropertyEditorPanel';
import { BulkActionsPanel } from './panels/BulkActionsPanel';
import { ColDef } from 'ag-grid-community';
import { useColumnCustomizationStore } from './store/column-customization.store';
import { Undo2, Redo2, Eye } from 'lucide-react';

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
      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] p-0 flex flex-col bg-background">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Column Customization - {selectedCount} of {totalColumns} columns selected
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Column Selector Panel */}
          <div className="w-[280px] border-r bg-muted/30 overflow-hidden flex flex-col">
            <ColumnSelectorPanel />
          </div>

          {/* Property Editor Panel */}
          <div className="flex-1 overflow-hidden flex flex-col min-w-0">
            <PropertyEditorPanel />
          </div>

          {/* Bulk Actions Panel */}
          {!bulkActionsPanelCollapsed && (
            <div className="w-[280px] border-l bg-muted/30 overflow-hidden flex flex-col">
              <BulkActionsPanel />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={true}
              className="gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={true}
              className="gap-2"
            >
              <Redo2 className="h-4 w-4" />
              Redo
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDiscardChanges}>
              Reset
            </Button>
            <Button variant="default" onClick={handleApplyChanges}>
              Apply
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                handleApplyChanges();
                onOpenChange(false);
              }}
            >
              Apply & Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};