import { Client, IMessage } from '@stomp/stompjs';
import { ColDef } from 'ag-grid-community';
import { IDataSourceProvider, DataSourceEvent, DataSourceEventType, DataSourceStatistics } from './IDataSourceProvider';
import { StompDatasourceConfig } from '@/stores/datasource.store';
import { BrowserEventEmitter } from '@/services/datasource/BrowserEventEmitter';

/**
 * Simplified STOMP datasource provider implementation
 * Handles WebSocket connection and data streaming with a clean event-based interface
 */
export class SimplifiedStompDataSourceProvider extends BrowserEventEmitter implements IDataSourceProvider {
  readonly id: string;
  readonly name: string;
  
  private client: Client | null = null;
  private connected = false;
  private updatesEnabled = false;
  private subscription: any = null;
  private snapshotData: any[] = [];
  private isReceivingSnapshot = false;
  private statistics: DataSourceStatistics = {
    isConnected: false,
    snapshotRowsReceived: 0,
    updateRowsReceived: 0,
    connectionUptime: 0,
    lastUpdateTime: 0,
    messagesPerSecond: 0,
  };
  private connectionStartTime = 0;
  private messageTimestamps: number[] = [];
  private readonly MESSAGE_RATE_WINDOW = 5000; // 5 second window for rate calculation
  
  constructor(private config: StompDatasourceConfig) {
    super();
    this.id = config.id;
    this.name = config.name;
  }
  
