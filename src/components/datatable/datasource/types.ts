import { ColDef } from 'ag-grid-community';

export type DataSourceType = 'stomp' | 'rest';

export interface StompConfig {
  websocketUrl: string;
  topic: string;
  triggerMessage: string;
  snapshotToken: string;
}

export interface RestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  active: boolean;
  config: StompConfig | RestConfig;
  schema: any | null;
  columnDefs: ColDef[];
  createdAt: number;
  updatedAt: number;
  lastFetch?: number;
  lastError?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error?: string;
  lastUpdate: number;
}

export interface TestResult {
  success: boolean;
  data?: any[];
  error?: string;
  duration: number;
  recordCount: number;
}