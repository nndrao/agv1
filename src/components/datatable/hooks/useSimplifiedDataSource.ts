import { useState, useEffect, useCallback, useRef } from 'react';
import { GridApi } from 'ag-grid-community';
import { IDataSourceProvider, DataSourceEvent } from '@/providers/IDataSourceProvider';
import { DatasourceProviderManager as DataSourceProviderManager } from '@/services/datasource/DatasourceProviderManager';
import { useDatasourceStore, StompDatasourceConfig } from '@/stores/datasource.store';
import { useToast } from '@/hooks/use-toast';

interface UseSimplifiedDataSourceOptions {
  datasourceId?: string;
  gridApi: GridApi | null;
}

interface UseSimplifiedDataSourceResult {
  isConnected: boolean;
  isLoadingSnapshot: boolean;
  snapshotProgress: number;
  totalRows: number;
  provider: IDataSourceProvider | null;
  error: Error | null;
}

/**
 * Hook to integrate simplified datasource providers with AG-Grid
 */
export function useSimplifiedDataSource({
  datasourceId,
  gridApi,
}: UseSimplifiedDataSourceOptions): UseSimplifiedDataSourceResult {
  const { getDatasource } = useDatasourceStore();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [snapshotProgress, setSnapshotProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [provider, setProvider] = useState<IDataSourceProvider | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const providerRef = useRef<IDataSourceProvider | null>(null);
  
  // Handle datasource events
  const handleConnected = useCallback(() => {
    console.log(`[useSimplifiedDataSource] Connected to ${datasourceId}`);
    setIsConnected(true);
    setError(null);
    toast({
      title: 'Connected',
      description: `Connected to datasource ${providerRef.current?.name}`,
    });
  }, [datasourceId, toast]);
  
  const handleDisconnected = useCallback((event: DataSourceEvent) => {
    console.log(`[useSimplifiedDataSource] Disconnected from ${datasourceId}`);
    setIsConnected(false);
    
    if (event.type === 'disconnected') {
      toast({
        title: 'Disconnected',
        description: event.reason || 'Lost connection to datasource',
        variant: 'destructive',
      });
    }
  }, [datasourceId, toast]);
  
  const handleSnapshotStart = useCallback(() => {
    console.log(`[useSimplifiedDataSource] Snapshot started for ${datasourceId}`);
    setIsLoadingSnapshot(true);
    setSnapshotProgress(0);
    setTotalRows(0);
    
    // Clear the grid
    if (gridApi) {
      gridApi.setGridOption('rowData', []);
    }
  }, [datasourceId, gridApi]);
  
  const handleSnapshotData = useCallback((event: DataSourceEvent) => {
    if (event.type !== 'snapshotData' || !gridApi) return;
    
    console.log(`[useSimplifiedDataSource] Received ${event.rows.length} rows, isLastBatch: ${event.isLastBatch}`);
    
    // Update total rows
    setTotalRows(event.rows.length);
    
    // Set all data at once (replace existing)
    gridApi.setGridOption('rowData', event.rows);
    
    // Update progress
    if (event.isLastBatch) {
      setSnapshotProgress(100);
    } else {
      // Estimate progress based on rows received
      const estimatedProgress = Math.min(90, (event.rows.length / 20000) * 100);
      setSnapshotProgress(estimatedProgress);
    }
  }, [gridApi]);
  
  const handleSnapshotComplete = useCallback((event: DataSourceEvent) => {
    if (event.type !== 'snapshotComplete') return;
    
    console.log(`[useSimplifiedDataSource] Snapshot complete: ${event.totalRows} rows`);
    setIsLoadingSnapshot(false);
    setSnapshotProgress(100);
    setTotalRows(event.totalRows);
    
    // Now that snapshot is complete, start receiving updates
    if (providerRef.current) {
      console.log(`[useSimplifiedDataSource] Starting updates after snapshot complete`);
      providerRef.current.startUpdates();
    }
    
    toast({
      title: 'Snapshot loaded',
      description: `Loaded ${event.totalRows} rows`,
    });
  }, [toast]);
  
  const handleUpdate = useCallback((event: DataSourceEvent) => {
    if (event.type !== 'update' || !gridApi) return;
    
    const keyColumn = providerRef.current?.getKeyColumn();
    if (!keyColumn) {
      console.error('[useSimplifiedDataSource] No key column defined for updates');
      return;
    }
    
    // Apply updates using AG-Grid transactions
    const transaction = {
      update: event.rows,
    };
    
    const result = gridApi.applyTransactionAsync(transaction);
    console.log(`[useSimplifiedDataSource] Applied ${event.rows.length} updates`, result);
  }, [gridApi]);
  
  const handleError = useCallback((event: DataSourceEvent) => {
    if (event.type !== 'error') return;
    
    console.error(`[useSimplifiedDataSource] Error:`, event.error);
    setError(event.error);
    
    toast({
      title: 'Datasource error',
      description: event.error.message,
      variant: 'destructive',
    });
  }, [toast]);
  
  // Setup datasource provider
  useEffect(() => {
    if (!datasourceId || !gridApi) {
      return;
    }
    
    const datasourceConfig = getDatasource(datasourceId);
    if (!datasourceConfig) {
      console.error(`[useSimplifiedDataSource] Datasource ${datasourceId} not found`);
      return;
    }

    // Only support STOMP datasources for now
    if (datasourceConfig.type !== 'stomp') {
      console.error(`[useSimplifiedDataSource] Datasource type ${datasourceConfig.type} not supported`);
      setError(new Error(`Datasource type ${datasourceConfig.type} not supported`));
      return;
    }
    
    console.log(`[useSimplifiedDataSource] Setting up provider for ${datasourceId}`);
    
    // Get provider from manager (singleton)
    const manager = DataSourceProviderManager.getInstance();
    const dsProvider = manager.getProvider(datasourceConfig as StompDatasourceConfig);
    providerRef.current = dsProvider;
    setProvider(dsProvider);
    
    // Register as subscriber
    const unsubscribe = manager.registerSubscriber(datasourceId);
    unsubscribeRef.current = unsubscribe;
    
    // Configure grid with key column
    const keyColumn = dsProvider.getKeyColumn();
    if (keyColumn) {
      gridApi.setGridOption('getRowId' as any, (params: any) => params.data[keyColumn]);
      console.log(`[useSimplifiedDataSource] Set grid row ID to use column: ${keyColumn}`);
    }
    
    // Set column definitions
    const columnDefs = dsProvider.getColumnDefs();
    if (columnDefs && columnDefs.length > 0) {
      gridApi.setGridOption('columnDefs', columnDefs);
      console.log(`[useSimplifiedDataSource] Set ${columnDefs.length} column definitions`);
    }
    
    // Subscribe to provider events
    dsProvider.on('connected', handleConnected);
    dsProvider.on('disconnected', handleDisconnected);
    dsProvider.on('snapshotStart', handleSnapshotStart);
    dsProvider.on('snapshotData', handleSnapshotData);
    dsProvider.on('snapshotComplete', handleSnapshotComplete);
    dsProvider.on('update', handleUpdate);
    dsProvider.on('error', handleError);
    
    // Start the provider if not already connected
    dsProvider.start().catch((err: Error) => {
      console.error(`[useSimplifiedDataSource] Failed to start provider:`, err);
      setError(err);
    });
    
    // Update initial state
    setIsConnected(dsProvider.isConnected());
    
    // Cleanup
    return () => {
      console.log(`[useSimplifiedDataSource] Cleaning up provider for ${datasourceId}`);
      
      // Unsubscribe from events
      if (providerRef.current) {
        providerRef.current.off('connected', handleConnected);
        providerRef.current.off('disconnected', handleDisconnected);
        providerRef.current.off('snapshotStart', handleSnapshotStart);
        providerRef.current.off('snapshotData', handleSnapshotData);
        providerRef.current.off('snapshotComplete', handleSnapshotComplete);
        providerRef.current.off('update', handleUpdate);
        providerRef.current.off('error', handleError);
      }
      
      // Unregister as subscriber
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      providerRef.current = null;
      setProvider(null);
    };
  }, [datasourceId, gridApi, getDatasource, handleConnected, handleDisconnected, 
      handleSnapshotStart, handleSnapshotData, handleSnapshotComplete, handleUpdate, handleError]);
  
  return {
    isConnected,
    isLoadingSnapshot,
    snapshotProgress,
    totalRows,
    provider,
    error,
  };
}