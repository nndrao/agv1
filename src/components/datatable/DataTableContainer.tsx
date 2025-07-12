import React, { memo, useMemo, useRef, useState } from 'react';
import { GridApi } from 'ag-grid-community';
import { DataTableProvider } from './DataTableContext';
import { DataTableGrid } from './DataTableGrid';
import { DataTableToolbarInstance } from './DataTableToolbarInstance';
import { ColumnFormattingDialogInstance } from './columnFormatting/ColumnFormattingDialogInstance';
import { GridOptionsPropertyEditorInstance } from './gridOptions/GridOptionsPropertyEditorInstance';
// import { DataSourceFloatingDialog } from './datasource/DataSourceFloatingDialog';
import { ProfileStoreProvider, useInstanceProfile } from './ProfileStoreProvider';
import { useColumnProcessor } from './hooks/useColumnProcessor';
import { useGridState } from './hooks/useGridState';
import { useInstanceProfileSync } from './hooks/useInstanceProfileSync';
import { useColumnOperations } from './hooks/useColumnOperations';
import { useGridOptions } from './gridOptions/hooks/useGridOptions';
import { useDataSourceUpdates } from './hooks/useDataSourceUpdates';
import { DataTableProps } from './types';
import { useTheme } from '@/components/datatable/ThemeProvider';
import { useColumnFormattingStore } from './columnFormatting/store/columnFormatting.store';
import { useInstanceDatasource } from './hooks/useInstanceDatasource';
import { useDatasourceStore } from '@/stores/datasource.store';
import { useToast } from '@/hooks/use-toast';
import './datatable.css';

/**
 * Inner container component that uses instance-specific profile hooks.
 * This component must be wrapped with ProfileStoreProvider.
 */
