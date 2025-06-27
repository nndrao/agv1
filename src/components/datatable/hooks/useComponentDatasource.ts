import { useState, useCallback, useEffect, useRef } from 'react';
import { useDatasourceStore } from '@/stores/datasource.store';
import { useDatasourceContext } from '@/contexts/DatasourceContext';
import { useProfileStore, useActiveProfile } from '@/components/datatable/stores/profile.store';

export const useComponentDatasource = (instanceId: string) => {
  const { datasources } = useDatasourceStore();
  const { 
    activateDatasource, 
    deactivateDatasource,
    datasourceData,
    connectionStatus,
    activeDatasources,
    registerComponent,
    unregisterComponent,
    snapshotStatus,
    getDataStore
  } = useDatasourceContext();
  
  const { updateProfile, saveColumnCustomizations } = useProfileStore();
  const activeProfile = useActiveProfile();
  
  // Get datasource from active profile
  const selectedDatasourceId = activeProfile?.datasourceId;
  
  const [columnDefinitions, setColumnDefinitions] = useState<any[]>([]);
  
  // Handle datasource selection
  const handleDatasourceChange = useCallback(async (datasourceId: string | undefined) => {
    const currentProfile = useProfileStore.getState().getActiveProfile();
    if (!currentProfile) return;
    
    // Skip if datasource hasn't changed
    if (datasourceId === currentProfile.datasourceId) return;
    
    // Unregister from previous datasource
    if (currentProfile.datasourceId) {
      unregisterComponent(currentProfile.datasourceId, instanceId);
    }
    
    // Update profile with new datasource
    const updatedProfile = {
      ...currentProfile,
      datasourceId,
      updatedAt: Date.now()
    };
    
    if (datasourceId) {
      // Register with new datasource
      registerComponent(datasourceId, instanceId);
      
      // Get datasource config
      const datasource = datasources.find(ds => ds.id === datasourceId);
      if (datasource) {
        // Replace column definitions with datasource columns
        if (datasource.columnDefinitions && datasource.columnDefinitions.length > 0) {
          setColumnDefinitions(datasource.columnDefinitions);
          
          // Update profile with new column definitions from datasource
          updatedProfile.columnSettings = {
            ...updatedProfile.columnSettings,
            baseColumnDefs: datasource.columnDefinitions.map(col => ({
              field: col.field,
              headerName: col.headerName,
              cellDataType: col.cellDataType,
              width: col.width,
              hide: col.hide
            })),
            columnCustomizations: {} // Clear any existing customizations
          };
          
          // Clear grid state to reset column order, filters, etc
          updatedProfile.gridState = undefined;
        }
        
        // Activate if not already active
        if (!activeDatasources.has(datasourceId)) {
          await activateDatasource(datasourceId);
        }
      }
    } else {
      setColumnDefinitions([]);
      // Clear column settings when no datasource
      updatedProfile.columnSettings = undefined;
      updatedProfile.gridState = undefined;
    }
    
    // Update the profile
    updateProfile(currentProfile.id, updatedProfile);
  }, [
    instanceId, 
    datasources, 
    activeDatasources, 
    activateDatasource, 
    registerComponent, 
    unregisterComponent,
    updateProfile
  ]);
  
  // Get current datasource data from the store snapshot
  const [currentData, setCurrentData] = useState<any[] | undefined>(undefined);
  const currentStatus = selectedDatasourceId ? connectionStatus.get(selectedDatasourceId) : undefined;
  const isSnapshotComplete = selectedDatasourceId ? snapshotStatus?.get(selectedDatasourceId) === 'complete' : true;
  
  // Update data when snapshot is complete
  useEffect(() => {
    if (selectedDatasourceId && isSnapshotComplete) {
      const dataStore = getDataStore(selectedDatasourceId);
      if (dataStore) {
        // Get initial snapshot
        setCurrentData(dataStore.getSnapshot());
      } else {
        // Fallback to datasourceData map
        setCurrentData(datasourceData.get(selectedDatasourceId));
      }
    }
  }, [selectedDatasourceId, isSnapshotComplete, getDataStore, datasourceData]);
  
  // Register component and load datasource columns when profile changes
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
  
  return {
    selectedDatasourceId,
    columnDefinitions,
    currentData,
    currentStatus,
    isSnapshotComplete,
    handleDatasourceChange
  };
};