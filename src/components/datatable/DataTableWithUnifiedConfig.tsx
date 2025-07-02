/**
 * Example DataTable that demonstrates gradual migration to unified config
 * This works alongside existing DataTable without breaking it
 */

import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { GridApi, GridReadyEvent, ColDef } from 'ag-grid-community';
import { useUnifiedConfig } from './hooks/useUnifiedConfig';
import { useProfileStore } from './stores/profile.store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Download, Upload } from 'lucide-react';

interface DataTableWithUnifiedConfigProps {
  instanceId?: string;
  data?: any[];
  columns?: ColDef[];
  showVersionManager?: boolean;
  onConfigChange?: (config: any) => void;
}

export const DataTableWithUnifiedConfig: React.FC<DataTableWithUnifiedConfigProps> = ({
  instanceId = 'datatable-unified-demo',
  data = [],
  columns = [],
  showVersionManager = true,
  onConfigChange
}) => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  
  // Use existing profile store for backward compatibility
  const { getActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();
  
  // Use new unified config system
  const {
    config,
    loading,
    createVersion,
    activateVersion,
    updateConfig,
    profileToConfig,
    // configToProfile
  } = useUnifiedConfig({
    instanceId,
    autoLoad: true
  });

  // Get active version configuration
  const activeVersion = config?.settings.versions[config.settings.activeVersionId];
  const versionConfig = activeVersion?.config;

  // Apply configuration to grid when it changes
  useEffect(() => {
    if (gridApi && versionConfig) {
      // Apply column state
      if (versionConfig.columnState) {
        gridApi.applyColumnState({
          state: versionConfig.columnState,
          applyOrder: true
        });
      }

      // Apply filters
      if (versionConfig.filterModel) {
        gridApi.setFilterModel(versionConfig.filterModel);
      }

      // Apply sorts
      if (versionConfig.sortModel) {
        gridApi.applyColumnState({ 
          state: versionConfig.sortModel?.map((sort: any) => ({
            colId: sort.colId,
            sort: sort.sort,
            sortIndex: sort.sortIndex
          })) || []
        });
      }
    }
  }, [gridApi, versionConfig]);

  const handleGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const handleStateChange = async () => {
    if (!gridApi || !config) return;

    // Capture current state
    const currentState = {
      columnState: gridApi.getColumnState(),
      filterModel: gridApi.getFilterModel(),
      sortModel: gridApi.getColumnState()?.filter((col: any) => col.sort)?.map((col: any) => ({
        colId: col.colId,
        sort: col.sort,
        sortIndex: col.sortIndex
      })) || []
    };

    // Update active version config
    const updatedConfig = {
      ...config,
      settings: {
        ...config.settings,
        versions: {
          ...config.settings.versions,
          [config.settings.activeVersionId]: {
            ...config.settings.versions[config.settings.activeVersionId],
            config: {
              ...config.settings.versions[config.settings.activeVersionId].config,
              ...currentState
            }
          }
        }
      }
    };

    await updateConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  const handleCreateVersion = async () => {
    const name = prompt('Version name:');
    if (!name) return;

    const description = prompt('Version description:') || '';
    const newVersion = await createVersion(name, description);
    
    if (newVersion) {
      alert(`Created version: ${name}`);
    }
  };

  const handleVersionChange = async (versionId: string) => {
    await activateVersion(versionId);
  };

  const handleImportProfile = async () => {
    // Example: Import from existing profile store
    if (activeProfile) {
      const configUpdate = profileToConfig(activeProfile);
      await updateConfig(configUpdate);
      alert('Imported active profile to unified config');
    }
  };

  const handleExportConfig = () => {
    if (!config) return;

    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${instanceId}-config.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return <div className="p-4">Loading configuration...</div>;
  }

  return (
    <div className="datatable-unified-container h-full flex flex-col">
      {showVersionManager && config && (
        <div className="datatable-toolbar p-2 border-b flex items-center gap-2">
          <Select 
            value={config.settings.activeVersionId} 
            onValueChange={handleVersionChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(config.settings.versions).map(version => (
                <SelectItem key={version.versionId} value={version.versionId}>
                  <div className="flex items-center justify-between w-full">
                    <span>{version.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      v{version.versionNumber}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateVersion}
            title="Create new version"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Version
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImportProfile}
            title="Import from profile store"
            disabled={!activeProfile}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import Profile
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportConfig}
            title="Export configuration"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          <div className="ml-auto text-sm text-muted-foreground">
            Instance: {instanceId}
          </div>
        </div>
      )}

      <div className="flex-1 ag-theme-alpine-dark">
        <AgGridReact
          columnDefs={versionConfig?.columns || columns}
          rowData={data}
          onGridReady={handleGridReady}
          onColumnMoved={handleStateChange}
          onColumnResized={handleStateChange}
          onColumnVisible={handleStateChange}
          onSortChanged={handleStateChange}
          onFilterChanged={handleStateChange}
          // Apply grid options from config
          rowHeight={versionConfig?.gridOptions?.rowHeight}
          headerHeight={versionConfig?.gridOptions?.headerHeight}
          pagination={versionConfig?.gridOptions?.pagination}
          paginationPageSize={versionConfig?.gridOptions?.paginationPageSize}
          // Default options
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            floatingFilter: true
          }}
        />
      </div>
    </div>
  );
};