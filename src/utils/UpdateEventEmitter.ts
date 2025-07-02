// Custom event emitter with queue management for ordered async processing
// Using a browser-compatible EventTarget instead of Node.js EventEmitter

export interface UpdateEvent {
  type: 'transaction' | 'error' | 'status';
  datasourceId: string;
  transaction?: any;
  error?: Error;
  status?: 'connected' | 'disconnected' | 'error';
  timestamp: number;
}

export interface QueueMetrics {
  queueDepth: number;
  processedCount: number;
  errorCount: number;
  averageProcessingTime: number;
  batchedCount: number;
  lastBatchSize: number;
  lastBatchTime: number;
}

// Browser-compatible event emitter implementation
export class UpdateEventEmitter {
  private listeners: Map<string, Set<(event: UpdateEvent) => void | Promise<void>>> = new Map();
  private queue: UpdateEvent[] = [];
  private processing = false;
  private metrics: QueueMetrics = {
    queueDepth: 0,
    processedCount: 0,
    errorCount: 0,
    averageProcessingTime: 0,
    batchedCount: 0,
    lastBatchSize: 0,
    lastBatchTime: 0
  };
  private processingTimes: number[] = [];
  private maxQueueSize: number;
  // private processingPromise: Promise<void> | null = null;
  
  // Batching configuration - DISABLED to avoid double batching with ConflatedDataStore
  private batchingEnabled: boolean = false;
  private batchInterval: number = 60; // milliseconds
  private batchTimer: NodeJS.Timeout | null = null;
  private eventBatches: Map<string, UpdateEvent[]> = new Map();

  constructor(maxQueueSize: number = 10000, batchingConfig?: { enabled: boolean; interval: number }) {
    this.maxQueueSize = maxQueueSize;
    if (batchingConfig) {
      this.batchingEnabled = batchingConfig.enabled;
      this.batchInterval = Math.min(Math.max(batchingConfig.interval, 10), 100); // Clamp between 10-100ms
    }
  }
  
  // EventEmitter-like methods
  on(event: string, listener: (event: UpdateEvent) => void | Promise<void>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }
  
