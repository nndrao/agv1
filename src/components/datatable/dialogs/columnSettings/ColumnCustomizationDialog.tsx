import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ColumnSelectorPanel } from './panels/ColumnSelectorPanel';
import { PropertyEditorPanel } from './panels/PropertyEditorPanel';
import { BulkActionsPanel } from './panels/BulkActionsPanel';
import { ColDef } from 'ag-grid-community';
import { DialogState } from './types';
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
  // State Management
  const [state, setState] = useState<DialogState>({
    selectedColumns: new Set(),
    columnDefinitions: new Map(),
    pendingChanges: new Map(),
    bulkChanges: {},
    applyMode: 'override',
    activeTab: 'general',
    searchTerm: '',
    groupBy: 'none',
    showOnlyCommon: false,
    compareMode: false,
    undoStack: [],
    redoStack: []
  });

  // Initialize column definitions and reset state on close
  useEffect(() => {
    if (open && columnDefs.length > 0) {
      const columnMap = new Map<string, ColDef>();
      columnDefs.forEach(col => {
        const colId = col.field || col.colId || '';
        if (colId) {
          columnMap.set(colId, col);
        }
      });
      setState(prev => ({ ...prev, columnDefinitions: columnMap }));
    } else if (!open) {
      // Reset state when dialog closes to prevent memory leaks
      setState({
        selectedColumns: new Set(),
        columnDefinitions: new Map(),
        pendingChanges: new Map(),
        bulkChanges: {},
        applyMode: 'override',
        activeTab: 'general',
        searchTerm: '',
        groupBy: 'none',
        showOnlyCommon: false,
        compareMode: false,
        undoStack: [],
        redoStack: []
      });
    }
  }, [open, columnDefs]);

  const selectedCount = state.selectedColumns.size;
  const totalColumns = state.columnDefinitions.size;

  // Update bulk property
  const updateBulkProperty = useCallback((property: string, value: unknown) => {
    setState(prev => {
      const newBulkChanges = { ...prev.bulkChanges, [property]: value };
      
      // Apply to all selected columns
      const newPendingChanges = new Map(prev.pendingChanges);
      prev.selectedColumns.forEach(colId => {
        const existingChanges = newPendingChanges.get(colId) || {};
        if (prev.applyMode === 'override' || 
            prev.applyMode === 'merge' || 
            (prev.applyMode === 'empty' && !prev.columnDefinitions.get(colId)?.[property as keyof ColDef])) {
          newPendingChanges.set(colId, { ...existingChanges, [property]: value });
        }
      });
      
      return { ...prev, bulkChanges: newBulkChanges, pendingChanges: newPendingChanges };
    });
  }, []); // Dependencies handled within setState callback

  // Apply changes
  const handleApplyChanges = useCallback(() => {
    setState(prev => {
      const updatedColumns: ColDef[] = [];
      
      prev.columnDefinitions.forEach((colDef, colId) => {
        const changes = prev.pendingChanges.get(colId);
        if (changes) {
          updatedColumns.push({ ...colDef, ...changes });
        } else {
          updatedColumns.push(colDef);
        }
      });

      // Apply changes immediately
      onApply(updatedColumns);

      // Return updated state
      return {
        ...prev,
        undoStack: [...prev.undoStack, {
          timestamp: Date.now(),
          changes: new Map(prev.pendingChanges),
          description: `Updated ${prev.pendingChanges.size} columns`
        }],
        redoStack: [],
        pendingChanges: new Map()
      };
    });
  }, [onApply]);

  // Discard changes
  const handleDiscardChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingChanges: new Map(),
      bulkChanges: {}
    }));
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    if (state.undoStack.length === 0) return;
    
    const lastChange = state.undoStack[state.undoStack.length - 1];
    setState(prev => ({
      ...prev,
      undoStack: prev.undoStack.slice(0, -1),
      redoStack: [...prev.redoStack, lastChange],
      pendingChanges: new Map()
    }));
  }, [state.undoStack]);

  // Redo
  const handleRedo = useCallback(() => {
    if (state.redoStack.length === 0) return;
    
    const lastRedo = state.redoStack[state.redoStack.length - 1];
    setState(prev => ({
      ...prev,
      redoStack: prev.redoStack.slice(0, -1),
      undoStack: [...prev.undoStack, lastRedo],
      pendingChanges: lastRedo.changes
    }));
  }, [state.redoStack]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 flex flex-col bg-background">
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
            <ColumnSelectorPanel 
              state={state}
              setState={setState}
            />
          </div>

          {/* Property Editor Panel */}
          <div className="flex-1 overflow-hidden flex flex-col min-w-0">
            <PropertyEditorPanel 
              state={state}
              updateBulkProperty={updateBulkProperty}
              setState={setState}
            />
          </div>

          {/* Bulk Actions Panel */}
          <div className="w-[280px] border-l bg-muted/30 overflow-hidden flex flex-col">
            <BulkActionsPanel 
              state={state}
              setState={setState}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={state.undoStack.length === 0}
              className="gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={state.redoStack.length === 0}
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