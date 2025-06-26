# AGV1 Framework Implementation Roadmap

## Technology Stack Recommendations

### Core Technologies (Shared)

#### Data Grid
- **AG-Grid Community Edition** (33.x)
  - Free version has most features needed
  - Enterprise features can be added later
  - Works with both Angular and React

#### State Management
- **React**: Zustand or Valtio
- **Angular**: Akita or NgRx Signal Store
  - Both support similar patterns for easy porting

#### UI Component Libraries
- **React**: 
  - Radix UI + Tailwind CSS
  - shadcn/ui components
  - Floating UI for positioning
- **Angular**:
  - Angular CDK + Tailwind CSS
  - PrimeNG or custom components
  - Angular CDK Overlay for positioning

#### Styling
- **Tailwind CSS** (3.x) - Works great with both
- **CSS Variables** for theming
- **PostCSS** for optimizations

#### Build Tools
- **React**: Vite 5.x
- **Angular**: Angular CLI with esbuild
- **Shared**: Nx Monorepo (optional)

#### Data Management
- **REST**: Axios or native fetch
- **WebSocket**: STOMP.js
- **Data Processing**: Comlink for Web Workers

#### Development Tools
- **TypeScript** 5.x
- **ESLint** + **Prettier**
- **Husky** for git hooks
- **Playwright** for E2E testing
- **Vitest** (React) / **Jest** (Angular) for unit tests

### Package Structure

```
agv1-framework/
├── packages/
│   ├── core/                    # Shared business logic
│   │   ├── src/
│   │   │   ├── services/        # Data processing, formatting
│   │   │   ├── models/          # TypeScript interfaces
│   │   │   ├── utils/           # Shared utilities
│   │   │   └── constants/       # Shared constants
│   │   └── package.json
│   │
│   ├── react/                   # React implementation
│   │   ├── src/
│   │   │   ├── components/      # React components
│   │   │   ├── hooks/           # Custom hooks
│   │   │   ├── stores/          # Zustand stores
│   │   │   └── lib/             # React-specific utils
│   │   └── package.json
│   │
│   └── angular/                 # Angular implementation
│       ├── src/
│       │   ├── components/      # Angular components
│       │   ├── directives/      # Custom directives
│       │   ├── services/        # Angular services
│       │   └── lib/             # Angular-specific utils
│       └── package.json
│
├── apps/
│   ├── react-demo/              # React demo app
│   └── angular-demo/            # Angular demo app
│
└── tools/
    ├── scripts/                 # Build scripts
    └── config/                  # Shared configs
```

## Implementation Phases

### Phase 1: Core Foundation (Week 1-2)

#### 1.1 Set Up Monorepo
```bash
# Using Nx for monorepo management
npx create-nx-workspace@latest agv1-framework \
  --preset=ts \
  --packageManager=npm

# Add React and Angular support
nx g @nx/react:application react-demo
nx g @nx/angular:application angular-demo
```

#### 1.2 Create Core Package
```typescript
// packages/core/src/models/component.model.ts
export interface ComponentConfig {
  instanceId: string;
  type: ComponentType;
  config: Record<string, any>;
  version: string;
}

export interface DataTableConfig extends ComponentConfig {
  columns: ColumnConfig[];
  dataSource?: DataSourceConfig;
  gridOptions?: GridOptions;
}

// packages/core/src/services/formatter.service.ts
export class FormatterService {
  private formatters = new Map<string, Formatter>();
  
  register(name: string, formatter: Formatter): void {
    this.formatters.set(name, formatter);
  }
  
  format(value: any, format: string): string {
    // Implementation
  }
}
```

#### 1.3 Design System Setup
```scss
// packages/core/src/styles/variables.css
:root {
  /* Colors */
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  --color-primary: 221.2 83.2% 53.3%;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
}
```

### Phase 2: Component Architecture (Week 3-4)

#### 2.1 React Implementation

