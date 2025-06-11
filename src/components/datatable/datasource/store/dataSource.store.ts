import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DataSource, TestResult } from '../types';

interface DataSourceState {
  dataSources: DataSource[];
  activeDataSourceId: string | null;
  connectionStatus: Record<string, boolean>;
  
  // Actions
  addDataSource: (dataSource: DataSource) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  deleteDataSource: (id: string) => void;
  setActiveDataSource: (id: string | null) => void;
  testDataSource: (dataSource: DataSource) => Promise<TestResult>;
  fetchDataFromSource: (id: string) => Promise<any[]>;
  
  // Getters
  getActiveDataSources: () => DataSource[];
  getDataSourceById: (id: string) => DataSource | undefined;
}

export const useDataSourceStore = create<DataSourceState>()(
  persist(
    (set, get) => ({
      dataSources: [],
      activeDataSourceId: null,
      connectionStatus: {},

      addDataSource: (dataSource) => {
        set((state) => ({
          dataSources: [...state.dataSources, dataSource]
        }));
      },

      updateDataSource: (id, updates) => {
        set((state) => ({
          dataSources: state.dataSources.map(ds =>
            ds.id === id
              ? { ...ds, ...updates, updatedAt: Date.now() }
              : ds
          )
        }));
      },

      deleteDataSource: (id) => {
        set((state) => ({
          dataSources: state.dataSources.filter(ds => ds.id !== id),
          activeDataSourceId: state.activeDataSourceId === id ? null : state.activeDataSourceId
        }));
      },

      setActiveDataSource: (id) => {
        set({ activeDataSourceId: id });
      },

      testDataSource: async (dataSource) => {
        const startTime = Date.now();
        
        try {
          let data: any[] = [];
          
          if (dataSource.type === 'rest') {
            const config = dataSource.config as any;
            const response = await fetch(config.url, {
              method: config.method,
              headers: config.headers,
              body: config.method !== 'GET' ? config.body : undefined
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            data = await response.json();
            
            // Ensure data is an array
            if (!Array.isArray(data)) {
              // Try to find an array in the response
              const possibleArrays = Object.values(data).filter(v => Array.isArray(v));
              if (possibleArrays.length > 0) {
                data = possibleArrays[0] as any[];
              } else {
                data = [data]; // Wrap single object in array
              }
            }
          } else if (dataSource.type === 'stomp') {
            // For STOMP, we'll implement a mock test for now
            // In a real implementation, this would establish a WebSocket connection
            data = generateMockStompData();
          }
          
          return {
            success: true,
            data,
            duration: Date.now() - startTime,
            recordCount: data.length
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime,
            recordCount: 0
          };
        }
      },

      fetchDataFromSource: async (id) => {
        const dataSource = get().dataSources.find(ds => ds.id === id);
        if (!dataSource) {
          throw new Error('Data source not found');
        }
        
        const result = await get().testDataSource(dataSource);
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch data');
        }
        
        return result.data || [];
      },

      getActiveDataSources: () => {
        return get().dataSources.filter(ds => ds.active);
      },

      getDataSourceById: (id) => {
        return get().dataSources.find(ds => ds.id === id);
      }
    }),
    {
      name: 'datatable-datasources',
      partialize: (state) => ({
        dataSources: state.dataSources
      })
    }
  )
);

// Mock data generator for STOMP testing
function generateMockStompData(): any[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    timestamp: new Date().toISOString(),
    symbol: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'][Math.floor(Math.random() * 5)],
    price: (Math.random() * 1000).toFixed(2),
    volume: Math.floor(Math.random() * 1000000),
    change: (Math.random() * 10 - 5).toFixed(2),
    changePercent: (Math.random() * 5 - 2.5).toFixed(2),
    bid: (Math.random() * 1000).toFixed(2),
    ask: (Math.random() * 1000).toFixed(2),
    high: (Math.random() * 1000).toFixed(2),
    low: (Math.random() * 1000).toFixed(2),
    open: (Math.random() * 1000).toFixed(2),
    close: (Math.random() * 1000).toFixed(2),
    marketCap: Math.floor(Math.random() * 1000000000000),
    peRatio: (Math.random() * 50).toFixed(2),
    dividendYield: (Math.random() * 5).toFixed(2),
    beta: (Math.random() * 2).toFixed(2),
    exchange: ['NYSE', 'NASDAQ', 'LSE', 'TSE'][Math.floor(Math.random() * 4)],
    currency: ['USD', 'EUR', 'GBP', 'JPY'][Math.floor(Math.random() * 4)],
    lastUpdate: Date.now()
  }));
}