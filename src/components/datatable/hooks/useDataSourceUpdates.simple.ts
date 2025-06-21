import { useEffect, useRef, useCallback } from 'react';
import { GridApi } from 'ag-grid-community';
import { useDatasourceContext } from '@/contexts/DatasourceContext';

export interface UseDataSourceUpdatesOptions {
  datasourceId?: string;
  gridApi: GridApi | null;
  keyColumn?: string;
  asyncTransactionWaitMillis?: number;
  updatesEnabled?: boolean;
  onUpdateError?: (error: Error) => void;
  enableConflation?: boolean;
  onUpdateMetrics?: (metrics: UpdateMetrics) => void;
}

export interface UpdateMetrics {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  lastUpdateTime: number;
  conflatedUpdates: number;
  droppedUpdates: number;
  updateLatency: number;
}

export function useDataSourceUpdates({
  datasourceId,
  gridApi,
  keyColumn,
  asyncTransactionWaitMillis = 60,
  updatesEnabled = false,
  onUpdateError,
  enableConflation = true,
  onUpdateMetrics
}: UseDataSourceUpdatesOptions) {
  const { getProvider } = useDatasourceContext();
  const metricsRef = useRef<UpdateMetrics>({
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    lastUpdateTime: 0,
    conflatedUpdates: 0,
    droppedUpdates: 0,
    updateLatency: 0
  });
  
  // Batch updates to prevent UI blocking
  const pendingUpdatesRef = useRef<any[]>([]);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentDataMapRef = useRef<Map<string, any>>(new Map());
  
  // Initialize current data map when grid is ready
  useEffect(() => {
    if (!gridApi || !keyColumn) return;
    
    // Build initial data map
    const dataMap = new Map<string, any>();
    gridApi.forEachNode((node) => {
      if (node.data && node.data[keyColumn] !== undefined) {
        dataMap.set(String(node.data[keyColumn]), node.data);
      }
    });
    currentDataMapRef.current = dataMap;
    
    console.log('[useDataSourceUpdates] Initialized with', dataMap.size, 'rows');
  }, [gridApi, keyColumn]);
  
  // Process batched updates
  const processBatchedUpdates = useCallback(() => {
    if (!gridApi || pendingUpdatesRef.current.length === 0) return;
    
    const updates = pendingUpdatesRef.current;
    pendingUpdatesRef.current = [];
    
    const updateStartTime = Date.now();
    const transaction: any = {
      add: [],
      update: [],
      remove: []
    };
    
    // Track updates by key for conflation
    const updateMap = new Map<string, any>();
    const updateCountByRow = new Map<string, number>();
    
    // Process each update
    updates.forEach(rawUpdate => {
      if (!keyColumn || !rawUpdate[keyColumn]) {
        // No key column - treat as add
        transaction.add.push(rawUpdate);
        return;
      }
      
      const key = String(rawUpdate[keyColumn]);
      
      // Track update count for metrics
      updateCountByRow.set(key, (updateCountByRow.get(key) || 0) + 1);
      
      // Check if this is an update or add
      const rowNode = gridApi.getRowNode(key);
      const isUpdate = rowNode && rowNode.data;
      
      if (isUpdate) {
        if (enableConflation) {
          // Merge with existing pending update
          updateMap.set(key, { ...updateMap.get(key), ...rawUpdate });
        } else {
          transaction.update.push(rawUpdate);
        }
      } else {
        // New row
        transaction.add.push(rawUpdate);
        // Update our map
        currentDataMapRef.current.set(key, rawUpdate);
      }
    });
    
    // Add conflated updates to transaction
    if (enableConflation) {
      transaction.update = Array.from(updateMap.values());
      
      // Calculate conflation metrics
      let conflatedCount = 0;
      updateCountByRow.forEach((count) => {
        if (count > 1) {
          conflatedCount += (count - 1);
        }
      });
      metricsRef.current.conflatedUpdates += conflatedCount;
    }
    
    // Apply transaction
    try {
      const res = gridApi.applyTransaction(transaction);
      
      if (res) {
        metricsRef.current.successfulUpdates++;
        
        // Update latency metric
        const latency = Date.now() - updateStartTime;
        if (metricsRef.current.updateLatency === 0) {
          metricsRef.current.updateLatency = latency;
        } else {
          metricsRef.current.updateLatency = metricsRef.current.updateLatency * 0.9 + latency * 0.1;
        }
        
        console.log('[useDataSourceUpdates] Transaction applied:', {
          added: res.add?.length || 0,
          updated: res.update?.length || 0,
          removed: res.remove?.length || 0,
          latency: latency + 'ms'
        });
        
        // Update our data map with successful updates
        res.update?.forEach(node => {
          if (node.data && keyColumn) {
            currentDataMapRef.current.set(String(node.data[keyColumn]), node.data);
          }
        });
        
        // Notify metrics callback
        if (onUpdateMetrics) {
          onUpdateMetrics({ ...metricsRef.current });
        }
      }
    } catch (error) {
      metricsRef.current.failedUpdates++;
      console.error('[useDataSourceUpdates] Error applying transaction:', error);
      if (onUpdateError) {
        onUpdateError(error as Error);
      }
    }
  }, [gridApi, keyColumn, enableConflation, onUpdateMetrics, onUpdateError]);
  
  // Subscribe to updates directly from provider
  useEffect(() => {
    if (!datasourceId || !updatesEnabled || !gridApi) return;
    
    const provider = getProvider(datasourceId);
    if (!provider) {
      console.warn('[useDataSourceUpdates] No provider found for', datasourceId);
      return;
    }
    
    const updateHandler = (updatedData: any) => {
      metricsRef.current.totalUpdates++;
      metricsRef.current.lastUpdateTime = Date.now();
      
      // Check if grid is ready
      const gridReady = gridApi.isDestroyed !== undefined && !gridApi.isDestroyed();
      if (!gridReady) {
        console.warn('[useDataSourceUpdates] Dropping update - grid not ready');
        metricsRef.current.droppedUpdates++;
        return;
      }
      
      // Add to pending updates
      if (Array.isArray(updatedData)) {
        pendingUpdatesRef.current.push(...updatedData);
      } else {
        pendingUpdatesRef.current.push(updatedData);
      }
      
      // Clear existing timer
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      
      // Set new timer to process batch
      updateTimerRef.current = setTimeout(processBatchedUpdates, asyncTransactionWaitMillis);
    };
    
    // Subscribe to updates
    provider.subscribeToUpdates(updateHandler);
    console.log('[useDataSourceUpdates] Subscribed to updates for', datasourceId);
    
    // Cleanup
    return () => {
      provider.unsubscribeFromUpdates(updateHandler);
      
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
      
      pendingUpdatesRef.current = [];
      console.log('[useDataSourceUpdates] Unsubscribed from updates for', datasourceId);
    };
  }, [datasourceId, updatesEnabled, gridApi, getProvider, asyncTransactionWaitMillis, processBatchedUpdates]);
  
  // Manual flush function
  const flushTransactions = useCallback(() => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    processBatchedUpdates();
  }, [processBatchedUpdates]);
  
  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);
  
  return {
    flushTransactions,
    getMetrics
  };
}