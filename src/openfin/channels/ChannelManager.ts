/**
 * OpenFin Channel Manager for inter-window communication
 */

export interface ChannelConfig {
  name: string;
  type: 'data' | 'control' | 'config';
  description?: string;
}

export class ChannelManager {
  private static instance: ChannelManager;
  private channels: Map<string, any> = new Map();
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {}

  static getInstance(): ChannelManager {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }

  /**
   * Create a new channel for data distribution
   */
  async createChannel(config: ChannelConfig): Promise<string> {
    if (typeof fin === 'undefined') {
      console.warn('OpenFin not available, channel creation skipped');
      return config.name;
    }

    try {
      const channel = await fin.InterApplicationBus.Channel.create(config.name);
      
      // Set up channel middleware for logging
      channel.beforeAction((action, payload, identity) => {
        console.log(`📡 Channel ${config.name} - Action: ${action}`, { payload, identity });
        return payload;
      });

      this.channels.set(config.name, channel);
      console.log(`✅ Created channel: ${config.name}`);
      
      return config.name;
    } catch (error) {
      console.error(`Failed to create channel ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Connect to an existing channel
   */
  async connectToChannel(channelName: string): Promise<any> {
    if (typeof fin === 'undefined') {
      console.warn('OpenFin not available, channel connection skipped');
      return null;
    }

    try {
      const channel = await fin.InterApplicationBus.Channel.connect(channelName);
      this.channels.set(channelName, channel);
      console.log(`✅ Connected to channel: ${channelName}`);
      return channel;
    } catch (error) {
      console.error(`Failed to connect to channel ${channelName}:`, error);
      throw error;
    }
  }

  /**
   * Send data to a channel
   */
  async sendToChannel(channelName: string, action: string, data: any): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.error(`Channel ${channelName} not found`);
      return;
    }

    try {
      await channel.dispatch(action, data);
    } catch (error) {
      console.error(`Failed to send to channel ${channelName}:`, error);
    }
  }

  /**
   * Register a handler for channel actions
   */
  async registerHandler(
    channelName: string, 
    action: string, 
    handler: (data: any) => any
  ): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.error(`Channel ${channelName} not found`);
      return;
    }

    channel.register(action, handler);
    console.log(`📌 Registered handler for ${action} on channel ${channelName}`);
  }

  /**
   * Subscribe to channel updates (client side)
   */
  async subscribeToUpdates(
    channelName: string,
    action: string,
    callback: (data: any) => void
  ): Promise<() => void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.error(`Channel ${channelName} not found`);
      return () => {};
    }

    // Store subscription
    const key = `${channelName}:${action}`;
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)!.add(callback);

    // Register with channel
    const handler = (data: any) => callback(data);
    channel.register(action, handler);

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          channel.unregister(action);
          this.subscriptions.delete(key);
        }
      }
    };
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Close a channel
   */
  async closeChannel(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel && channel.disconnect) {
      await channel.disconnect();
    }
    this.channels.delete(channelName);
    
    // Clean up subscriptions
    for (const [key] of this.subscriptions) {
      if (key.startsWith(channelName + ':')) {
        this.subscriptions.delete(key);
      }
    }
    
    console.log(`🔌 Closed channel: ${channelName}`);
  }

  /**
   * Broadcast to all connected clients on a channel
   */
  async broadcast(channelName: string, action: string, data: any): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.error(`Channel ${channelName} not found`);
      return;
    }

    try {
      // For provider channels, dispatch to all connected clients
      await channel.dispatch(action, data);
      console.log(`📢 Broadcast on ${channelName}:${action}`, data);
    } catch (error) {
      console.error(`Failed to broadcast on channel ${channelName}:`, error);
    }
  }
}

// Export singleton instance
export const channelManager = ChannelManager.getInstance();