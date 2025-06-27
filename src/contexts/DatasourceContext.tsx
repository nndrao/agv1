import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { DatasourceConfig, useDatasourceStore } from '@/stores/datasource.store';
import { StompDatasourceProvider, StompStatistics } from '@/providers/StompDatasourceProvider';
import { UpdateEventEmitter } from '@/utils/UpdateEventEmitter';
import { DataStoreManager } from '@/services/datasource/DataStoreManager';
import { ConflatedDataStore } from '@/services/datasource/ConflatedDataStore';
import { DatasourceStatistics } from '@/services/datasource/DatasourceStatistics';

interface DatasourceContextType {
  // Currently active datasources
  activeDatasources: Map<string, DatasourceConfig>;
  
  // Data from active datasources (initial snapshot only)
  datasourceData: Map<string, any[]>;
  
  // Connection status
  connectionStatus: Map<string, 'connecting' | 'connected' | 'error' | 'disconnected'>;
  
  // Snapshot status
  snapshotStatus: Map<string, 'loading' | 'complete' | 'error'>;
  
  // Statistics for datasources (new comprehensive stats)
  datasourceStatistics: Map<string, DatasourceStatistics>;
  
  // Component usage tracking
  componentUsage: Map<string, Set<string>>; // datasourceId -> Set of componentIds
  
  // Data store manager
  dataStoreManager: DataStoreManager;
  
  // Update event emitter
  updateEmitter: UpdateEventEmitter;
  
  // Actions
  activateDatasource: (datasourceId: string) => Promise<void>;
  deactivateDatasource: (datasourceId: string) => void;
  refreshDatasource: (datasourceId: string) => Promise<void>;
  registerComponent: (datasourceId: string, componentId: string) => void;
  unregisterComponent: (datasourceId: string, componentId: string) => void;
  subscribeToUpdates: (datasourceId: string) => void;
  unsubscribeFromUpdates: (datasourceId: string) => void;
  initializeWorkerForGrid: (datasourceId: string, gridData: any[]) => void;
  syncWorkerState: (datasourceId: string, currentData: any[]) => void;
  getProvider: (datasourceId: string) => any | undefined;
  getDataStore: (datasourceId: string) => ConflatedDataStore<any> | undefined;
  
  // UI Controls
  showDatasourceList: boolean;
  setShowDatasourceList: (show: boolean) => void;
  
  // Update batching configuration
  setBatchingConfig: (enabled: boolean, interval?: number) => void;
  getBatchingMetrics: () => any;
}

const DatasourceContext = createContext<DatasourceContextType | undefined>(undefined);

export const useDatasourceContext = () => {
  const context = useContext(DatasourceContext);
  if (!context) {
    throw new Error('useDatasourceContext must be used within a DatasourceProvider');
  }
  return context;
};

interface DatasourceProviderProps {
  children: React.ReactNode;
}

