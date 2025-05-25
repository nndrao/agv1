import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useColumnCustomizationStore } from './store/column-customization.store';
import { ColumnSelectorPanel } from './panels/ColumnSelectorPanel';
import { PropertyEditorPanel } from './panels/PropertyEditorPanel';
import { BulkActionsPanel } from './panels/BulkActionsPanel';
import { GridApi } from 'ag-grid-community';
import { Undo2, Redo2, Eye } from 'lucide-react';
import { useColumnCustomization } from './hooks/useColumnCustomization';

interface ColumnCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gridApi: GridApi;
  onColumnDefsChange?: (columnDefs: any[]) => void;
}

export const ColumnCustomizationDialog: React.FC<ColumnCustomizationDialogProps> = ({
  open,
  onOpenChange,
  gridApi,
  onColumnDefsChange
}) => {
  const { applyChanges } = useColumnCustomization(gridApi, onColumnDefsChange);
  const {
    selectedColumns,
    discardChanges,
    undo,
    redo,
    undoStack,
    redoStack,
    setColumnDefinitions,
    pendingChanges
  } = useColumnCustomizationStore();

  // Initialize column definitions when dialog opens
  useEffect(() => {
    if (open && gridApi) {
      const columnDefs = new Map();
      const currentColumnDefs = gridApi.getColumnDefs() || [];
      
      currentColumnDefs.forEach(colDef => {
        const colId = colDef.field || colDef.colId || '';
        columnDefs.set(colId, { ...colDef });
      });

      setColumnDefinitions(columnDefs);
    }
  }, [open, gridApi, setColumnDefinitions]);

  const selectedCount = selectedColumns.size;
  const totalColumns = gridApi ? (gridApi.getColumnDefs() || []).length : 0;
  const hasChanges = pendingChanges.size > 0;

  const handleApply = () => {
    applyChanges();
    
    // Apply the updated column definitions to AG-Grid
    if (gridApi && onColumnDefsChange) {
      const updatedColumnDefs = Array.from(columnDefinitions.values());
      onColumnDefsChange(updatedColumnDefs);
    }
  };

  const handleApplyAndClose = () => {
    handleApply();
    onOpenChange(false);
  };

  const handlePreview = () => {
    // TODO: Implement preview functionality
    console.log('Preview changes:', pendingChanges);
  };

  const handleClose = () => {
    if (hasChanges) {
      // TODO: Show confirmation dialog
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    discardChanges();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] w-[1400px] h-[85vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Column Customization - {selectedCount} of {totalColumns} columns selected
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column Selector Panel */}
          <div className="w-[280px] border-r bg-muted/50">
            <ColumnSelectorPanel gridApi={gridApi} />
          </div>

          {/* Property Editor Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            <PropertyEditorPanel />
          </div>

          {/* Bulk Actions Panel */}
          <div className="w-[280px] border-l bg-muted/50">
            <BulkActionsPanel />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={undoStack.length === 0}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={redoStack.length === 0}
            >
              <Redo2 className="h-4 w-4 mr-1" />
              Redo
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePreview}
              disabled={!hasChanges}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={discardChanges}
              disabled={!hasChanges}
            >
              Reset
            </Button>
            <Button 
              variant="default" 
              onClick={handleApply}
              disabled={!hasChanges}
            >
              Apply
            </Button>
            <Button 
              variant="default" 
              onClick={handleApplyAndClose}
              disabled={!hasChanges}
            >
              Apply & Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};