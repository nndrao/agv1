import React, { memo, useMemo, useRef, useState } from 'react';
import { GridApi } from 'ag-grid-community';
import { DataTableProvider } from './DataTableContext';
import { DataTableGrid } from './DataTableGrid';
import { DataTableToolbar } from './DataTableToolbar';
import { ColumnCustomizationDialog } from './dialogs/columnSettings/ColumnCustomizationDialog';
import { useColumnProcessor } from './hooks/useColumnProcessor';
import { useGridState } from './hooks/useGridState';
import { useProfileSync } from './hooks/useProfileSync';
import { useColumnOperations } from './hooks/useColumnOperations';
import { DataTableProps } from './types';
import { useProfileStore } from '@/components/datatable/stores/profile.store';
import { useTheme } from '@/components/datatable/ThemeProvider';
import { useColumnCustomizationStore } from './dialogs/columnSettings/store/columnCustomization.store';
import './datatable.css';

/**
 * Container component that manages the state and logic for the DataTable.
 * This component coordinates all the hooks and provides context to child components.
 */
export const DataTableContainer = memo(({ columnDefs, dataRow }: DataTableProps) => {
  const gridApiRef = useRef<GridApi | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const { saveColumnCustomizations } = useProfileStore();
  const { theme } = useTheme();
  
  // Initialize grid state
  const {
    currentColumnDefs,
    selectedFont,
    showColumnDialog,
    setCurrentColumnDefs,
    setSelectedFont,
    setShowColumnDialog,
  } = useGridState(columnDefs);
  
  
  // Process columns to ensure cellStyle functions for conditional formatting
  // This preserves the CRITICAL ensureCellStyleForColumns functionality
  const processedColumns = useColumnProcessor(currentColumnDefs);
  
  // Handle profile synchronization
  const { handleProfileChange } = useProfileSync(setCurrentColumnDefs, setSelectedFont);
  
  // Handle column operations
  const { handleApplyColumnChanges, getColumnDefsWithStyles } = useColumnOperations(
    gridApiRef,
    setCurrentColumnDefs
  );
  
  // Initialize default profile if needed
  React.useEffect(() => {
    const activeProfile = useProfileStore.getState().getActiveProfile();
    if (activeProfile && activeProfile.id === 'default-profile' && 
        !activeProfile.gridState.columnCustomizations && 
        (!activeProfile.gridState.columnDefs || activeProfile.gridState.columnDefs.length === 0)) {
      console.log('[DataTableContainer] Initializing default profile with base columnDefs');
      // Pass columnDefs as both current and base since this is the initial setup
      // The first parameter is current state, second is the original base columns
      saveColumnCustomizations(columnDefs, columnDefs);
    }
  }, [columnDefs, saveColumnCustomizations]);
  
  // Handle font changes
  const handleFontChange = React.useCallback((font: string) => {
    setSelectedFont(font);
    if (gridApiRef.current) {
      gridApiRef.current.refreshCells({ force: true });
    }
  }, [setSelectedFont]);
  
  // Refresh cells when theme changes to update conditional formatting colors
  React.useEffect(() => {
    if (gridApiRef.current || gridApi) {
      // Small delay to ensure DOM classes are updated
      setTimeout(() => {
        gridApiRef.current?.refreshCells({ force: true });
        gridApi?.refreshCells({ force: true });
      }, 50);
    }
  }, [theme, gridApi]);
  
  // Listen for format-column events from context menu
  React.useEffect(() => {
    const handleFormatColumn = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { colId } = customEvent.detail;
      
      // Open the dialog (which now shows the ribbon)
      setShowColumnDialog(true);
      
      // Pre-select the column in the store
      if (colId) {
        // Use the store directly to select the column
        setTimeout(() => {
          const store = useColumnCustomizationStore.getState();
          store.setSelectedColumns(new Set([colId]));
        }, 100);
      }
    };
    
    const handleOpenColumnSettings = (_event: Event) => {
      // Open the dialog (which now shows the ribbon)
      setShowColumnDialog(true);
    };
    
    window.addEventListener('format-column', handleFormatColumn);
    window.addEventListener('open-column-settings', handleOpenColumnSettings);
    
    return () => {
      window.removeEventListener('format-column', handleFormatColumn);
      window.removeEventListener('open-column-settings', handleOpenColumnSettings);
    };
  }, [setShowColumnDialog]);
  
  // Memoize column state to prevent repeated calls
  const columnState = React.useMemo(() => {
    if (!gridApiRef.current || !showColumnDialog) return undefined;
    
    const columnState = gridApiRef.current.getColumnState();
    const allColumns = gridApiRef.current.getColumns();
    
    console.log('[DataTableContainer] Getting column state for dialog:', {
      columnStateLength: columnState?.length,
      allColumnsLength: allColumns?.length,
      visibleColumns: allColumns?.filter(col => col.isVisible()).length,
      hiddenColumns: allColumns?.filter(col => !col.isVisible()).length
    });
    
    // Create a complete state by merging column state with actual column visibility
    if (allColumns) {
      const completeState = allColumns.map(column => {
        const colId = column.getColId();
        const existingState = columnState?.find(cs => cs.colId === colId);
        
        return {
          colId: colId,
          hide: !column.isVisible(),
          ...existingState
        };
      });
      
      return completeState;
    }
    
    return columnState;
  }, [showColumnDialog, gridApi]); // Only recalculate when dialog opens or grid API changes
  
  // Create context value
  const contextValue = useMemo(() => ({
    processedColumns,
    selectedFont,
    handleFontChange,
    showColumnDialog,
    setShowColumnDialog,
    gridApiRef,
    getColumnDefsWithStyles,
    setGridApi,
  }), [
    processedColumns,
    selectedFont,
    handleFontChange,
    showColumnDialog,
    setShowColumnDialog,
    getColumnDefsWithStyles,
  ]);
  
  return (
    <DataTableProvider value={contextValue}>
      <div className="h-full w-full flex flex-col overflow-hidden">
        <DataTableToolbar
          onFontChange={handleFontChange}
          onSpacingChange={() => {}} // Empty function to satisfy prop requirements
          onOpenColumnSettings={() => setShowColumnDialog(true)}
          gridApi={gridApi}
          onProfileChange={handleProfileChange}
          getColumnDefsWithStyles={getColumnDefsWithStyles}
        />
        
        <DataTableGrid
          columnDefs={processedColumns}
          rowData={dataRow}
          gridApiRef={gridApiRef}
        />
        
        <ColumnCustomizationDialog
          open={showColumnDialog}
          onOpenChange={setShowColumnDialog}
          columnDefs={processedColumns}
          columnState={columnState}
          onApply={handleApplyColumnChanges}
        />
      </div>
    </DataTableProvider>
  );
});

DataTableContainer.displayName = 'DataTableContainer';