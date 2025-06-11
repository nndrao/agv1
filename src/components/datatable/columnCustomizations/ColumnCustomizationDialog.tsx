import React, { useEffect, memo } from 'react';
import { ColDef, ColumnState } from 'ag-grid-community';
import { useColumnCustomizationStore } from './store/columnCustomization.store';
import { FloatingRibbonUI } from '../floatingRibbon/FloatingRibbonUI';

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
    setOpen,
    setColumnDefinitions,
    setColumnState,
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
  }, [open, columnDefs, columnState, columnDefinitions, setColumnDefinitions, setColumnState, setOpen]);

  // Don't render if not open
  if (!open) return null;

  // Get the target column from selected columns (first selected)
  const targetColumn = selectedColumns.size > 0 ? Array.from(selectedColumns)[0] : undefined;

  return (
    <FloatingRibbonUI
      targetColumn={targetColumn}
      initialPosition={{ x: 50, y: 50 }}
      onClose={() => onOpenChange(false)}
      columnDefs={columnDefs}
      columnState={columnState}
      onApply={onApply}
    />
  );
});

ColumnCustomizationDialog.displayName = 'ColumnCustomizationDialog';