```typescript
// packages/react/src/components/DataTable/DataTable.tsx
import { AgGridReact } from 'ag-grid-react';
import { useDataTableStore } from '../../stores/dataTableStore';
import { DataTableProvider } from './DataTableContext';

export interface DataTableProps {
  instanceId: string;
  onConfigChange?: (config: DataTableConfig) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  instanceId,
  onConfigChange 
}) => {
  const { config, updateConfig } = useDataTableStore(instanceId);
  
  return (
    <DataTableProvider instanceId={instanceId}>
      <div className="datatable-container">
        <DataTableToolbar />
        <AgGridReact
          columnDefs={config.columns}
          rowData={config.data}
          {...config.gridOptions}
        />
        {config.showRibbon && <FloatingRibbon />}
      </div>
    </DataTableProvider>
  );
};

// packages/react/src/hooks/useDataTable.ts
export const useDataTable = (instanceId: string) => {
  const config = useDataTableStore((state) => state.instances[instanceId]);
  const updateConfig = useDataTableStore((state) => state.updateInstance);
  
  const formatColumn = useCallback((columnId: string, format: Format) => {
    // Implementation
  }, [instanceId, updateConfig]);
  
  return {
    config,
    updateConfig,
    formatColumn,
    // ... other methods
  };
};
```

#### 2.2 Angular Implementation

```typescript
// packages/angular/src/components/data-table/data-table.component.ts
@Component({
  selector: 'agv1-data-table',
  template: `
    <div class="datatable-container">
      <agv1-data-table-toolbar 
        [config]="config$ | async"
        (configChange)="updateConfig($event)">
      </agv1-data-table-toolbar>
      
      <ag-grid-angular
        [columnDefs]="columnDefs$ | async"
        [rowData]="rowData$ | async"
        [gridOptions]="gridOptions$ | async"
        (gridReady)="onGridReady($event)">
      </ag-grid-angular>
      
      <agv1-floating-ribbon 
        *ngIf="showRibbon$ | async"
        [config]="config$ | async">
      </agv1-floating-ribbon>
    </div>
  `,
  providers: [DataTableService]
})
export class DataTableComponent implements OnInit {
  @Input() instanceId!: string;
  @Output() configChange = new EventEmitter<DataTableConfig>();
  
  config$ = this.dataTableService.getConfig(this.instanceId);
  columnDefs$ = this.config$.pipe(map(c => c.columns));
  rowData$ = this.config$.pipe(map(c => c.data));
  
  constructor(private dataTableService: DataTableService) {}
}

// packages/angular/src/services/data-table.service.ts
@Injectable()
export class DataTableService {
  private store = new BehaviorSubject<DataTableState>({});
  
  getConfig(instanceId: string): Observable<DataTableConfig> {
    return this.store.pipe(
      map(state => state[instanceId]),
      filter(Boolean)
    );
  }
  
  updateConfig(instanceId: string, config: Partial<DataTableConfig>): void {
    // Implementation
  }
}
```

### Phase 3: Dialog Components (Week 5-6)

#### 3.1 React Dialog Implementation

```typescript
// packages/react/src/components/dialogs/ColumnFormattingDialog.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export const ColumnFormattingDialog: React.FC<Props> = ({ 
  open, 
  onOpenChange,
  columns,
  onApply 
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('styling');
  
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content w-[900px] h-[650px]">
          <DraggableHeader>
            <Dialog.Title>Column Formatting</Dialog.Title>
            <Dialog.Close />
          </DraggableHeader>
          
          <div className="dialog-body">
            <ColumnList 
              columns={columns}
              selected={selectedColumns}
              onSelectionChange={setSelectedColumns}
            />
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="styling">Styling</TabsTrigger>
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
              </TabsList>
              
              <TabsContent value="styling">
                <StylingTab columns={selectedColumns} />
              </TabsContent>
              {/* Other tabs */}
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </DialogFooter>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
```

#### 3.2 Angular Dialog Implementation

