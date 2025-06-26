# AGV1 React Implementation Plan

## Technology Stack

### Core Technologies

#### UI Framework
- **React 19** with TypeScript 5.x
- **Vite 5.x** for build tooling
- **React Router** for navigation (if needed)

#### Data Grid
- **AG-Grid Enterprise 33.x**
  - All enterprise features available
  - Row grouping, pivoting, Excel export
  - Advanced filtering and aggregations
  - Master/detail views

#### Layout Management
- **Infragistics Dock Manager** (@infragistics/igniteui-react-dockmanager)
  - Advanced docking layouts
  - Save/restore layout states
  - Floating panes support
  - Tab grouping

#### State Management
- **Zustand** for global state
- **React Query** for server state
- **Context API** for component trees

#### Data Persistence
- **Local**: IDB package for IndexedDB
  - Better performance than localStorage
  - Larger storage capacity
  - Async API
- **Remote**: MongoDB integration
  - Profile storage
  - Shared configurations
  - Team collaboration

#### UI Components
- **Radix UI** primitives
- **shadcn/ui** component library
- **Floating UI** for positioning
- **Lucide React** for icons

#### Styling
- **Tailwind CSS 3.x**
- **CSS Variables** for theming
- Match current dark theme aesthetics

#### Real-time Data
- **STOMP.js** for WebSocket
- **Socket.io** as alternative

#### Additional Libraries
- **date-fns** for date formatting
- **Comlink** for Web Workers
- **React Hook Form** for complex forms
- **Zod** for validation

## Project Structure

```
agv1-react/
├── src/
│   ├── components/
│   │   ├── datatable/
│   │   │   ├── DataTable.tsx
│   │   │   ├── DataTableToolbar.tsx
│   │   │   ├── DataTableContext.tsx
│   │   │   └── hooks/
│   │   │       ├── useDataTable.ts
│   │   │       ├── useColumnFormatting.ts
│   │   │       └── useDataSource.ts
│   │   ├── dialogs/
│   │   │   ├── ColumnFormattingDialog/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── tabs/
│   │   │   │   │   ├── StylingTab.tsx
│   │   │   │   │   ├── FormatTab.tsx
│   │   │   │   │   ├── GeneralTab.tsx
│   │   │   │   │   ├── FilterTab.tsx
│   │   │   │   │   └── EditorTab.tsx
│   │   │   │   └── components/
│   │   │   ├── DataSourceDialog/
│   │   │   ├── GridOptionsDialog/
│   │   │   ├── ProfileManagementDialog/
│   │   │   └── shared/
│   │   │       ├── DraggableDialog.tsx
│   │   │       └── DialogHeader.tsx
│   │   ├── layout/
│   │   │   ├── DockManager.tsx
│   │   │   ├── WorkspaceProvider.tsx
│   │   │   └── PanelWrapper.tsx
│   │   └── ui/ (shadcn components)
│   │
│   ├── services/
│   │   ├── storage/
│   │   │   ├── StorageAdapter.ts
│   │   │   ├── IDBStorageAdapter.ts
│   │   │   ├── MongoDBAdapter.ts
│   │   │   └── migrationService.ts
│   │   ├── formatting/
│   │   │   ├── FormatterRegistry.ts
│   │   │   ├── formatters/
│   │   │   └── ExcelFormatParser.ts
│   │   ├── datasource/
│   │   │   ├── DataSourceManager.ts
│   │   │   ├── providers/
│   │   │   └── WebSocketService.ts
│   │   └── export/
│   │       └── ExportService.ts
│   │
│   ├── stores/
│   │   ├── dataTableStore.ts
│   │   ├── profileStore.ts
│   │   ├── uiStore.ts
│   │   └── types.ts
│   │
│   ├── utils/
│   │   ├── agGridHelpers.ts
│   │   ├── colorUtils.ts
│   │   └── validators.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── themes/
│   │   │   ├── dark.css
│   │   │   └── light.css
│   │   └── components/
│   │
│   └── App.tsx
│
├── public/
├── tests/
└── package.json
```

## Implementation Phases

### Phase 1: Project Setup & Core Infrastructure (Week 1)

#### 1.1 Initialize Project
```bash
npm create vite@latest agv1-react -- --template react-ts
cd agv1-react
npm install
```

