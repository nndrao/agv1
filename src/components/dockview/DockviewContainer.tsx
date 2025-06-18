import React, { useEffect, useRef, useState } from 'react';
import {
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  DockviewApi,
  IContentRenderer,
} from 'dockview';
import { DataTableContainer } from '../datatable/DataTableContainer';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Table2, 
  Settings, 
  Database,
  FileSpreadsheet,
  LayoutGrid,
  Moon,
  Sun,
  X
} from 'lucide-react';
import 'dockview/dist/styles/dockview.css';
import './dockview-custom.css';

// Panel component that renders DataTable - wrapped in React.memo for Dockview
const DataTablePanel = React.memo<IDockviewPanelProps>(({ api, params }) => {
  const [darkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const tableId = params.tableId || `table-${Date.now()}`;
  const title = params.title || 'DataTable';

  // Generate some mock data for now
  const [columnDefs] = useState(() => [
    { field: 'id', headerName: 'ID', cellDataType: 'number' },
    { field: 'name', headerName: 'Name', cellDataType: 'text' },
    { field: 'email', headerName: 'Email', cellDataType: 'text' },
    { field: 'status', headerName: 'Status', cellDataType: 'text' },
    { field: 'amount', headerName: 'Amount', cellDataType: 'number' },
    { field: 'date', headerName: 'Date', cellDataType: 'date' },
  ]);

  const [dataRow] = useState(() => 
    Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      status: ['Active', 'Pending', 'Inactive'][i % 3],
      amount: Math.floor(Math.random() * 10000),
      date: new Date(2024, 0, 1 + i).toISOString(),
    }))
  );

  // Update panel title
  useEffect(() => {
    api.setTitle(title);
  }, [api, title]);

  return (
    <div className="dockview-datatable-container">
      <DataTableContainer
        columnDefs={columnDefs}
        dataRow={dataRow}
      />
    </div>
  );
});

DataTablePanel.displayName = 'DataTablePanel';

// Watermark component
const DockviewWatermark = React.memo(() => {
  const { createNewDataTable } = React.useContext(DockviewContext);
  
  return (
    <div className="dockview-watermark">
      <Table2 className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No DataTables Open</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Create a new DataTable to get started
      </p>
      <Button onClick={() => createNewDataTable?.()}>
        <Plus className="h-4 w-4 mr-2" />
        Create DataTable
      </Button>
    </div>
  );
});

DockviewWatermark.displayName = 'DockviewWatermark';

// Context for passing functions to watermark
const DockviewContext = React.createContext<{
  createNewDataTable?: () => void;
}>({});


interface DockviewContainerProps {
  darkMode?: boolean;
  onPanelCountChange?: (count: number) => void;
}

export const DockviewContainer: React.FC<DockviewContainerProps> = ({
  darkMode = false,
  onPanelCountChange,
}) => {
  const dockviewRef = useRef<DockviewApi | null>(null);
  const [panelCount, setPanelCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Handle dockview ready event
  const onReady = (event: DockviewReadyEvent) => {
    dockviewRef.current = event.api;
    setIsReady(true);

    // Create initial panel
    createNewDataTable('Initial DataTable');

    // Listen to panel events
    event.api.onDidAddPanel(() => {
      const count = event.api.panels.length;
      setPanelCount(count);
      onPanelCountChange?.(count);
    });

    event.api.onDidRemovePanel(() => {
      const count = event.api.panels.length;
      setPanelCount(count);
      onPanelCountChange?.(count);
    });
  };

  // Create new DataTable panel
  const createNewDataTable = (title?: string) => {
    if (!dockviewRef.current) return;

    const id = `datatable-${Date.now()}`;
    const panel = dockviewRef.current.addPanel({
      id,
      component: 'dataTable',
      title: title || `DataTable ${panelCount + 1}`,
      params: {
        tableId: id,
        title: title || `DataTable ${panelCount + 1}`,
        profile: 'default',
      },
    });

    // Focus the new panel
    panel.focus();
  };

  // Create panel with specific data source
  const createTableWithSource = (sourceType: 'csv' | 'json' | 'api' | 'mock') => {
    const titles = {
      csv: 'CSV DataTable',
      json: 'JSON DataTable',
      api: 'API DataTable',
      mock: 'Mock DataTable',
    };
    
    createNewDataTable(titles[sourceType]);
  };

  return (
    <DockviewContext.Provider value={{ createNewDataTable }}>
      <div className="dockview-wrapper">
        {/* Toolbar */}
        <div className="dockview-toolbar">
          <div className="toolbar-section">
            <Button
              variant="default"
              size="sm"
              onClick={() => createNewDataTable()}
              disabled={!isReady}
            >
              <Plus className="h-4 w-4 mr-1" />
              New DataTable
            </Button>

            <div className="toolbar-separator" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => createTableWithSource('mock')}
              disabled={!isReady}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Mock Data
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => createTableWithSource('csv')}
              disabled={!isReady}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => createTableWithSource('json')}
              disabled={!isReady}
            >
              <Database className="h-4 w-4 mr-1" />
              JSON
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => createTableWithSource('api')}
              disabled={!isReady}
            >
              <Settings className="h-4 w-4 mr-1" />
              API
            </Button>
          </div>

          <div className="toolbar-section">
            <span className="text-sm text-muted-foreground">
              {panelCount} {panelCount === 1 ? 'table' : 'tables'} open
            </span>
            
            <div className="toolbar-separator" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
              }}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Dockview Container */}
        <div className="dockview-container">
          <DockviewReact
            onReady={onReady}
            components={{
              dataTable: DataTablePanel,
            }}
            watermarkComponent={DockviewWatermark}
            className={darkMode ? 'dockview-theme-dark' : 'dockview-theme-light'}
          />
        </div>
      </div>
    </DockviewContext.Provider>
  );
};