import React, { useEffect, useState } from 'react';
import { DataTableContainer } from './DataTableContainer';
import { useDatasourceContext } from '@/contexts/DatasourceContext';
import { inferColumnDefinitions } from '@/utils/columnUtils';
import { ColumnDef } from './types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database } from 'lucide-react';
// import { useComponentDatasource } from './hooks/useComponentDatasource';

interface DataTableWithDatasourceProps {
  datasourceId?: string;
  instanceId?: string;
}

export const DataTableWithDatasource: React.FC<DataTableWithDatasourceProps> = ({ 
  datasourceId,
  instanceId = 'datatable-default' 
}) => {
  const { datasourceData, connectionStatus, activeDatasources, registerComponent, unregisterComponent } = useDatasourceContext();
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    // If no specific datasource is specified, use the first active one
    const targetDatasourceId = datasourceId || Array.from(activeDatasources.keys())[0];
    
    if (targetDatasourceId) {
      // Register this component
      registerComponent(targetDatasourceId, instanceId);
      
      const datasourceInfo = activeDatasources.get(targetDatasourceId);
      const currentData = datasourceData.get(targetDatasourceId);
      const status = connectionStatus.get(targetDatasourceId);
      
      if (currentData && currentData.length > 0) {
        // Use column definitions from datasource if available
        if (datasourceInfo && datasourceInfo.columnDefinitions && datasourceInfo.columnDefinitions.length > 0) {
          setColumns(datasourceInfo.columnDefinitions as ColumnDef[]);
        } else {
          // Otherwise infer from data
          const inferredColumns = inferColumnDefinitions(currentData);
          setColumns(inferredColumns);
        }
        setData(currentData);
      }
      
      console.log('[DataTableWithDatasource] Using datasource:', {
        datasourceId: targetDatasourceId,
        datasourceName: datasourceInfo?.name,
        dataCount: currentData?.length || 0,
        status
      });
      
      // Cleanup: unregister when component unmounts or datasource changes
      return () => {
        unregisterComponent(targetDatasourceId, instanceId);
      };
    }
  }, [datasourceId, activeDatasources, datasourceData, connectionStatus, instanceId, registerComponent, unregisterComponent]);
  
  // Show loading state
  if (activeDatasources.size === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Database className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No Active Datasources</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Activate a datasource from the Data Sources menu to see data here.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const targetDatasourceId = datasourceId || Array.from(activeDatasources.keys())[0];
  const status = connectionStatus.get(targetDatasourceId);
  
  if (status === 'connecting') {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Connecting to datasource...</p>
        </div>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="h-full w-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to connect to datasource. Please check your connection settings and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Database className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The datasource is connected but returned no data.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <DataTableContainer
      columnDefs={columns}
      dataRow={data}
      instanceId={instanceId}
    />
  );
};