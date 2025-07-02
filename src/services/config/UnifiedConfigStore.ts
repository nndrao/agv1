/**
 * UnifiedConfigStore
 * 
 * Maps between old localStorage keys and the new unified schema format.
 * Provides a unified interface that works with existing data while presenting
 * it in the new ComponentConfig format defined in the architecture document.
 */

// Storage keys
const STORAGE_KEYS = {
  PROFILES: 'grid-profile-storage',
  COLUMN_TEMPLATES: 'column-template-store',
  DATA_SOURCES: 'datatable-datasources',
  UI_PREFERENCES: 'column-formatting-store',
  SOUND_ENABLED: 'column-dialog-sound-enabled',
} as const;

// interface StorageAdapter {
//   get(key: string, defaultValue?: any): Promise<any>;
//   set(key: string, value: any): Promise<void>;
//   remove(key: string): Promise<void>;
// }
import { GridProfile } from '../../components/datatable/stores/profile.store';
import { ColumnTemplate } from '../../components/datatable/stores/columnTemplate.store';
import { DataSource } from '../../components/datatable/datasource/types';

// ===== New Unified Schema Types =====

export interface ComponentConfig {
  // Identity
  instanceId: string;
  componentType: string;
  subcomponentType?: string;
  displayName?: string;
  
  // Ownership & Access
  appId: string;
  userId: string;
  ownerId: string;
  permissions: {
    isPublic: boolean;
    canEdit: string[];
    canView: string[];
    allowSharing: boolean;
    editableByOthers: boolean;
  };
  
  // Settings with Versioning
  settings: {
    activeVersionId: string;
    versions: Record<string, Version>;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  metadata: {
    tags: string[];
    category: string;
    lastAccessed: string;
    accessCount: number;
    favorited: boolean;
    notes: string;
  };
  
  // Sharing
  sharing: {
    isShared: boolean;
    shareId?: string;
    shareUrl?: string;
    sharedWith: SharedUser[];
    publicAccess: PublicAccessConfig;
  };
}

export interface Version {
  versionId: string;
  versionNumber: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  config: any; // Component-specific configuration
  audit: AuditInfo;
}

export interface AuditInfo {
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  changeHistory: ChangeHistoryEntry[];
}

export interface ChangeHistoryEntry {
  timestamp: string;
  userId: string;
  action: string;
  changes: any;
}

export interface SharedUser {
  userId: string;
  sharedAt: string;
  permissions: string[];
  sharedBy: string;
}

export interface PublicAccessConfig {
  enabled: boolean;
  accessLevel: string;
  requiresAuth: boolean;
}

// ===== Storage Interfaces =====

interface LegacyProfileStorage {
  state: {
    profiles: GridProfile[];
    activeProfileId: string;
    autoSave?: boolean;
  };
  version: number;
}

interface LegacyTemplateStorage {
  state: {
    templates: ColumnTemplate[];
    recentTemplates: string[];
  };
  version?: number;
}

interface LegacyDataSourceStorage {
  state: {
    dataSources: DataSource[];
  };
  version?: number;
}

interface LegacyUIPreferencesStorage {
  state: {
    activeTab: string;
    showOnlyCommon: boolean;
    compareMode: boolean;
    cellDataTypeFilter: string;
    visibilityFilter: 'all' | 'visible' | 'hidden';
    bulkActionsPanelCollapsed: boolean;
    templateColumns: string[];
    appliedTemplates: Array<[string, { templateId: string; templateName: string; appliedAt: number }]>;
    uiMode: 'simple' | 'advanced';
    showPreviewPane: boolean;
    collapsedSections: string[];
    quickFormatPinned: string[];
    showColumnDrawer: boolean;
  };
  version?: number;
}

// ===== Main UnifiedConfigStore Class =====

export class UnifiedConfigStore {
  // private storageAdapter: StorageAdapter | null = null;
  private userId: string;
  private appId: string;

  constructor(userId: string = 'default-user', appId: string = 'datatable-app') {
    this.userId = userId;
    this.appId = appId;
  }

  // ===== Public Methods =====

  /**
   * Get all component configurations in the new unified format
   */
  async getAllConfigs(): Promise<ComponentConfig[]> {
    const configs: ComponentConfig[] = [];
    
    // Convert grid profiles to component configs
    const profiles = await this.getGridProfiles();
    for (const profile of profiles) {
      const config = await this.convertProfileToConfig(profile);
      configs.push(config);
    }
    
    return configs;
  }