  off(event: string, listener: (event: UpdateEvent) => void | Promise<void>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
  
  emit(event: string, data: UpdateEvent): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('[UpdateEventEmitter] Listener error:', error);
        }
      });
    }
  }
  
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  // Enqueue update event
  async enqueue(event: UpdateEvent): Promise<void> {
    if (this.batchingEnabled) {
      // Add to batch for this datasource
      const datasourceBatch = this.eventBatches.get(event.datasourceId) || [];
      
      // Check if batch size is exceeding limits
      if (datasourceBatch.length >= this.maxQueueSize / 10) { // Use 1/10th of max queue size per datasource
        console.warn(`[UpdateEventEmitter] Batch size limit reached for ${event.datasourceId}, processing immediately`);
        // Process this batch immediately
        await this.processSingleBatch(event.datasourceId, datasourceBatch);
        this.eventBatches.set(event.datasourceId, [event]); // Start new batch with current event
      } else {
        datasourceBatch.push(event);
        this.eventBatches.set(event.datasourceId, datasourceBatch);
      }
      
      this.metrics.queueDepth = Array.from(this.eventBatches.values()).reduce((sum, batch) => sum + batch.length, 0);
      
      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatches(), this.batchInterval);
      }
      
      return; // Don't wait for processing in batch mode
    }
    
    // Original non-batched behavior
    // Check queue size
    if (this.queue.length >= this.maxQueueSize) {
      const error = new Error(`Queue overflow: max size ${this.maxQueueSize} reached`);
      this.emit('error', { ...event, error });
      this.metrics.errorCount++;
      throw error;
    }

    // Add to queue
    this.queue.push(event);
    this.metrics.queueDepth = this.queue.length;

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue(); // Don't await - let it process async
    }
  }

  // Process batches of events
  private async processBatches(): Promise<void> {
    this.batchTimer = null;
    const startTime = performance.now();
    
    // Process each datasource's batch
    for (const [datasourceId, events] of this.eventBatches.entries()) {
      if (events.length === 0) continue;
      
      await this.processSingleBatch(datasourceId, events);
    }
    
    // Clear batches
    this.eventBatches.clear();
    this.metrics.queueDepth = 0;
    
    // Update processing time metrics
    const processingTime = performance.now() - startTime;
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }
  
  // Process a single batch
  private async processSingleBatch(datasourceId: string, events: UpdateEvent[]): Promise<void> {
    const startTime = performance.now();
    try {
      // Combine all transactions in the batch
      const batchedEvent = this.combineBatchedEvents(datasourceId, events);
      
      // Emit the batched event
      await this.emitAsync(datasourceId, batchedEvent);
      
      // Update metrics
      this.metrics.batchedCount += events.length;
      this.metrics.lastBatchSize = events.length;
      this.metrics.lastBatchTime = Date.now();
      this.metrics.processedCount += events.length;
      
      console.log(`[UpdateEventEmitter] Processed batch for ${datasourceId}: ${events.length} events`);
    } catch (error) {
      console.error('[UpdateEventEmitter] Error processing batch:', error);
      this.metrics.errorCount++;
      // Emit individual errors for each event in the failed batch
      events.forEach(event => {
        this.emit('error', { ...event, error } as UpdateEvent);
      });
    }
    
    // Update processing time metrics
    const processingTime = performance.now() - startTime;
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }
  
  // Combine multiple events into a single batched event
  private combineBatchedEvents(datasourceId: string, events: UpdateEvent[]): UpdateEvent {
    // Filter only transaction events
    const transactionEvents = events.filter(e => e.type === 'transaction' && e.transaction);
    
    if (transactionEvents.length === 0) {
      // If no transaction events, return the last event
      return events[events.length - 1];
    }
    
    // Combine all transactions
    const combinedTransaction: any = {
      add: [],
      update: [],
      remove: []
    };
    
    transactionEvents.forEach(event => {
      const tx = event.transaction;
      if (tx.add) combinedTransaction.add.push(...tx.add);
      if (tx.update) combinedTransaction.update.push(...tx.update);
      if (tx.remove) combinedTransaction.remove.push(...tx.remove);
    });
    
    // Return a single batched event
    return {
      type: 'transaction',
      datasourceId,
      transaction: combinedTransaction,
      timestamp: Date.now()
    };
  }

  // Process queue in FIFO order
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      const startTime = performance.now();

      try {
        // Emit event to all listeners
        await this.emitAsync(event.datasourceId, event);
        
        // Update metrics
        const processingTime = performance.now() - startTime;
        this.processingTimes.push(processingTime);
        if (this.processingTimes.length > 100) {
          this.processingTimes.shift();
        }
        this.metrics.processedCount++;
        this.metrics.averageProcessingTime = 
          this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
      } catch (error) {
        console.error('[UpdateEventEmitter] Error processing event:', error);
        this.metrics.errorCount++;
        this.emit('error', { ...event, error } as UpdateEvent);
      }

      this.metrics.queueDepth = this.queue.length;

      // Yield to event loop to prevent blocking
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    this.processing = false;
    // this.processingPromise = null;
  }

  // Emit event asynchronously to all listeners
  private async emitAsync(event: string, data: UpdateEvent): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;
    
    // Process listeners sequentially to maintain order
    for (const listener of eventListeners) {
      try {
        const result = listener(data);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error('[UpdateEventEmitter] Listener error:', error);
        // Continue processing other listeners
      }
    }
  }

  // Get current metrics
  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  // Enable or disable batching
  setBatching(enabled: boolean, interval?: number): void {
    this.batchingEnabled = enabled;
    if (interval !== undefined) {
      this.batchInterval = Math.min(Math.max(interval, 10), 100); // Clamp between 10-100ms
    }
    
    // If disabling batching, process any pending batches immediately
    if (!enabled && this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
      this.processBatches();
    }
    
    console.log(`[UpdateEventEmitter] Batching ${enabled ? 'enabled' : 'disabled'} with interval ${this.batchInterval}ms`);
  }

  // Clear queue (emergency use)
  clearQueue(): void {
    if (this.batchingEnabled) {
      let cleared = 0;
      this.eventBatches.forEach(batch => {
        cleared += batch.length;
      });
      this.eventBatches.clear();
      this.metrics.queueDepth = 0;
      console.warn(`[UpdateEventEmitter] Cleared ${cleared} pending batched events`);
    } else {
      const cleared = this.queue.length;
      this.queue = [];
      this.metrics.queueDepth = 0;
      console.warn(`[UpdateEventEmitter] Cleared ${cleared} pending events`);
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    // Cancel batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Process any pending batches
    if (this.batchingEnabled && this.eventBatches.size > 0) {
      await this.processBatches();
    }
    
    // Wait for queue to empty
    while (this.queue.length > 0 || this.processing) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Remove all listeners
    this.removeAllListeners();
  }
}