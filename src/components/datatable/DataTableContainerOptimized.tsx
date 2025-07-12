import React, { memo, useMemo, useRef, useState, useCallback } from 'react';
import { GridApi } from 'ag-grid-community';
import { DataTableProvider } from './DataTableContext';
import { DataTableGrid } from './DataTableGrid';
import { DataTableToolbar } from './DataTableToolbar';
// import { ProfileManagerV2 } from './ProfileManagerV2';
import { UnifiedConfigProvider } from './UnifiedConfigContext';
import { ColumnFormattingDialog } from './columnFormatting/ColumnFormattingDialog';
import { GridOptionsPropertyEditor } from './gridOptions/GridOptionsPropertyEditor';
import { DataSourceFloatingDialog } from './datasource/DataSourceFloatingDialog';
// import { useColumnProcessor } from './hooks/useColumnProcessor';
import { useGridState } from './hooks/useGridState';
// import { useProfileSync } from './hooks/useProfileSync';
import { useColumnOperations } from './hooks/useColumnOperations';
import { useGridOptions } from './gridOptions/hooks/useGridOptions';
import { useUnifiedConfig } from './hooks/useUnifiedConfig';
import { useDataSourceUpdates } from './hooks/useDataSourceUpdates';
import { DataTableProps, ColumnDef } from './types';
import { useProfileStore } from '@/components/datatable/stores/profile.store';
import { useTheme } from '@/components/datatable/ThemeProvider';
import { useColumnFormattingStore } from './columnFormatting/store/columnFormatting.store';
import { useInstanceDatasource } from './hooks/useInstanceDatasource';
import { useDatasourceStore } from '@/stores/datasource.store';
// import { useToast } from '@/hooks/use-toast';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import './datatable.css';

/**
 * Optimized container component with improved performance characteristics
 */