  /**
   * Get a specific component configuration by instanceId
   */
  async getConfig(instanceId: string): Promise<ComponentConfig | null> {
    // Check if it's a profile-based instanceId
    if (instanceId.startsWith('datatable-')) {
      const profileId = instanceId.replace('datatable-', '');
      const profiles = await this.getGridProfiles();
      const profile = profiles.find(p => p.id === profileId);
      
      if (profile) {
        return await this.convertProfileToConfig(profile);
      }
    }
    
    return null;
  }

  /**
   * Create or update a component configuration
   */
  async setConfig(config: ComponentConfig): Promise<void> {
    // Extract profile ID from instanceId
    const profileId = config.instanceId.replace('datatable-', '');
    
    // Get current profiles
    const profiles = await this.getGridProfiles();
    const existingIndex = profiles.findIndex(p => p.id === profileId);
    
    // Convert config back to profile format
    const profile = await this.convertConfigToProfile(config);
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    
    // Save back to localStorage
    await this.saveGridProfiles(profiles);
  }

  /**
   * Delete a component configuration
   */
  async deleteConfig(instanceId: string): Promise<void> {
    const profileId = instanceId.replace('datatable-', '');
    const profiles = await this.getGridProfiles();
    const filteredProfiles = profiles.filter(p => p.id !== profileId);
    await this.saveGridProfiles(filteredProfiles);
  }

  /**
   * Get shared column templates in new format
   */
  async getSharedTemplates(): Promise<ComponentConfig[]> {
    const templates = await this.getColumnTemplates();
    return templates.map(template => this.convertTemplateToConfig(template));
  }

  /**
   * Get data source configurations in new format
   */
  async getDataSourceConfigs(): Promise<ComponentConfig[]> {
    const dataSources = await this.getDataSources();
    return dataSources.map(ds => this.convertDataSourceToConfig(ds));
  }

  /**
   * Get UI preferences as a component config
   */
  async getUIPreferencesConfig(): Promise<ComponentConfig> {
    const preferences = await this.getUIPreferences();
    return this.convertUIPreferencesToConfig(preferences);
  }

  // ===== Migration Utilities =====

