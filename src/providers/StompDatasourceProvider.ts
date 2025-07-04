import { Client, IMessage } from '@stomp/stompjs';
import { StompDatasourceConfig } from '@/stores/datasource.store';

export interface StompConnectionResult {
  success: boolean;
  data?: any[];
  error?: string;
  rawData?: any;
  statistics?: StompStatistics;
}

export interface StompStatistics {
  snapshotRowsReceived: number;
  updateRowsReceived: number;
  connectionCount: number;
  disconnectionCount: number;
  snapshotDuration?: number;
  lastConnectedAt?: number;
  lastDisconnectedAt?: number;
  isConnected: boolean;
  snapshotStartTime?: number;
  snapshotEndTime?: number;
  bytesReceived: number;
  snapshotBytesReceived: number;
  updateBytesReceived: number;
}

export class StompDatasourceProvider {
  private client: Client | null = null;
  private connectionPromise: Promise<void> | null = null;
  private isConnected = false;
  private activeSubscriptions: any[] = [];
  private messageRate: string = '1000';
  private updateStatsInterval: NodeJS.Timeout | null = null;
  private lastLogTime = Date.now();
  private statistics: StompStatistics = {
    snapshotRowsReceived: 0,
    updateRowsReceived: 0,
    connectionCount: 0,
    disconnectionCount: 0,
    isConnected: false,
    bytesReceived: 0,
    snapshotBytesReceived: 0,
    updateBytesReceived: 0,
  };
  private isReceivingSnapshot = false;
  private updateCallbacks: ((data: any) => void)[] = [];

