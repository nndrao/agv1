import { useState, useCallback, useEffect } from 'react';
import { useDatasourceStore } from '@/stores/datasource.store';
import { useDatasourceContext } from '@/contexts/DatasourceContext';

// Global map to store datasource selection per instance
// This ensures datasource selection persists across component remounts
const instanceDatasourceMap = new Map<string, string | undefined>();

/**
 * Hook to manage datasource selection at the instance level.
 * This ensures each table instance maintains its own datasource selection
 * independently of the profile system.
 */
export const useInstanceDatasource = (instanceId: string) => {
  const { datasources } = useDatasourceStore();
  const { 
    activateDatasource, 
    datasourceData,
    connectionStatus,
    activeDatasources,
    registerComponent,
    unregisterComponent,
    snapshotStatus,
    getDataStore
  } = useDatasourceContext();
  
  // Initialize state from the global map
  const [selectedDatasourceId, setSelectedDatasourceId] = useState<string | undefined>(
    () => instanceDatasourceMap.get(instanceId)
  );
  
  const [columnDefinitions, setColumnDefinitions] = useState<any[]>([]);
  
  // Handle datasource selection
  const handleDatasourceChange = useCallback(async (datasourceId: string | undefined) => {
    // Skip if datasource hasn't changed
    if (datasourceId === selectedDatasourceId) return;
    
    // Unregister from previous datasource
    if (selectedDatasourceId) {
      unregisterComponent(selectedDatasourceId, instanceId);
    }
    
    // Update instance-level state
    setSelectedDatasourceId(datasourceId);
    instanceDatasourceMap.set(instanceId, datasourceId);
    
    if (datasourceId) {
      // Register with new datasource
      registerComponent(datasourceId, instanceId);
      
      // Get datasource config
      const datasource = datasources.find(ds => ds.id === datasourceId);
      if (datasource) {
        // Set column definitions from datasource
        if (datasource.columnDefinitions && datasource.columnDefinitions.length > 0) {
          setColumnDefinitions(datasource.columnDefinitions);
        }
        
        // Activate if not already active
        if (!activeDatasources.has(datasourceId)) {
          await activateDatasource(datasourceId);
        }
      }
    } else {
      setColumnDefinitions([]);
    }
  }, [
    instanceId, 
    selectedDatasourceId,
    datasources, 
    activeDatasources, 
    activateDatasource, 
    registerComponent, 
    unregisterComponent
  ]);
  
  // Get current datasource data from the store snapshot
  const [currentData, setCurrentData] = useState<any[] | undefined>(undefined);
  const currentStatus = selectedDatasourceId ? connectionStatus.get(selectedDatasourceId) : undefined;
  const snapshotStatusValue = selectedDatasourceId ? snapshotStatus?.get(selectedDatasourceId) : undefined;
  const isSnapshotComplete = selectedDatasourceId ? snapshotStatusValue === 'complete' : true;
  
  // Update data when datasource data changes
  useEffect(() => {
    if (selectedDatasourceId) {
      const dataStore = getDataStore(selectedDatasourceId);
      if (dataStore) {
        // Get current snapshot from data store
        setCurrentData(dataStore.getSnapshot());
      } else {
        // Fallback to datasourceData map
        const data = datasourceData.get(selectedDatasourceId);
        setCurrentData(data);
      }
    } else {
      setCurrentData(undefined);
    }
  }, [selectedDatasourceId, getDataStore, datasourceData]);
  
  // Register component when datasource is selected
  useEffect(() => {
    if (selectedDatasourceId) {
      registerComponent(selectedDatasourceId, instanceId);
      
      // Load datasource columns
      const datasource = datasources.find(ds => ds.id === selectedDatasourceId);
      if (datasource && datasource.columnDefinitions) {
        setColumnDefinitions(datasource.columnDefinitions);
      }
      
      // Activate if not already active
      if (!activeDatasources.has(selectedDatasourceId)) {
        activateDatasource(selectedDatasourceId);
      }
    }
    
    return () => {
      if (selectedDatasourceId) {
        unregisterComponent(selectedDatasourceId, instanceId);
      }
    };
  }, [selectedDatasourceId, instanceId, datasources, activeDatasources, activateDatasource, registerComponent, unregisterComponent]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optionally clear the instance from the map on unmount
      // For now, we keep it to persist selection across remounts
      // instanceDatasourceMap.delete(instanceId);
    };
  }, [instanceId]);
  
  return {
    selectedDatasourceId,
    columnDefinitions,
    currentData,
    currentStatus,
    isSnapshotComplete,
    handleDatasourceChange
  };
};