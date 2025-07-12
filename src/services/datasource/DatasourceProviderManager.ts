import { SimplifiedStompDataSourceProvider } from '@/providers/SimplifiedStompDataSourceProvider';
import { StompDatasourceConfig } from '@/stores/datasource.store';

export interface ProviderSubscriber {
  id: string;
  onSnapshot: (data: any[], totalRows: number, isComplete?: boolean) => void;
  onUpdate?: (updates: any[]) => void;
  onError?: (error: Error) => void;
}

export class DatasourceProviderManager {
  private static instance: DatasourceProviderManager;
  private providers = new Map<string, SimplifiedStompDataSourceProvider>();
  private subscribers = new Map<string, Set<ProviderSubscriber>>();
  private snapshotData = new Map<string, any[]>();
  private fetchingSnapshots = new Map<string, Promise<any>>();

  private constructor() {}

  static getInstance(): DatasourceProviderManager {
    if (!DatasourceProviderManager.instance) {
      DatasourceProviderManager.instance = new DatasourceProviderManager();
    }
    return DatasourceProviderManager.instance;
  }

  /**
   * Get or create a provider for a datasource
   */
  private getOrCreateProvider(datasource: StompDatasourceConfig): SimplifiedStompDataSourceProvider {
    const existingProvider = this.providers.get(datasource.id);
    if (existingProvider) {
      return existingProvider;
    }

    const provider = new SimplifiedStompDataSourceProvider(datasource);

    this.providers.set(datasource.id, provider);
    // Don't reset subscribers if they already exist (important for refresh)
    if (!this.subscribers.has(datasource.id)) {
      this.subscribers.set(datasource.id, new Set());
    }
    
    // Set up event listeners for the simplified provider
    provider.on('update', (event) => {
      const subscribers = this.subscribers.get(datasource.id);
      if (subscribers && event.type === 'update' && event.rows) {
        subscribers.forEach(subscriber => {
          if (subscriber.onUpdate) {
            subscriber.onUpdate(event.rows);
          }
        });
      }
    });
    
    provider.on('error', (event) => {
      const subscribers = this.subscribers.get(datasource.id);
      if (subscribers && event.type === 'error' && event.error) {
        subscribers.forEach(subscriber => {
          if (subscriber.onError) {
            subscriber.onError(event.error);
          }
        });
      }
    });
    
    return provider;
  }

  /**
   * Subscribe to a datasource
   */
  async subscribe(
    datasource: StompDatasourceConfig,
    subscriber: ProviderSubscriber
  ): Promise<void> {
    console.log(`[DatasourceProviderManager] Subscribe request from ${subscriber.id} to ${datasource.id}`);
    
    // Check if subscriber already exists
    const subscribers = this.subscribers.get(datasource.id) || new Set();
    const existingSubscriber = Array.from(subscribers).find(s => s.id === subscriber.id);
    if (existingSubscriber) {
      console.log(`[DatasourceProviderManager] Subscriber ${subscriber.id} already exists for ${datasource.id}, updating`);
      subscribers.delete(existingSubscriber);
    }
    
    // Get or create provider
    const provider = this.getOrCreateProvider(datasource);
    
    // Add subscriber (we already got subscribers above and removed any existing one)
    subscribers.add(subscriber);
    this.subscribers.set(datasource.id, subscribers);

    // If we already have snapshot data, send it immediately
    const existingData = this.snapshotData.get(datasource.id);
    if (existingData) {
      console.log(`[DatasourceProviderManager] Sending existing snapshot to ${subscriber.id}: ${existingData.length} rows`);
      subscriber.onSnapshot(existingData, existingData.length, true);
      return;
    }

    // Check if a snapshot fetch is already in progress
    const fetchingPromise = this.fetchingSnapshots.get(datasource.id);
    if (fetchingPromise) {
      console.log(`[DatasourceProviderManager] Snapshot fetch already in progress for ${datasource.id}, waiting...`);
      await fetchingPromise;
      
      // Send the data after fetch completes
      const data = this.snapshotData.get(datasource.id) || [];
      subscriber.onSnapshot(data, data.length, true);
      return;
    }

    // Start new snapshot fetch
    await this.fetchSnapshot(datasource, provider);
  }

