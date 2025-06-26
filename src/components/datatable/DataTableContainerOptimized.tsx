import React, { memo, useMemo, useRef, useState, useCallback } from 'react';
import { GridApi } from 'ag-grid-community';
import { DataTableProvider } from './DataTableContext';
import { DataTableGrid } from './DataTableGrid';
import { DataTableToolbar } from './DataTableToolbar';
import { ProfileManagerV2 } from './ProfileManagerV2';
import { UnifiedConfigProvider } from './UnifiedConfigContext';
import { ColumnFormattingDialog } from './columnFormatting/ColumnFormattingDialog';
import { GridOptionsPropertyEditor } from './gridOptions/GridOptionsPropertyEditor';
import { DataSourceFloatingDialog } from './datasource/DataSourceFloatingDialog';
import { useColumnProcessor } from './hooks/useColumnProcessor';
import { useGridState } from './hooks/useGridState';
import { useProfileSync } from './hooks/useProfileSync';
import { useColumnOperations } from './hooks/useColumnOperations';
import { useGridOptions } from './gridOptions/hooks/useGridOptions';
import { useUnifiedConfig } from './hooks/useUnifiedConfig';
import { useDataSourceUpdates } from './hooks/useDataSourceUpdates';
import { DataTableProps } from './types';
import { useProfileStore, useHasHydrated } from '@/components/datatable/stores/profile.store';
import { useTheme } from '@/components/datatable/ThemeProvider';
import { useColumnFormattingStore } from './columnFormatting/store/columnFormatting.store';
import { useComponentDatasource } from './hooks/useComponentDatasource';
import { useDatasourceStore } from '@/stores/datasource.store';
import { useToast } from '@/hooks/use-toast';
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
  const { logMetrics } = usePerformanceMonitor({
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
  const { toast } = useToast();
  
  // State management
  const [updatesEnabled, setUpdatesEnabled] = useState(false);
  const [hasAutoEnabledUpdates, setHasAutoEnabledUpdates] = useState(false);
  
  // Memoized unified config
  const unifiedConfig = useUnifiedConfig({
    instanceId,
    autoLoad: enableUnifiedConfig,
    userId: 'default-user',
    appId: 'agv1'
  });
  
  // Memoized component datasource hook
  const datasourceHook = useComponentDatasource(instanceId);
  const { 
    selectedDatasourceId, 
    columnDefinitions: datasourceColumns,
    currentData: datasourceData,
    currentStatus: datasourceStatus,
    isSnapshotComplete,
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
  const columnOperations = useColumnOperations(gridApi);
  
  // Memoized data source updates configuration
  const dataSourceUpdatesConfig = useMemo(() => ({
    instanceId,
    enabled: updatesEnabled,
    onDataUpdate: undefined,
    onStatusChange: undefined,
  }), [instanceId, updatesEnabled]);
  
  const dataSourceUpdates = useDataSourceUpdates(dataSourceUpdatesConfig);
  
  // Memoized callbacks
  const handleFontChange = useCallback((font: string) => {
    setSelectedFont(font);
    saveGridOptions({ fontFamily: font });
    
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
      
      if (gridApiRef.current && typeof gridApiRef.current.setColumnDefs === 'function') {
        gridApiRef.current.setColumnDefs(datasourceColumns);
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
    gridApi,
    gridApiRef,
    setGridApi,
    currentColumnDefs,
    selectedFont,
    selectedFontSize,
    showColumnDialog,
    handleFontChange,
    handleFontSizeChange,
    handleApplyGridOptions,
    instanceId,
    enableUnifiedConfig,
    unifiedConfig,
    datasourceHook,
    dataSourceUpdates,
    columnOperations,
    gridOptions,
    gridState,
  }), [
    gridApi,
    currentColumnDefs,
    selectedFont,
    selectedFontSize,
    showColumnDialog,
    handleFontChange,
    handleFontSizeChange,
    handleApplyGridOptions,
    instanceId,
    enableUnifiedConfig,
    unifiedConfig,
    datasourceHook,
    dataSourceUpdates,
    columnOperations,
    gridOptions,
    gridState,
  ]);
  
  return (
    <DataTableProvider value={contextValue}>
      <UnifiedConfigProvider 
        config={enableUnifiedConfig ? unifiedConfig : undefined}
      >
        <div className="datatable-container h-full flex flex-col">
          <DataTableToolbar 
            enableProfile={true}
            enableDatasource={true}
            enableAutoUpdate={true}
            enableThemeToggle={true}
            enableFontSelector={true}
            enableGridOptions={true}
            selectedFont={selectedFont}
            selectedFontSize={selectedFontSize}
            onFontChange={handleFontChange}
            onFontSizeChange={handleFontSizeChange}
            profileElement={<ProfileManagerV2 instanceId={instanceId} />}
            updatesEnabled={updatesEnabled}
            onUpdatesEnabledChange={setUpdatesEnabled}
          />
          
          <div className="flex-1 relative">
            <DataTableGrid 
              columnDefs={currentColumnDefs}
              rowData={datasourceData || dataRow}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                minWidth: 100,
                flex: 0,
              }}
              sideBar={{
                toolPanels: ['columns', 'filters'],
                defaultToolPanel: 'columns',
              }}
              enableRangeSelection={true}
              enableCharts={true}
              animateRows={false}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              className={cn(
                selectedFont && `font-${selectedFont}`,
                selectedFontSize && `text-${selectedFontSize}`
              )}
            />
          </div>
          
          {showColumnDialog && (
            <ColumnFormattingDialog
              open={showColumnDialog}
              onOpenChange={setShowColumnDialog}
              instanceId={instanceId}
            />
          )}
          
          <GridOptionsPropertyEditor
            instanceId={instanceId}
            onApply={handleApplyGridOptions}
          />
          
          <DataSourceFloatingDialog
            instanceId={instanceId}
            onApply={datasources => {
              console.log('[DataTableContainer] Applying data sources:', datasources);
            }}
          />
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
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}