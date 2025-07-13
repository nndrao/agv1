import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  type GridApi, 
  type GridReadyEvent,
  type ColDef,
  type GridOptions 
} from 'ag-grid-community';
import { LicenseManager } from 'ag-grid-enterprise';
import { generateFixedIncomeData } from './lib/dataGenerator';
import { inferColumnDefinitions } from '@/utils/columnUtils';
import { DataTableToolbar } from './DataTableToolbar';
import './datatable.css';

// Set license key
LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY || '');

interface DataTableStandaloneProps {
  tableId: string;
  channelName?: string;
  initialConfig?: {
    columns?: ColDef[];
    theme?: string;
    datasourceId?: string;
  };
}

export const DataTableStandalone: React.FC<DataTableStandaloneProps> = ({
  tableId,
  channelName,
  initialConfig
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(initialConfig?.theme || 'ag-theme-alpine');
  const channelRef = useRef<any>(null);

  // Initialize with demo data or wait for channel data
  useEffect(() => {
    const initializeData = async () => {
      if (!channelName) {
        // No channel specified, use demo data
        const demoData = generateFixedIncomeData(1000);
        const columns = initialConfig?.columns || inferColumnDefinitions(demoData);
        setRowData(demoData);
        setColumnDefs(columns);
        setLoading(false);
      } else {
        // Connect to OpenFin channel for data
        connectToDataChannel();
      }
    };

    initializeData();
  }, [channelName, initialConfig]);

  // Connect to OpenFin data channel
  const connectToDataChannel = async () => {
    if (typeof fin === 'undefined') {
      console.warn('OpenFin not available, using demo data');
      const demoData = generateFixedIncomeData(1000);
      setRowData(demoData);
      setColumnDefs(inferColumnDefinitions(demoData));
      setLoading(false);
      return;
    }

    try {
      console.log(`📡 Connecting to channel: ${channelName}`);
      const channel = await fin.InterApplicationBus.Channel.connect(channelName!);
      channelRef.current = channel;

      // Register data update handler
      channel.register('data-update', (data: any) => {
        console.log(`📊 Received data update: ${data.rows?.length || 0} rows`);
        if (data.rows) {
          setRowData(data.rows);
          
          // Infer columns from first update if not provided
          if (columnDefs.length === 0 && data.rows.length > 0) {
            setColumnDefs(inferColumnDefinitions(data.rows));
          }
        }
        setLoading(false);
      });

      // Register configuration update handler
      channel.register('config-update', (config: any) => {
        console.log('⚙️ Received configuration update', config);
        if (config.columns) {
          setColumnDefs(config.columns);
        }
        if (config.theme) {
          setTheme(config.theme);
        }
      });

      // Request initial data
      const initialData = await channel.dispatch('request-data', { tableId });
      if (initialData?.rows) {
        setRowData(initialData.rows);
        if (columnDefs.length === 0) {
          setColumnDefs(inferColumnDefinitions(initialData.rows));
        }
      }
      setLoading(false);

    } catch (error) {
      console.error('Failed to connect to data channel:', error);
      // Fallback to demo data
      const demoData = generateFixedIncomeData(1000);
      setRowData(demoData);
      setColumnDefs(inferColumnDefinitions(demoData));
      setLoading(false);
    }
  };

  // Grid ready handler
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    console.log(`✅ Grid ready for table: ${tableId}`);
  }, [tableId]);

  // Handle profile/configuration changes via OpenFin messaging
  useEffect(() => {
    if (typeof fin === 'undefined') return;

    const handleMessage = async (message: any) => {
      console.log('📨 Received OpenFin message:', message);
      
      switch (message.type) {
        case 'apply-profile':
          if (message.profile && gridApi) {
            // Apply column state
            if (message.profile.columnState) {
              gridApi.applyColumnState({
                state: message.profile.columnState,
                applyOrder: true
              });
            }
            // Apply filter model
            if (message.profile.filterModel) {
              gridApi.setFilterModel(message.profile.filterModel);
            }
          }
          break;
          
        case 'toggle-theme':
          setTheme(current => 
            current === 'ag-theme-alpine' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
          );
          break;
      }
    };

    const currentWindow = fin.Window.getCurrentSync();
    currentWindow.addListener('message', handleMessage);

    return () => {
      currentWindow.removeListener('message', handleMessage);
    };
  }, [gridApi]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.disconnect();
      }
    };
  }, []);

  const gridOptions: GridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: true,
    },
    rowSelection: 'multiple',
    animateRows: true,
    pagination: true,
    paginationPageSize: 100,
    paginationPageSizeSelector: [50, 100, 250, 500],
    suppressRowClickSelection: true,
    enableRangeSelection: true,
    statusBar: {
      statusPanels: [
        { statusPanel: 'agTotalAndFilteredRowCountComponent' },
        { statusPanel: 'agTotalRowCountComponent' },
        { statusPanel: 'agFilteredRowCountComponent' },
        { statusPanel: 'agSelectedRowCountComponent' },
        { statusPanel: 'agAggregationComponent' },
      ],
    },
  };

  return (
    <div className="datatable-standalone h-full flex flex-col">
      <DataTableToolbar 
        gridApi={gridApi} 
        title={`DataTable: ${tableId}`}
      />
      
      <div className={`flex-1 ${theme}`}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Loading data...</div>
          </div>
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            gridOptions={gridOptions}
            onGridReady={onGridReady}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
};