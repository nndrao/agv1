import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { DatasourceConfig, useDatasourceStore } from '@/stores/datasource.store';
import { UpdateEventEmitter, UpdateEvent } from '@/utils/UpdateEventEmitter';
import { DataStoreManager } from '@/services/datasource/DataStoreManager';
import { ConflatedDataStore } from '@/services/datasource/ConflatedDataStore';
import { DatasourceStatistics } from '@/services/datasource/DatasourceStatistics';
import { DatasourceProviderManager } from '@/services/datasource/DatasourceProviderManager';

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
  const [showDatasourceList, setShowDatasourceList] = useState(false);
  
  // Initialize data store manager
  const dataStoreManager = useRef(DataStoreManager.getInstance()).current;
  
  // Initialize datasource provider manager
  const providerManager = useRef(DatasourceProviderManager.getInstance()).current;
  
  // Initialize update event emitter with batching DISABLED (conflation happens in ConflatedDataStore)
  const updateEmitterRef = useRef<UpdateEventEmitter>(new UpdateEventEmitter(10000, { enabled: false, interval: 100 }));
  const updateEmitter = updateEmitterRef.current;
  
  // Initialize Web Worker
  // NOTE: Worker is being phased out in favor of direct processing for better performance
  // const workerRef = useRef<Worker | null>(null);
  // const [isWorkerReady, setIsWorkerReady] = useState(false);
  
  // Track snapshot completion status with ref for access in callbacks
  const snapshotCompleteRef = useRef<Map<string, boolean>>(new Map());
  
  // Track update subscriptions
  const updateSubscriptionsRef = useRef<Map<string, ((data: any) => void) | null>>(new Map());
  
  // Track datasources being activated to prevent concurrent activations
  const activatingDatasourcesRef = useRef<Set<string>>(new Set());
  
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
    
    // Check if already being activated
    if (activatingDatasourcesRef.current.has(datasourceId)) {
      console.log(`[DatasourceContext] Datasource ${datasourceId} is already being activated`);
      return;
    }
    
    // Mark as being activated
    activatingDatasourcesRef.current.add(datasourceId);
    console.log(`[DatasourceContext] Activating datasource ${datasourceId}`);
    
    const datasource = getDatasource(datasourceId);
    if (!datasource) {
      // console.error(`[DatasourceContext] Datasource ${datasourceId} not found`);
      return;
    }
    
    // Update status
    setConnectionStatus(prev => new Map(prev).set(datasourceId, 'connecting'));
    setSnapshotStatus(prev => new Map(prev).set(datasourceId, 'loading'));
    snapshotCompleteRef.current.set(datasourceId, false);
    
    try {
      if (datasource.type === 'stomp') {
        // Create conflated data store for this datasource
        const dataStore = dataStoreManager.createStore(datasource);
        const statistics = dataStoreManager.getStatistics(datasourceId)!;
        
        // Start snapshot tracking
        statistics.startSnapshot();
        
        // Clear any existing data first
        dataStore.setSnapshot([]);
        setDatasourceData(prev => new Map(prev).set(datasourceId, []));
        
        // Subscribe to the datasource via the singleton manager
        await providerManager.subscribe(datasource, {
          id: `context-${datasourceId}`,
          onSnapshot: (data, totalRows, isComplete) => {
            console.log(`[DatasourceContext] onSnapshot called: data.length=${data.length}, totalRows=${totalRows}, complete: ${isComplete}`);
            
            // Update the data store
            dataStore.setSnapshot(data);
            
            // Update datasource data for UI (this will trigger AG-Grid updates)
            setDatasourceData(prev => {
              const newMap = new Map(prev);
              newMap.set(datasourceId, data);
              console.log(`[DatasourceContext] Updated datasourceData for ${datasourceId}: ${data.length} rows`);
              return newMap;
            });
            
            // Update snapshot status
            if (isComplete) {
              console.log(`[DatasourceContext] Marking snapshot as COMPLETE for ${datasourceId} with ${data.length} rows`);
              snapshotCompleteRef.current.set(datasourceId, true);
              setSnapshotStatus(prev => {
                const newMap = new Map(prev);
                newMap.set(datasourceId, 'complete');
                console.log(`[DatasourceContext] Snapshot status map updated:`, Array.from(newMap.entries()));
                return newMap;
              });
              statistics.completeSnapshot(data.length, 0);
            } else {
              setSnapshotStatus(prev => new Map(prev).set(datasourceId, 'loading'));
              statistics.updateSnapshotProgress(totalRows, 1000);
            }
            
            setDatasourceStatistics(prev => new Map(prev).set(datasourceId, statistics));
          },
          onUpdate: (updates) => {
            // Handle real-time updates by adding them to the data store
            console.log(`[DatasourceContext] Received ${updates.length} real-time updates for ${datasourceId}`);
            
            // Add updates to the ConflatedDataStore
            dataStore.addBulkUpdates(updates, 'update');
            
            // Also emit update event for backward compatibility
            const updateEvent: UpdateEvent = {
              type: 'transaction',
              datasourceId,
              transaction: { update: updates },
              timestamp: Date.now()
            };
            updateEmitter.emit('update', updateEvent);
          },
          onError: (error) => {
            console.error(`[DatasourceContext] Error from provider:`, error);
            setConnectionStatus(prev => new Map(prev).set(datasourceId, 'error'));
            setSnapshotStatus(prev => new Map(prev).set(datasourceId, 'error'));
          }
        });
        
        // Mark as active and connected
        setActiveDatasources(prev => new Map(prev).set(datasourceId, datasource));
        setConnectionStatus(prev => new Map(prev).set(datasourceId, 'connected'));
        
        // Check if snapshot is already complete
        const existingData = providerManager.getSnapshotData(datasourceId);
        if (existingData) {
          snapshotCompleteRef.current.set(datasourceId, true);
          setSnapshotStatus(prev => new Map(prev).set(datasourceId, 'complete'));
          statistics.completeSnapshot(existingData.length, 0);
        }
      }
      // TODO: Handle REST datasources
    } catch (error) {
      console.error(`[DatasourceContext] Error activating datasource ${datasourceId}:`, error);
      setConnectionStatus(prev => new Map(prev).set(datasourceId, 'error'));
      setSnapshotStatus(prev => new Map(prev).set(datasourceId, 'error'));
      snapshotCompleteRef.current.delete(datasourceId);
    } finally {
      // Remove from activating set
      activatingDatasourcesRef.current.delete(datasourceId);
    }
  }, [getDatasource, activeDatasources]);
  
  // Deactivate a datasource
  const deactivateDatasource = useCallback((datasourceId: string) => {
    // Unsubscribe from provider manager
    providerManager.unsubscribe(datasourceId, `context-${datasourceId}`);
    
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
  }, [providerManager, dataStoreManager]);
  
  // Refresh a datasource
  const refreshDatasource = useCallback(async (datasourceId: string) => {
    const datasource = getDatasource(datasourceId);
    if (!datasource || datasource.type !== 'stomp') {
      console.error(`[DatasourceContext] Cannot refresh datasource ${datasourceId}`);
      return;
    }
    
    // Clear existing data
    setDatasourceData(prev => new Map(prev).set(datasourceId, []));
    setSnapshotStatus(prev => new Map(prev).set(datasourceId, 'loading'));
    snapshotCompleteRef.current.set(datasourceId, false);
    
    // Refresh via provider manager - this will notify all subscribers
    await providerManager.refresh(datasource);
  }, [getDatasource, providerManager]);
  
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
    // Updates are now handled automatically via the provider manager subscription
    console.log(`[DatasourceContext] subscribeToUpdates called for ${datasourceId} (handled by provider manager)`);
  }, []);

  // Initialize worker with grid data (kept for backward compatibility, but no-op)
  const initializeWorkerForGrid = useCallback(() => {
    // This is now a no-op as we're using ConflatedDataStore instead of workers
    // console.log(`[DatasourceContext] initializeWorkerForGrid called (no-op) for ${datasourceId} with ${gridData.length} rows`);
  }, []);
  
  // Sync worker state with grid state (kept for backward compatibility, but no-op)
  const syncWorkerState = useCallback(() => {
    // This is now a no-op as we're using ConflatedDataStore instead of workers
    // console.log(`[DatasourceContext] syncWorkerState called (no-op) for ${datasourceId} with ${currentData.length} rows`);
  }, []);

  // Unsubscribe from updates for a datasource
  const unsubscribeFromUpdates = useCallback((_datasourceId: string) => {
    // Updates are now handled automatically via the provider manager subscription
    console.log(`[DatasourceContext] unsubscribeFromUpdates called (handled by provider manager)`);
  }, []);
  
  // Get provider for a datasource
  const getProvider = useCallback((_datasourceId: string) => {
    // Providers are now managed by the singleton manager
    return undefined;
  }, []);
  
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
      // console.log(`[DatasourceContext] Auto-starting datasource: ${ds.name}`);
      activateDatasource(ds.id);
    });
  }, [datasources]); // Only run once when datasources change
  
  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      // Providers are now managed by the singleton manager
      // Just shutdown event emitter
      updateEmitter.shutdown();
    };
  }, [updateEmitter]);
  
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