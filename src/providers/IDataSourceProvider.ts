import { EventEmitter } from 'events';
import { ColDef } from 'ag-grid-community';

/**
 * Event types emitted by datasource providers
 */
export type DataSourceEventType = 
  | 'connected'
  | 'disconnected' 
  | 'snapshotStart'
  | 'snapshotData'
  | 'snapshotComplete'
  | 'update'
  | 'error';

/**
 * Event data structure for datasource events
 */
export type DataSourceEvent = 
  | { type: 'connected' }
  | { type: 'disconnected'; reason?: string }
  | { type: 'snapshotStart'; totalRows?: number }
  | { type: 'snapshotData'; rows: any[]; isLastBatch: boolean }
  | { type: 'snapshotComplete'; totalRows: number }
  | { type: 'update'; rows: any[] }
  | { type: 'error'; error: Error };

/**
 * Statistics for monitoring datasource performance
 */
export interface DataSourceStatistics {
  isConnected: boolean;
  snapshotRowsReceived: number;
  updateRowsReceived: number;
  connectionUptime: number;
  lastUpdateTime: number;
  messagesPerSecond: number;
}

/**
 * Core interface for all datasource providers
 */
export interface IDataSourceProvider extends EventEmitter {
  // Unique identifier for this datasource
  readonly id: string;
  
  // Display name
  readonly name: string;
  
  /**
   * Start the datasource connection and begin receiving data
   */
  start(): Promise<void>;
  
  /**
   * Stop the datasource connection
   */
  stop(): void;
  
  /**
   * Restart the datasource (stop + start)
   * This should clear all data and start fresh
   */
  restart(): Promise<void>;
  
  /**
   * Start receiving real-time updates
   * Should only be called after snapshot is complete
   */
  startUpdates(): void;
  
  /**
   * Stop receiving real-time updates
   */
  stopUpdates(): void;
  
  /**
   * Get the column definitions for this datasource
   */
  getColumnDefs(): ColDef[];
  
  /**
   * Get the key column field name for row identification
   */
  getKeyColumn(): string;
  
  /**
   * Get current connection status
   */
  isConnected(): boolean;
  
  /**
   * Get statistics about the datasource
   */
  getStatistics(): DataSourceStatistics;
  
  /**
   * Subscribe to datasource events
   */
  on(event: DataSourceEventType, listener: (data: DataSourceEvent) => void): this;
  
  /**
   * Unsubscribe from datasource events
   */
  off(event: DataSourceEventType, listener: (data: DataSourceEvent) => void): this;
  
  /**
   * Emit a datasource event
   */
  emit(event: DataSourceEventType, data: DataSourceEvent): boolean;
}