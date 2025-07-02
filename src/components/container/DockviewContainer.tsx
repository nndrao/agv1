import React, { useEffect, useRef } from 'react';
import {
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  DockviewApi,
} from 'dockview';
import { DataTable } from '@/components/datatable/DataTable';
import { generateFixedIncomeData } from '@/components/datatable/lib/dataGenerator';
import { inferColumnDefinitions } from '@/utils/columnUtils';
import { useWorkspaceStore } from './stores/workspace.store';
import 'dockview/dist/styles/dockview.css';
import '@/styles/dockview.css';

// Panel component for DataTable
const DataTablePanel: React.FC<IDockviewPanelProps> = ({ params }) => {
  const { tableId } = params as { tableId: string; title: string; datasourceId?: string };
  
  // Always use sample data and let the DataTable handle datasource selection
  const [data] = React.useState(() => generateFixedIncomeData(10000));
  const [columns] = React.useState(() => inferColumnDefinitions(data));

  return (
    <div className="h-full w-full">
      <DataTable 
        columnDefs={columns} 
        dataRow={data} 
        instanceId={tableId}
      />
    </div>
  );
};

// Panel component for empty state
const EmptyPanel: React.FC<IDockviewPanelProps> = () => {
  return (
    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="text-lg font-medium">No content</p>
        <p className="text-sm">Open a table from the sidebar to get started</p>
      </div>
    </div>
  );
};

// Register panel components
const panels = {
  dataTable: DataTablePanel,
  empty: EmptyPanel,
};

interface DockviewContainerProps {
  className?: string;
}

export const DockviewContainer: React.FC<DockviewContainerProps> = ({ className }) => {
  const apiRef = useRef<DockviewApi>();
  const { getActiveWorkspace, saveLayout } = useWorkspaceStore();
  const activeWorkspace = getActiveWorkspace();

  // Handle dockview ready
  const onReady = (event: DockviewReadyEvent) => {
    apiRef.current = event.api;

    // Restore layout if exists
    if (activeWorkspace?.layout?.panels) {
      try {
        event.api.fromJSON(activeWorkspace.layout as any);
      } catch (e) {
        console.error('Failed to restore layout:', e);
        // Add default panel if restore fails
        addDefaultPanel(event.api);
      }
    } else {
      // Add default panel
      addDefaultPanel(event.api);
    }

    // Save layout on changes
    event.api.onDidLayoutChange(() => {
      if (apiRef.current) {
        const layout = apiRef.current.toJSON();
        saveLayout(layout);
      }
    });
  };

  const addDefaultPanel = (api: DockviewApi) => {
    api.addPanel({
      id: 'default',
      component: 'dataTable',
      params: {
        tableId: 'default-table',
        title: 'Fixed Income Portfolio',
      },
      title: 'Fixed Income Portfolio',
    });
  };

  // Add new table panel
  const addTablePanel = (tableId: string, title: string) => {
    if (!apiRef.current) return;

    apiRef.current.addPanel({
      id: tableId,
      component: 'dataTable',
      params: { tableId, title },
      title,
    });
  };

  // Expose API for external use
  useEffect(() => {
    (window as any).dockviewApi = {
      addTablePanel,
      api: apiRef.current,
    };
  }, []);

  return (
    <div className={className}>
      <DockviewReact
        components={panels}
        onReady={onReady}
        className="dockview-theme-light dark:dockview-theme-dark"
        singleTabMode="fullwidth"
      />
    </div>
  );
};