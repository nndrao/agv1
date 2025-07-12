import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConflationSettings {
  enabled: boolean;
  windowMs: number;        // Default: 100ms
  maxBatchSize: number;    // Default: 1000
  enableMetrics: boolean;  // Default: true
}

export interface StompDatasourceConfig {
  id: string;
  name: string;
  type: 'stomp';
  websocketUrl: string;
  listenerTopic: string;
  requestMessage: string;
  requestBody?: string;
  snapshotEndToken: string;
  keyColumn: string;
  columnDefinitions: ColumnDefinition[];
  createdAt: number;
  updatedAt: number;
  autoStart?: boolean;
  inferredFields?: FieldInfo[];
  snapshotTimeoutMs?: number; // Timeout for snapshot collection (default: 60000ms)
  conflationSettings?: ConflationSettings;
}

export interface RestDatasourceConfig {
  id: string;
  name: string;
  type: 'rest';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  keyColumn: string;
  columnDefinitions: ColumnDefinition[];
  createdAt: number;
  updatedAt: number;
  conflationSettings?: ConflationSettings;
}

export type DatasourceConfig = StompDatasourceConfig | RestDatasourceConfig;

export interface ColumnDefinition {
  field: string;
  headerName: string;
  cellDataType: 'text' | 'number' | 'boolean' | 'date' | 'dateString' | 'object';
  width?: number;
  hide?: boolean;
  filter?: string;
  valueFormatter?: string;
  type?: string;
}

export interface FieldInfo {
  path: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable: boolean;
  children?: Record<string, FieldInfo>;
  sample?: any;
}

interface DatasourceStore {
  datasources: DatasourceConfig[];
  
  // Actions
  addDatasource: (datasource: DatasourceConfig) => void;
  updateDatasource: (id: string, updates: Partial<DatasourceConfig>) => void;
  deleteDatasource: (id: string) => void;
  getDatasource: (id: string) => DatasourceConfig | undefined;
  getDatasourcesByType: (type: 'stomp' | 'rest') => DatasourceConfig[];
}

export const useDatasourceStore = create<DatasourceStore>()(
  persist(
    (set, get) => ({
      datasources: [],
      
      addDatasource: (datasource) => {
        set((state) => ({
          datasources: [...state.datasources, datasource],
        }));
      },
      
      updateDatasource: (id, updates) => {
        set((state) => ({
          datasources: state.datasources.map((ds) =>
            ds.id === id
              ? { ...ds, ...updates, updatedAt: Date.now() } as DatasourceConfig
              : ds
          ),
        }));
      },
      
      deleteDatasource: (id) => {
        set((state) => ({
          datasources: state.datasources.filter((ds) => ds.id !== id),
        }));
      },
      
      getDatasource: (id) => {
        return get().datasources.find((ds) => ds.id === id);
      },
      
      getDatasourcesByType: (type) => {
        return get().datasources.filter((ds) => ds.type === type);
      },
    }),
    {
      name: 'datasource-storage',
    }
  )
);