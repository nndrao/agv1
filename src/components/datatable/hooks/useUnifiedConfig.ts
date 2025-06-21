/**
 * Hook to bridge between existing DataTable and new unified config system
 * This allows gradual migration without breaking existing functionality
 */

import { useEffect, useState, useCallback } from 'react';
import { GridProfile } from '../stores/profile.store';
import { UnifiedConfigStore } from '@/services/config/UnifiedConfigStore';
import { ComponentConfig } from '@/services/config/UnifiedConfigStore';
import { storageAdapter } from '@/lib/storage/storageAdapter';

interface UseUnifiedConfigOptions {
  instanceId?: string;
  userId?: string;
  appId?: string;
  autoLoad?: boolean;
}

export function useUnifiedConfig(options: UseUnifiedConfigOptions = {}) {
  const {
    instanceId = 'datatable-default',
    userId = 'default-user',
    appId = 'agv1',
    autoLoad = true
  } = options;

  const [config, setConfig] = useState<ComponentConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [store] = useState(() => new UnifiedConfigStore(userId, appId, storageAdapter));

  // Load config on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      loadConfig();
    }
  }, [instanceId, autoLoad]);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get config in unified format
      const unifiedConfig = await store.getConfig(instanceId);
      
      if (unifiedConfig) {
        setConfig(unifiedConfig);
      } else {
        // Create default config if none exists
        const defaultConfig = await createDefaultConfig();
        setConfig(defaultConfig);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load unified config:', err);
    } finally {
      setLoading(false);
    }
  }, [instanceId, store]);

  const createDefaultConfig = useCallback(async (): Promise<ComponentConfig> => {
    // Create a default config based on existing DataTable structure
    const now = new Date().toISOString();
    
    const defaultConfig: ComponentConfig = {
      instanceId,
      componentType: 'DataGrid',
      subcomponentType: 'AdvancedTable',
      displayName: 'DataTable',
      appId,
      userId,
      ownerId: userId,
      permissions: {
        isPublic: false,
        canEdit: [],
        canView: [],
        allowSharing: false,
        editableByOthers: false
      },
      settings: {
        activeVersionId: 'v1',
        versions: {
          'v1': {
            versionId: 'v1',
            versionNumber: 1,
            name: 'Default Configuration',
            description: 'Initial configuration',
            isActive: true,
            createdAt: now,
            createdBy: userId,
            config: {
              // Empty config - will use DataTable defaults
              columnState: [],
              filterModel: null,
              sortModel: [],
              gridOptions: {}
            },
            audit: {
              createdBy: userId,
              createdAt: now,
              lastModifiedBy: userId,
              lastModifiedAt: now,
              changeHistory: []
            }
          }
        }
      },
      createdAt: now,
      updatedAt: now,
      metadata: {
        tags: ['datatable'],
        category: 'DataVisualization',
        lastAccessed: now,
        accessCount: 0,
        favorited: false,
        notes: ''
      },
      sharing: {
        isShared: false,
        sharedWith: [],
        publicAccess: {
          enabled: false,
          accessLevel: 'none',
          requiresAuth: true
        }
      }
    };

    // Save the default config
    await store.setConfig(defaultConfig);
    
    return defaultConfig;
  }, [instanceId, userId, appId, store]);

  const updateConfig = useCallback(async (updates: Partial<ComponentConfig>) => {
    if (!config) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedConfig = {
        ...config,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await store.setConfig(updatedConfig);
      setConfig(updatedConfig);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to update config:', err);
    } finally {
      setLoading(false);
    }
  }, [config, store]);

  const createVersion = useCallback(async (name: string, description: string) => {
    if (!config) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const newVersionId = `v${Object.keys(config.settings.versions).length + 1}`;
      const now = new Date().toISOString();
      
      // Copy current active version's config
      const activeVersion = config.settings.versions[config.settings.activeVersionId];
      
      const newVersion = {
        versionId: newVersionId,
        versionNumber: Object.keys(config.settings.versions).length + 1,
        name,
        description,
        isActive: false,
        createdAt: now,
        createdBy: userId,
        config: { ...activeVersion.config },
        audit: {
          createdBy: userId,
          createdAt: now,
          lastModifiedBy: userId,
          lastModifiedAt: now,
          changeHistory: []
        }
      };
      
      const updatedConfig = {
        ...config,
        settings: {
          ...config.settings,
          versions: {
            ...config.settings.versions,
            [newVersionId]: newVersion
          }
        },
        updatedAt: now
      };
      
      await store.setConfig(updatedConfig);
      setConfig(updatedConfig);
      
      return newVersion;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to create version:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [config, userId, store]);

  const activateVersion = useCallback(async (versionId: string) => {
    if (!config) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedConfig = {
        ...config,
        settings: {
          ...config.settings,
          activeVersionId: versionId
        },
        updatedAt: new Date().toISOString()
      };
      
      await store.setConfig(updatedConfig);
      setConfig(updatedConfig);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to activate version:', err);
    } finally {
      setLoading(false);
    }
  }, [config, store]);

  // Convert between GridProfile and ComponentConfig formats
  const profileToConfig = useCallback((profile: GridProfile): Partial<ComponentConfig> => {
    const now = new Date().toISOString();
    
    return {
      settings: {
        activeVersionId: 'v1',
        versions: {
          'v1': {
            versionId: 'v1',
            versionNumber: 1,
            name: profile.name,
            description: profile.description || '',
            isActive: true,
            createdAt: new Date(profile.createdAt).toISOString(),
            createdBy: userId,
            config: {
              columnState: profile.gridState?.columnState || [],
              filterModel: profile.gridState?.filterModel || null,
              sortModel: profile.gridState?.sortModel || [],
              columns: profile.columnSettings?.baseColumnDefs,
              gridOptions: profile.gridOptions,
              columnCustomizations: profile.columnSettings?.columnCustomizations
            },
            audit: {
              createdBy: userId,
              createdAt: new Date(profile.createdAt).toISOString(),
              lastModifiedBy: userId,
              lastModifiedAt: new Date(profile.updatedAt).toISOString(),
              changeHistory: []
            }
          }
        }
      }
    };
  }, [userId]);

  const configToProfile = useCallback((config: ComponentConfig): GridProfile | null => {
    const activeVersion = config.settings.versions[config.settings.activeVersionId];
    if (!activeVersion) return null;
    
    return {
      id: config.instanceId,
      name: activeVersion.name,
      description: activeVersion.description,
      createdAt: new Date(activeVersion.createdAt).getTime(),
      updatedAt: new Date(config.updatedAt).getTime(),
      isDefault: config.metadata?.favorited || false,
      columnSettings: {
        columnCustomizations: activeVersion.config.columnCustomizations,
        baseColumnDefs: activeVersion.config.columns
      },
      gridState: {
        columnState: activeVersion.config.columnState || [],
        filterModel: activeVersion.config.filterModel || null,
        sortModel: activeVersion.config.sortModel || []
      },
      gridOptions: activeVersion.config.gridOptions
    };
  }, []);

  return {
    // Config data
    config,
    loading,
    error,
    
    // Config operations
    loadConfig,
    updateConfig,
    createVersion,
    activateVersion,
    
    // Conversion utilities
    profileToConfig,
    configToProfile,
    
    // Direct store access
    store
  };
}