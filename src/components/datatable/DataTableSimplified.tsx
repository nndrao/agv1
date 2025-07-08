import React, { memo, useRef, useState } from 'react';
import { GridApi } from 'ag-grid-community';
import { DataTableProvider } from './DataTableContext';
import { DataTableGrid } from './DataTableGrid';
import { DataTableToolbar } from './DataTableToolbar';
import { useSimplifiedDataSource } from './hooks/useSimplifiedDataSource';
import { useGridState } from './hooks/useGridState';
import { useColumnProcessor } from './hooks/useColumnProcessor';
import { ColumnFormattingDialog } from './columnFormatting/ColumnFormattingDialog';
import { DataTableProps } from './types';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, WifiOff } from 'lucide-react';

/**
 * Simplified DataTable using the new provider architecture
 */
export const DataTableSimplified = memo(({ 
  columnDefs: initialColumnDefs, 
  dataRow,
  instanceId = 'datatable-default',
  onGridReady
}: DataTableProps & { onGridReady?: (api: GridApi) => void }) => {
  const gridApiRef = useRef<GridApi | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedDatasourceId, setSelectedDatasourceId] = useState<string>('');
  
  // Grid state management
  const {
    currentColumnDefs,
    selectedFont,
    selectedFontSize,
    showColumnDialog,
    setSelectedFont,
    setSelectedFontSize,
    setShowColumnDialog,
  } = useGridState(initialColumnDefs);
  
  // Process columns for formatting
  const processedColumns = useColumnProcessor(currentColumnDefs);
  
  // Use simplified datasource
  const {
    isConnected,
    isLoadingSnapshot,
    snapshotProgress,
    totalRows,
    provider,
    error,
  } = useSimplifiedDataSource({
    datasourceId: selectedDatasourceId,
    gridApi,
  });
  
  // Handle grid ready
  const handleGridReady = (params: any) => {
    gridApiRef.current = params.api;
    setGridApi(params.api);
    console.log('[DataTableSimplified] Grid ready');
    
    // Call external onGridReady if provided
    if (onGridReady) {
      onGridReady(params.api);
    }
  };
  
  // Handle datasource change
  const handleDatasourceChange = (datasourceId: string | undefined) => {
    console.log(`[DataTableSimplified] Datasource changed to: ${datasourceId}`);
    setSelectedDatasourceId(datasourceId || '');
  };
  
  // Handle restart
  const handleRestart = () => {
    if (provider) {
      provider.restart();
    }
  };
  
  // Create context value
  const contextValue = React.useMemo(() => ({
    processedColumns,
    selectedFont,
    selectedFontSize,
    handleFontChange: setSelectedFont,
    handleFontSizeChange: setSelectedFontSize,
    showColumnDialog,
    setShowColumnDialog,
    gridApiRef,
    getColumnDefsWithStyles: () => processedColumns,
    setGridApi,
  }), [
    processedColumns,
    selectedFont,
    selectedFontSize,
    showColumnDialog,
    setShowColumnDialog,
  ]);

  return (
    <DataTableProvider value={contextValue}>
      <div className="h-full w-full flex flex-col overflow-hidden">
        <DataTableToolbar
          selectedFont={selectedFont}
          selectedFontSize={selectedFontSize}
          onFontChange={setSelectedFont}
          onFontSizeChange={setSelectedFontSize}
          onSpacingChange={() => {}}
          onOpenColumnSettings={() => setShowColumnDialog(true)}
          onOpenGridOptions={() => {}}
          gridApi={gridApi}
          onProfileChange={() => {}}
          getColumnDefsWithStyles={() => processedColumns}
          instanceId={instanceId}
          selectedDatasourceId={selectedDatasourceId}
          onDatasourceChange={handleDatasourceChange}
          // Additional props for simplified version
          isConnected={isConnected}
          onRestart={handleRestart}
        />
        
        {/* Connection status */}
        {selectedDatasourceId && !isConnected && !isLoadingSnapshot && (
          <Alert variant="destructive" className="mx-4 mb-2">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Disconnected from datasource. Attempting to reconnect...
            </AlertDescription>
          </Alert>
        )}
        
        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="mx-4 mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        {/* Loading progress */}
        {isLoadingSnapshot && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">
                Loading snapshot data...
              </span>
              <span className="text-sm font-medium">
                {totalRows.toLocaleString()} rows
              </span>
            </div>
            <Progress value={snapshotProgress} className="h-2" />
          </div>
        )}
        
        <DataTableGrid
          columnDefs={processedColumns}
          rowData={dataRow} // Always use the provided data
          gridApiRef={gridApiRef}
          keyColumn={provider?.getKeyColumn()}
          onGridReady={handleGridReady}
        />
        
        <ColumnFormattingDialog
          open={showColumnDialog}
          onOpenChange={setShowColumnDialog}
          columnDefs={processedColumns}
          columnState={gridApi?.getColumnState()}
          onApply={() => {}} // Simplified version doesn't need complex column updates
        />
      </div>
    </DataTableProvider>
  );
});

DataTableSimplified.displayName = 'DataTableSimplified';