export const DatasourceProvider: React.FC<DatasourceProviderProps> = ({ children }) => {
  const { getDatasource, datasources } = useDatasourceStore();
  
  // State
  const [activeDatasources, setActiveDatasources] = useState<Map<string, DatasourceConfig>>(new Map());
  const [datasourceData, setDatasourceData] = useState<Map<string, any[]>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<Map<string, 'connecting' | 'connected' | 'error' | 'disconnected'>>(new Map());
  const [snapshotStatus, setSnapshotStatus] = useState<Map<string, 'loading' | 'complete' | 'error'>>(new Map());
  const [datasourceStatistics, setDatasourceStatistics] = useState<Map<string, DatasourceStatistics>>(new Map());
  const [componentUsage, setComponentUsage] = useState<Map<string, Set<string>>>(new Map());
  const [providers, setProviders] = useState<Map<string, StompDatasourceProvider>>(new Map());
  const [showDatasourceList, setShowDatasourceList] = useState(false);
  
  // Initialize data store manager
  const dataStoreManager = useRef(DataStoreManager.getInstance()).current;
  
  // Initialize update event emitter with batching DISABLED (conflation happens in ConflatedDataStore)
  const updateEmitterRef = useRef<UpdateEventEmitter>(new UpdateEventEmitter(10000, { enabled: false }));
  const updateEmitter = updateEmitterRef.current;
  
  // Initialize Web Worker
  // NOTE: Worker is being phased out in favor of direct processing for better performance
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  
  // Track snapshot completion status with ref for access in callbacks
  const snapshotCompleteRef = useRef<Map<string, boolean>>(new Map());
  
  // Track update subscriptions
  const updateSubscriptionsRef = useRef<Map<string, ((data: any) => void) | null>>(new Map());
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      updateEmitter.shutdown();
      dataStoreManager.clear();
    };
  }, []);
  
  // Activate a datasource
  const activateDatasource = useCallback(async (datasourceId: string) => {
    // Check if already active
    if (activeDatasources.has(datasourceId)) {
      console.log(`[DatasourceContext] Datasource ${datasourceId} is already active`);
      return;
    }
    
    const datasource = getDatasource(datasourceId);
    if (!datasource) {
      console.error(`[DatasourceContext] Datasource ${datasourceId} not found`);
      return;
    }
    
    // Update status
    setConnectionStatus(prev => new Map(prev).set(datasourceId, 'connecting'));
    setSnapshotStatus(prev => new Map(prev).set(datasourceId, 'loading'));
    snapshotCompleteRef.current.set(datasourceId, false);
    
    try {
      if (datasource.type === 'stomp') {
        const provider = new StompDatasourceProvider({
          ...datasource,
          messageRate: '1000', // TODO: Get from datasource config
        });
        
        // Store provider for later cleanup
        setProviders(prev => new Map(prev).set(datasourceId, provider));
        
        // Create conflated data store for this datasource
        const dataStore = dataStoreManager.createStore(datasource);
        const statistics = dataStoreManager.getStatistics(datasourceId)!;
        
        // Start snapshot tracking
        statistics.startSnapshot();
        
        // Connect and fetch data
        const result = await provider.fetchSnapshot(); // Fetch all available data
        
        if (result.success && result.data) {
          // Set snapshot data in the conflated store
          dataStore.setSnapshot(result.data || []);
          
          // Complete snapshot tracking
          statistics.completeSnapshot(result.data?.length || 0, result.statistics?.bytesReceived || 0);
          
          // Store the datasource and its data (for backward compatibility)
          setActiveDatasources(prev => new Map(prev).set(datasourceId, datasource));
          setDatasourceData(prev => new Map(prev).set(datasourceId, result.data || []));
          setConnectionStatus(prev => new Map(prev).set(datasourceId, 'connected'));
          setSnapshotStatus(prev => new Map(prev).set(datasourceId, 'complete'));
          
          // Store statistics reference
          setDatasourceStatistics(prev => new Map(prev).set(datasourceId, statistics));
          
          // Subscribe data store to updates from update emitter
          updateEmitter.on(datasourceId, (event) => {
            if (event.type === 'transaction' && event.transaction) {
              const { transaction } = event;
              // Apply updates to the conflated store
              if (transaction.update) {
                dataStore.addBulkUpdates(transaction.update, 'update');
              }
              if (transaction.add) {
                dataStore.addBulkUpdates(transaction.add, 'add');
              }
              if (transaction.remove) {
                dataStore.addBulkUpdates(transaction.remove, 'remove');
              }
              
              // Don't update datasourceData map on every update - this causes re-renders
              // Only update it when explicitly needed
            }
          });
          
          console.log(`[DatasourceContext] Datasource ${datasource.name} activated with ${result.data.length} rows`);
        } else {
          throw new Error(result.error || 'Failed to connect');
        }
      }
      // TODO: Handle REST datasources
    } catch (error) {
      console.error(`[DatasourceContext] Error activating datasource ${datasourceId}:`, error);
      setConnectionStatus(prev => new Map(prev).set(datasourceId, 'error'));
      setSnapshotStatus(prev => new Map(prev).set(datasourceId, 'error'));
      snapshotCompleteRef.current.delete(datasourceId);
    }
  }, [getDatasource, activeDatasources]);
  
  // Deactivate a datasource
  const deactivateDatasource = useCallback((datasourceId: string) => {
    // Clean up provider
    const provider = providers.get(datasourceId);
    if (provider) {
      provider.disconnect();
      setProviders(prev => {
        const newMap = new Map(prev);
        newMap.delete(datasourceId);
        return newMap;
      });
    }
    
    // Remove from update emitter
    updateEmitter.removeAllListeners(datasourceId);
    
    // Remove from data store manager
    dataStoreManager.removeStore(datasourceId);
    
    // Remove from active datasources
    setActiveDatasources(prev => {
      const newMap = new Map(prev);
      newMap.delete(datasourceId);
      return newMap;
    });
    
    // Remove data
    setDatasourceData(prev => {
      const newMap = new Map(prev);
      newMap.delete(datasourceId);
      return newMap;
    });
    
    // Update status
    setConnectionStatus(prev => new Map(prev).set(datasourceId, 'disconnected'));
    setSnapshotStatus(prev => {
      const newMap = new Map(prev);
      newMap.delete(datasourceId);
      return newMap;
    });
    setDatasourceStatistics(prev => {
      const newMap = new Map(prev);
      newMap.delete(datasourceId);
      return newMap;
    });
    snapshotCompleteRef.current.delete(datasourceId);
    updateSubscriptionsRef.current.delete(datasourceId);
    
    console.log(`[DatasourceContext] Datasource ${datasourceId} deactivated`);
  }, [providers, updateEmitter, dataStoreManager]);
  
  // Refresh a datasource
  const refreshDatasource = useCallback(async (datasourceId: string) => {
    // Deactivate and reactivate
    deactivateDatasource(datasourceId);
    await activateDatasource(datasourceId);
  }, [activateDatasource, deactivateDatasource]);
  
  // Register a component as using a datasource
  const registerComponent = useCallback((datasourceId: string, componentId: string) => {
    setComponentUsage(prev => {
      const newMap = new Map(prev);
      const components = newMap.get(datasourceId) || new Set();
      components.add(componentId);
      newMap.set(datasourceId, components);
      return newMap;
    });
  }, []);
  
  // Unregister a component
  const unregisterComponent = useCallback((datasourceId: string, componentId: string) => {
    setComponentUsage(prev => {
      const newMap = new Map(prev);
      const components = newMap.get(datasourceId);
      if (components) {
        components.delete(componentId);
        if (components.size === 0) {
          newMap.delete(datasourceId);
        } else {
          newMap.set(datasourceId, components);
        }
      }
      return newMap;
    });
  }, []);

  // Subscribe to updates for a datasource (called by components when ready)
  const subscribeToUpdates = useCallback((datasourceId: string) => {
    const provider = providers.get(datasourceId);
    if (!provider) {
      console.warn(`[DatasourceContext] Cannot subscribe - no provider for ${datasourceId}`);
      return;
    }

    // Check if already subscribed
    if (updateSubscriptionsRef.current.has(datasourceId)) {
      console.log(`[DatasourceContext] Already subscribed to updates for ${datasourceId}`);
      return;
    }

    console.log(`[DatasourceContext] Subscribing to updates for ${datasourceId}`);
    
    // Mark as ready for updates immediately to avoid dropping updates
    snapshotCompleteRef.current.set(datasourceId, true);
    console.log(`[DatasourceContext] Marked ${datasourceId} as ready for updates`);
    
    // Create update handler
    const updateHandler = async (updatedData: any) => {
      // Process all updates - snapshot is considered complete
      if (!snapshotCompleteRef.current.get(datasourceId)) {
        console.warn(`[DatasourceContext] Processing update for ${datasourceId} even though snapshot flag is false`);
      }
      
      // Track update in statistics
      const statistics = dataStoreManager.getStatistics(datasourceId);
      if (statistics) {
        statistics.recordUpdate(true);
      }
      
      const transaction: any = {
        update: Array.isArray(updatedData) ? updatedData : [updatedData]
      };
      
      console.log(`[DatasourceContext] Sending ${transaction.update.length} updates to event emitter`);
      
      // Emit transaction event directly
      await updateEmitter.enqueue({
        type: 'transaction',
        datasourceId,
        transaction,
        timestamp: Date.now()
      });
    };
    
    // Subscribe to real-time updates
    provider.subscribeToUpdates(updateHandler);
    
    // Store the handler reference
    updateSubscriptionsRef.current.set(datasourceId, updateHandler);
  }, [providers]);

  // Initialize worker with grid data (kept for backward compatibility, but no-op)
  const initializeWorkerForGrid = useCallback((datasourceId: string, gridData: any[]) => {
    // This is now a no-op as we're using ConflatedDataStore instead of workers
    console.log(`[DatasourceContext] initializeWorkerForGrid called (no-op) for ${datasourceId} with ${gridData.length} rows`);
  }, []);
  
  // Sync worker state with grid state (kept for backward compatibility, but no-op)
  const syncWorkerState = useCallback((datasourceId: string, currentData: any[]) => {
    // This is now a no-op as we're using ConflatedDataStore instead of workers
    console.log(`[DatasourceContext] syncWorkerState called (no-op) for ${datasourceId} with ${currentData.length} rows`);
  }, []);

  // Unsubscribe from updates for a datasource
  const unsubscribeFromUpdates = useCallback((datasourceId: string) => {
    // Check if subscribed
    if (!updateSubscriptionsRef.current.has(datasourceId)) {
      console.log(`[DatasourceContext] Not subscribed to updates for ${datasourceId}`);
      return;
    }

    console.log(`[DatasourceContext] Unsubscribing from updates for ${datasourceId}`);
    
    // Mark as not ready for updates
    snapshotCompleteRef.current.set(datasourceId, false);
    
    // Remove the handler reference (provider will handle cleanup internally)
    updateSubscriptionsRef.current.delete(datasourceId);
  }, []);
  
  // Get provider for a datasource
  const getProvider = useCallback((datasourceId: string) => {
    return providers.get(datasourceId);
  }, [providers]);
  
  // Get data store for a datasource
  const getDataStore = useCallback((datasourceId: string) => {
    return dataStoreManager.getStore(datasourceId);
  }, [dataStoreManager]);
  
  // Set batching configuration
  const setBatchingConfig = useCallback((enabled: boolean, interval?: number) => {
    updateEmitter.setBatching(enabled, interval);
  }, [updateEmitter]);
  
  // Get batching metrics
  const getBatchingMetrics = useCallback(() => {
    return updateEmitter.getMetrics();
  }, [updateEmitter]);
  
  // Auto-start datasources on mount
  useEffect(() => {
    const autoStartDatasources = datasources.filter(ds => 
      ds.type === 'stomp' && ds.autoStart && !activeDatasources.has(ds.id)
    );
    
    autoStartDatasources.forEach(ds => {
      console.log(`[DatasourceContext] Auto-starting datasource: ${ds.name}`);
      activateDatasource(ds.id);
    });
  }, [datasources]); // Only run once when datasources change
  
  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      // Disconnect all providers
      providers.forEach(provider => provider.disconnect());
      // Shutdown event emitter
      updateEmitter.shutdown();
    };
  }, [providers, updateEmitter]);
  
  const value: DatasourceContextType = {
    activeDatasources,
    datasourceData,
    connectionStatus,
    snapshotStatus,
    datasourceStatistics,
    componentUsage,
    dataStoreManager,
    updateEmitter,
    activateDatasource,
    deactivateDatasource,
    refreshDatasource,
    registerComponent,
    unregisterComponent,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    initializeWorkerForGrid,
    syncWorkerState,
    getProvider,
    getDataStore,
    showDatasourceList,
    setShowDatasourceList,
    setBatchingConfig,
    getBatchingMetrics,
  };
  
  return (
    <DatasourceContext.Provider value={value}>
      {children}
    </DatasourceContext.Provider>
  );
};