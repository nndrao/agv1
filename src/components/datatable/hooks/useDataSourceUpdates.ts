import { useEffect, useRef, useCallback } from 'react';
import { GridApi } from 'ag-grid-community';
import { useDatasourceContext } from '@/contexts/DatasourceContext';
import { DataUpdate } from '@/services/datasource/ConflatedDataStore';
import { useDatasourceStore } from '@/stores/datasource.store';

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
  // enableConflation = true,
  onUpdateMetrics
}: UseDataSourceUpdatesOptions) {
  const { getDataStore, subscribeToUpdates, unsubscribeFromUpdates, dataStoreManager } = useDatasourceContext();
  const hasInitializedRef = useRef(false);
  const storeSubscriptionRef = useRef<(() => void) | null>(null);
  const metricsSubscriptionRef = useRef<(() => void) | null>(null);

  // Configure AG-Grid and initialize datasource when ready
  useEffect(() => {
    if (!gridApi || !datasourceId) {
      return;
    }

    // Set async transaction wait time
    if (asyncTransactionWaitMillis) {
      gridApi.setGridOption('asyncTransactionWaitMillis', asyncTransactionWaitMillis);
    }
    
    // Log key column configuration
    if (keyColumn) {
      // console.log('[useDataSourceUpdates] Using keyColumn:', keyColumn);
    } else {
      console.warn('[useDataSourceUpdates] No keyColumn specified - updates may not work correctly');
    }
    
    hasInitializedRef.current = true;
  }, [gridApi, datasourceId, keyColumn, asyncTransactionWaitMillis]);

  // Handle updates enable/disable and subscribe to ConflatedDataStore
  useEffect(() => {
    console.log('[useDataSourceUpdates] Effect running:', { 
      datasourceId, 
      hasGridApi: !!gridApi, 
      updatesEnabled 
    });
    
    if (!datasourceId || !gridApi) {
      return;
    }
    
    // Check if datasource exists in the store
    const { datasources } = useDatasourceStore.getState();
    const datasourceExists = datasources.some(ds => ds.id === datasourceId);
    
    if (!datasourceExists) {
      console.log(`[useDataSourceUpdates] Datasource ${datasourceId} not found in store, skipping`);
      return;
    }

    if (updatesEnabled) {
      console.log('[useDataSourceUpdates] Enabling updates for:', datasourceId);
      subscribeToUpdates(datasourceId);
      
      // Function to set up store subscription
      const setupStoreSubscription = () => {
        const dataStore = getDataStore(datasourceId);
        if (!dataStore) {
          // This can happen if the datasource hasn't been activated yet
          // The store will be created when activateDatasource is called
          console.log(`[useDataSourceUpdates] Waiting for data store creation for: ${datasourceId}`);
          return false;
        }
        
        // Subscribe to store updates
        const handleStoreUpdates = (updates: DataUpdate<any>[]) => {
        console.log(`[useDataSourceUpdates] handleStoreUpdates called with ${updates.length} updates, gridApi: ${!!gridApi}`);
        
        if (!gridApi || updates.length === 0) return;
        
        const startTime = Date.now();
        
        // Create AG-Grid transaction
        const transaction: any = {
          add: [],
          update: [],
          remove: []
        };
        
        // Process updates into transaction
        updates.forEach(update => {
          switch (update.operation) {
            case 'add':
              transaction.add.push(update.data);
              break;
            case 'update':
              transaction.update.push(update.data);
              break;
            case 'remove':
              transaction.remove.push(update.data);
              break;
          }
        });
        
        // Apply transaction to grid
        try {
          console.log('[useDataSourceUpdates] Applying transaction:', {
            add: transaction.add.length,
            update: transaction.update.length,
            remove: transaction.remove.length,
            hasGridApi: !!gridApi,
            keyColumn
          });
          
          const result = gridApi.applyTransaction(transaction);
          
          if (result) {
            const latency = Date.now() - startTime;
            console.log('[useDataSourceUpdates] Transaction applied:', {
              added: result.add?.length || 0,
              updated: result.update?.length || 0,
              removed: result.remove?.length || 0,
              latency: latency + 'ms'
            });
            
            // Record latency in statistics
            const statistics = dataStoreManager.getStatistics(datasourceId);
            if (statistics) {
              statistics.recordLatency(latency);
            }
          }
        } catch (error) {
          console.error('[useDataSourceUpdates] Error applying transaction:', error);
          if (onUpdateError) {
            onUpdateError(error as Error);
          }
        }
      };
      
        // Subscribe to updates event
        console.log(`[useDataSourceUpdates] Subscribing to dataStore updates for ${datasourceId}`);
        dataStore.on('updates', handleStoreUpdates);
        storeSubscriptionRef.current = () => dataStore.off('updates', handleStoreUpdates);
        
        // Subscribe to metrics if callback provided
        if (onUpdateMetrics) {
          const subscription = dataStore.getMetrics$().subscribe(metrics => {
            onUpdateMetrics({
              totalUpdates: metrics.totalUpdatesReceived,
              successfulUpdates: metrics.updatesApplied,
              failedUpdates: 0, // Not tracked in ConflatedDataStore
              lastUpdateTime: metrics.lastUpdateTimestamp,
              conflatedUpdates: metrics.updatesConflated,
              droppedUpdates: 0, // Not tracked in ConflatedDataStore
              updateLatency: metrics.averageUpdateRate
            });
          });
          metricsSubscriptionRef.current = () => subscription.unsubscribe();
        }
        
        return true; // Successfully set up subscription
      };
      
      // Try to set up subscription immediately
      if (!setupStoreSubscription()) {
        // If failed, retry after a delay
        const retryTimeout = setTimeout(() => {
          if (setupStoreSubscription()) {
            console.log(`[useDataSourceUpdates] Successfully connected to data store for ${datasourceId} after retry`);
          } else {
            console.log(`[useDataSourceUpdates] Still no data store for ${datasourceId} after retry`);
          }
        }, 1000);
        
        return () => {
          clearTimeout(retryTimeout);
          unsubscribeFromUpdates(datasourceId);
          if (storeSubscriptionRef.current) {
            storeSubscriptionRef.current();
            storeSubscriptionRef.current = null;
          }
          if (metricsSubscriptionRef.current) {
            metricsSubscriptionRef.current();
            metricsSubscriptionRef.current = null;
          }
        };
      }
    } else {
      // console.log('[useDataSourceUpdates] Disabling updates for:', datasourceId);
      unsubscribeFromUpdates(datasourceId);
      
      // Cleanup subscriptions
      if (storeSubscriptionRef.current) {
        storeSubscriptionRef.current();
        storeSubscriptionRef.current = null;
      }
      if (metricsSubscriptionRef.current) {
        metricsSubscriptionRef.current();
        metricsSubscriptionRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (storeSubscriptionRef.current) {
        storeSubscriptionRef.current();
        storeSubscriptionRef.current = null;
      }
      if (metricsSubscriptionRef.current) {
        metricsSubscriptionRef.current();
        metricsSubscriptionRef.current = null;
      }
    };
  }, [updatesEnabled, datasourceId, gridApi, subscribeToUpdates, unsubscribeFromUpdates, getDataStore, dataStoreManager, onUpdateError, onUpdateMetrics]);

  // Manual flush function
  const flushTransactions = useCallback(() => {
    if (gridApi && typeof gridApi.flushAsyncTransactions === 'function') {
      gridApi.flushAsyncTransactions();
    }
  }, [gridApi]);

  // Get current metrics
  const getMetrics = useCallback(() => {
    if (!datasourceId) return null;
    
    const dataStore = getDataStore(datasourceId);
    if (dataStore) {
      const metrics = dataStore.getMetrics();
      return {
        totalUpdates: metrics.totalUpdatesReceived,
        successfulUpdates: metrics.updatesApplied,
        failedUpdates: 0,
        lastUpdateTime: metrics.lastUpdateTimestamp,
        conflatedUpdates: metrics.updatesConflated,
        droppedUpdates: 0,
        updateLatency: metrics.averageUpdateRate
      };
    }
    
    return null;
  }, [datasourceId, getDataStore]);

  return {
    flushTransactions,
    getMetrics
  };
}