#### 1.2 Install Core Dependencies
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "ag-grid-enterprise": "^33.0.0",
    "ag-grid-react": "^33.0.0",
    "@infragistics/igniteui-react-dockmanager": "latest",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "idb": "^8.0.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "tailwindcss": "^3.4.0",
    "@stompjs/stompjs": "^7.0.0",
    "date-fns": "^3.0.0",
    "lucide-react": "latest",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "comlink": "^4.0.0"
  }
}
```

#### 1.3 Storage Service Setup
```typescript
// src/services/storage/IDBStorageAdapter.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AGV1Schema extends DBSchema {
  profiles: {
    key: string;
    value: Profile;
    indexes: { 'by-date': Date };
  };
  configurations: {
    key: string;
    value: ComponentConfig;
  };
  templates: {
    key: string;
    value: ColumnTemplate;
  };
}

export class IDBStorageAdapter implements StorageAdapter {
  private db: IDBPDatabase<AGV1Schema>;
  
  async initialize(): Promise<void> {
    this.db = await openDB<AGV1Schema>('agv1-storage', 1, {
      upgrade(db) {
        // Create object stores
        const profileStore = db.createObjectStore('profiles', {
          keyPath: 'id'
        });
        profileStore.createIndex('by-date', 'updatedAt');
        
        db.createObjectStore('configurations', {
          keyPath: 'instanceId'
        });
        
        db.createObjectStore('templates', {
          keyPath: 'id'
        });
      }
    });
  }
  
  async saveProfile(profile: Profile): Promise<void> {
    await this.db.put('profiles', profile);
  }
  
  async getProfile(id: string): Promise<Profile | undefined> {
    return await this.db.get('profiles', id);
  }
  
  async getAllProfiles(): Promise<Profile[]> {
    return await this.db.getAll('profiles');
  }
}
```

#### 1.4 MongoDB Integration
```typescript
// src/services/storage/MongoDBAdapter.ts
export class MongoDBAdapter implements StorageAdapter {
  private apiUrl: string;
  private authToken: string;
  
  constructor(config: MongoDBConfig) {
    this.apiUrl = config.apiUrl;
    this.authToken = config.authToken;
  }
  
