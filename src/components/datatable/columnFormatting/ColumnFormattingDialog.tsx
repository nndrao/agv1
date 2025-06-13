import React, { useEffect, memo } from 'react';
import { ColDef, ColumnState } from 'ag-grid-community';
import { useColumnFormattingStore } from './store/columnFormatting.store';
import { FloatingRibbonUI } from './FloatingRibbonUI';

interface ColumnFormattingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnDefs: ColDef[];
  columnState?: ColumnState[]; // AG-Grid column state
  onApply: (updatedColumns: ColDef[]) => void;
}

export const ColumnFormattingDialog: React.FC<ColumnFormattingDialogProps> = memo(({
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
              'aggFunc', 'moving', 'menuTabs', 'columnsMenuParams'
            ];
            stateProperties.forEach(prop => {
              if (prop in cleanCol) {
                console.log(`[ColumnFormattingDialog] Removing state property '${prop}' from column:`, colId);
                delete (cleanCol as any)[prop];
              }
            });
            columnMap.set(colId, cleanCol);
          }
        });
        setColumnDefinitions(columnMap);
      }
      
      // Also set column state if provided
      if (columnState) {
        console.log('[ColumnFormattingDialog] Setting column state:', {
          columnStateLength: columnState.length,
          sampleState: columnState.slice(0, 3).map(cs => ({
            colId: cs.colId,
            hide: cs.hide,
            width: cs.width
          }))
        });
        setColumnState(columnState);
      } else {
        console.log('[ColumnFormattingDialog] No column state provided');
      }
    }
    
    // Always sync the open state
    if (open !== useColumnFormattingStore.getState().open) {
      setOpen(open);
    }
  }, [open]); // Only depend on 'open' to prevent re-initialization on column changes

  // Don't render if not open
  if (!open) return null;

  // Don't pass a specific target column - let the ribbon use existing selection
  // or determine selection based on the current state
  return (
    <FloatingRibbonUI
      targetColumn={undefined}
      initialPosition={{ x: 50, y: 50 }}
      onClose={() => onOpenChange(false)}
      columnDefs={columnDefs}
      columnState={columnState}
      onApply={onApply}
    />
  );
});

ColumnFormattingDialog.displayName = 'ColumnFormattingDialog';