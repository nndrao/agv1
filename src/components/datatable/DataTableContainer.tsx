import React, { memo, useMemo, useRef, useState } from 'react';
import { GridApi } from 'ag-grid-community';
import { DataTableProvider } from './DataTableContext';
import { DataTableGrid } from './DataTableGrid';
import { DataTableToolbar } from './DataTableToolbar';
import { ColumnCustomizationDialog } from './columnCustomizations/ColumnCustomizationDialog';
import { GridOptionsPropertyEditor } from './gridOptions/GridOptionsPropertyEditor';
import { DataSourceFloatingDialog } from './datasource/DataSourceFloatingDialog';
import { useColumnProcessor } from './hooks/useColumnProcessor';
import { useGridState } from './hooks/useGridState';
import { useProfileSync } from './hooks/useProfileSync';
import { useColumnOperations } from './hooks/useColumnOperations';
import { useGridOptions } from './gridOptions/hooks/useGridOptions';
import { DataTableProps } from './types';
import { useProfileStore } from '@/components/datatable/stores/profile.store';
import { useTheme } from '@/components/datatable/ThemeProvider';
import { useColumnCustomizationStore } from './columnCustomizations/store/columnCustomization.store';
import './datatable.css';

/**
 * Container component that manages the state and logic for the DataTable.
 * This component coordinates all the hooks and provides context to child components.
 */
export const DataTableContainer = memo(({ columnDefs, dataRow }: DataTableProps) => {
  const gridApiRef = useRef<GridApi | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const { saveColumnCustomizations, saveGridOptions } = useProfileStore();
  const { theme } = useTheme();
  
  // Initialize grid state
  const {
    currentColumnDefs,
    selectedFont,
    selectedFontSize,
    showColumnDialog,
    setCurrentColumnDefs,
    setSelectedFont,
    setSelectedFontSize,
    setShowColumnDialog,
  } = useGridState(columnDefs);
  
  // State for dialogs
  const [showGridOptionsDialog, setShowGridOptionsDialog] = useState(false);
  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false);
  
  // Debug log for dialog state
  React.useEffect(() => {
    console.log('[DataTableContainer] showDataSourceDialog:', showDataSourceDialog);
  }, [showDataSourceDialog]);
  
  // Initialize grid options hook
  const {
    gridOptions,
    updateGridOptions,
    applyGridOptions
  } = useGridOptions(gridApi);
  
  
  // Process columns to ensure cellStyle functions for conditional formatting
  // This preserves the CRITICAL ensureCellStyleForColumns functionality
  const processedColumns = useColumnProcessor(currentColumnDefs);
  
  // Handle profile synchronization
  const { handleProfileChange } = useProfileSync(setCurrentColumnDefs, setSelectedFont, setSelectedFontSize);
  
  // Handle column operations - pass processedColumns which have the styles
  const { handleApplyColumnChanges, getColumnDefsWithStyles } = useColumnOperations(
    gridApiRef,
    setCurrentColumnDefs,
    processedColumns
  );
  
  // Initialize default profile if needed
  const hasInitializedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasInitializedRef.current || !columnDefs || columnDefs.length === 0) return;
    
    const activeProfile = useProfileStore.getState().getActiveProfile();
    if (activeProfile && activeProfile.id === 'default-profile' && 
        !activeProfile.columnSettings?.columnCustomizations && 
        (!activeProfile.gridState_legacy?.columnDefs || activeProfile.gridState_legacy?.columnDefs?.length === 0)) {
      console.log('[DataTableContainer] Initializing default profile with base columnDefs');
      // Pass columnDefs as both current and base since this is the initial setup
      // The first parameter is current state, second is the original base columns
      saveColumnCustomizations(columnDefs, columnDefs);
      hasInitializedRef.current = true;
    }
  }, [columnDefs, saveColumnCustomizations]);
  
  // Handle font changes
  const handleFontChange = React.useCallback((font: string) => {
    setSelectedFont(font);
    
    // Save font to profile's grid options
    saveGridOptions({ font });
    
    if (gridApiRef.current) {
      gridApiRef.current.refreshCells({ force: true });
    }
  }, [setSelectedFont, saveGridOptions]);
  
  // Handle font size changes
  const handleFontSizeChange = React.useCallback((size: string) => {
    setSelectedFontSize(size);
    
    // Save font size to profile's grid options
    saveGridOptions({ fontSize: size });
    
    if (gridApiRef.current) {
      gridApiRef.current.refreshCells({ force: true });
    }
  }, [setSelectedFontSize, saveGridOptions]);
  
  // Handle data source changes
  const handleApplyDataSources = React.useCallback((dataSources: any[]) => {
    console.log('[DataTableContainer] Applying data sources:', dataSources);
    
    // TODO: Implement data source loading logic
    // This would typically:
    // 1. Connect to active data sources
    // 2. Fetch data from each source
    // 3. Merge/combine data as needed
    // 4. Update the grid with new data
    
    // For now, just log the data sources
    dataSources.forEach(ds => {
      console.log(`Loading data from ${ds.name} (${ds.type})`);
    });
  }, []);
  
  // Handle grid options apply
  const handleApplyGridOptions = React.useCallback((options: any) => {
    console.log('[DataTableContainer] handleApplyGridOptions called:', {
      options,
      hasGridApi: !!gridApi
    });
    
    // Update local state in the hook
    updateGridOptions(options);
    
    // Apply to grid
    if (gridApi) {
      applyGridOptions(gridApi);
    }
    
    // Save to the profile store (but not to localStorage)
    // This ensures the options are available when Save Profile is clicked
    saveGridOptions(options);
  }, [updateGridOptions, applyGridOptions, gridApi, saveGridOptions]);
  
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
    selectedFontSize,
    handleFontChange,
    handleFontSizeChange,
    showColumnDialog,
    setShowColumnDialog,
    gridApiRef,
    getColumnDefsWithStyles,
    setGridApi,
  }), [
    processedColumns,
    selectedFont,
    selectedFontSize,
    handleFontChange,
    handleFontSizeChange,
    showColumnDialog,
    setShowColumnDialog,
    getColumnDefsWithStyles,
  ]);
  
  return (
    <DataTableProvider value={contextValue}>
      <div className="h-full w-full flex flex-col overflow-hidden">
        <DataTableToolbar
          selectedFont={selectedFont}
          selectedFontSize={selectedFontSize}
          onFontChange={handleFontChange}
          onFontSizeChange={handleFontSizeChange}
          onSpacingChange={() => {}} // Empty function to satisfy prop requirements
          onOpenColumnSettings={() => setShowColumnDialog(true)}
          onOpenGridOptions={() => setShowGridOptionsDialog(true)}
          onOpenDataSource={() => {
            console.log('[DataTableContainer] Opening data source dialog');
            setShowDataSourceDialog(true);
          }}
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
        
        <GridOptionsPropertyEditor
          isOpen={showGridOptionsDialog}
          onClose={() => setShowGridOptionsDialog(false)}
          onApply={handleApplyGridOptions}
          currentOptions={gridOptions}
        />
        
      </div>
      
      {/* Render dialogs outside the main container to avoid overflow issues */}
      <DataSourceFloatingDialog
        open={showDataSourceDialog}
        onOpenChange={setShowDataSourceDialog}
        onApply={handleApplyDataSources}
      />
    </DataTableProvider>
  );
});

DataTableContainer.displayName = 'DataTableContainer';