  async saveProfile(profile: Profile): Promise<void> {
    const response = await fetch(`${this.apiUrl}/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify(profile)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save profile');
    }
  }
  
  async syncWithLocal(idbAdapter: IDBStorageAdapter): Promise<void> {
    // Implement sync logic
  }
}
```

### Phase 2: Layout Management with Infragistics (Week 2)

#### 2.1 Dock Manager Integration
```typescript
// src/components/layout/DockManager.tsx
import { IgrDockManager, IgrDockManagerComponent } from '@infragistics/igniteui-react-dockmanager';
import { registerIconFromText } from '@infragistics/igniteui-react-core';
import { useLayoutStore } from '@/stores/layoutStore';

export const DockManager: React.FC = () => {
  const dockManagerRef = useRef<IgrDockManagerComponent>(null);
  const { layout, saveLayout } = useLayoutStore();
  
  useEffect(() => {
    // Configure dock manager
    if (dockManagerRef.current) {
      dockManagerRef.current.layout = {
        rootPane: {
          type: 'splitPane',
          orientation: 'horizontal',
          panes: [
            {
              type: 'contentPane',
              header: 'Data Table',
              contentId: 'datatable-1'
            },
            {
              type: 'tabGroupPane',
              panes: [
                {
                  type: 'contentPane',
                  header: 'Properties',
                  contentId: 'properties'
                },
                {
                  type: 'contentPane',
                  header: 'Data Source',
                  contentId: 'datasource'
                }
              ]
            }
          ]
        }
      };
    }
  }, []);
  
  const handleLayoutChange = () => {
    if (dockManagerRef.current) {
      const currentLayout = dockManagerRef.current.layout;
      saveLayout(currentLayout);
    }
  };
  
  return (
    <IgrDockManager 
      ref={dockManagerRef}
      className="dock-manager"
      onLayoutChange={handleLayoutChange}
    >
      <div slot="datatable-1" className="h-full">
        <DataTable instanceId="datatable-1" />
      </div>
      <div slot="properties" className="h-full">
        <PropertiesPanel />
      </div>
      <div slot="datasource" className="h-full">
        <DataSourcePanel />
      </div>
    </IgrDockManager>
  );
};
```

### Phase 3: AG-Grid Enterprise Integration (Week 3-4)

#### 3.1 DataTable Component with Enterprise Features
```typescript
// src/components/datatable/DataTable.tsx
import { AgGridReact } from 'ag-grid-react';
import { 
  LicenseManager,
  ModuleRegistry,
  AllEnterpriseModules 
} from 'ag-grid-enterprise';
import 'ag-grid-enterprise/styles/ag-grid.css';
import './ag-grid-theme-custom.css';

// Register all enterprise modules
ModuleRegistry.registerModules(AllEnterpriseModules);

// Set license key
LicenseManager.setLicenseKey(process.env.REACT_APP_AG_GRID_LICENSE);

interface DataTableProps {
  instanceId: string;
}

export const DataTable: React.FC<DataTableProps> = ({ instanceId }) => {
  const gridRef = useRef<AgGridReact>(null);
  const { config, updateConfig } = useDataTableStore(instanceId);
  const [rowData, setRowData] = useState([]);
  
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    menuTabs: ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab'],
    cellClass: 'ag-cell-custom',
    headerClass: 'ag-header-custom'
  }), []);
  
  const gridOptions = useMemo(() => ({
    // Enterprise features
    enableRangeSelection: true,
    enableCharts: true,
    enableAdvancedFilter: true,
    sideBar: {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
        }
      ],
      defaultToolPanel: 'columns'
    },
    statusBar: {
      statusPanels: [
        { statusPanel: 'agTotalAndFilteredRowCountComponent' },
        { statusPanel: 'agTotalRowCountComponent' },
        { statusPanel: 'agFilteredRowCountComponent' },
        { statusPanel: 'agSelectedRowCountComponent' },
        { statusPanel: 'agAggregationComponent' }
      ]
    },
    // Custom context menu
    getContextMenuItems: getContextMenuItems,
    // Excel export settings
    excelStyles: getExcelStyles(),
    // Theme
    theme: config.darkMode ? 'ag-theme-custom-dark' : 'ag-theme-custom'
  }), [config.darkMode]);
  
  const onGridReady = useCallback((params: GridReadyEvent) => {
    // Load data
    loadData();
    // Restore column state if exists
    if (config.columnState) {
      params.api.applyColumnState({
        state: config.columnState,
        applyOrder: true
      });
    }
  }, [config]);
  
  return (
    <div className="datatable-container h-full flex flex-col">
      <DataTableToolbar 
        gridRef={gridRef}
        instanceId={instanceId}
      />
      <div className="flex-1 ag-theme-custom">
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={config.columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          onColumnMoved={handleColumnChange}
          onColumnResized={handleColumnChange}
          onSortChanged={handleColumnChange}
          onFilterChanged={handleFilterChange}
        />
      </div>
      {config.showFloatingRibbon && (
        <FloatingRibbon gridRef={gridRef} />
      )}
    </div>
  );
};
```

#### 3.2 Custom Theme Matching Current Implementation
```css
/* src/components/datatable/ag-grid-theme-custom.css */
.ag-theme-custom {
  --ag-background-color: hsl(0 0% 93%);
  --ag-foreground-color: hsl(222.2 84% 4.9%);
  --ag-header-background-color: hsl(210 40% 96.1%);
  --ag-header-foreground-color: hsl(222.2 84% 4.9%);
  --ag-border-color: hsl(214.3 31.8% 91.4%);
  --ag-row-hover-color: hsl(210 40% 94%);
  --ag-selected-row-background-color: hsl(221.2 83.2% 53.3% / 0.1);
  --ag-range-selection-border-color: hsl(221.2 83.2% 53.3%);
  --ag-header-height: 40px;
  --ag-row-height: 32px;
  --ag-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --ag-font-size: 13px;
}

.ag-theme-custom-dark {
  --ag-background-color: hsl(210 12% 17%);
  --ag-foreground-color: hsl(210 40% 98%);
  --ag-header-background-color: hsl(210 12% 20%);
  --ag-header-foreground-color: hsl(210 40% 98%);
  --ag-border-color: hsl(210 12% 25%);
  --ag-row-hover-color: hsl(210 12% 22%);
  --ag-selected-row-background-color: hsl(162 23% 54% / 0.1);
}
```

### Phase 4: Dialog System Implementation (Week 5-6)

#### 4.1 Column Formatting Dialog
```typescript
// src/components/dialogs/ColumnFormattingDialog/index.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDraggable } from '@/hooks/useDraggable';
import { useColumnFormatting } from '@/hooks/useColumnFormatting';
import { StylingTab } from './tabs/StylingTab';
import { FormatTab } from './tabs/FormatTab';
// ... other imports

export const ColumnFormattingDialog: React.FC<Props> = ({ 
  open, 
  onOpenChange,
  gridApi,
  instanceId 
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { position, handleMouseDown } = useDraggable(dialogRef, {
    initialPosition: { x: window.innerWidth / 2 - 450, y: 100 }
  });
  
  const {
    selectedColumns,
    setSelectedColumns,
    formatting,
    updateFormatting,
    previewData
  } = useColumnFormatting(gridApi);
  
  const [activeTab, setActiveTab] = useState('styling');
  
  const handleApply = useCallback(() => {
    // Apply formatting to selected columns
    selectedColumns.forEach(colId => {
      const colDef = gridApi.getColumnDef(colId);
      if (colDef) {
        // Apply cell style
        if (formatting.style) {
          colDef.cellStyle = formatting.style;
        }
        // Apply value formatter
        if (formatting.format) {
          colDef.valueFormatter = createValueFormatter(formatting.format);
        }
        // Apply cell renderer if needed
        if (formatting.template) {
          colDef.cellRenderer = getCellRenderer(formatting.template);
        }
      }
    });
    
    // Refresh grid
    gridApi.refreshCells({ force: true });
    
    // Save to store
    updateColumnFormatting(instanceId, selectedColumns, formatting);
    
    onOpenChange(false);
  }, [selectedColumns, formatting, gridApi, instanceId]);
  
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content 
          ref={dialogRef}
          className="fixed bg-background border rounded-lg shadow-xl z-50"
          style={{
            width: '900px',
            height: '650px',
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
        >
          <div 
            className="dialog-header flex items-center justify-between p-4 border-b cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Dialog.Title className="text-lg font-semibold">
                Column Formatting
              </Dialog.Title>
            </div>
            <Dialog.Close className="rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          
          <div className="flex h-[calc(100%-120px)]">
            {/* Column List */}
            <div className="w-[180px] border-r">
              <ColumnList
                columns={gridApi.getColumnDefs()}
                selected={selectedColumns}
                onSelectionChange={setSelectedColumns}
              />
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start border-b rounded-none h-10">
                  <TabsTrigger value="styling">Styling</TabsTrigger>
                  <TabsTrigger value="format">Format</TabsTrigger>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="filter">Filter</TabsTrigger>
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                </TabsList>
                
                <TabsContent value="styling" className="p-4">
                  <StylingTab 
                    formatting={formatting}
                    onChange={updateFormatting}
                    previewData={previewData}
                  />
                </TabsContent>
                
                <TabsContent value="format" className="p-4">
                  <FormatTab
                    formatting={formatting}
                    onChange={updateFormatting}
                    columnType={getColumnType(selectedColumns[0])}
                  />
                </TabsContent>
                
                {/* Other tabs... */}
              </Tabs>
            </div>
          </div>
          
          <div className="dialog-footer flex items-center justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply
            </Button>
            <Button onClick={() => handleApply(true)}>
              Apply to All
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
```

### Phase 5: Format Templates & Excel Parser (Week 7)

#### 5.1 Format Template System
```typescript
// src/services/formatting/formatters/index.ts
export const BUILT_IN_TEMPLATES = {
  currency: {
    name: 'Currency',
    category: 'number',
    config: {
      symbol: '$',
      position: 'before',
      decimals: 2,
      thousandsSeparator: true,
      negativeFormat: 'parentheses-red'
    },
    formatter: (params: ValueFormatterParams) => {
      const value = parseFloat(params.value);
      if (isNaN(value)) return '';
      
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Math.abs(value));
      
      if (value < 0) {
        return `<span style="color: red">(${formatted})</span>`;
      }
      return formatted;
    }
  },
  
  percentage: {
    name: 'Percentage',
    category: 'number',
    config: {
      decimals: 1,
      multiply: true
    },
    formatter: (params: ValueFormatterParams) => {
      const value = parseFloat(params.value);
      if (isNaN(value)) return '';
      return `${(value * 100).toFixed(1)}%`;
    }
  },
  
  trafficLight: {
    name: 'Traffic Light',
    category: 'status',
    config: {
      thresholds: [
        { value: 0, color: '#ef4444', label: 'Low' },
        { value: 50, color: '#f59e0b', label: 'Medium' },
        { value: 80, color: '#10b981', label: 'High' }
      ]
    },
    cellRenderer: TrafficLightRenderer
  },
  
  progressBar: {
    name: 'Progress Bar',
    category: 'visual',
    config: {
      min: 0,
      max: 100,
      showValue: true,
      gradient: true
    },
    cellRenderer: ProgressBarRenderer
  }
  
  // ... other templates
};
```

### Phase 6: Real-time Data Integration (Week 8)

#### 6.1 WebSocket Service with STOMP
```typescript
// src/services/datasource/WebSocketService.ts
import { Client, StompSubscription } from '@stomp/stompjs';

export class WebSocketService {
  private client: Client;
  private subscriptions = new Map<string, StompSubscription>();
  private reconnectAttempts = 0;
  
  constructor(private config: WebSocketConfig) {
    this.client = new Client({
      brokerURL: config.url,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (config.debug) console.log(str);
      }
    });
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.client.onConnect = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.config.onConnect?.();
    };
    
    this.client.onDisconnect = () => {
      console.log('WebSocket disconnected');
      this.config.onDisconnect?.();
    };
    
    this.client.onStompError = (frame) => {
      console.error('STOMP error', frame);
      this.config.onError?.(new Error(frame.headers.message));
    };
  }
  
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
      
      this.client.onConnect = () => {
        clearTimeout(timeout);
        this.setupEventHandlers();
        resolve();
      };
      
      this.client.activate();
    });
  }
  
  subscribe(
    topic: string, 
    callback: (data: any) => void,
    options?: SubscribeOptions
  ): string {
    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Failed to parse message', error);
      }
    }, options);
    
    const id = `sub-${Date.now()}`;
    this.subscriptions.set(id, subscription);
    return id;
  }
  
  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(id);
    }
  }
  
  publish(topic: string, data: any): void {
    this.client.publish({
      destination: topic,
      body: JSON.stringify(data)
    });
  }
}
```

### Phase 7: Performance Optimizations (Week 9)

#### 7.1 Web Worker for Data Processing
```typescript
// src/workers/dataProcessor.worker.ts
import * as Comlink from 'comlink';

class DataProcessor {
  processLargeDataset(
    data: any[], 
    operations: DataOperation[]
  ): ProcessedData {
    // Heavy processing off the main thread
    let result = data;
    
    for (const operation of operations) {
      switch (operation.type) {
        case 'filter':
          result = this.applyFilter(result, operation.config);
          break;
        case 'sort':
          result = this.applySort(result, operation.config);
          break;
        case 'aggregate':
          result = this.applyAggregation(result, operation.config);
          break;
      }
    }
    
    return {
      data: result,
      stats: this.calculateStats(result)
    };
  }
  
  generateExport(
    data: any[], 
    format: 'csv' | 'excel' | 'json',
    config: ExportConfig
  ): Blob {
    switch (format) {
      case 'csv':
        return this.exportCSV(data, config);
      case 'excel':
        return this.exportExcel(data, config);
      case 'json':
        return this.exportJSON(data, config);
    }
  }
}

Comlink.expose(new DataProcessor());
```

### Phase 8: Testing & Deployment (Week 10-12)

#### 8.1 Testing Strategy
```typescript
// src/components/datatable/__tests__/DataTable.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';

describe('DataTable', () => {
  it('should apply column formatting', async () => {
    const { getByRole, getByText } = render(
      <DataTable instanceId="test-1" />
    );
    
    // Open formatting dialog
    await userEvent.click(getByText('Format Columns'));
    
    // Select column
    await userEvent.click(getByText('Price'));
    
    // Apply currency format
    await userEvent.click(getByText('Currency'));
    await userEvent.click(getByText('Apply'));
    
    // Verify formatting applied
    await waitFor(() => {
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });
  });
});
```

#### 8.2 Build Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ag-grid': ['ag-grid-enterprise', 'ag-grid-react'],
          'ui-libs': ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          'formatting': ['date-fns', './src/services/formatting'],
          'vendor': ['react', 'react-dom', 'zustand']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['ag-grid-enterprise', '@stomp/stompjs', 'idb']
  }
});
```

## Migration from Current Implementation

### Step 1: Component Mapping
- DataTable → Enhanced with Infragistics layout
- DatasourceDialog → Improved with better state management
- FloatingRibbonUI → Redesigned with consistent UX
- Profile management → IDB + MongoDB hybrid

### Step 2: Feature Preservation
- All 15+ format templates
- Excel format string parser
- Conditional formatting
- Real-time updates
- Profile system

### Step 3: Performance Improvements
- Replace localStorage with IDB
- Web Worker processing
- Virtual scrolling optimization
- Memoization strategies

## Deployment Strategy

### Environment Variables
```env
REACT_APP_AG_GRID_LICENSE=your-license-key
REACT_APP_MONGODB_API=https://api.yourapp.com
REACT_APP_WEBSOCKET_URL=wss://ws.yourapp.com
```

### Docker Configuration
```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

## Success Metrics

1. **Performance**
   - Initial load < 2s
   - Grid render < 1s for 100k rows
   - 60fps scrolling
   - Memory usage < 150MB

2. **Features**
   - All existing features preserved
   - Enhanced with enterprise AG-Grid features
   - Better layout management with Infragistics
   - Hybrid storage (local + remote)

3. **Developer Experience**
   - Hot module replacement
   - TypeScript intellisense
   - Component isolation
   - Comprehensive testing

This plan leverages the existing implementation while modernizing the architecture and adding the requested enterprise features.