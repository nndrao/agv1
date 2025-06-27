import { Subject, BehaviorSubject, Observable, Subscription } from 'rxjs';
import { bufferTime, filter, map, tap } from 'rxjs/operators';
import { BrowserEventEmitter } from './BrowserEventEmitter';

export interface ConflationConfig {
  windowMs: number;
  maxBatchSize: number;
  enableMetrics: boolean;
}

export interface DataUpdate<T> {
  data: T;
  operation: 'add' | 'update' | 'remove';
  timestamp: number;
}

export interface ConflationMetrics {
  totalUpdatesReceived: number;
  updatesApplied: number;
  updatesConflated: number;
  currentUpdateRate: number;
  averageUpdateRate: number;
  conflationRate: number;
  lastUpdateTimestamp: number;
  snapshotSize: number;
}

export class ConflatedDataStore<T extends Record<string, any>> extends BrowserEventEmitter {
  private snapshot = new Map<string, T>();
  private updates$ = new Subject<DataUpdate<T>>();
  private metrics$ = new BehaviorSubject<ConflationMetrics>({
    totalUpdatesReceived: 0,
    updatesApplied: 0,
    updatesConflated: 0,
    currentUpdateRate: 0,
    averageUpdateRate: 0,
    conflationRate: 0,
    lastUpdateTimestamp: 0,
    snapshotSize: 0,
  });
  
  private subscription: Subscription | null = null;
  private updateRateWindow: number[] = [];
  private updateRateWindowSize = 10; // Track last 10 seconds
  private lastRateCalculation = Date.now();
  
  constructor(
    private keyColumn: string,
    private config: ConflationConfig = {
      windowMs: 100,
      maxBatchSize: 1000,
      enableMetrics: true,
    }
  ) {
    super();
    this.setupConflationPipeline();
  }
  
  private setupConflationPipeline(): void {
    this.subscription = this.updates$.pipe(
      tap(() => this.incrementReceivedCount()),
      bufferTime(this.config.windowMs),
      filter(updates => updates.length > 0),
      map(updates => this.conflateUpdates(updates)),
      tap(conflated => this.updateMetrics(conflated))
    ).subscribe({
      next: (conflatedUpdates) => {
        this.applyToSnapshot(conflatedUpdates);
        this.notifySubscribers(conflatedUpdates);
      },
      error: (error) => {
        console.error('[ConflatedDataStore] Pipeline error:', error);
        this.emit('error', error);
      }
    });
  }
  
  private conflateUpdates(updates: DataUpdate<T>[]): Map<string, DataUpdate<T>> {
    const conflated = new Map<string, DataUpdate<T>>();
    let conflatedCount = 0;
    
    // Process updates in order, keeping only the latest for each key
    updates.forEach(update => {
      const key = String(update.data[this.keyColumn]);
      
      // If we've seen this key before in this batch, it's conflation
      if (conflated.has(key)) {
        conflatedCount++;
      }
      
      // For remove operations, we need to handle differently
      if (update.operation === 'remove') {
        // If there was an add/update for this key, cancel it out
        const existing = conflated.get(key);
        if (existing && existing.operation === 'add') {
          // Add followed by remove = no-op
          conflated.delete(key);
        } else {
          // Otherwise, keep the remove
          conflated.set(key, update);
        }
      } else {
        // For add/update, always keep the latest
        conflated.set(key, update);
      }
    });
    
    // Update conflation metrics
    const currentMetrics = this.metrics$.value;
    this.metrics$.next({
      ...currentMetrics,
      updatesConflated: currentMetrics.updatesConflated + conflatedCount,
    });
    
    // Limit batch size if configured
    if (this.config.maxBatchSize && conflated.size > this.config.maxBatchSize) {
      const limited = new Map<string, DataUpdate<T>>();
      let count = 0;
      for (const [key, update] of conflated) {
        if (count >= this.config.maxBatchSize) break;
        limited.set(key, update);
        count++;
      }
      return limited;
    }
    
    return conflated;
  }
  
  private applyToSnapshot(updates: Map<string, DataUpdate<T>>): void {
    updates.forEach((update, key) => {
      switch (update.operation) {
        case 'add':
        case 'update':
          this.snapshot.set(key, update.data);
          break;
        case 'remove':
          this.snapshot.delete(key);
          break;
      }
    });
    
    // Update snapshot size metric
    const currentMetrics = this.metrics$.value;
    this.metrics$.next({
      ...currentMetrics,
      snapshotSize: this.snapshot.size,
      updatesApplied: currentMetrics.updatesApplied + updates.size,
    });
  }
  