```typescript
// packages/angular/src/components/dialogs/column-formatting-dialog.component.ts
@Component({
  selector: 'agv1-column-formatting-dialog',
  template: `
    <div class="dialog-container" *ngIf="visible" cdkDrag>
      <div class="dialog-header" cdkDragHandle>
        <h2>Column Formatting</h2>
        <button (click)="close.emit()">×</button>
      </div>
      
      <div class="dialog-body">
        <agv1-column-list
          [columns]="columns"
          [(selected)]="selectedColumns">
        </agv1-column-list>
        
        <mat-tab-group [(selectedIndex)]="activeTabIndex">
          <mat-tab label="Styling">
            <agv1-styling-tab [columns]="selectedColumns">
            </agv1-styling-tab>
          </mat-tab>
          <!-- Other tabs -->
        </mat-tab-group>
      </div>
      
      <div class="dialog-footer">
        <button mat-button (click)="close.emit()">Cancel</button>
        <button mat-raised-button color="primary" (click)="apply()">
          Apply
        </button>
      </div>
    </div>
  `
})
export class ColumnFormattingDialogComponent {
  @Input() visible = false;
  @Input() columns: ColumnConfig[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<FormattingConfig>();
  
  selectedColumns: string[] = [];
  activeTabIndex = 0;
}
```

### Phase 4: State Management (Week 7-8)

#### 4.1 React State (Zustand)

```typescript
// packages/react/src/stores/dataTableStore.ts
interface DataTableStore {
  instances: Record<string, DataTableConfig>;
  profiles: Profile[];
  activeProfile: string | null;
  
  // Actions
  createInstance: (id: string, config: DataTableConfig) => void;
  updateInstance: (id: string, updates: Partial<DataTableConfig>) => void;
  deleteInstance: (id: string) => void;
  
  // Profile actions
  saveProfile: (name: string) => void;
  loadProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
}

export const useDataTableStore = create<DataTableStore>((set, get) => ({
  instances: {},
  profiles: [],
  activeProfile: null,
  
  createInstance: (id, config) => {
    set((state) => ({
      instances: { ...state.instances, [id]: config }
    }));
  },
  
  updateInstance: (id, updates) => {
    set((state) => ({
      instances: {
        ...state.instances,
        [id]: { ...state.instances[id], ...updates }
      }
    }));
  },
  
  // ... other actions
}));
```

#### 4.2 Angular State (Akita)

```typescript
// packages/angular/src/state/data-table.store.ts
export interface DataTableState {
  instances: Record<string, DataTableConfig>;
  profiles: Profile[];
  activeProfile: string | null;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'dataTable' })
export class DataTableStore extends Store<DataTableState> {
  constructor() {
    super({
      instances: {},
      profiles: [],
      activeProfile: null
    });
  }
}

@Injectable({ providedIn: 'root' })
export class DataTableService {
  constructor(
    private store: DataTableStore,
    private query: DataTableQuery
  ) {}
  
  createInstance(id: string, config: DataTableConfig): void {
    this.store.update(state => ({
      instances: { ...state.instances, [id]: config }
    }));
  }
  
  updateInstance(id: string, updates: Partial<DataTableConfig>): void {
    this.store.update(state => ({
      instances: {
        ...state.instances,
        [id]: { ...state.instances[id], ...updates }
      }
    }));
  }
}
```

### Phase 5: Advanced Features (Week 9-10)

#### 5.1 Web Worker Integration

```typescript
// packages/core/src/workers/data-processor.worker.ts
import { expose } from 'comlink';

const dataProcessor = {
  async processLargeDataset(data: any[], operations: Operation[]) {
    // Heavy processing
    return processedData;
  },
  
  async generateExport(data: any[], format: ExportFormat) {
    // Export generation
    return blob;
  }
};

expose(dataProcessor);

// Usage in React
import * as Comlink from 'comlink';

const worker = new Worker(
  new URL('../workers/data-processor.worker', import.meta.url),
  { type: 'module' }
);
const dataProcessor = Comlink.wrap(worker);

// Usage in Angular
// Similar pattern with Angular's Web Worker support
```

#### 5.2 Real-time Updates

