import type { IDataSourceConfig } from '@/providers/IDataSourceProvider';

interface ProviderWindow {
  id: string;
  window: OpenFin.Window;
  config: IDataSourceConfig;
  channelName: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  lastError?: string;
}

/**
 * Manages headless provider windows in OpenFin
 */
export class ProviderWindowManager {
  private static instance: ProviderWindowManager;
  private providers: Map<string, ProviderWindow> = new Map();
  private statusListeners: Set<(providerId: string, status: ProviderWindow['status']) => void> = new Set();

  private constructor() {
    if (typeof fin !== 'undefined') {
      this.setupEventListeners();
    }
  }

  static getInstance(): ProviderWindowManager {
    if (!ProviderWindowManager.instance) {
      ProviderWindowManager.instance = new ProviderWindowManager();
    }
    return ProviderWindowManager.instance;
  }

  /**
   * Create and start a new provider window
   */
  async createProvider(config: IDataSourceConfig): Promise<string> {
    const providerId = config.componentId || `provider-${Date.now()}`;
    
    if (this.providers.has(providerId)) {
      console.warn(`Provider ${providerId} already exists`);
      return providerId;
    }

    console.log(`🚀 Creating provider window: ${providerId}`);

    try {
      // Create headless window
      const window = await fin.Window.create({
        name: providerId,
        url: `http://localhost:5173/provider/headless?configId=${providerId}`,
        autoShow: false,
        frame: false,
        defaultWidth: 100,
        defaultHeight: 100,
        defaultLeft: -200,
        defaultTop: -200,
        saveWindowState: false,
        showTaskbarIcon: false,
        skipTaskbar: true,
        opacity: 0,
        customData: {
          type: 'data-provider',
          config: config
        }
      });

      // Store provider info
      const provider: ProviderWindow = {
        id: providerId,
        window,
        config,
        channelName: `data-channel-${providerId}`,
        status: 'starting'
      };
      
      this.providers.set(providerId, provider);
      this.notifyStatusChange(providerId, 'starting');

      // Listen for provider ready event
      window.addListener('provider-ready', (event: any) => {
        if (event.providerId === providerId) {
          provider.status = 'running';
          provider.channelName = event.channelName;
          this.notifyStatusChange(providerId, 'running');
          console.log(`✅ Provider ${providerId} is ready on channel: ${event.channelName}`);
        }
      });

      // Listen for provider error event
      window.addListener('provider-error', (event: any) => {
        if (event.providerId === providerId) {
          provider.status = 'error';
          provider.lastError = event.error;
          this.notifyStatusChange(providerId, 'error');
          console.error(`❌ Provider ${providerId} error: ${event.error}`);
        }
      });

      // Listen for window close
      window.addListener('closed', () => {
        this.handleProviderClosed(providerId);
      });

      return providerId;

    } catch (error) {
      console.error(`Failed to create provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Stop and remove a provider
   */
  async stopProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      console.warn(`Provider ${providerId} not found`);
      return;
    }

    console.log(`⏹️ Stopping provider: ${providerId}`);

    try {
      await provider.window.close();
      this.providers.delete(providerId);
      this.notifyStatusChange(providerId, 'stopped');
    } catch (error) {
      console.error(`Failed to stop provider ${providerId}:`, error);
    }
  }

  /**
   * Restart a provider
   */
  async restartProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      console.warn(`Provider ${providerId} not found`);
      return;
    }

    console.log(`🔄 Restarting provider: ${providerId}`);
    
    const config = provider.config;
    await this.stopProvider(providerId);
    await this.createProvider(config);
  }

  /**
   * Get all active providers
   */
  getProviders(): ProviderWindow[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider
   */
  getProvider(providerId: string): ProviderWindow | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Subscribe to provider status changes
   */
  onStatusChange(listener: (providerId: string, status: ProviderWindow['status']) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Monitor provider health
   */
  async startHealthMonitoring(intervalMs: number = 5000): Promise<void> {
    setInterval(async () => {
      for (const [providerId, provider] of this.providers) {
        try {
          const exists = await provider.window.exists();
          if (!exists && provider.status === 'running') {
            console.warn(`Provider ${providerId} window disappeared, marking as error`);
            provider.status = 'error';
            provider.lastError = 'Window closed unexpectedly';
            this.notifyStatusChange(providerId, 'error');
          }
        } catch (error) {
          console.error(`Health check failed for ${providerId}:`, error);
        }
      }
    }, intervalMs);
  }

  /**
   * Setup global event listeners
   */
  private setupEventListeners(): void {
    // Listen for control messages
    fin.InterApplicationBus.subscribe({ uuid: '*' }, 'provider-control', async (message: any) => {
      console.log('📨 Received provider control message:', message);
      
      switch (message.action) {
        case 'create':
          await this.createProvider(message.config);
          break;
        case 'stop':
          await this.stopProvider(message.providerId);
          break;
        case 'restart':
          await this.restartProvider(message.providerId);
          break;
      }
    });
  }

  /**
   * Handle provider window closed
   */
  private handleProviderClosed(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.status = 'stopped';
      this.notifyStatusChange(providerId, 'stopped');
      this.providers.delete(providerId);
      console.log(`🪟 Provider window closed: ${providerId}`);
    }
  }

  /**
   * Notify listeners of status change
   */
  private notifyStatusChange(providerId: string, status: ProviderWindow['status']): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(providerId, status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  /**
   * Get provider statistics
   */
  getStatistics(): {
    total: number;
    running: number;
    stopped: number;
    error: number;
  } {
    const stats = {
      total: this.providers.size,
      running: 0,
      stopped: 0,
      error: 0
    };

    for (const provider of this.providers.values()) {
      switch (provider.status) {
        case 'running':
          stats.running++;
          break;
        case 'stopped':
          stats.stopped++;
          break;
        case 'error':
          stats.error++;
          break;
      }
    }

    return stats;
  }
}

// Export singleton instance
export const providerWindowManager = ProviderWindowManager.getInstance();