  /**
   * Check if migration to new schema is needed
   */
  async needsMigration(): Promise<boolean> {
    // Check if any of the old keys exist
    const oldKeys = Object.values(STORAGE_KEYS);
    for (const key of oldKeys) {
      if (localStorage.getItem(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Migrate all old data to new unified schema
   * This creates new entries without removing old ones for safety
   */
  async migrateToUnifiedSchema(): Promise<{
    migratedConfigs: number;
    errors: string[];
  }> {
    const results = {
      migratedConfigs: 0,
      errors: [] as string[]
    };

    try {
      // Get all configs in new format
      const configs = await this.getAllConfigs();
      
      // Store them in a new unified key
      const unifiedKey = `unified-component-configs-${this.appId}-${this.userId}`;
      localStorage.setItem(unifiedKey, JSON.stringify({
        version: 1,
        configs: configs,
        migratedAt: new Date().toISOString()
      }));
      
      results.migratedConfigs = configs.length;
    } catch (error) {
      results.errors.push(`Migration failed: ${error}`);
    }

    return results;
  }

  // ===== Private Helper Methods =====

  private async getGridProfiles(): Promise<GridProfile[]> {
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!stored) return [];
    
    try {
      const data = JSON.parse(stored) as LegacyProfileStorage;
      return data.state?.profiles || [];
    } catch {
      return [];
    }
  }

  private async saveGridProfiles(profiles: GridProfile[]): Promise<void> {
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
    const data = stored ? JSON.parse(stored) as LegacyProfileStorage : {
      state: { profiles: [], activeProfileId: 'default-profile', autoSave: true },
      version: 4
    };
    
    data.state.profiles = profiles;
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(data));
  }

  private async getColumnTemplates(): Promise<ColumnTemplate[]> {
    const stored = localStorage.getItem(STORAGE_KEYS.COLUMN_TEMPLATES);
    if (!stored) return [];
    
    try {
      const data = JSON.parse(stored) as LegacyTemplateStorage;
      return data.state?.templates || [];
    } catch {
      return [];
    }
  }

  private async getDataSources(): Promise<DataSource[]> {
    const stored = localStorage.getItem(STORAGE_KEYS.DATA_SOURCES);
    if (!stored) return [];
    
    try {
      const data = JSON.parse(stored) as LegacyDataSourceStorage;
      return data.state?.dataSources || [];
    } catch {
      return [];
    }
  }

  private async getUIPreferences(): Promise<LegacyUIPreferencesStorage['state']> {
    const stored = localStorage.getItem(STORAGE_KEYS.UI_PREFERENCES);
    if (!stored) {
      return {
        activeTab: 'general',
        showOnlyCommon: false,
        compareMode: false,
        cellDataTypeFilter: 'all',
        visibilityFilter: 'visible',
        bulkActionsPanelCollapsed: false,
        templateColumns: [],
        appliedTemplates: [],
        uiMode: 'simple',
        showPreviewPane: false,
        collapsedSections: [],
        quickFormatPinned: ['number', 'currency', 'percentage', 'date', 'text'],
        showColumnDrawer: false
      };
    }
    
    try {
      const data = JSON.parse(stored) as LegacyUIPreferencesStorage;
      return data.state || data as any;
    } catch {
      return this.getUIPreferences(); // Return defaults
    }
  }

  // ===== Conversion Methods =====

  private async convertProfileToConfig(profile: GridProfile): Promise<ComponentConfig> {
    const versionId = `v${profile.updatedAt}`;
    
    return {
      instanceId: `datatable-${profile.id}`,
      componentType: 'DataGrid',
      subcomponentType: 'AdvancedTable',
      displayName: profile.name,
      appId: this.appId,
      userId: this.userId,
      ownerId: this.userId,
      permissions: {
        isPublic: false,
        canEdit: [this.userId],
        canView: [this.userId],
        allowSharing: false,
        editableByOthers: false
      },
      settings: {
        activeVersionId: versionId,
        versions: {
          [versionId]: {
            versionId,
            versionNumber: 1,
            name: profile.name,
            description: profile.description || 'Migrated from legacy profile',
            isActive: true,
            createdAt: new Date(profile.createdAt).toISOString(),
            createdBy: this.userId,
            config: {
              // Column settings from ribbon
              columnSettings: profile.columnSettings,
              // AG-Grid state
              gridState: profile.gridState,
              // Grid options from editor
              gridOptions: profile.gridOptions
            },
            audit: {
              createdBy: this.userId,
              createdAt: new Date(profile.createdAt).toISOString(),
              lastModifiedBy: this.userId,
              lastModifiedAt: new Date(profile.updatedAt).toISOString(),
              changeHistory: []
            }
          }
        }
      },
      createdAt: new Date(profile.createdAt).toISOString(),
      updatedAt: new Date(profile.updatedAt).toISOString(),
      metadata: {
        tags: profile.isDefault ? ['default', 'system'] : ['user-created'],
        category: 'DataVisualization',
        lastAccessed: new Date().toISOString(),
        accessCount: 0,
        favorited: profile.isDefault || false,
        notes: 'Migrated from legacy grid profile storage'
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
  }

  private async convertConfigToProfile(config: ComponentConfig): Promise<GridProfile> {
    const activeVersion = config.settings.versions[config.settings.activeVersionId];
    const versionConfig = activeVersion.config;
    
    return {
      id: config.instanceId.replace('datatable-', ''),
      name: config.displayName || activeVersion.name,
      createdAt: new Date(config.createdAt).getTime(),
      updatedAt: new Date(config.updatedAt).getTime(),
      isDefault: config.metadata.tags.includes('default'),
      description: activeVersion.description,
      columnSettings: versionConfig.columnSettings,
      gridState: versionConfig.gridState,
      gridOptions: versionConfig.gridOptions
    };
  }

  private convertTemplateToConfig(template: ColumnTemplate): ComponentConfig {
    return {
      instanceId: `template-${template.id}`,
      componentType: 'ColumnTemplate',
      subcomponentType: 'FormattingTemplate',
      displayName: template.name,
      appId: this.appId,
      userId: this.userId,
      ownerId: this.userId,
      permissions: {
        isPublic: true, // Templates are typically shared
        canEdit: [this.userId],
        canView: ['*'], // Anyone can view
        allowSharing: true,
        editableByOthers: false
      },
      settings: {
        activeVersionId: 'v1',
        versions: {
          'v1': {
            versionId: 'v1',
            versionNumber: 1,
            name: template.name,
            description: template.description || '',
            isActive: true,
            createdAt: new Date(template.createdAt).toISOString(),
            createdBy: this.userId,
            config: {
              settings: template.settings,
              includedProperties: template.includedProperties
            },
            audit: {
              createdBy: this.userId,
              createdAt: new Date(template.createdAt).toISOString(),
              lastModifiedBy: this.userId,
              lastModifiedAt: new Date(template.updatedAt).toISOString(),
              changeHistory: []
            }
          }
        }
      },
      createdAt: new Date(template.createdAt).toISOString(),
      updatedAt: new Date(template.updatedAt).toISOString(),
      metadata: {
        tags: ['template', 'formatting'],
        category: 'ColumnFormatting',
        lastAccessed: new Date().toISOString(),
        accessCount: 0,
        favorited: false,
        notes: 'Column formatting template'
      },
      sharing: {
        isShared: true,
        sharedWith: [],
        publicAccess: {
          enabled: true,
          accessLevel: 'view',
          requiresAuth: false
        }
      }
    };
  }

  private convertDataSourceToConfig(dataSource: DataSource): ComponentConfig {
    return {
      instanceId: `datasource-${dataSource.id}`,
      componentType: 'DataSource',
      subcomponentType: dataSource.type === 'rest' ? 'RESTDataSource' : 'WebSocketDataSource',
      displayName: dataSource.name,
      appId: this.appId,
      userId: this.userId,
      ownerId: this.userId,
      permissions: {
        isPublic: false,
        canEdit: [this.userId],
        canView: [this.userId],
        allowSharing: true,
        editableByOthers: false
      },
      settings: {
        activeVersionId: 'v1',
        versions: {
          'v1': {
            versionId: 'v1',
            versionNumber: 1,
            name: dataSource.name,
            description: (dataSource as any).description || '',
            isActive: true,
            createdAt: new Date(dataSource.createdAt).toISOString(),
            createdBy: this.userId,
            config: {
              type: dataSource.type,
              config: dataSource.config,
              active: dataSource.active,
              autoRefresh: (dataSource as any).autoRefresh || false,
              refreshInterval: (dataSource as any).refreshInterval || 60000
            },
            audit: {
              createdBy: this.userId,
              createdAt: new Date(dataSource.createdAt).toISOString(),
              lastModifiedBy: this.userId,
              lastModifiedAt: new Date(dataSource.updatedAt).toISOString(),
              changeHistory: []
            }
          }
        }
      },
      createdAt: new Date(dataSource.createdAt).toISOString(),
      updatedAt: new Date(dataSource.updatedAt).toISOString(),
      metadata: {
        tags: ['datasource', dataSource.type],
        category: 'DataIntegration',
        lastAccessed: new Date().toISOString(),
        accessCount: 0,
        favorited: false,
        notes: `${dataSource.type.toUpperCase()} data source configuration`
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
  }

  private convertUIPreferencesToConfig(preferences: LegacyUIPreferencesStorage['state']): ComponentConfig {
    return {
      instanceId: 'ui-preferences-global',
      componentType: 'UIPreferences',
      subcomponentType: 'ColumnFormattingDialog',
      displayName: 'Column Formatting UI Preferences',
      appId: this.appId,
      userId: this.userId,
      ownerId: this.userId,
      permissions: {
        isPublic: false,
        canEdit: [this.userId],
        canView: [this.userId],
        allowSharing: false,
        editableByOthers: false
      },
      settings: {
        activeVersionId: 'v1',
        versions: {
          'v1': {
            versionId: 'v1',
            versionNumber: 1,
            name: 'UI Preferences',
            description: 'User interface preferences for column formatting dialog',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: this.userId,
            config: preferences,
            audit: {
              createdBy: this.userId,
              createdAt: new Date().toISOString(),
              lastModifiedBy: this.userId,
              lastModifiedAt: new Date().toISOString(),
              changeHistory: []
            }
          }
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        tags: ['preferences', 'ui-state'],
        category: 'UserInterface',
        lastAccessed: new Date().toISOString(),
        accessCount: 0,
        favorited: false,
        notes: 'UI state and preferences for column formatting dialog'
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
  }

  // ===== Static Factory Methods =====

  /**
   * Create a new component configuration with defaults
   */
  static createDefaultConfig(
    instanceId: string,
    componentType: string,
    userId: string,
    appId: string
  ): ComponentConfig {
    const now = new Date().toISOString();
    
    return {
      instanceId,
      componentType,
      displayName: `New ${componentType}`,
      appId,
      userId,
      ownerId: userId,
      permissions: {
        isPublic: false,
        canEdit: [userId],
        canView: [userId],
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
            config: {},
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
        tags: ['new'],
        category: 'General',
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
  }

  /**
   * Create a new version for an existing configuration
   */
  static createNewVersion(
    config: ComponentConfig,
    name: string,
    description: string,
    userId: string
  ): Version {
    const versionNumber = Object.keys(config.settings.versions).length + 1;
    const versionId = `v${versionNumber}`;
    const now = new Date().toISOString();
    
    // Clone the active version's config
    const activeVersion = config.settings.versions[config.settings.activeVersionId];
    const clonedConfig = JSON.parse(JSON.stringify(activeVersion.config));
    
    return {
      versionId,
      versionNumber,
      name,
      description,
      isActive: false,
      createdAt: now,
      createdBy: userId,
      config: clonedConfig,
      audit: {
        createdBy: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        changeHistory: []
      }
    };
  }
}

// ===== Export Types =====

// Types are already exported above, no need to re-export