const DataTableInner = memo(({ 
  columnDefs, 
  dataRow, 
  instanceId = 'datatable-default'
}: DataTableProps) => {
  const gridApiRef = useRef<GridApi | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  // Use instance-specific profile hooks
  const saveColumnCustomizations = useInstanceProfile((state) => state.saveColumnCustomizations);
  const saveGridOptions = useInstanceProfile((state) => state.saveGridOptions);
  const getActiveProfile = useInstanceProfile((state) => state.getActiveProfile);
  const _hasHydrated = useInstanceProfile((state) => state._hasHydrated);
  const { theme } = useTheme();
  const { datasources } = useDatasourceStore();
  const { toast } = useToast();
  const [updatesEnabled, setUpdatesEnabled] = useState(false);
  const [hasAutoEnabledUpdates, setHasAutoEnabledUpdates] = useState(false);
  
  
  // Initialize instance-level datasource hook
  const { 
    selectedDatasourceId, 
    columnDefinitions: datasourceColumns,
    currentData: datasourceData,
    // currentStatus: datasourceStatus,
    isSnapshotComplete,
    handleDatasourceChange 
  } = useInstanceDatasource(instanceId);
  
  // Use datasource columns if available, otherwise use provided columns
  const effectiveColumnDefs = React.useMemo(() => {
    if (selectedDatasourceId && datasourceColumns && datasourceColumns.length > 0) {
      return datasourceColumns;
    }
    return columnDefs;
  }, [selectedDatasourceId, datasourceColumns, columnDefs]);
  
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
  } = useGridState(effectiveColumnDefs);
  
  // Update column definitions when datasource changes
  React.useEffect(() => {
    if (selectedDatasourceId && datasourceColumns && datasourceColumns.length > 0) {
      // console.log('[DataTableContainer] Datasource changed, updating columns:', {
      //   datasourceId: selectedDatasourceId,
      //   columnCount: datasourceColumns.length,
      //   hasGridApi: !!gridApi,
      //   hasSetColumnDefs: !!(gridApi && typeof gridApi.setColumnDefs === 'function'),
      //   isSnapshotComplete
      // });
      
      // Update current column definitions
      setCurrentColumnDefs(datasourceColumns);
      
      // If grid is ready, apply the new column definitions
      // Using gridApiRef.current instead of gridApi state
      if (gridApiRef.current && typeof gridApiRef.current.setGridOption === 'function') {
        // Batch all grid operations in a single frame
        requestAnimationFrame(() => {
          if (!gridApiRef.current) return;
          
          // Set new column definitions
          gridApiRef.current.setGridOption('columnDefs', datasourceColumns);
          
          // Only reset state if explicitly needed
          // Don't clear data here - let the datasource data flow handle it
        });
      }
    }
  }, [selectedDatasourceId, datasourceColumns, setCurrentColumnDefs]); // Remove gridApi from dependencies
  
  // Show toast when snapshot data is loaded
  const [hasShownSnapshotToast, setHasShownSnapshotToast] = useState(false);
  
  // Debug logging for snapshot completion
  React.useEffect(() => {
    // console.log(`[DataTableContainer] Snapshot status changed for ${selectedDatasourceId}:`, {
    //   isSnapshotComplete,
    //   dataLength: datasourceData?.length || 0,
    //   hasShownToast: hasShownSnapshotToast
    // });
  }, [isSnapshotComplete, selectedDatasourceId, datasourceData?.length]);
  
  React.useEffect(() => {
    if (selectedDatasourceId && isSnapshotComplete && datasourceData && datasourceData.length > 0) {
      // Only show toast once per datasource
      if (!hasShownSnapshotToast) {
        toast({
          title: 'Snapshot loaded',
          description: `${datasourceData.length} rows loaded from datasource`,
        });
        setHasShownSnapshotToast(true);
      }
    }
  }, [selectedDatasourceId, isSnapshotComplete, datasourceData?.length, toast, hasShownSnapshotToast]);
  
  // Reset toast flag when datasource changes
  React.useEffect(() => {
    setHasShownSnapshotToast(false);
  }, [selectedDatasourceId]);
  
  // State for dialogs
  const [showGridOptionsDialog, setShowGridOptionsDialog] = useState(false);
  
  // Initialize grid options hook
  const {
    gridOptions,
    updateGridOptions,
    applyGridOptions
  } = useGridOptions(gridApi);
  
  // Initialize datasource updates hook for real-time updates
  useDataSourceUpdates({
    datasourceId: selectedDatasourceId,
    gridApi: gridApi || gridApiRef.current, // Use state first, fallback to ref
    keyColumn: datasources?.find(ds => ds.id === selectedDatasourceId)?.keyColumn,
    asyncTransactionWaitMillis: 60,
    updatesEnabled,
    onUpdateError: (error) => {
      console.error('[DataTableContainer] Update error:', error);
    }
  });
  
  // Process columns to ensure cellStyle functions for conditional formatting
  // This preserves the CRITICAL ensureCellStyleForColumns functionality
  const processedColumns = useColumnProcessor(currentColumnDefs);
  
  // Handle profile synchronization
  const { handleProfileChange } = useInstanceProfileSync(
    setCurrentColumnDefs, 
    setSelectedFont, 
    setSelectedFontSize,
    handleDatasourceChange
  );
  
  // Wait for store hydration
  const hasHydrated = _hasHydrated;
  
  // Initialize and apply active profile on mount
  const hasInitializedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasInitializedRef.current || !hasHydrated) return;
    
    const activeProfile = getActiveProfile();
    if (activeProfile && columnDefs && columnDefs.length > 0) {
      // console.log('[DataTableContainer] Active profile on mount (after hydration):', {
      //   profileId: activeProfile.id,
      //   profileName: activeProfile.name,
      //   hasColumnSettings: !!activeProfile.columnSettings,
      //   baseColumnsCount: activeProfile.columnSettings?.baseColumnDefs?.length || 0,
      //   customizationsCount: activeProfile.columnSettings?.columnCustomizations ? 
      //     Object.keys(activeProfile.columnSettings.columnCustomizations).length : 0
      // });
      
      // If profile has no base columns but we have columnDefs, initialize them
      if (!activeProfile.columnSettings?.baseColumnDefs || 
          activeProfile.columnSettings.baseColumnDefs.length === 0) {
        // console.log('[DataTableContainer] Profile missing base columns, initializing with:', {
        //   columnCount: columnDefs.length
        // });
        saveColumnCustomizations(columnDefs, columnDefs);
      }
      
      // Apply the profile
      handleProfileChange(activeProfile);
      hasInitializedRef.current = true;
    }
  }, [columnDefs, hasHydrated]); // Wait for hydration
  
  
  // Auto-enable updates when snapshot is complete
  React.useEffect(() => {
    if (isSnapshotComplete && !hasAutoEnabledUpdates && selectedDatasourceId) {
      console.log('[DataTableContainer] Snapshot complete, auto-enabling updates');
      setUpdatesEnabled(true);
      setHasAutoEnabledUpdates(true);
      toast({
        title: 'Real-time updates enabled',
        description: 'Live data updates are now active',
        duration: 3000,
      });
    }
  }, [isSnapshotComplete, hasAutoEnabledUpdates, selectedDatasourceId, toast]);
  
  // Reset auto-enable flag when datasource changes
  React.useEffect(() => {
    setHasAutoEnabledUpdates(false);
  }, [selectedDatasourceId]);
  
  // Handle column operations - pass processedColumns which have the styles
  const { handleApplyColumnChanges, getColumnDefsWithStyles } = useColumnOperations(
    gridApiRef,
    setCurrentColumnDefs,
    processedColumns
  );
  
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
  // const handleApplyDataSources = React.useCallback((dataSources: any[]) => {
  //   // console.log('[DataTableContainer] Applying data sources:', dataSources);
  //   
  //   // TODO: Implement data source loading logic
  //   // This would typically:
  //   // 1. Connect to active data sources
  //   // 2. Fetch data from each source
  //   // 3. Merge/combine data as needed
  //   // 4. Update the grid with new data
  //   
  //   // For now, just log the data sources
  //   dataSources.forEach(ds => {
  //     // console.log(`Loading data from ${ds.name} (${ds.type})`);
  //   });
  // }, []);
  
  // Handle grid options apply
  const handleApplyGridOptions = React.useCallback((options: any) => {
    // console.log('[DataTableContainer] handleApplyGridOptions called:', {
    //   options,
    //   hasGridApi: !!gridApi
    // });
    
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
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        gridApiRef.current?.refreshCells({ force: true });
      });
    }
  }, [theme]);
  
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
          const store = useColumnFormattingStore.getState();
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
    
    // console.log('[DataTableContainer] Getting column state for dialog:', {
    //   columnStateLength: columnState?.length,
    //   allColumnsLength: allColumns?.length,
    //   visibleColumns: allColumns?.filter(col => col.isVisible()).length,
    //   hiddenColumns: allColumns?.filter(col => !col.isVisible()).length
    // });
    
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
        <DataTableToolbarInstance
          selectedFont={selectedFont}
          selectedFontSize={selectedFontSize}
          onFontChange={handleFontChange}
          onFontSizeChange={handleFontSizeChange}
          onSpacingChange={() => {}} // Empty function to satisfy prop requirements
          onOpenColumnSettings={() => setShowColumnDialog(true)}
          onOpenGridOptions={() => setShowGridOptionsDialog(true)}
          gridApi={gridApi}
          onProfileChange={handleProfileChange}
          getColumnDefsWithStyles={getColumnDefsWithStyles}
          instanceId={instanceId}
          selectedDatasourceId={selectedDatasourceId}
          onDatasourceChange={handleDatasourceChange}
          updatesEnabled={updatesEnabled}
          onToggleUpdates={() => setUpdatesEnabled(!updatesEnabled)}
        />
        
        <DataTableGrid
          columnDefs={processedColumns}
          rowData={selectedDatasourceId 
            ? (datasourceData || []) 
            : dataRow
          }
          gridApiRef={gridApiRef}
          keyColumn={selectedDatasourceId ? datasources?.find(ds => ds.id === selectedDatasourceId)?.keyColumn : undefined}
        />
        
        {selectedDatasourceId && !isSnapshotComplete && (
          <div className="absolute top-0 right-0 m-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Loading snapshot... {datasourceData?.length || 0} rows
              </p>
            </div>
          </div>
        )}
        
        <ColumnFormattingDialogInstance
          open={showColumnDialog}
          onOpenChange={setShowColumnDialog}
          columnDefs={processedColumns}
          columnState={columnState}
          onApply={handleApplyColumnChanges}
        />
        
        <GridOptionsPropertyEditorInstance
          isOpen={showGridOptionsDialog}
          onClose={() => setShowGridOptionsDialog(false)}
          onApply={handleApplyGridOptions}
          currentOptions={gridOptions}
        />
        
      </div>
      
    </DataTableProvider>
  );
});

DataTableInner.displayName = 'DataTableInner';

/**
 * Container component that manages the state and logic for the DataTable.
 * This component wraps the inner component with ProfileStoreProvider.
 */
export const DataTableContainer = memo(({ 
  columnDefs, 
  dataRow, 
  instanceId = 'datatable-default'
}: DataTableProps) => {
  return (
    <ProfileStoreProvider instanceId={instanceId}>
      <DataTableInner
        columnDefs={columnDefs}
        dataRow={dataRow}
        instanceId={instanceId}
      />
    </ProfileStoreProvider>
  );
});

DataTableContainer.displayName = 'DataTableContainer';