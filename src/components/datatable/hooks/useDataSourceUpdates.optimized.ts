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
  initialData?: any[];
}

export interface UpdateMetrics {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  lastUpdateTime: number;
}

export function useDataSourceUpdates({
  datasourceId,
  gridApi,
  keyColumn,
  asyncTransactionWaitMillis = 60,
  updatesEnabled = false,
  onUpdateError
}: UseDataSourceUpdatesOptions) {
  const { updateEmitter, subscribeToUpdates, initializeWorkerForGrid, unsubscribeFromUpdates } = useDatasourceContext();
  const metricsRef = useRef<UpdateMetrics>({
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    lastUpdateTime: 0
  });
  const hasInitializedRef = useRef(false);
  
  // Batch updates to prevent UI blocking
  const pendingUpdatesRef = useRef<any[]>([]);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // MEMORY LEAK FIX: Clear these maps periodically
  const changedColumnsMapRef = useRef<Map<string, Set<string>>>(new Map());
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configure AG-Grid and initialize datasource when ready
  useEffect(() => {
    if (!gridApi || !datasourceId || hasInitializedRef.current) {
      return;
    }

    // Set async transaction wait time
    if (asyncTransactionWaitMillis) {
      gridApi.setGridOption('asyncTransactionWaitMillis', asyncTransactionWaitMillis);
    }
    
    // Ensure cell change flash is enabled
    // gridApi.setGridOption('enableCellChangeFlash', true);
    // gridApi.setGridOption('cellFlashDelay', 500);
    // gridApi.setGridOption('cellFadeDelay', 1000);
    
    // Set getRowId if keyColumn is specified
    if (keyColumn) {
      console.log('[useDataSourceUpdates] Setting up getRowId for keyColumn:', keyColumn);
    } else {
      console.warn('[useDataSourceUpdates] No keyColumn specified - updates may not work correctly');
    }

    // PERFORMANCE: Use a single check instead of multiple timeouts
    let initCheckCount = 0;
    const maxInitChecks = 10;
    
    const checkAndInitialize = () => {
      const rowCount = gridApi.getDisplayedRowCount();
      if (rowCount > 0 && !hasInitializedRef.current) {
        console.log('[useDataSourceUpdates] Grid has data, initializing datasource updates');

        // PERFORMANCE: Use more efficient data collection
        const gridData: any[] = [];
        gridApi.forEachNodeAfterFilterAndSort((node) => {
          if (node.data) {
            gridData.push(node.data);
          }
        });

        // Initialize worker with grid data
        initializeWorkerForGrid(datasourceId, gridData);

        // Only subscribe to updates if enabled
        if (updatesEnabled) {
          subscribeToUpdates(datasourceId);
        }
        
        hasInitializedRef.current = true;
        return true;
      }
      return false;
    };

    // Check immediately
    if (!checkAndInitialize() && initCheckCount < maxInitChecks) {
      // If no data yet, check again with exponential backoff
      const timer = setTimeout(() => {
        initCheckCount++;
        checkAndInitialize();
      }, 100 * Math.pow(2, initCheckCount));
      
      return () => clearTimeout(timer);
    }
  }, [gridApi, datasourceId, keyColumn, asyncTransactionWaitMillis, initializeWorkerForGrid, subscribeToUpdates, updatesEnabled]);

  // Handle updates enable/disable after initialization
  useEffect(() => {
    if (!datasourceId || !hasInitializedRef.current) {
      return;
    }

    if (updatesEnabled) {
      console.log('[useDataSourceUpdates] Enabling updates for:', datasourceId);
      subscribeToUpdates(datasourceId);
    } else if (unsubscribeFromUpdates) {
      console.log('[useDataSourceUpdates] Disabling updates for:', datasourceId);
      unsubscribeFromUpdates(datasourceId);
    }
  }, [updatesEnabled, datasourceId, subscribeToUpdates, unsubscribeFromUpdates]);

  // PERFORMANCE: Process updates more efficiently
  const processBatchedUpdates = useCallback(() => {
    if (!gridApi || pendingUpdatesRef.current.length === 0) return;

    const updates = pendingUpdatesRef.current;
    pendingUpdatesRef.current = [];

    // Combine all updates into a single transaction
    const combinedTransaction: any = {
      add: [],
      update: [],
      remove: []
    };

    // Use a map to deduplicate updates by row ID
    const updateMap = new Map<string, any>();
    
    // PERFORMANCE: Limit the number of change detections
    const maxChangeDetections = 100;
    let changeDetectionCount = 0;
    
    updates.forEach(transaction => {
      if (transaction.add) combinedTransaction.add.push(...transaction.add);
      if (transaction.remove) combinedTransaction.remove.push(...transaction.remove);
      
      // Merge updates for the same row
      if (transaction.update && keyColumn) {
        transaction.update.forEach((item: any) => {
          const rowId = item[keyColumn];
          
          // PERFORMANCE: Only detect changes for first N updates
          if (changeDetectionCount < maxChangeDetections) {
            const rowNode = gridApi.getRowNode(String(rowId));
            if (rowNode && rowNode.data) {
              const changedCols = new Set<string>();
              
              Object.keys(item).forEach(colId => {
                if (colId !== keyColumn && rowNode.data[colId] !== item[colId]) {
                  changedCols.add(colId);
                }
              });
              
              if (changedCols.size > 0) {
                changedColumnsMapRef.current.set(rowId, changedCols);
              }
              changeDetectionCount++;
            }
          }
          
          if (updateMap.has(rowId)) {
            updateMap.set(rowId, { ...updateMap.get(rowId), ...item });
          } else {
            updateMap.set(rowId, item);
          }
        });
      }
    });

    // Convert map back to array
    combinedTransaction.update = Array.from(updateMap.values());

    // PERFORMANCE: Use async transaction for large updates
    const useAsync = combinedTransaction.update.length > 50;
    
    if (useAsync) {
      gridApi.applyTransactionAsync(combinedTransaction, (res) => {
        if (res) {
          metricsRef.current.successfulUpdates++;
          // Skip flashing for large async updates
        }
      });
    } else {
      const res = gridApi.applyTransaction(combinedTransaction);
      
      if (res && res.update && res.update.length > 0 && keyColumn) {
        metricsRef.current.successfulUpdates++;
        
        // Flash changed cells only for small updates
        requestAnimationFrame(() => {
          res.update.forEach(rowNode => {
            const rowId = rowNode.data[keyColumn];
            const changedColumns = changedColumnsMapRef.current.get(rowId);
            
            if (changedColumns && changedColumns.size > 0) {
              gridApi.flashCells({
                rowNodes: [rowNode],
                columns: Array.from(changedColumns)
              });
              
              // MEMORY: Clean up after use
              changedColumnsMapRef.current.delete(rowId);
            }
          });
        });
      }
    }
    
    // MEMORY: Periodically clean up the changed columns map
    if (changedColumnsMapRef.current.size > 1000) {
      changedColumnsMapRef.current.clear();
    }
  }, [gridApi, keyColumn]);

  // Subscribe to update events
  useEffect(() => {
    if (!datasourceId || !updateEmitter || !gridApi) return;

    // Create event handler inline to avoid dependency issues
    const eventHandler = (event: any) => {
      if (event.type === 'transaction' && event.transaction) {
        const { transaction } = event;
        metricsRef.current.totalUpdates++;
        metricsRef.current.lastUpdateTime = Date.now();

        try {
          // Check if grid has row data before applying updates
          const rowCount = gridApi.getDisplayedRowCount();
          
          // Skip updates if grid is not ready
          if (rowCount === 0 && transaction.update?.length > 0) {
            return;
          }

          // Add to pending updates
          pendingUpdatesRef.current.push(transaction);

          // Clear existing timer
          if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
          }

          // Set new timer to process batch
          updateTimerRef.current = setTimeout(processBatchedUpdates, asyncTransactionWaitMillis);
          
        } catch (error) {
          metricsRef.current.failedUpdates++;
          console.error('[useDataSourceUpdates] Error handling transaction:', error);
          if (onUpdateError) {
            onUpdateError(error as Error);
          }
        }
      }
    };

    updateEmitter.on(datasourceId, eventHandler);
    
    // MEMORY: Set up periodic cleanup
    cleanupTimerRef.current = setInterval(() => {
      // Clear old entries from changedColumnsMap
      if (changedColumnsMapRef.current.size > 0) {
        // const now = Date.now();
        // const ageLimit = 60000; // 1 minute
        
        // Since we can't track age directly, just clear if too large
        if (changedColumnsMapRef.current.size > 500) {
          changedColumnsMapRef.current.clear();
        }
      }
      
      // Clear metrics periodically to prevent number overflow
      if (metricsRef.current.totalUpdates > Number.MAX_SAFE_INTEGER / 2) {
        metricsRef.current = {
          totalUpdates: 0,
          successfulUpdates: 0,
          failedUpdates: 0,
          lastUpdateTime: Date.now()
        };
      }
    }, 60000); // Every minute

    // Cleanup
    return () => {
      updateEmitter.off(datasourceId, eventHandler);
      hasInitializedRef.current = false;
      
      // Clear any pending update timer
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
      
      // Clear cleanup timer
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      
      // Clear pending updates
      pendingUpdatesRef.current = [];
      
      // Clear changed columns map
      changedColumnsMapRef.current.clear();
    };
  }, [datasourceId, updateEmitter, gridApi, asyncTransactionWaitMillis, onUpdateError, processBatchedUpdates]);

  // Manual flush function
  const flushTransactions = useCallback(() => {
    // Process any pending updates immediately
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    
    processBatchedUpdates();
    
    // Also flush async transactions if available
    if (gridApi && typeof gridApi.flushAsyncTransactions === 'function') {
      gridApi.flushAsyncTransactions();
    }
  }, [gridApi, processBatchedUpdates]);

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  return {
    flushTransactions,
    getMetrics
  };
}