export const DataTableContainerOptimized = memo(({ 
  columnDefs, 
  dataRow, 
  instanceId = 'datatable-default',
  useUnifiedConfig: enableUnifiedConfig = false 
}: DataTableProps) => {
  // Performance monitoring
  const { } = usePerformanceMonitor({
    componentName: 'DataTableContainer',
    slowRenderThreshold: 20,
    enableMemoryTracking: true,
  });

  // Refs for stable references
  const gridApiRef = useRef<GridApi | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  
  // Core hooks with memoized dependencies
  const { saveColumnCustomizations, saveGridOptions } = useProfileStore();
  const { theme } = useTheme();
  const { datasources } = useDatasourceStore();
  // const { toast } = useToast();
  
  // State management
  const [updatesEnabled, setUpdatesEnabled] = useState(false);
  // const [hasAutoEnabledUpdates, setHasAutoEnabledUpdates] = useState(false);
  const [showGridOptionsDialog, setShowGridOptionsDialog] = useState(false);
  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false);
  
  // Memoized unified config
  const unifiedConfig = useUnifiedConfig({
    instanceId,
    autoLoad: enableUnifiedConfig,
    userId: 'default-user',
    appId: 'agv1'
  });
  
  // Memoized instance datasource hook
  const datasourceHook = useInstanceDatasource(instanceId);
  const { 
    selectedDatasourceId, 
    columnDefinitions: datasourceColumns,
    currentData: datasourceData,
    // currentStatus: datasourceStatus,
    // isSnapshotComplete,
    handleDatasourceChange 
  } = datasourceHook;
  
  // Memoize effective column definitions
  const effectiveColumnDefs = useMemo(() => {
    if (selectedDatasourceId && datasourceColumns && datasourceColumns.length > 0) {
      return datasourceColumns;
    }
    return columnDefs;
  }, [selectedDatasourceId, datasourceColumns, columnDefs]);
  
  // Initialize grid state with memoized columns
  const gridState = useGridState(effectiveColumnDefs);
  const {
    currentColumnDefs,
    selectedFont,
    selectedFontSize,
    showColumnDialog,
    setCurrentColumnDefs,
    setSelectedFont,
    setSelectedFontSize,
    setShowColumnDialog,
  } = gridState;
  
  // Memoized grid options
  const gridOptions = useGridOptions({ instanceId });
  const { updateGridOptions, applyGridOptions } = gridOptions;
  
  // Memoized column operations
  const columnOperations = useColumnOperations(gridApiRef, setCurrentColumnDefs, columnDefs);
  
  // Memoized data source updates configuration
  useDataSourceUpdates({
    datasourceId: selectedDatasourceId,
    gridApi: gridApi,
    keyColumn: undefined,
    asyncTransactionWaitMillis: 60,
    updatesEnabled: updatesEnabled,
    onUpdateError: (error) => {
      console.error('[DataTableContainer] Update error:', error);
    }
  });
  
  // Memoized callbacks
  const handleFontChange = useCallback((font: string) => {
    setSelectedFont(font);
    saveGridOptions({ font });
    
    if (enableUnifiedConfig && unifiedConfig.config) {
      // Update unified config logic here
    }
    
    if (gridApiRef.current) {
      gridApiRef.current.refreshCells({ force: true });
    }
  }, [setSelectedFont, saveGridOptions, enableUnifiedConfig, unifiedConfig]);
  
  const handleFontSizeChange = useCallback((size: string) => {
    setSelectedFontSize(size);
    saveGridOptions({ fontSize: size });
    
    if (gridApiRef.current) {
      gridApiRef.current.refreshCells({ force: true });
    }
  }, [setSelectedFontSize, saveGridOptions]);
  
  const handleApplyGridOptions = useCallback((options: any) => {
    updateGridOptions(options);
    
    if (gridApi) {
      applyGridOptions(gridApi);
    }
    
    saveGridOptions(options);
  }, [updateGridOptions, applyGridOptions, gridApi, saveGridOptions]);
  
  // Memoized event handlers
  const handleFormatColumn = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    const { colId } = customEvent.detail;
    
    setShowColumnDialog(true);
    
    if (colId) {
      setTimeout(() => {
        const store = useColumnFormattingStore.getState();
        store.setSelectedColumns(new Set([colId]));
      }, 100);
    }
  }, [setShowColumnDialog]);
  
  const handleOpenColumnSettings = useCallback(() => {
    setShowColumnDialog(true);
  }, [setShowColumnDialog]);
  
  // Effect for column definition updates
  React.useEffect(() => {
    if (selectedDatasourceId && datasourceColumns && datasourceColumns.length > 0) {
      setCurrentColumnDefs(datasourceColumns);
      
      if (gridApiRef.current && typeof gridApiRef.current.setGridOption === 'function') {
        gridApiRef.current.setGridOption('columnDefs', datasourceColumns);
      }
    }
  }, [selectedDatasourceId, datasourceColumns, setCurrentColumnDefs]);
  
  // Effect for theme changes with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (gridApiRef.current || gridApi) {
        gridApiRef.current?.refreshCells({ force: true });
        gridApi?.refreshCells({ force: true });
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [theme, gridApi]);
  
  // Event listeners with cleanup
  React.useEffect(() => {
    window.addEventListener('format-column', handleFormatColumn);
    window.addEventListener('open-column-settings', handleOpenColumnSettings);
    
    return () => {
      window.removeEventListener('format-column', handleFormatColumn);
      window.removeEventListener('open-column-settings', handleOpenColumnSettings);
    };
  }, [handleFormatColumn, handleOpenColumnSettings]);
  
  // Memoized context value
  const contextValue = useMemo(() => ({
    // Required DataTableContextValue properties
    processedColumns: currentColumnDefs,
    selectedFont,
    selectedFontSize,
    handleFontChange,
    handleFontSizeChange,
    showColumnDialog,
    setShowColumnDialog,
    gridApiRef,
    getColumnDefsWithStyles: columnOperations.getColumnDefsWithStyles || (() => currentColumnDefs),
    setGridApi,
    gridApi,
  }), [
    currentColumnDefs,
    selectedFont,
    selectedFontSize,
    showColumnDialog,
    setShowColumnDialog,
    gridApiRef,
    handleFontChange,
    handleFontSizeChange,
    setGridApi,
    columnOperations.getColumnDefsWithStyles,
    gridApi,
  ]);
  
  return (
    <DataTableProvider value={contextValue}>
      <UnifiedConfigProvider value={enableUnifiedConfig ? {
        ...unifiedConfig,
        instanceId,
        enabled: true,
        createVersion: unifiedConfig.createVersion || (async () => {}),
        activateVersion: unifiedConfig.activateVersion || (async () => {})
      } : { 
        instanceId, 
        enabled: false,
        config: null,
        loading: false,
        error: null,
        loadConfig: async () => {},
        updateConfig: async () => {},
        createVersion: async () => {},
        activateVersion: async () => {},
        configToProfile: () => null,
        profileToConfig: () => ({})
      }}>
        <div className="datatable-container h-full flex flex-col">
          <DataTableToolbar 
            selectedFont={selectedFont}
            selectedFontSize={selectedFontSize}
            onFontChange={handleFontChange}
            onFontSizeChange={handleFontSizeChange}
            onSpacingChange={() => {}}
            onOpenColumnSettings={() => setShowColumnDialog(true)}
            onOpenGridOptions={() => setShowGridOptionsDialog(true)}
            onOpenDataSourceDialog={() => setShowDataSourceDialog(true)}
            gridApi={gridApi}
            onProfileChange={() => {}}
            getColumnDefsWithStyles={columnOperations.getColumnDefsWithStyles || (() => currentColumnDefs)}
            instanceId={instanceId}
            selectedDatasourceId={selectedDatasourceId}
            onDatasourceChange={() => {}}
            updatesEnabled={updatesEnabled}
            onToggleUpdates={() => setUpdatesEnabled(!updatesEnabled)}
          />
          
          <div className="flex-1 relative">
            <DataTableGrid 
              columnDefs={currentColumnDefs}
              rowData={datasourceData || dataRow}
              gridApiRef={gridApiRef}
              keyColumn={datasourceHook.selectedDatasourceId ? datasources.find(ds => ds.id === datasourceHook.selectedDatasourceId)?.keyColumn : undefined}
            />
          </div>
          
          {showColumnDialog && (
            <ColumnFormattingDialog
              open={showColumnDialog}
              onOpenChange={setShowColumnDialog}
              columnDefs={currentColumnDefs}
              columnState={gridApi?.getColumnState?.()}
              onApply={(updatedColumns) => {
                setCurrentColumnDefs(updatedColumns as ColumnDef[]);
                if (gridApi) {
                  gridApi.setGridOption('columnDefs', updatedColumns);
                }
                saveColumnCustomizations(updatedColumns);
              }}
            />
          )}
          
          {showGridOptionsDialog && (
            <GridOptionsPropertyEditor
              isOpen={showGridOptionsDialog}
              onClose={() => setShowGridOptionsDialog(false)}
              onApply={handleApplyGridOptions}
              currentOptions={gridOptions.gridOptions}
            />
          )}
          
          {showDataSourceDialog && (
            <DataSourceFloatingDialog
              open={showDataSourceDialog}
              onOpenChange={setShowDataSourceDialog}
              onApply={datasources => {
                console.log('[DataTableContainer] Applying data sources:', datasources);
                if (datasources.length > 0) {
                  handleDatasourceChange(datasources[0].id);
                }
              }}
            />
          )}
        </div>
      </UnifiedConfigProvider>
    </DataTableProvider>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.instanceId === nextProps.instanceId &&
    prevProps.useUnifiedConfig === nextProps.useUnifiedConfig &&
    JSON.stringify(prevProps.columnDefs) === JSON.stringify(nextProps.columnDefs) &&
    JSON.stringify(prevProps.dataRow) === JSON.stringify(nextProps.dataRow)
  );
});

DataTableContainerOptimized.displayName = 'DataTableContainerOptimized';

// Helper function for className
// function cn(...classes: (string | undefined | false)[]) {
//   return classes.filter(Boolean).join(' ');
// }