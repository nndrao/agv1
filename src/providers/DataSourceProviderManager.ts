import { IDataSourceProvider } from './IDataSourceProvider';
import { SimplifiedStompDataSourceProvider } from './SimplifiedStompDataSourceProvider';
import { DatasourceConfig } from '@/stores/datasource.store';

/**
 * Singleton manager for datasource providers
 * Ensures only one provider instance exists per datasource ID
 */
export class DataSourceProviderManager {
  private static instance: DataSourceProviderManager;
  private providers = new Map<string, IDataSourceProvider>();
  private subscriberCounts = new Map<string, number>();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  static getInstance(): DataSourceProviderManager {
    if (!DataSourceProviderManager.instance) {
      DataSourceProviderManager.instance = new DataSourceProviderManager();
    }
    return DataSourceProviderManager.instance;
  }
  
  /**
   * Get or create a provider for the given configuration
   */
  getProvider(config: DatasourceConfig): IDataSourceProvider {
    const existingProvider = this.providers.get(config.id);
    if (existingProvider) {
      console.log(`[DataSourceProviderManager] Returning existing provider for ${config.id}`);
      return existingProvider;
    }
    
    console.log(`[DataSourceProviderManager] Creating new provider for ${config.id}`);
    const provider = this.createProvider(config);
    this.providers.set(config.id, provider);
    this.subscriberCounts.set(config.id, 0);
    
    return provider;
  }
  
  /**
   * Create a new provider based on the configuration type
   */
  private createProvider(config: DatasourceConfig): IDataSourceProvider {
    switch (config.type) {
      case 'stomp':
        return new SimplifiedStompDataSourceProvider(config);
      case 'rest':
        // TODO: Implement REST provider
        throw new Error('REST datasource provider not implemented yet');
      default:
        throw new Error(`Unknown datasource type: ${(config as any).type}`);
    }
  }
  
  /**
   * Register a subscriber for a datasource
   * Returns an unsubscribe function
   */
  registerSubscriber(datasourceId: string): () => void {
    const currentCount = this.subscriberCounts.get(datasourceId) || 0;
    this.subscriberCounts.set(datasourceId, currentCount + 1);
    
    console.log(`[DataSourceProviderManager] Subscriber registered for ${datasourceId}. Count: ${currentCount + 1}`);
    
    // Return unsubscribe function
    return () => {
      const count = this.subscriberCounts.get(datasourceId) || 0;
      const newCount = Math.max(0, count - 1);
      this.subscriberCounts.set(datasourceId, newCount);
      
      console.log(`[DataSourceProviderManager] Subscriber unregistered for ${datasourceId}. Count: ${newCount}`);
      
      // If no more subscribers, stop and remove the provider
      if (newCount === 0) {
        const provider = this.providers.get(datasourceId);
        if (provider) {
          console.log(`[DataSourceProviderManager] No more subscribers for ${datasourceId}. Stopping provider.`);
          provider.stop();
          this.providers.delete(datasourceId);
          this.subscriberCounts.delete(datasourceId);
        }
      }
    };
  }
  
  /**
   * Get all active providers
   */
  getActiveProviders(): Map<string, IDataSourceProvider> {
    return new Map(this.providers);
  }
  
  /**
   * Get subscriber count for a datasource
   */
  getSubscriberCount(datasourceId: string): number {
    return this.subscriberCounts.get(datasourceId) || 0;
  }
  
  /**
   * Stop all providers (useful for cleanup)
   */
  stopAll(): void {
    console.log('[DataSourceProviderManager] Stopping all providers');
    this.providers.forEach((provider) => {
      provider.stop();
    });
    this.providers.clear();
    this.subscriberCounts.clear();
  }
}