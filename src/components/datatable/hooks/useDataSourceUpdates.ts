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
  enableConflation?: boolean; // Whether to merge updates for same row within batch window
  onUpdateMetrics?: (metrics: UpdateMetrics) => void; // Callback for metrics updates
}

export interface UpdateMetrics {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  lastUpdateTime: number;
  conflatedUpdates: number; // Number of updates merged due to conflation
  droppedUpdates: number; // Number of updates dropped
  updateLatency: number; // Average latency in ms
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
  const { updateEmitter, subscribeToUpdates, initializeWorkerForGrid, unsubscribeFromUpdates, syncWorkerState } = useDatasourceContext();
  const metricsRef = useRef<UpdateMetrics>({
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    lastUpdateTime: 0,
    conflatedUpdates: 0,
    droppedUpdates: 0,
    updateLatency: 0
  });
  const hasInitializedRef = useRef(false);
  
  // REMOVED: Unused map that was causing memory leak
  // const pendingChangesRef = useRef<Map<string, Set<string>>>(new Map());
  
  // Batch updates to prevent UI blocking
  const pendingUpdatesRef = useRef<any[]>([]);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configure AG-Grid and initialize datasource when ready
  useEffect(() => {
    if (!gridApi || !datasourceId || hasInitializedRef.current) {
      return;
    }

    // Set async transaction wait time
    if (asyncTransactionWaitMillis) {
      gridApi.setGridOption('asyncTransactionWaitMillis', asyncTransactionWaitMillis);
    }
    
    // Cell flash is now configured at column level via DEFAULT_COL_DEF
    
    // Set getRowId if keyColumn is specified
    if (keyColumn) {
      console.log('[useDataSourceUpdates] Setting up getRowId for keyColumn:', keyColumn);
      // getRowId needs to be set as part of grid options, not via setGridOption
      // We'll need to ensure the grid is configured with getRowId when initialized
    } else {
      console.warn('[useDataSourceUpdates] No keyColumn specified - updates may not work correctly');
    }

    // Wait for grid to have data before initializing
    const checkAndInitialize = () => {
      const rowCount = gridApi.getDisplayedRowCount();
      if (rowCount > 0 && !hasInitializedRef.current) {
        console.log('[useDataSourceUpdates] Grid has data, initializing datasource updates:', {
          datasourceId,
          rowCount,
          keyColumn
        });

        // Get all current data from grid
        const gridData: any[] = [];
        gridApi.forEachNode((node) => {
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
      }
    };

    // Check immediately
    checkAndInitialize();

    // If no data yet, check again after a delay
    if (!hasInitializedRef.current) {
      const timer = setTimeout(checkAndInitialize, 100);
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
  
  // Periodic sync of worker state with grid state
  useEffect(() => {
    if (!datasourceId || !gridApi || !updatesEnabled || !syncWorkerState) {
      return;
    }
    
    // Sync every 30 seconds to catch any drift
    const syncInterval = setInterval(() => {
      const rowCount = gridApi.getDisplayedRowCount();
      if (rowCount > 0) {
        const currentData: any[] = [];
        gridApi.forEachNodeAfterFilterAndSort((node) => {
          if (node.data) {
            currentData.push(node.data);
          }
        });
        
        console.log('[useDataSourceUpdates] Periodic sync with worker:', currentData.length);
        syncWorkerState(datasourceId, currentData);
      }
    }, 30000); // 30 seconds
    
    syncTimerRef.current = syncInterval;
    
    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [datasourceId, gridApi, updatesEnabled, syncWorkerState]);



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
          // Check if grid is initialized (not just row count)
          const gridReady = gridApi.isDestroyed !== undefined && !gridApi.isDestroyed();
          const rowCount = gridApi.getDisplayedRowCount();
          
          // Only skip updates if grid is not initialized at all
          if (!gridReady) {
            console.warn('[useDataSourceUpdates] Dropping updates - grid not initialized');
            metricsRef.current.droppedUpdates += transaction.update?.length || 0;
            return;
          }
          
          // If grid is ready but has 0 rows (e.g., due to filtering), still process updates
          if (rowCount === 0 && transaction.update?.length > 0) {
            console.log('[useDataSourceUpdates] Processing updates even though display count is 0 (might be filtered)');
          }

          // Add to pending updates
          pendingUpdatesRef.current.push(transaction);

          // Clear existing timer
          if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
          }

          // Set new timer to process batch
          updateTimerRef.current = setTimeout(() => {
            // Process batched updates inline
            if (!gridApi || pendingUpdatesRef.current.length === 0) return;

            const updates = pendingUpdatesRef.current;
            pendingUpdatesRef.current = [];

            // Combine all updates into a single transaction
            const combinedTransaction: any = {
              add: [],
              update: [],
              remove: []
            };

            // Track conflation metrics
            const updateStartTime = Date.now();
            const updateCountByRow = new Map<string, number>();
            
            // Use a map to deduplicate updates by row ID (if conflation is enabled)
            const updateMap = new Map<string, any>();
            // Track which columns changed per row
            const changedColumnsMap = new Map<string, Set<string>>();
            
            // First pass: collect old values before any updates
            const oldValuesMap = new Map<string, any>();
            updates.forEach(transaction => {
              if (transaction.update && keyColumn) {
                transaction.update.forEach((item: any) => {
                  const rowId = String(item[keyColumn]);
                  if (!oldValuesMap.has(rowId)) {
                    const rowNode = gridApi.getRowNode(rowId);
                    if (rowNode && rowNode.data) {
                      oldValuesMap.set(rowId, { ...rowNode.data });
                    }
                  }
                });
              }
            });
            
            // Second pass: process updates and detect changes
            updates.forEach(transaction => {
              if (transaction.add) combinedTransaction.add.push(...transaction.add);
              if (transaction.remove) combinedTransaction.remove.push(...transaction.remove);
              
              // Merge updates for the same row
              if (transaction.update && keyColumn) {
                transaction.update.forEach((item: any) => {
                  const rowId = String(item[keyColumn]);
                  
                  // Track update count for conflation metrics
                  updateCountByRow.set(rowId, (updateCountByRow.get(rowId) || 0) + 1);
                  
                  // Compare with old values we stored
                  const oldData = oldValuesMap.get(rowId);
                  if (oldData) {
                    // Track changed columns
                    const changedCols = changedColumnsMap.get(rowId) || new Set<string>();
                    
                    // Define important columns to flash (for performance and visibility)
                    const importantColumns = [
                      'marketValue', 'totalValue', 'currentPrice', 
                      'pnl', 'unrealizedPnl', 'dailyPnl',
                      'spread', 'rating', 'dv01'
                    ];
                    
                    Object.keys(item).forEach(colId => {
                      // Only track important columns for flashing
                      if (colId !== keyColumn && 
                          importantColumns.includes(colId) && 
                          oldData[colId] !== item[colId]) {
                        changedCols.add(colId);
                      }
                    });
                    
                    if (changedCols.size > 0) {
                      changedColumnsMap.set(rowId, changedCols);
                    }
                  }
                  
                  if (enableConflation) {
                    if (updateMap.has(rowId)) {
                      // Merge with existing update (conflation)
                      updateMap.set(rowId, { ...updateMap.get(rowId), ...item });
                    } else {
                      updateMap.set(rowId, item);
                    }
                  } else {
                    // No conflation - add all updates
                    combinedTransaction.update.push(item);
                  }
                });
              }
            });

            // Calculate conflation metrics
            let conflatedCount = 0;
            
            // Convert map back to array if using conflation
            if (enableConflation) {
              combinedTransaction.update = Array.from(updateMap.values());
              
              // Calculate how many updates were conflated
              updateCountByRow.forEach((count) => {
                if (count > 1) {
                  conflatedCount += (count - 1); // Number of updates that were merged
                }
              });
              metricsRef.current.conflatedUpdates += conflatedCount;
            }

            // Always use sync transaction for cell flashing to work
            // AG-Grid will automatically flash cells that have enableCellChangeFlash: true
            const res = gridApi.applyTransaction(combinedTransaction);
            
            if (res) {
              metricsRef.current.successfulUpdates++;
              
              // Calculate latency
              const latency = Date.now() - updateStartTime;
              // Update rolling average latency
              if (metricsRef.current.updateLatency === 0) {
                metricsRef.current.updateLatency = latency;
              } else {
                // Exponential moving average
                metricsRef.current.updateLatency = metricsRef.current.updateLatency * 0.9 + latency * 0.1;
              }
              
              console.log('[useDataSourceUpdates] Transaction applied:', {
                updated: res.update?.length || 0,
                added: res.add?.length || 0,
                removed: res.remove?.length || 0,
                conflated: conflatedCount || 0,
                latency: latency + 'ms'
              });
              
              // Call metrics callback if provided
              if (onUpdateMetrics) {
                onUpdateMetrics({ ...metricsRef.current });
              }
            }
          }, asyncTransactionWaitMillis);
          
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

    // Cleanup
    return () => {
      updateEmitter.off(datasourceId, eventHandler);
      hasInitializedRef.current = false;
      
      // Clear any pending update timer
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
      
      // Clear pending updates to prevent memory leak
      pendingUpdatesRef.current = [];
    };
  }, [datasourceId, updateEmitter, gridApi, keyColumn, asyncTransactionWaitMillis, onUpdateError, enableConflation, onUpdateMetrics]);

  // Manual flush function
  const flushTransactions = useCallback(() => {
    if (gridApi && typeof gridApi.flushAsyncTransactions === 'function') {
      gridApi.flushAsyncTransactions();
    }
  }, [gridApi]);

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  return {
    flushTransactions,
    getMetrics
  };
}