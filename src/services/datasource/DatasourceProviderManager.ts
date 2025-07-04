import { StompDatasourceProvider } from '@/providers/StompDatasourceProvider';
import { StompDatasourceConfig } from '@/stores/datasource.store';

export interface ProviderSubscriber {
  id: string;
  onSnapshot: (data: any[], totalRows: number, isComplete?: boolean) => void;
  onUpdate?: (updates: any[]) => void;
  onError?: (error: Error) => void;
}

export class DatasourceProviderManager {
  private static instance: DatasourceProviderManager;
  private providers = new Map<string, StompDatasourceProvider>();
  private subscribers = new Map<string, Set<ProviderSubscriber>>();
  private snapshotData = new Map<string, any[]>();
  private fetchingSnapshots = new Map<string, Promise<any>>();
  private updateUnsubscribers = new Map<string, () => void>();

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
  private getOrCreateProvider(datasource: StompDatasourceConfig): StompDatasourceProvider {
    const existingProvider = this.providers.get(datasource.id);
    if (existingProvider) {
      return existingProvider;
    }

    const provider = new StompDatasourceProvider({
      ...datasource,
      messageRate: '1000', // TODO: Get from datasource config
    });

    this.providers.set(datasource.id, provider);
    this.subscribers.set(datasource.id, new Set());
    
    // Set up update broadcasting to all subscribers
    const unsubscribe = provider.subscribeToUpdates((updates) => {
      const subscribers = this.subscribers.get(datasource.id);
      console.log(`[DatasourceProviderManager] Broadcasting ${updates.length} updates to ${subscribers?.size || 0} subscribers for ${datasource.id}`);
      if (subscribers) {
        subscribers.forEach(subscriber => {
          if (subscriber.onUpdate) {
            console.log(`[DatasourceProviderManager] Sending updates to subscriber ${subscriber.id}`);
            subscriber.onUpdate(updates);
          }
        });
      }
    });
    
    this.updateUnsubscribers.set(datasource.id, unsubscribe);
    
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
    
    // Get or create provider
    const provider = this.getOrCreateProvider(datasource);
    
    // Add subscriber
    const subscribers = this.subscribers.get(datasource.id) || new Set();
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
    provider: StompDatasourceProvider
  ): Promise<void> {
    console.log(`[DatasourceProviderManager] Starting snapshot fetch for ${datasource.id}`);
    
    // Create promise to track fetch
    const fetchPromise = (async () => {
      try {
        const result = await provider.fetchSnapshot(undefined, (allDataSoFar, totalRows, isComplete) => {
          // Store snapshot data
          this.snapshotData.set(datasource.id, allDataSoFar);
          
          // Notify all subscribers
          const subscribers = this.subscribers.get(datasource.id) || new Set();
          subscribers.forEach(subscriber => {
            console.log(`[DatasourceProviderManager] Notifying subscriber ${subscriber.id}: ${allDataSoFar.length} rows (totalRows param: ${totalRows}), complete: ${isComplete}`);
            // Always use the actual array length, not the totalRows parameter which might be stale
            subscriber.onSnapshot(allDataSoFar, allDataSoFar.length, isComplete || false);
          });
        });

        if (result.success && result.data) {
          // Final update
          this.snapshotData.set(datasource.id, result.data);
          
          // Notify all subscribers with final data
          const subscribers = this.subscribers.get(datasource.id) || new Set();
          subscribers.forEach(subscriber => {
            console.log(`[DatasourceProviderManager] Final snapshot for subscriber ${subscriber.id}: ${result.data?.length} rows`);
            subscriber.onSnapshot(result.data || [], result.data?.length || 0, true);
          });
        } else {
          throw new Error(result.error || 'Failed to fetch snapshot');
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
        // Unsubscribe from updates
        const unsubscriber = this.updateUnsubscribers.get(datasourceId);
        if (unsubscriber) {
          unsubscriber();
          this.updateUnsubscribers.delete(datasourceId);
        }
        
        provider.disconnect();
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

    // Unsubscribe from updates
    const unsubscriber = this.updateUnsubscribers.get(datasource.id);
    if (unsubscriber) {
      unsubscriber();
      this.updateUnsubscribers.delete(datasource.id);
    }
    
    // Disconnect and reconnect
    provider.disconnect();
    this.providers.delete(datasource.id);
    
    // Create new provider (this will set up update broadcasting again)
    const newProvider = this.getOrCreateProvider(datasource);

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
}