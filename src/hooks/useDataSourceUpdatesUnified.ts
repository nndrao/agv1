import { useEffect, useRef, useCallback, useMemo } from 'react';
import { GridApi } from 'ag-grid-community';
import { useDatasourceContext } from '@/contexts/DatasourceContext';

export interface UseDataSourceUpdatesOptions {
  datasourceId?: string;
  gridApi: GridApi | null;
  keyColumn?: string;
  asyncTransactionWaitMillis?: number;
  updatesEnabled?: boolean;
  onUpdateError?: (error: Error) => void;
  initialData?: any[];
  
  // Performance options
  enableConflation?: boolean;
  maxBatchSize?: number;
  batchWindowMs?: number;
  
  // Monitoring
  onUpdateMetrics?: (metrics: UpdateMetrics) => void;
  enablePerformanceTracking?: boolean;
}

export interface UpdateMetrics {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  lastUpdateTime: number;
  conflatedUpdates: number;
  droppedUpdates: number;
  updateLatency: number;
  averageBatchSize: number;
}

interface UpdateBatch {
  updates: Map<string, any>;
  timestamp: number;
}

/**
 * Unified hook for handling data source updates with improved performance
 * Combines the best features from all three implementations
 */
export function useDataSourceUpdatesUnified(options: UseDataSourceUpdatesOptions) {
  const {
    datasourceId,
    gridApi,
    keyColumn,
    asyncTransactionWaitMillis = 60,
    updatesEnabled = false,
    onUpdateError,
    enableConflation = true,
    maxBatchSize = 1000,
    batchWindowMs = 50,
    onUpdateMetrics,
    enablePerformanceTracking = false,
  } = options;

  const { updateEmitter, subscribeToUpdates, unsubscribeFromUpdates } = useDatasourceContext();
  
  // Refs for stable references
  const metricsRef = useRef<UpdateMetrics>({
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    lastUpdateTime: 0,
    conflatedUpdates: 0,
    droppedUpdates: 0,
    updateLatency: 0,
    averageBatchSize: 0,
  });
  
  const batchRef = useRef<UpdateBatch>({
    updates: new Map(),
    timestamp: Date.now(),
  });
  
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Memoized row node getter for performance
  const getRowNode = useCallback((id: string) => {
    if (!gridApi) return null;
    try {
      return gridApi.getRowNode(id);
    } catch (error) {
      return null;
    }
  }, [gridApi]);

  // Process a batch of updates
  const processBatch = useCallback(() => {
    if (!gridApi || batchRef.current.updates.size === 0) return;

    const startTime = performance.now();
    const updates = Array.from(batchRef.current.updates.values());
    const metrics = metricsRef.current;

    try {
      // Separate updates into add/update/remove
      const toAdd: any[] = [];
      const toUpdate: any[] = [];
      const toRemove: any[] = [];

      updates.forEach(update => {
        const rowNode = keyColumn && update[keyColumn] 
          ? getRowNode(update[keyColumn])
          : null;

        if (update._deleted) {
          toRemove.push(update);
        } else if (rowNode) {
          toUpdate.push(update);
        } else {
          toAdd.push(update);
        }
      });

      // Apply transactions
      const results: any[] = [];

      if (toAdd.length > 0 || toUpdate.length > 0 || toRemove.length > 0) {
        const result = gridApi.applyTransactionAsync({
          add: toAdd,
          update: toUpdate,
          remove: toRemove,
        }, (res) => {
          if (res.status === 'Cancelled') {
            metrics.droppedUpdates += updates.length;
          } else {
            metrics.successfulUpdates += updates.length;
          }
        });
        
        if (result) {
          results.push(result);
        }
      }

      // Update metrics
      const endTime = performance.now();
      const latency = endTime - startTime;
      metrics.updateLatency = (metrics.updateLatency * metrics.totalUpdates + latency) / (metrics.totalUpdates + 1);
      metrics.totalUpdates += updates.length;
      metrics.lastUpdateTime = Date.now();
      metrics.averageBatchSize = (metrics.averageBatchSize * (metrics.totalUpdates - updates.length) + updates.length) / metrics.totalUpdates;

      if (enablePerformanceTracking && onUpdateMetrics) {
        onUpdateMetrics({ ...metrics });
      }

    } catch (error) {
      metrics.failedUpdates += updates.length;
      onUpdateError?.(error as Error);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[DataSourceUpdates] Batch processing error:', error);
      }
    } finally {
      // Clear the batch
      batchRef.current.updates.clear();
      batchRef.current.timestamp = Date.now();
    }
  }, [gridApi, keyColumn, getRowNode, onUpdateError, enablePerformanceTracking, onUpdateMetrics]);

  // Schedule batch processing
  const scheduleBatch = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      processBatch();
    }, batchWindowMs);
  }, [processBatch, batchWindowMs]);

  // Handle individual updates
  const handleUpdate = useCallback((update: any) => {
    if (!updatesEnabled || !gridApi) return;

    const metrics = metricsRef.current;

    // Check batch size limit
    if (batchRef.current.updates.size >= maxBatchSize) {
      metrics.droppedUpdates++;
      return;
    }

    // Handle conflation
    if (enableConflation && keyColumn && update[keyColumn]) {
      const key = update[keyColumn];
      if (batchRef.current.updates.has(key)) {
        metrics.conflatedUpdates++;
      }
      batchRef.current.updates.set(key, update);
    } else {
      // Without conflation, use timestamp as key
      batchRef.current.updates.set(`${Date.now()}-${Math.random()}`, update);
    }

    scheduleBatch();
  }, [updatesEnabled, gridApi, keyColumn, enableConflation, maxBatchSize, scheduleBatch]);

  // Subscribe to updates
  useEffect(() => {
    if (!datasourceId || !updatesEnabled || !gridApi) return;

    const unsubscribe = subscribeToUpdates(datasourceId, handleUpdate);

    return () => {
      unsubscribe();
      
      // Process any remaining updates
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        processBatch();
      }
    };
  }, [datasourceId, updatesEnabled, gridApi, subscribeToUpdates, handleUpdate, processBatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  // Return useful methods and state
  return useMemo(() => ({
    metrics: metricsRef.current,
    processPendingUpdates: processBatch,
    clearPendingUpdates: () => {
      batchRef.current.updates.clear();
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    },
  }), [processBatch]);
}