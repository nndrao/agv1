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
  
  // Track pending changes for cell-level flashing
  const pendingChangesRef = useRef<Map<string, Set<string>>>(new Map());
  
  // Batch updates to prevent UI blocking
  const pendingUpdatesRef = useRef<any[]>([]);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    gridApi.setGridOption('enableCellChangeFlash', true);
    gridApi.setGridOption('cellFlashDelay', 500);
    gridApi.setGridOption('cellFadeDelay', 1000);
    
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
            console.warn('[useDataSourceUpdates] Skipping updates - grid has no data yet');
            return;
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

            // Use a map to deduplicate updates by row ID
            const updateMap = new Map<string, any>();
            // Track which columns changed per row
            const changedColumnsMap = new Map<string, Set<string>>();
            
            updates.forEach(transaction => {
              if (transaction.add) combinedTransaction.add.push(...transaction.add);
              if (transaction.remove) combinedTransaction.remove.push(...transaction.remove);
              
              // Merge updates for the same row
              if (transaction.update && keyColumn) {
                transaction.update.forEach((item: any) => {
                  const rowId = item[keyColumn];
                  
                  // Get current row data to compare
                  const rowNode = gridApi.getRowNode(String(rowId));
                  if (rowNode && rowNode.data) {
                    // Track changed columns
                    const changedCols = changedColumnsMap.get(rowId) || new Set<string>();
                    
                    Object.keys(item).forEach(colId => {
                      if (colId !== keyColumn && rowNode.data[colId] !== item[colId]) {
                        changedCols.add(colId);
                      }
                    });
                    
                    changedColumnsMap.set(rowId, changedCols);
                  }
                  
                  if (updateMap.has(rowId)) {
                    // Merge with existing update
                    updateMap.set(rowId, { ...updateMap.get(rowId), ...item });
                  } else {
                    updateMap.set(rowId, item);
                  }
                });
              }
            });

            // Convert map back to array
            combinedTransaction.update = Array.from(updateMap.values());

            // Apply transaction with cell flashing
            console.log('[useDataSourceUpdates] Applying transaction:', {
              updates: combinedTransaction.update.length,
              adds: combinedTransaction.add.length,
              removes: combinedTransaction.remove.length
            });
            
            const res = gridApi.applyTransaction(combinedTransaction);
            
            if (res) {
              metricsRef.current.successfulUpdates++;
              
              console.log('[useDataSourceUpdates] Transaction result:', {
                updated: res.update?.length || 0,
                added: res.add?.length || 0,
                removed: res.remove?.length || 0
              });
              
              // Flash changed cells with a small delay
              if (res.update && res.update.length > 0 && keyColumn) {
                console.log('[useDataSourceUpdates] Flashing cells for', res.update.length, 'rows');
                
                // Use setTimeout to ensure DOM has updated
                setTimeout(() => {
                  res.update.forEach(rowNode => {
                    const rowId = rowNode.data[keyColumn];
                    const changedColumns = changedColumnsMap.get(rowId);
                    
                    if (changedColumns && changedColumns.size > 0) {
                      const columnsArray = Array.from(changedColumns);
                      console.log(`[useDataSourceUpdates] Flashing ${columnsArray.length} columns for row ${rowId}:`, columnsArray);
                      
                      gridApi.flashCells({
                        rowNodes: [rowNode],
                        columns: columnsArray
                      });
                    } else {
                      // If we couldn't detect specific columns, flash the whole row
                      console.log(`[useDataSourceUpdates] No specific columns detected, flashing whole row ${rowId}`);
                      gridApi.flashCells({
                        rowNodes: [rowNode]
                      });
                    }
                  });
                }, 0);
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
    };
  }, [datasourceId, updateEmitter, gridApi, keyColumn, asyncTransactionWaitMillis, onUpdateError]);

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