  private notifySubscribers(updates: Map<string, DataUpdate<T>>): void {
    // Convert to array format for compatibility
    const updateArray = Array.from(updates.values());
    
    // Emit updates event only - avoid multiple events
    this.emit('updates', updateArray);
    
    // Don't emit snapshot-changed on every update - too expensive
    // Let consumers request snapshot when needed
  }
  
  private incrementReceivedCount(): void {
    const currentMetrics = this.metrics$.value;
    const now = Date.now();
    
    // Update total count
    this.metrics$.next({
      ...currentMetrics,
      totalUpdatesReceived: currentMetrics.totalUpdatesReceived + 1,
      lastUpdateTimestamp: now,
    });
    
    // Update rate calculation
    this.updateRateCalculation(now);
  }
  
  private updateRateCalculation(now: number): void {
    // Add current timestamp to window
    this.updateRateWindow.push(now);
    
    // Remove old timestamps (older than window size in seconds)
    const cutoff = now - (this.updateRateWindowSize * 1000);
    this.updateRateWindow = this.updateRateWindow.filter(ts => ts > cutoff);
    
    // Calculate current rate (updates per second)
    if (this.updateRateWindow.length > 1) {
      const duration = (now - this.updateRateWindow[0]) / 1000; // in seconds
      const currentRate = this.updateRateWindow.length / duration;
      
      const currentMetrics = this.metrics$.value;
      const avgRate = currentMetrics.averageUpdateRate === 0 
        ? currentRate 
        : (currentMetrics.averageUpdateRate * 0.9 + currentRate * 0.1); // Exponential moving average
      
      this.metrics$.next({
        ...currentMetrics,
        currentUpdateRate: Math.round(currentRate),
        averageUpdateRate: Math.round(avgRate),
      });
    }
  }
  
  private updateMetrics(conflated: Map<string, DataUpdate<T>>): void {
    const currentMetrics = this.metrics$.value;
    const conflationRate = currentMetrics.totalUpdatesReceived > 0
      ? (currentMetrics.updatesConflated / currentMetrics.totalUpdatesReceived) * 100
      : 0;
    
    this.metrics$.next({
      ...currentMetrics,
      conflationRate: Math.round(conflationRate * 10) / 10, // Round to 1 decimal
    });
  }
  
  // Public API
  
  addUpdate(update: T, operation: 'add' | 'update' | 'remove' = 'update'): void {
    this.updates$.next({
      data: update,
      operation,
      timestamp: Date.now(),
    });
  }
  
  addBulkUpdates(updates: T[], operation: 'add' | 'update' | 'remove' = 'update'): void {
    updates.forEach(update => {
      this.updates$.next({
        data: update,
        operation,
        timestamp: Date.now(),
      });
    });
  }
  
  setSnapshot(data: T[]): void {
    // Clear existing snapshot
    this.snapshot.clear();
    
    // Add all data
    data.forEach(item => {
      const key = String(item[this.keyColumn]);
      this.snapshot.set(key, item);
    });
    
    // Update metrics
    const currentMetrics = this.metrics$.value;
    this.metrics$.next({
      ...currentMetrics,
      snapshotSize: this.snapshot.size,
    });
    
    // Notify subscribers
    this.emit('snapshot-loaded', data);
  }
  
  getSnapshot(): T[] {
    return Array.from(this.snapshot.values());
  }
  
  getByKey(key: string): T | undefined {
    return this.snapshot.get(String(key));
  }
  
  getMetrics(): ConflationMetrics {
    return this.metrics$.value;
  }
  
  getMetrics$(): Observable<ConflationMetrics> {
    return this.metrics$.asObservable();
  }
  
  clear(): void {
    this.snapshot.clear();
    this.updateRateWindow = [];
    this.metrics$.next({
      totalUpdatesReceived: 0,
      updatesApplied: 0,
      updatesConflated: 0,
      currentUpdateRate: 0,
      averageUpdateRate: 0,
      conflationRate: 0,
      lastUpdateTimestamp: 0,
      snapshotSize: 0,
    });
    this.emit('cleared');
  }
  
  destroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.updates$.complete();
    this.metrics$.complete();
    this.removeAllListeners();
    this.snapshot.clear();
  }
  
  // Configuration updates
  
  updateConfig(config: Partial<ConflationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart pipeline with new config
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.setupConflationPipeline();
  }
  
  getConfig(): ConflationConfig {
    return { ...this.config };
  }
}