  async start(): Promise<void> {
    if (this.connected) {
      console.log(`[${this.id}] Already connected`);
      return;
    }
    
    console.log(`[${this.id}] Starting connection to ${this.config.websocketUrl}`);
    
    return new Promise((resolve, reject) => {
      try {
        this.client = new Client({
          brokerURL: this.config.websocketUrl,
          debug: (str) => {
            if (str.includes('ERROR') || str.includes('WARN')) {
              console.error(`[${this.id}] STOMP:`, str);
            }
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });
        
        this.client.onConnect = () => {
          this.connected = true;
          this.connectionStartTime = Date.now();
          this.statistics.isConnected = true;
          console.log(`[${this.id}] Connected`);
          
          this.emit('connected', { type: 'connected' });
          
          // Start subscription
          this.startSubscription();
          resolve();
        };
        
        this.client.onDisconnect = () => {
          this.connected = false;
          this.statistics.isConnected = false;
          console.log(`[${this.id}] Disconnected`);
          
          this.emit('disconnected', { type: 'disconnected' });
        };
        
        this.client.onStompError = (frame) => {
          const error = new Error(frame.headers['message'] || 'STOMP connection error');
          console.error(`[${this.id}] STOMP error:`, error);
          
          this.emit('error', { type: 'error', error });
          reject(error);
        };
        
        this.client.onWebSocketError = (event) => {
          const error = new Error('WebSocket connection error');
          console.error(`[${this.id}] WebSocket error:`, event);
          
          this.emit('error', { type: 'error', error });
          reject(error);
        };
        
        this.client.activate();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  stop(): void {
    console.log(`[${this.id}] Stopping`);
    
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    if (this.client && this.connected) {
      this.client.deactivate();
      this.connected = false;
      this.statistics.isConnected = false;
    }
    
    this.snapshotData = [];
    this.isReceivingSnapshot = false;
    this.updatesEnabled = false;
  }
  
  async restart(): Promise<void> {
    console.log(`[${this.id}] Restarting`);
    this.stop();
    
    // Reset statistics
    this.statistics = {
      isConnected: false,
      snapshotRowsReceived: 0,
      updateRowsReceived: 0,
      connectionUptime: 0,
      lastUpdateTime: 0,
      messagesPerSecond: 0,
    };
    
    await this.start();
  }
  
  startUpdates(): void {
    console.log(`[${this.id}] Starting updates`);
    this.updatesEnabled = true;
  }
  
  stopUpdates(): void {
    console.log(`[${this.id}] Stopping updates`);
    this.updatesEnabled = false;
  }
  
  getColumnDefs(): ColDef[] {
    return this.config.columnDefinitions.map(col => ({
      field: col.field,
      headerName: col.headerName,
      type: col.cellDataType,
      // Enable cell flashing for updates
      enableCellChangeFlash: true,
    }));
  }
  
  getKeyColumn(): string {
    return this.config.keyColumn;
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  getStatistics(): DataSourceStatistics {
    // Update connection uptime
    if (this.connected && this.connectionStartTime > 0) {
      this.statistics.connectionUptime = Date.now() - this.connectionStartTime;
    }
    
    // Calculate messages per second
    const now = Date.now();
    this.messageTimestamps = this.messageTimestamps.filter(ts => now - ts <= this.MESSAGE_RATE_WINDOW);
    this.statistics.messagesPerSecond = (this.messageTimestamps.length / this.MESSAGE_RATE_WINDOW) * 1000;
    
    return { ...this.statistics };
  }
  
  private startSubscription(): void {
    if (!this.client || !this.connected) {
      return;
    }
    
    console.log(`[${this.id}] Subscribing to ${this.config.listenerTopic}`);
    
    this.isReceivingSnapshot = true;
    this.snapshotData = [];
    
    // Emit snapshot start event
    this.emit('snapshotStart', { type: 'snapshotStart' });
    
    this.subscription = this.client.subscribe(
      this.config.listenerTopic,
      (message: IMessage) => this.handleMessage(message)
    );
    
    // Send request message to trigger snapshot
    setTimeout(() => {
      if (this.config.requestMessage && this.client) {
        const destination = this.config.requestMessage || `${this.config.listenerTopic}/1000`;
        const body = (this.config as any).requestBody || 'START';
        
        console.log(`[${this.id}] Sending request to ${destination}: ${body}`);
        this.client.publish({
          destination,
          body,
        });
      }
    }, 1000);
  }
  
  private handleMessage(message: IMessage): void {
    try {
      const messageBody = message.body;
      this.recordMessage();
      
      // Check for snapshot end token
      if (this.isReceivingSnapshot && this.config.snapshotEndToken) {
        if (messageBody.includes(this.config.snapshotEndToken) || messageBody.startsWith('Success')) {
          console.log(`[${this.id}] Snapshot complete: ${this.snapshotData.length} rows`);
          
          this.isReceivingSnapshot = false;
          this.statistics.snapshotRowsReceived = this.snapshotData.length;
          
          // Emit final batch if any remaining data
          if (this.snapshotData.length > 0) {
            console.log(`[${this.id}] Emitting final snapshot batch: ${this.snapshotData.length} rows`);
            
            // Check for duplicates in the data
            if (this.config.keyColumn) {
              const uniqueKeys = new Set(this.snapshotData.map(row => row[this.config.keyColumn]));
              if (uniqueKeys.size !== this.snapshotData.length) {
                console.warn(`[${this.id}] Duplicate rows in snapshot data! ${this.snapshotData.length} rows but only ${uniqueKeys.size} unique keys`);
              }
            }
            
            this.emit('snapshotData', { 
              type: 'snapshotData', 
              rows: [...this.snapshotData], 
              isLastBatch: true 
            });
          }
          
          // Emit snapshot complete
          this.emit('snapshotComplete', { 
            type: 'snapshotComplete', 
            totalRows: this.statistics.snapshotRowsReceived 
          });
          
          // Clear snapshot data to free memory
          this.snapshotData = [];
          
          // Auto-start updates only after snapshot is complete
          // This is now handled by the component after it receives snapshotComplete event
          // this.startUpdates();
          return;
        }
      }
      
      // Try to parse JSON data
      let data;
      try {
        data = JSON.parse(messageBody);
      } catch (e) {
        // Not JSON, might be end token or error
        if (!messageBody.startsWith('Success')) {
          console.warn(`[${this.id}] Non-JSON message:`, messageBody.substring(0, 100));
        }
        return;
      }
      
      // Process data
      const rows = Array.isArray(data) ? data : [data];
      
      if (this.isReceivingSnapshot) {
        // During snapshot, collect and batch data
        console.log(`[${this.id}] Received ${rows.length} rows, total accumulated: ${this.snapshotData.length + rows.length}`);
        
        // Check if these rows contain duplicates
        if (this.config.keyColumn && rows.length > 0) {
          const firstRowKey = rows[0][this.config.keyColumn];
          const existingRow = this.snapshotData.find(r => r[this.config.keyColumn] === firstRowKey);
          if (existingRow) {
            console.warn(`[${this.id}] Received duplicate row with key ${firstRowKey}!`);
          }
        }
        
        this.snapshotData.push(...rows);
        
        // Emit batches of 1000 rows to avoid overwhelming the UI
        if (this.snapshotData.length >= 1000) {
          console.log(`[${this.id}] Emitting snapshot batch: ${this.snapshotData.length} rows`);
          this.emit('snapshotData', { 
            type: 'snapshotData', 
            rows: [...this.snapshotData], 
            isLastBatch: false 
          });
          // Don't clear snapshot data, keep accumulating
        }
      } else if (this.updatesEnabled) {
        // Real-time updates
        this.statistics.updateRowsReceived += rows.length;
        this.statistics.lastUpdateTime = Date.now();
        
        this.emit('update', { 
          type: 'update', 
          rows 
        });
      }
    } catch (error) {
      console.error(`[${this.id}] Error processing message:`, error);
      this.emit('error', { 
        type: 'error', 
        error: error instanceof Error ? error : new Error(String(error)) 
      });
    }
  }
  
  private recordMessage(): void {
    const now = Date.now();
    this.messageTimestamps.push(now);
    // Keep only messages within the rate window
    this.messageTimestamps = this.messageTimestamps.filter(ts => now - ts <= this.MESSAGE_RATE_WINDOW);
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