  constructor(private config: Partial<StompDatasourceConfig> & { messageRate?: string }) {
    this.messageRate = config.messageRate || '1000';
  }

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.client = new Client({
          brokerURL: this.config.websocketUrl!,
          debug: (str) => {
            // Only log errors, not regular messages
            if (str.includes('ERROR') || str.includes('WARN')) {
              console.error('[STOMP Error]', str);
            }
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        this.client.onConnect = () => {
          // Connected successfully
          this.isConnected = true;
          this.statistics.isConnected = true;
          this.statistics.connectionCount++;
          this.statistics.lastConnectedAt = Date.now();
          resolve();
        };

        this.client.onDisconnect = () => {
          // Disconnected
          this.isConnected = false;
          this.statistics.isConnected = false;
          this.statistics.disconnectionCount++;
          this.statistics.lastDisconnectedAt = Date.now();
        };

        this.client.onStompError = (frame) => {
          console.error('[STOMP] Error', frame.headers['message']);
          this.statistics.isConnected = false;
          reject(new Error(frame.headers['message'] || 'STOMP connection error'));
        };

        this.client.onWebSocketError = (event) => {
          console.error('[STOMP] WebSocket error', event);
          this.statistics.isConnected = false;
          reject(new Error('WebSocket connection error'));
        };

        this.client.activate();
      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  async checkConnection(): Promise<boolean> {
    try {
      // Just try to connect without subscribing
      if (!this.isConnected) {
        await this.connect();
      }
      return true;
    } catch (error) {
      console.error('[STOMP] Connection check failed:', error);
      return false;
    }
  }

  async fetchSnapshot(maxRows?: number): Promise<StompConnectionResult> {
    try {
      // Connect if not already connected
      if (!this.isConnected) {
        await this.connect();
      }

      return new Promise((resolve) => {
        const receivedData: any[] = [];
        this.statistics.snapshotRowsReceived = 0;
        this.statistics.snapshotStartTime = Date.now();
        this.isReceivingSnapshot = true;
        
        // Start periodic stats logging
        this.startStatsLogging();
        let subscription: any;
        let resolved = false;

        // Helper to resolve only once
        const resolveOnce = (result: StompConnectionResult) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(result);
          }
        };

        // Set up a timeout
        // Use configured timeout or default to 60 seconds for large datasets
        const timeoutMs = this.config.snapshotTimeoutMs || 60000;
        const timeout = setTimeout(() => {
          // Timeout reached, returning collected data
          console.warn(`[StompDatasourceProvider] Snapshot timeout reached after ${timeoutMs}ms. Received ${receivedData.length} rows.`);
          resolveOnce({
            success: true,
            data: receivedData,
            rawData: receivedData,
          });
        }, timeoutMs);

        // Subscribe to the topic
        subscription = this.client!.subscribe(
          this.config.listenerTopic!,
          (message: IMessage) => {
            try {
              const messageBody = message.body;
              const messageBytes = new TextEncoder().encode(messageBody).length;
              this.statistics.bytesReceived += messageBytes;
              // Process received message
              
              // Check if this is a snapshot end token (string starting with 'Success' or matching the token)
              if (this.config.snapshotEndToken) {
                if (messageBody.startsWith('Success') || 
                    messageBody.includes(this.config.snapshotEndToken)) {
                  // Snapshot end detected
                  this.isReceivingSnapshot = false;
                  this.statistics.snapshotEndTime = Date.now();
                  this.statistics.snapshotDuration = this.statistics.snapshotEndTime - (this.statistics.snapshotStartTime || 0);
                  console.log(`[StompDatasourceProvider] Snapshot end token received: ${this.statistics.snapshotRowsReceived} rows so far`);
                  
                  // On slow networks, wait a bit for any remaining messages in transit
                  setTimeout(() => {
                    console.log(`[StompDatasourceProvider] Snapshot completed: ${this.statistics.snapshotRowsReceived} rows in ${this.statistics.snapshotDuration}ms`);
                    resolveOnce({
                      success: true,
                      data: receivedData,
                      rawData: receivedData,
                      statistics: { ...this.statistics },
                    });
                  }, 500); // 500ms grace period for slow networks
                  return;
                }
              }
              
              // Try to parse as JSON
              let data;
              try {
                data = JSON.parse(messageBody);
              } catch (parseError) {
                // If not JSON, check if it's a snapshot end token
                if (messageBody.startsWith('Success')) {
                  // Snapshot end detected (non-JSON)
                  this.isReceivingSnapshot = false;
                  this.statistics.snapshotEndTime = Date.now();
                  this.statistics.snapshotDuration = this.statistics.snapshotEndTime - (this.statistics.snapshotStartTime || 0);
                  console.log(`[StompDatasourceProvider] Snapshot end token received (non-JSON): ${this.statistics.snapshotRowsReceived} rows so far`);
                  
                  if (!resolved) {
                    // On slow networks, wait a bit for any remaining messages in transit
                    setTimeout(() => {
                      console.log(`[StompDatasourceProvider] Snapshot completed (non-JSON token): ${this.statistics.snapshotRowsReceived} rows in ${this.statistics.snapshotDuration}ms`);
                      resolveOnce({
                        success: true,
                        data: receivedData,
                        rawData: receivedData,
                        statistics: { ...this.statistics },
                      });
                    }, 500); // 500ms grace period for slow networks
                  }
                  // Continue receiving updates for real-time data
                  return;
                }
                console.warn('[STOMP] Non-JSON message received:', messageBody);
                return;
              }
              
              // Process data based on whether it's snapshot or update
              if (this.isReceivingSnapshot) {
                // During snapshot, just append data
                if (Array.isArray(data)) {
                  receivedData.push(...data);
                  this.statistics.snapshotRowsReceived += data.length;
                  this.statistics.snapshotBytesReceived += messageBytes;
                } else if (typeof data === 'object' && data !== null) {
                  receivedData.push(data);
                  this.statistics.snapshotRowsReceived += 1;
                  this.statistics.snapshotBytesReceived += messageBytes;
                }
                
                // Log progress every 5000 rows
                if (this.statistics.snapshotRowsReceived % 5000 === 0) {
                  const elapsed = Date.now() - (this.statistics.snapshotStartTime || 0);
                  console.log(`[StompDatasourceProvider] Snapshot progress: ${this.statistics.snapshotRowsReceived} rows received in ${elapsed}ms`);
                }
              } else {
                // For real-time updates, send only the updates
                const updates = Array.isArray(data) ? data : [data];
                
                this.statistics.updateRowsReceived += updates.length;
                this.statistics.updateBytesReceived += messageBytes;
                // Notify update callbacks with just the updates
                this.updateCallbacks.forEach(callback => callback(updates));
              }

              // Check if we've reached max rows for initial snapshot (only if maxRows is specified)
              if (maxRows && receivedData.length >= maxRows && !resolved) {
                // Resolve the promise for initial snapshot
                resolveOnce({
                  success: true,
                  data: receivedData.slice(0, maxRows),
                  rawData: receivedData,
                });
                // Continue receiving updates for real-time data
              }
            } catch (error) {
              console.error('[STOMP] Error processing message:', error);
            }
          }
        );
        
        // Store the subscription for cleanup
        this.activeSubscriptions.push(subscription);

        // Send request message after a delay (like the test client does)
        setTimeout(() => {
          if (this.config.requestMessage || this.config.listenerTopic!.includes('/snapshot/')) {
            // Use requestMessage as the destination, or fall back to listenerTopic with rate
            let triggerDestination = this.config.requestMessage || this.config.listenerTopic!;
            
            // If no explicit requestMessage and the listener topic is like /snapshot/positions
            if (!this.config.requestMessage && this.config.listenerTopic!.includes('/snapshot/')) {
              triggerDestination = `${this.config.listenerTopic}/${this.messageRate}`;
            }
            
            this.client!.publish({
              destination: triggerDestination,
              body: (this.config as any).requestBody || 'START',
            });
          }
        }, 1000); // 1 second delay like in test client
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private containsToken(data: any, token: string): boolean {
    if (typeof data === 'string') {
      return data.includes(token) || data.startsWith('Success');
    }
    if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (this.containsToken(data[key], token)) {
          return true;
        }
      }
    }
    return false;
  }

  // Subscribe to real-time updates
  subscribeToUpdates(callback: (data: any) => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }
  
  unsubscribeFromUpdates(callback: (data: any) => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  getStatistics(): StompStatistics {
    return { ...this.statistics };
  }


  disconnect(): void {
    // Stop stats logging
    this.stopStatsLogging();
    
    // Unsubscribe from all active subscriptions
    this.activeSubscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('[STOMP] Error unsubscribing:', error);
      }
    });
    this.activeSubscriptions = [];
    
    // Disconnect the client
    if (this.client && this.isConnected) {
      this.client.deactivate();
      this.isConnected = false;
      this.statistics.isConnected = false;
      this.statistics.disconnectionCount++;
      this.statistics.lastDisconnectedAt = Date.now();
      this.connectionPromise = null;
    }
    
    // Clear callbacks
    this.updateCallbacks = [];
  }

  // Infer fields from the received data
  static inferFields(data: any[]): Record<string, FieldInfo> {
    const fieldMap: Record<string, FieldInfo> = {};
    
    // Sample up to 100 rows for type inference
    const sampleSize = Math.min(data.length, 100);
    const samples = data.slice(0, sampleSize);

    // Process each sample
    samples.forEach((row) => {
      this.processObject(row, '', fieldMap);
    });

    return fieldMap;
  }

  private static processObject(
    obj: any,
    prefix: string,
    fieldMap: Record<string, FieldInfo>,
    depth: number = 0
  ): void {
    if (depth > 10) return; // Prevent infinite recursion

    Object.keys(obj).forEach((key) => {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (!fieldMap[fieldPath]) {
        fieldMap[fieldPath] = {
          path: fieldPath,
          type: this.inferType(value),
          nullable: value === null || value === undefined,
          sample: value,
        };
      }

      // Update nullable status
      if (value === null || value === undefined) {
        fieldMap[fieldPath].nullable = true;
      }

      // Process nested objects
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        if (!fieldMap[fieldPath].children) {
          fieldMap[fieldPath].children = {};
        }
        this.processObject(value, fieldPath, fieldMap[fieldPath].children!, depth + 1);
      }

      // Process arrays
      if (Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (firstItem && typeof firstItem === 'object') {
          if (!fieldMap[fieldPath].children) {
            fieldMap[fieldPath].children = {};
          }
          this.processObject(firstItem, `${fieldPath}[]`, fieldMap[fieldPath].children!, depth + 1);
        }
      }
    });
  }