```typescript
// packages/core/src/services/websocket.service.ts
export class WebSocketService {
  private client: Client;
  private subscriptions = new Map<string, StompSubscription>();
  
  connect(config: WebSocketConfig): Promise<void> {
    this.client = new Client({
      brokerURL: config.url,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });
    
    return new Promise((resolve, reject) => {
      this.client.onConnect = () => resolve();
      this.client.onStompError = (error) => reject(error);
      this.client.activate();
    });
  }
  
  subscribe(topic: string, callback: (data: any) => void): string {
    const subscription = this.client.subscribe(topic, (message) => {
      callback(JSON.parse(message.body));
    });
    
    const id = generateId();
    this.subscriptions.set(id, subscription);
    return id;
  }
}
```

### Phase 6: Testing & Documentation (Week 11-12)

#### 6.1 Testing Strategy

```typescript
// React Testing
// packages/react/src/components/__tests__/DataTable.test.tsx
import { render, screen } from '@testing-library/react';
import { DataTable } from '../DataTable';

describe('DataTable', () => {
  it('renders with configuration', () => {
    render(<DataTable instanceId="test-1" />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});

// Angular Testing
// packages/angular/src/components/data-table.component.spec.ts
describe('DataTableComponent', () => {
  let component: DataTableComponent;
  let fixture: ComponentFixture<DataTableComponent>;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DataTableComponent],
      imports: [AgGridModule]
    });
    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

#### 6.2 E2E Testing

```typescript
// e2e/tests/data-table.spec.ts
import { test, expect } from '@playwright/test';

test.describe('DataTable', () => {
  test('should format columns', async ({ page }) => {
    await page.goto('/demo');
    await page.click('button:has-text("Format Columns")');
    await expect(page.locator('.dialog-content')).toBeVisible();
    // ... more tests
  });
});
```

## Migration Strategy

### From Current React Implementation

1. **Extract Core Logic**
   - Move formatters to core package
   - Extract data processing utilities
   - Create shared TypeScript interfaces

2. **Component Migration**
   - Start with smallest components
   - Use adapter pattern for state
   - Maintain API compatibility

3. **Testing Migration**
   - Port existing tests
   - Add cross-framework tests
   - Ensure feature parity

### For Angular Implementation

1. **Leverage Angular Features**
   - Use Angular CDK for overlays
   - Implement with RxJS patterns
   - Use Angular animations

2. **Maintain Consistency**
   - Same features and behavior
   - Shared styling with Tailwind
   - Common keyboard shortcuts

## Performance Considerations

### Bundle Size Optimization
```javascript
// Webpack/Vite config for code splitting
{
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ag-grid': ['ag-grid-community', 'ag-grid-react'],
          'formatting': ['./src/services/formatters'],
          'dialogs': ['./src/components/dialogs']
        }
      }
    }
  }
}
```

### Lazy Loading
```typescript
// React
const ColumnFormattingDialog = lazy(() => 
  import('./dialogs/ColumnFormattingDialog')
);

// Angular
const routes: Routes = [
  {
    path: 'data-table',
    loadChildren: () => import('./data-table/data-table.module')
      .then(m => m.DataTableModule)
  }
];
```

## Deployment Strategy

### NPM Package Publishing
```json
// Package structure
{
  "@agv1/core": "1.0.0",
  "@agv1/react": "1.0.0",
  "@agv1/angular": "1.0.0",
  "@agv1/themes": "1.0.0"
}
```

### CDN Distribution
- Provide UMD builds for direct browser usage
- Host on unpkg/jsdelivr
- Include all dependencies

### Documentation Site
- Build with Docusaurus or similar
- Interactive examples for both frameworks
- API documentation
- Migration guides

## Success Metrics

1. **Performance**
   - Initial load < 2s
   - 60fps scrolling
   - Bundle size < 500KB (excluding AG-Grid)

2. **Developer Experience**
   - Setup time < 5 minutes
   - Hot reload support
   - TypeScript autocomplete

3. **Feature Parity**
   - All features work in both frameworks
   - Consistent behavior
   - Shared test suite passes

## Conclusion

This roadmap provides a clear path to implement the AGV1 framework in both React 19 and Angular 19. The shared core package ensures consistency while allowing each framework to leverage its strengths. The phased approach allows for incremental development and testing, reducing risk and ensuring quality.