import React, { useEffect, useRef } from 'react';
import { SimplifiedStompDataSourceProvider } from '@/providers/SimplifiedStompDataSourceProvider';
import { channelManager } from '@/openfin/channels/ChannelManager';
import type { IDataSourceConfig } from '@/providers/IDataSourceProvider';

interface HeadlessDataProviderProps {
  providerId: string;
  config: IDataSourceConfig;
}

/**
 * Headless component that runs data providers in background OpenFin windows
 * Publishes data to OpenFin channels for consumption by DataTable windows
 */
export const HeadlessDataProvider: React.FC<HeadlessDataProviderProps> = ({
  providerId,
  config
}) => {
  const providerRef = useRef<SimplifiedStompDataSourceProvider | null>(null);
  const channelNameRef = useRef<string>(`data-channel-${providerId}`);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const initializeProvider = async () => {
      console.log(`🚀 Initializing headless provider: ${providerId}`);
      
      try {
        // Create OpenFin channel for this provider
        await channelManager.createChannel({
          name: channelNameRef.current,
          type: 'data',
          description: `Data channel for ${config.name || providerId}`
        });

        // Register control handlers
        await channelManager.registerHandler(
          channelNameRef.current,
          'request-data',
          async () => {
            // Return current snapshot if available
            if (providerRef.current) {
              const snapshot = await providerRef.current.getSnapshot();
              return { rows: snapshot };
            }
            return { rows: [] };
          }
        );

        await channelManager.registerHandler(
          channelNameRef.current,
          'control',
          async (command: { action: 'start' | 'stop' | 'restart' }) => {
            console.log(`🎮 Received control command: ${command.action}`);
            
            switch (command.action) {
              case 'start':
                await startProvider();
                break;
              case 'stop':
                await stopProvider();
                break;
              case 'restart':
                await stopProvider();
                await startProvider();
                break;
            }
          }
        );

        // Initialize and start the provider
        await startProvider();

        // Notify platform that provider is ready
        if (typeof fin !== 'undefined') {
          await fin.Window.getCurrentSync().dispatchEvent('provider-ready', {
            providerId,
            channelName: channelNameRef.current,
            config
          });
        }

      } catch (error) {
        console.error(`Failed to initialize provider ${providerId}:`, error);
        
        // Notify platform of error
        if (typeof fin !== 'undefined') {
          await fin.Window.getCurrentSync().dispatchEvent('provider-error', {
            providerId,
            error: error.message
          });
        }
      }
    };

    const startProvider = async () => {
      if (isRunningRef.current) {
        console.log('Provider already running');
        return;
      }

      try {
        // Create new provider instance
        providerRef.current = new SimplifiedStompDataSourceProvider();
        
        // Subscribe to data updates
        providerRef.current.on('snapshot', async (data: any[], count: number, isLast: boolean) => {
          // Publish to channel
          await channelManager.broadcast(channelNameRef.current, 'data-update', {
            rows: data,
            count,
            isLast,
            timestamp: new Date().toISOString()
          });
        });

        providerRef.current.on('update', async (updates: any[]) => {
          // Publish incremental updates
          await channelManager.broadcast(channelNameRef.current, 'data-delta', {
            updates,
            timestamp: new Date().toISOString()
          });
        });

        providerRef.current.on('error', async (error: Error) => {
          console.error(`Provider error: ${error.message}`);
          await channelManager.broadcast(channelNameRef.current, 'error', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
        });

        // Start the provider
        await providerRef.current.start(config);
        isRunningRef.current = true;
        
        console.log(`✅ Provider ${providerId} started successfully`);
        
        // Notify status change
        await channelManager.broadcast(channelNameRef.current, 'status', {
          status: 'running',
          providerId
        });

      } catch (error) {
        console.error(`Failed to start provider ${providerId}:`, error);
        isRunningRef.current = false;
        
        await channelManager.broadcast(channelNameRef.current, 'status', {
          status: 'error',
          error: error.message,
          providerId
        });
      }
    };

    const stopProvider = async () => {
      if (!isRunningRef.current || !providerRef.current) {
        console.log('Provider not running');
        return;
      }

      try {
        await providerRef.current.stop();
        providerRef.current.removeAllListeners();
        providerRef.current = null;
        isRunningRef.current = false;
        
        console.log(`⏹️ Provider ${providerId} stopped`);
        
        // Notify status change
        await channelManager.broadcast(channelNameRef.current, 'status', {
          status: 'stopped',
          providerId
        });

      } catch (error) {
        console.error(`Failed to stop provider ${providerId}:`, error);
      }
    };

    // Initialize the provider
    initializeProvider();

    // Cleanup on unmount
    return () => {
      console.log(`🧹 Cleaning up provider ${providerId}`);
      stopProvider().then(() => {
        channelManager.closeChannel(channelNameRef.current);
      });
    };
  }, [providerId, config]);

  // Headless component - no UI
  return null;
};

/**
 * Route component for headless provider windows
 */
export const HeadlessProviderRoute: React.FC = () => {
  // Get configuration from window custom data or URL params
  const [config, setConfig] = React.useState<IDataSourceConfig | null>(null);
  const [providerId, setProviderId] = React.useState<string>('');

  React.useEffect(() => {
    const loadConfig = async () => {
      if (typeof fin !== 'undefined') {
        // Get config from window options
        const options = await fin.Window.getCurrentSync().getOptions();
        if (options.customData?.config) {
          setConfig(options.customData.config);
          setProviderId(options.customData.config.componentId || options.name);
          return;
        }
      }

      // Fallback to URL params
      const params = new URLSearchParams(window.location.search);
      const configId = params.get('configId');
      
      if (configId) {
        // TODO: Load config from storage
        console.log(`Loading config for: ${configId}`);
        
        // For now, use demo config
        setConfig({
          id: configId,
          name: 'Demo Provider',
          type: 'stomp',
          url: 'ws://localhost:8080/stomp',
          topics: ['/topic/market-data'],
          reconnectInterval: 5000,
          keyColumn: 'id'
        });
        setProviderId(configId);
      }
    };

    loadConfig();
  }, []);

  if (!config || !providerId) {
    return <div>Loading provider configuration...</div>;
  }

  return <HeadlessDataProvider providerId={providerId} config={config} />;
};