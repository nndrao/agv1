import React, { useEffect, memo } from 'react';
import { ColDef, ColumnState } from 'ag-grid-community';
import { useColumnFormattingStore } from './store/columnFormatting.store';
import { FloatingRibbonUIInstance } from './FloatingRibbonUIInstance';

interface ColumnFormattingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnDefs: ColDef[];
  columnState?: ColumnState[]; // AG-Grid column state
  onApply: (updatedColumns: ColDef[]) => void;
}

export const ColumnFormattingDialogInstance: React.FC<ColumnFormattingDialogProps> = memo(({
  open,
  onOpenChange,
  columnDefs,
  columnState,
  onApply
}) => {
  const {
    columnDefinitions,
    setOpen,
    setColumnDefinitions,
    setColumnState,
  } = useColumnFormattingStore();

  // Initialize column definitions when dialog opens
  useEffect(() => {
    // Only process when dialog is opening, not on every prop change
    if (open && !useColumnFormattingStore.getState().open) {
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
            // Clean the column definition to remove state properties
            const cleanCol = { ...col };
            // Remove state properties that should never be in column definitions
            const stateProperties = [
              'width', 'actualWidth', 'hide', 'pinned', 'sort', 'sortIndex',
              'flex', 'rowGroup', 'rowGroupIndex', 'pivot', 'pivotIndex',
              'aggFunc', 'sortedAt'
            ];
            stateProperties.forEach(prop => {
              delete (cleanCol as any)[prop];
            });
            columnMap.set(colId, cleanCol);
          }
        });
        
        console.log('[ColumnFormattingDialogInstance] Setting column definitions:', {
          count: columnMap.size,
          columns: Array.from(columnMap.keys())
        });
        
        setColumnDefinitions(columnMap);
      }
      
      // Set column state if provided
      if (columnState && columnState.length > 0) {
        console.log('[ColumnFormattingDialogInstance] Setting column state:', {
          stateLength: columnState.length,
          hiddenColumns: columnState.filter(cs => cs.hide === true).length
        });
        setColumnState(columnState);
      }
    }
  }, [open, columnDefs, columnState, columnDefinitions, setColumnDefinitions, setColumnState]);

  // Update store's open state
  useEffect(() => {
    setOpen(open);
  }, [open, setOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    console.log('[ColumnFormattingDialogInstance] Dialog state changing:', newOpen);
    setOpen(newOpen);
    onOpenChange(newOpen);
  };

  return (
    <FloatingRibbonUIInstance
      open={open}
      onOpenChange={handleOpenChange}
      columnDefs={columnDefs}
      columnState={columnState}
      onApply={onApply}
    />
  );
});

ColumnFormattingDialogInstance.displayName = 'ColumnFormattingDialogInstance';