  /**
   * Fetch snapshot data and notify all subscribers
   */
  private async fetchSnapshot(
    datasource: StompDatasourceConfig,
    provider: SimplifiedStompDataSourceProvider
  ): Promise<void> {
    console.log(`[DatasourceProviderManager] Starting snapshot fetch for ${datasource.id}`);
    
    // Check if we have any subscribers
    const subscribers = this.subscribers.get(datasource.id) || new Set();
    console.log(`[DatasourceProviderManager] fetchSnapshot: ${subscribers.size} subscribers ready to be notified`);
    
    // Create promise to track fetch
    const fetchPromise = (async () => {
      try {
        // Set up event listeners for snapshot
        let isComplete = false;
        
        const snapshotHandler = (event: any) => {
          if (event.type === 'snapshotData') {
            // The provider already sends accumulated data, so we just pass it through
            this.snapshotData.set(datasource.id, event.rows);
            
            // Notify all subscribers
            const subscribers = this.subscribers.get(datasource.id) || new Set();
            subscribers.forEach(subscriber => {
              console.log(`[DatasourceProviderManager] Notifying subscriber ${subscriber.id}: ${event.rows.length} rows, complete: ${event.isLastBatch}`);
              subscriber.onSnapshot(event.rows, event.rows.length, event.isLastBatch || false);
            });
          }
        };
        
        const completeHandler = (event: any) => {
          if (event.type === 'snapshotComplete') {
            isComplete = true;
            console.log(`[DatasourceProviderManager] Snapshot complete for ${datasource.id}: ${event.totalRows} rows`);
            
            // Final update to ensure all subscribers are notified with the stored snapshot data
            const finalData = this.snapshotData.get(datasource.id) || [];
            const subscribers = this.subscribers.get(datasource.id) || new Set();
            subscribers.forEach(subscriber => {
              console.log(`[DatasourceProviderManager] Final snapshot for subscriber ${subscriber.id}: ${finalData.length} rows`);
              subscriber.onSnapshot(finalData, finalData.length, true);
            });
            
            // Clean up listeners
            provider.off('snapshotData', snapshotHandler);
            provider.off('snapshotComplete', completeHandler);
          }
        };
        
        // Add listeners
        provider.on('snapshotData', snapshotHandler);
        provider.on('snapshotComplete', completeHandler);
        
        // Start the provider
        await provider.start();
        
        // Wait for snapshot to complete (with timeout)
        const timeout = 30000; // 30 seconds
        const startTime = Date.now();
        while (!isComplete && (Date.now() - startTime) < timeout) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!isComplete) {
          throw new Error('Snapshot fetch timeout');
        }
        
      } catch (error) {
        console.error(`[DatasourceProviderManager] Error fetching snapshot for ${datasource.id}:`, error);
        
        // Notify subscribers of error
        const subscribers = this.subscribers.get(datasource.id) || new Set();
        subscribers.forEach(subscriber => {
          if (subscriber.onError) {
            subscriber.onError(error as Error);
          }
        });
        
        throw error;
      } finally {
        // Clear fetch promise
        this.fetchingSnapshots.delete(datasource.id);
      }
    })();

    // Store fetch promise
    this.fetchingSnapshots.set(datasource.id, fetchPromise);
    
    await fetchPromise;
  }


  /**
   * Unsubscribe from a datasource
   */
  unsubscribe(datasourceId: string, subscriberId: string): void {
    console.log(`[DatasourceProviderManager] Unsubscribe request from ${subscriberId} to ${datasourceId}`);
    
    const subscribers = this.subscribers.get(datasourceId);
    if (!subscribers) return;

    // Remove subscriber
    const subscriber = Array.from(subscribers).find(s => s.id === subscriberId);
    if (subscriber) {
      subscribers.delete(subscriber);
    }

    // If no more subscribers, disconnect provider
    if (subscribers.size === 0) {
      console.log(`[DatasourceProviderManager] No more subscribers for ${datasourceId}, disconnecting provider`);
      const provider = this.providers.get(datasourceId);
      if (provider) {
        provider.stop();
        this.providers.delete(datasourceId);
        this.snapshotData.delete(datasourceId);
        this.subscribers.delete(datasourceId);
      }
    }
  }

  /**
   * Refresh a datasource (clears cache and re-fetches for all subscribers)
   */
  async refresh(datasource: StompDatasourceConfig): Promise<void> {
    console.log(`[DatasourceProviderManager] Refresh requested for ${datasource.id}`);
    
    // Clear existing data
    this.snapshotData.delete(datasource.id);
    
    // Get provider
    const provider = this.providers.get(datasource.id);
    if (!provider) {
      console.log(`[DatasourceProviderManager] No active provider for ${datasource.id}`);
      return;
    }

    // Disconnect and reconnect
    provider.stop();
    this.providers.delete(datasource.id);
    
    // Create new provider (this will set up update broadcasting again)
    const newProvider = this.getOrCreateProvider(datasource);

    // Log current subscribers
    const subscribers = this.subscribers.get(datasource.id);
    console.log(`[DatasourceProviderManager] After refresh, ${subscribers?.size || 0} subscribers for ${datasource.id}:`, 
      subscribers ? Array.from(subscribers).map(s => s.id) : []);
    
    // Fetch new snapshot
    await this.fetchSnapshot(datasource, newProvider);
  }

  /**
   * Get current snapshot data
   */
  getSnapshotData(datasourceId: string): any[] | undefined {
    return this.snapshotData.get(datasourceId);
  }

  /**
   * Get provider for a datasource configuration
   */
  getProvider(datasource: StompDatasourceConfig): SimplifiedStompDataSourceProvider {
    return this.getOrCreateProvider(datasource);
  }

  /**
   * Register a subscriber and return an unsubscribe function
   */
  registerSubscriber(datasourceId: string): () => void {
    // Return a function that unsubscribes when called
    return () => {
      // No-op for now, as the actual subscription happens via subscribe method
      console.log(`[DatasourceProviderManager] Unsubscribe requested for ${datasourceId}`);
    };
  }

  /**
   * Check if provider exists
   */
  hasProvider(datasourceId: string): boolean {
    return this.providers.has(datasourceId);
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount(datasourceId: string): number {
    const subscribers = this.subscribers.get(datasourceId);
    return subscribers ? subscribers.size : 0;
  }
  
  /**
   * Start updates for a datasource
   */
  startUpdates(datasourceId: string): void {
    const provider = this.providers.get(datasourceId);
    if (provider) {
      console.log(`[DatasourceProviderManager] Starting updates for ${datasourceId}`);
      provider.startUpdates();
    }
  }
  
  /**
   * Stop updates for a datasource
   */
  stopUpdates(datasourceId: string): void {
    const provider = this.providers.get(datasourceId);
    if (provider) {
      console.log(`[DatasourceProviderManager] Stopping updates for ${datasourceId}`);
      provider.stopUpdates();
    }
  }
}