  private static inferType(value: any): FieldInfo['type'] {
    if (value === null || value === undefined) return 'string';
    if (typeof value === 'string') {
      // Check if it's a date string
      if (!isNaN(Date.parse(value)) && /\d{4}-\d{2}-\d{2}/.test(value)) {
        return 'date';
      }
      return 'string';
    }
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'object') return 'object';
    return 'string';
  }
  
  private startStatsLogging(): void {
    // Clear any existing interval
    this.stopStatsLogging();
    
    // Log stats every 30 seconds
    this.updateStatsInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastLog = (now - this.lastLogTime) / 1000;
      
      console.log(`[STOMP Stats] ${this.config.name || 'Datasource'} - Last ${timeSinceLastLog.toFixed(0)}s:`, {
        snapshotRows: this.statistics.snapshotRowsReceived,
        updateRows: this.statistics.updateRowsReceived,
        totalBytes: this.statistics.bytesReceived,
        isConnected: this.statistics.isConnected,
        isSnapshot: this.isReceivingSnapshot
      });
      
      this.lastLogTime = now;
    }, 30000); // 30 seconds
  }
  
  private stopStatsLogging(): void {
    if (this.updateStatsInterval) {
      clearInterval(this.updateStatsInterval);
      this.updateStatsInterval = null;
    }
  }
}

interface FieldInfo {
  path: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable: boolean;
  children?: Record<string, FieldInfo>;
  sample?: any;
}