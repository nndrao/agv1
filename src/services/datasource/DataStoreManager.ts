import { ConflatedDataStore, ConflationConfig } from './ConflatedDataStore';
import { DatasourceStatistics } from './DatasourceStatistics';
import { DatasourceConfig } from '@/stores/datasource.store';

export interface DataStoreEntry {
  store: ConflatedDataStore<any>;
  statistics: DatasourceStatistics;
  config: DatasourceConfig;
  lastAccess: number;
}

export class DataStoreManager {
  private static instance: DataStoreManager;
  private stores = new Map<string, DataStoreEntry>();
  private maxStores = 10; // Maximum number of stores to keep in memory
  private memoryLimitMB = 500; // Maximum total memory usage in MB
  
  private constructor() {}
  
  static getInstance(): DataStoreManager {
    if (!DataStoreManager.instance) {
      DataStoreManager.instance = new DataStoreManager();
    }
    return DataStoreManager.instance;
  }
  
  createStore(config: DatasourceConfig): ConflatedDataStore<any> {
    console.log(`[DataStoreManager] Creating store for ${config.id}`);
    
    const existingEntry = this.stores.get(config.id);
    if (existingEntry) {
      console.log(`[DataStoreManager] Store already exists for ${config.id}`);
      // Update last access time
      existingEntry.lastAccess = Date.now();
      return existingEntry.store;
    }
    
    // Check if we need to evict old stores
    if (this.stores.size >= this.maxStores) {
      this.evictLeastRecentlyUsed();
    }
    
    // Create conflation config from datasource settings
    const conflationConfig: ConflationConfig = config.conflationSettings || {
      windowMs: 100,  // 100ms window for conflation
      maxBatchSize: 1000,  // Process up to 1000 updates per batch
      enableMetrics: true,
    };
    
    // Create new store and statistics
    const store = new ConflatedDataStore(config.keyColumn, conflationConfig);
    const statistics = new DatasourceStatistics(config.id);
    
    // Create entry
    const entry: DataStoreEntry = {
      store,
      statistics,
      config,
      lastAccess: Date.now(),
    };
    
    // Store the entry
    this.stores.set(config.id, entry);
    
    // Set up memory monitoring
    this.setupMemoryMonitoring(config.id);
    
    return store;
  }
  
  getStore(datasourceId: string): ConflatedDataStore<any> | undefined {
    const entry = this.stores.get(datasourceId);
    if (entry) {
      entry.lastAccess = Date.now();
      return entry.store;
    }
    console.log(`[DataStoreManager] No store found for ${datasourceId}. Available stores:`, Array.from(this.stores.keys()));
    return undefined;
  }
  
  getStatistics(datasourceId: string): DatasourceStatistics | undefined {
    const entry = this.stores.get(datasourceId);
    return entry?.statistics;
  }
  
  updateStoreConfig(datasourceId: string, config: Partial<ConflationConfig>): void {
    const entry = this.stores.get(datasourceId);
    if (entry) {
      entry.store.updateConfig(config);
      entry.lastAccess = Date.now();
    }
  }
  
  removeStore(datasourceId: string): void {
    console.log(`[DataStoreManager] removeStore called for ${datasourceId}`);
    const entry = this.stores.get(datasourceId);
    if (entry) {
      // Clean up
      entry.store.destroy();
      entry.statistics.destroy();
      this.stores.delete(datasourceId);
      
      console.log(`[DataStoreManager] Removed store for datasource: ${datasourceId}`);
    } else {
      console.log(`[DataStoreManager] No store to remove for ${datasourceId}`);
    }
  }
  
  private evictLeastRecentlyUsed(): void {
    let oldestId: string | null = null;
    let oldestTime = Date.now();
    
    // Find the least recently used store
    this.stores.forEach((entry, id) => {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestId = id;
      }
    });
    
    if (oldestId) {
      console.log(`[DataStoreManager] Evicting least recently used store: ${oldestId}`);
      this.removeStore(oldestId);
    }
  }
  
  private setupMemoryMonitoring(datasourceId: string): void {
    const entry = this.stores.get(datasourceId);
    if (!entry) return;
    
    // Monitor store metrics
    const subscription = entry.store.getMetrics$().subscribe(metrics => {
      // Estimate memory usage (rough calculation)
      const rowSize = 1024; // Assume 1KB per row average
      const memoryBytes = metrics.snapshotSize * rowSize;
      
      // Update statistics
      entry.statistics.updateMemoryUsage(memoryBytes);
      
      // Check total memory usage
      this.checkMemoryLimit();
    });
    
    // Store the subscription for cleanup
    (entry as any)._metricsSubscription = subscription;
  }
  
  private checkMemoryLimit(): void {
    let totalMemoryMB = 0;
    
    // Calculate total memory usage
    this.stores.forEach(entry => {
      const stats = entry.statistics.getStats();
      totalMemoryMB += stats.memoryUsageMB;
    });
    
    // If over limit, evict stores
    while (totalMemoryMB > this.memoryLimitMB && this.stores.size > 1) {
      this.evictLeastRecentlyUsed();
      
      // Recalculate
      totalMemoryMB = 0;
      this.stores.forEach(entry => {
        const stats = entry.statistics.getStats();
        totalMemoryMB += stats.memoryUsageMB;
      });
    }
  }
  
  getAllStatistics(): Map<string, DatasourceStatistics> {
    const statsMap = new Map<string, DatasourceStatistics>();
    this.stores.forEach((entry, id) => {
      statsMap.set(id, entry.statistics);
    });
    return statsMap;
  }
  
  getActiveStoreIds(): string[] {
    return Array.from(this.stores.keys());
  }
  
  getTotalMemoryUsageMB(): number {
    let total = 0;
    this.stores.forEach(entry => {
      const stats = entry.statistics.getStats();
      total += stats.memoryUsageMB;
    });
    return total;
  }
  
  clear(): void {
    // Clean up all stores
    this.stores.forEach((_, id) => {
      this.removeStore(id);
    });
    this.stores.clear();
  }
  
  // Configuration methods
  
  setMaxStores(max: number): void {
    this.maxStores = max;
    // Evict if necessary
    while (this.stores.size > this.maxStores) {
      this.evictLeastRecentlyUsed();
    }
  }
  
  setMemoryLimitMB(limitMB: number): void {
    this.memoryLimitMB = limitMB;
    this.checkMemoryLimit();
  }
}