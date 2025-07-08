import { EventEmitter } from 'events';
import { ColDef } from 'ag-grid-community';
import { IDataSourceProvider, DataSourceEvent, DataSourceEventType, DataSourceStatistics } from './IDataSourceProvider';

interface MockData {
  id: number;
  symbol: string;
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

/**
 * Mock WebSocket provider for testing real-time updates
 */
export class MockWebSocketProvider extends EventEmitter implements IDataSourceProvider {
  readonly id: string;
  readonly name: string;
  
  private connected = false;
  private updatesEnabled = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private data: MockData[] = [];
  private statistics: DataSourceStatistics = {
    isConnected: false,
    snapshotRowsReceived: 0,
    updateRowsReceived: 0,
    connectionUptime: 0,
    lastUpdateTime: 0,
    messagesPerSecond: 0,
  };
  private connectionStartTime = 0;
  
  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
  }
  
  async start(): Promise<void> {
    console.log(`[MockWebSocketProvider] Starting ${this.id}`);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.connected = true;
    this.connectionStartTime = Date.now();
    this.statistics.isConnected = true;
    
    this.emit('connected', { type: 'connected' });
    
    // Start snapshot after connection
    this.startSnapshot();
  }
  
  stop(): void {
    console.log(`[MockWebSocketProvider] Stopping ${this.id}`);
    
    this.stopUpdates();
    this.connected = false;
    this.statistics.isConnected = false;
    this.data = [];
    
    this.emit('disconnected', { type: 'disconnected', reason: 'Manual stop' });
  }
  
  async restart(): Promise<void> {
    this.stop();
    await this.start();
  }
  
  startUpdates(): void {
    if (this.updatesEnabled || !this.connected) return;
    
    console.log(`[MockWebSocketProvider] Starting updates`);
    this.updatesEnabled = true;
    
    // Send updates every 500ms
    this.updateInterval = setInterval(() => {
      const numUpdates = Math.floor(Math.random() * 5) + 1;
      const updates: MockData[] = [];
      
      for (let i = 0; i < numUpdates; i++) {
        const rowIndex = Math.floor(Math.random() * this.data.length);
        const row = this.data[rowIndex];
        
        // Update price and timestamp
        const updatedRow = {
          ...row,
          price: row.price + (Math.random() - 0.5) * 10,
          timestamp: new Date().toISOString(),
        };
        
        this.data[rowIndex] = updatedRow;
        updates.push(updatedRow);
      }
      
      this.statistics.updateRowsReceived += updates.length;
      this.statistics.lastUpdateTime = Date.now();
      
      console.log(`[MockWebSocketProvider] Sending ${updates.length} updates`);
      this.emit('update', { type: 'update', rows: updates });
    }, 500);
  }
  
  stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.updatesEnabled = false;
    console.log(`[MockWebSocketProvider] Stopped updates`);
  }
  
  getColumnDefs(): ColDef[] {
    return [
      { 
        field: 'id', 
        headerName: 'ID',
        type: 'number',
        enableCellChangeFlash: true,
      },
      { 
        field: 'symbol', 
        headerName: 'Symbol',
        type: 'text',
        enableCellChangeFlash: true,
      },
      { 
        field: 'price', 
        headerName: 'Price',
        type: 'number',
        enableCellChangeFlash: true,
        valueFormatter: (params) => params.value?.toFixed(2),
      },
      { 
        field: 'quantity', 
        headerName: 'Quantity',
        type: 'number',
        enableCellChangeFlash: true,
      },
      { 
        field: 'side', 
        headerName: 'Side',
        type: 'text',
        enableCellChangeFlash: true,
        cellClassRules: {
          'text-green-600': (params) => params.value === 'BUY',
          'text-red-600': (params) => params.value === 'SELL',
        },
      },
      { 
        field: 'timestamp', 
        headerName: 'Last Updated',
        type: 'text',
        enableCellChangeFlash: true,
        valueFormatter: (params) => {
          if (!params.value) return '';
          return new Date(params.value).toLocaleTimeString();
        },
      },
    ];
  }
  
  getKeyColumn(): string {
    return 'id';
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  getStatistics(): DataSourceStatistics {
    if (this.connected && this.connectionStartTime > 0) {
      this.statistics.connectionUptime = Date.now() - this.connectionStartTime;
    }
    return { ...this.statistics };
  }
  
  private startSnapshot(): void {
    console.log(`[MockWebSocketProvider] Starting snapshot`);
    
    this.emit('snapshotStart', { type: 'snapshotStart' });
    
    // Generate initial data
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'BAC', 'WMT'];
    this.data = [];
    
    for (let i = 0; i < 100; i++) {
      this.data.push({
        id: i + 1,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        price: 100 + Math.random() * 400,
        quantity: Math.floor(Math.random() * 1000) + 100,
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Simulate batched snapshot delivery
    setTimeout(() => {
      console.log(`[MockWebSocketProvider] Sending snapshot batch 1`);
      this.emit('snapshotData', { 
        type: 'snapshotData', 
        rows: this.data.slice(0, 50),
        isLastBatch: false 
      });
    }, 100);
    
    setTimeout(() => {
      console.log(`[MockWebSocketProvider] Sending snapshot batch 2`);
      this.emit('snapshotData', { 
        type: 'snapshotData', 
        rows: this.data,
        isLastBatch: true 
      });
      
      this.statistics.snapshotRowsReceived = this.data.length;
      
      this.emit('snapshotComplete', { 
        type: 'snapshotComplete', 
        totalRows: this.data.length 
      });
    }, 200);
  }
  
  // Override EventEmitter methods with proper typing
  on(event: DataSourceEventType, listener: (data: DataSourceEvent) => void): this {
    return super.on(event, listener);
  }
  
  off(event: DataSourceEventType, listener: (data: DataSourceEvent) => void): this {
    return super.off(event, listener);
  }
  
  emit(event: DataSourceEventType, data: DataSourceEvent): boolean {
    return super.emit(event, data);
  }
}