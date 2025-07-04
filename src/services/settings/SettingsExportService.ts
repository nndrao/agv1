import { LocalStorageAdapter } from '@/services/storage/LocalStorageAdapter';
import { useDatasourceStore } from '@/stores/datasource.store';
import { useColumnTemplateStore } from '@/stores/columnTemplate.store';
import { useWorkspaceStore } from '@/stores/workspace.store';

export interface ExportedSettings {
  version: string;
  exportDate: string;
  applicationVersion: string;
  localStorage?: Record<string, string>; // New: entire localStorage
  metadata?: {
    totalKeys: number;
    totalSize: string;
    excludedKeys: string[];
  };
  // Legacy structure for backward compatibility
  data?: {
    profiles?: any[];
    datasources?: any[];
    columnTemplates?: any[];
    workspaces?: any[];
    uiPreferences?: Record<string, any>;
    customSettings?: Record<string, any>;
  };
}

export class SettingsExportService {
  private static readonly EXPORT_VERSION = '2.0.0'; // Bumped for new format
  private static readonly APP_VERSION = '1.0.0'; // TODO: Get from package.json
  
  // Keys to exclude from export for security/privacy
  private static readonly EXCLUDED_KEYS = [
    'token',
    'password',
    'secret',
    'auth',
    'session',
    'csrf'
  ];
  
  /**
   * Check if a key should be excluded
   */
  private static shouldExcludeKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.EXCLUDED_KEYS.some(excluded => lowerKey.includes(excluded));
  }
  
  /**
   * Export all application settings
   */
  static async exportAllSettings(): Promise<ExportedSettings> {
    console.log('[SettingsExport] Starting full localStorage export...');
    
    // Export entire localStorage
    const localStorageData: Record<string, string> = {};
    const excludedKeys: string[] = [];
    let totalSize = 0;
    
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Check if key should be excluded
        if (this.shouldExcludeKey(key)) {
          excludedKeys.push(key);
          console.log(`[SettingsExport] Excluding sensitive key: ${key}`);
          continue;
        }
        
        const value = localStorage.getItem(key);
        if (value) {
          localStorageData[key] = value;
          totalSize += key.length + value.length;
        }
      }
    }
    
    console.log(`[SettingsExport] Exported ${Object.keys(localStorageData).length} keys, excluded ${excludedKeys.length} keys`);
    
    const exportData: ExportedSettings = {
      version: this.EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      applicationVersion: this.APP_VERSION,
      localStorage: localStorageData,
      metadata: {
        totalKeys: Object.keys(localStorageData).length,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
        excludedKeys
      }
    };
    
    
    return exportData;
  }
  
  /**
   * Backup current localStorage
   */
  static backupCurrentSettings(): Record<string, string> {
    const backup: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          backup[key] = value;
        }
      }
    }
    return backup;
  }
  
  /**
   * Import settings from an exported file
   */
  static async importSettings(settings: ExportedSettings, options: {
    overwrite?: boolean;
    createBackup?: boolean;
    clearBeforeImport?: boolean;
    preserveKeys?: string[];
    // Legacy options for backward compatibility
    profiles?: boolean;
    datasources?: boolean;
    columnTemplates?: boolean;
    workspaces?: boolean;
    uiPreferences?: boolean;
    customSettings?: boolean;
  } = {}): Promise<{ success: boolean; errors: string[]; backup?: Record<string, string> }> {
    const errors: string[] = [];
    const {
      overwrite = true,
      createBackup = true,
      clearBeforeImport = true,
      preserveKeys = [],
      // Legacy options
      profiles = true,
      datasources = true,
      columnTemplates = true,
      workspaces = true,
      uiPreferences = true,
      customSettings = true
    } = options;
    
    let backup: Record<string, string> | undefined;
    
    // Validate settings format
    if (!settings || !settings.version) {
      errors.push('Invalid settings file format');
      return { success: false, errors };
    }
    
    console.log('[SettingsImport] Starting import process...');
    
    // Handle new format (v2.0.0+) - Full localStorage import
    if (settings.version >= '2.0.0' && settings.localStorage) {
      try {
        // Create backup if requested
        if (createBackup) {
          backup = this.backupCurrentSettings();
          console.log(`[SettingsImport] Created backup of ${Object.keys(backup).length} keys`);
        }
        
        // Preserve certain keys if requested
        const preservedData: Record<string, string> = {};
        preserveKeys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            preservedData[key] = value;
          }
        });
        
        // Clear localStorage if requested
        if (clearBeforeImport) {
          localStorage.clear();
          console.log('[SettingsImport] Cleared localStorage');
        }
        
        // Restore preserved keys
        Object.entries(preservedData).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        
        // Import all localStorage data
        let importedCount = 0;
        Object.entries(settings.localStorage).forEach(([key, value]) => {
          try {
            // Skip sensitive keys
            if (this.shouldExcludeKey(key)) {
              console.log(`[SettingsImport] Skipping sensitive key: ${key}`);
              return;
            }
            
            // Only overwrite if key doesn't exist or overwrite is true
            if (overwrite || !localStorage.getItem(key)) {
              localStorage.setItem(key, value);
              importedCount++;
            }
          } catch (error) {
            errors.push(`Failed to import key '${key}': ${error}`);
          }
        });
        
        console.log(`[SettingsImport] Imported ${importedCount} keys`);
        
        return { 
          success: errors.length === 0, 
          errors,
          backup 
        };
      } catch (error) {
        errors.push(`Import failed: ${error}`);
        return { success: false, errors, backup };
      }
    }
    
    // Handle legacy format (v1.x) - keep for backward compatibility
    if (settings.data) {
      console.log('[SettingsImport] Using legacy import for v1.x format');
      
      // Import profiles
      if (profiles && settings.data.profiles) {
        try {
        const adapter = new LocalStorageAdapter();
        
        if (overwrite) {
          // Complete overwrite - replace all profiles
          await adapter.set('grid-profile-storage', { profiles: settings.data.profiles });
          
          // Also update optimized store if it exists
          const optimizedData = await adapter.get('agv1-profiles-optimized');
          if (optimizedData) {
            await adapter.set('agv1-profiles-optimized', {
              ...optimizedData,
              state: {
                ...optimizedData.state,
                profiles: settings.data.profiles
              }
            });
          }
        } else {
          // Merge with existing profiles
          const existingData = await adapter.get('grid-profile-storage', { profiles: [] });
          const existingProfiles = existingData.profiles || [];
          const existingIds = new Set(existingProfiles.map((p: any) => p.id));
          
          // Only add profiles that don't exist
          const newProfiles = settings.data.profiles.filter(p => !existingIds.has(p.id));
          if (newProfiles.length > 0) {
            const mergedProfiles = [...existingProfiles, ...newProfiles];
            await adapter.set('grid-profile-storage', { profiles: mergedProfiles });
            
            // Also update optimized store if it exists
            const optimizedData = await adapter.get('agv1-profiles-optimized');
            if (optimizedData?.state) {
              const optimizedProfiles = optimizedData.state.profiles || [];
              const optimizedIds = new Set(optimizedProfiles.map((p: any) => p.id));
              const newOptimizedProfiles = settings.data.profiles.filter(p => !optimizedIds.has(p.id));
              if (newOptimizedProfiles.length > 0) {
                await adapter.set('agv1-profiles-optimized', {
                  ...optimizedData,
                  state: {
                    ...optimizedData.state,
                    profiles: [...optimizedProfiles, ...newOptimizedProfiles]
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        errors.push(`Error importing profiles: ${error}`);
      }
    }
    
    // Import datasources
    if (datasources && settings.data.datasources) {
      try {
        const store = useDatasourceStore.getState();
        
        if (overwrite) {
          // Clear existing datasources first
          const existingDatasources = [...store.datasources];
          existingDatasources.forEach(ds => store.deleteDatasource(ds.id));
          
          // Add all imported datasources
          for (const datasource of settings.data.datasources) {
            store.addDatasource(datasource);
          }
        } else {
          // Only add datasources that don't exist
          for (const datasource of settings.data.datasources) {
            const existing = store.getDatasource(datasource.id);
            if (!existing) {
              store.addDatasource(datasource);
            }
          }
        }
      } catch (error) {
        errors.push(`Error importing datasources: ${error}`);
      }
    }
    
    // Import column templates
    if (columnTemplates && settings.data.columnTemplates) {
      try {
        const store = useColumnTemplateStore.getState();
        
        if (overwrite) {
          // Clear existing templates
          const existingTemplates = [...store.templates];
          existingTemplates.forEach(t => store.deleteTemplate(t.id));
          
          // Add all imported templates
          for (const template of settings.data.columnTemplates) {
            store.saveTemplate(template);
          }
        } else {
          // Only add templates that don't exist
          for (const template of settings.data.columnTemplates) {
            if (!store.templates.find((t: any) => t.id === template.id)) {
              store.saveTemplate(template);
            }
          }
        }
      } catch (error) {
        errors.push(`Error importing column templates: ${error}`);
      }
    }
    
    // Import workspaces
    if (workspaces && settings.data.workspaces) {
      try {
        const store = useWorkspaceStore.getState();
        
        if (overwrite) {
          // Clear existing workspaces
          const existingWorkspaces = [...store.workspaces];
          existingWorkspaces.forEach(w => store.deleteWorkspace(w.id));
          
          // Add all imported workspaces
          for (const workspace of settings.data.workspaces) {
            store.addWorkspace(workspace);
          }
        } else {
          // Only add workspaces that don't exist
          for (const workspace of settings.data.workspaces) {
            if (!store.getWorkspace(workspace.id)) {
              store.addWorkspace(workspace);
            }
          }
        }
      } catch (error) {
        errors.push(`Error importing workspaces: ${error}`);
      }
    }
    
    // Import UI preferences
    if (uiPreferences && settings.data.uiPreferences) {
      try {
        Object.entries(settings.data.uiPreferences).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
      } catch (error) {
        errors.push(`Error importing UI preferences: ${error}`);
      }
    }
    
      // Import custom settings
      if (customSettings && settings.data.customSettings) {
        try {
          Object.entries(settings.data.customSettings).forEach(([key, value]) => {
            if (typeof value === 'string') {
              localStorage.setItem(key, value);
            } else {
              localStorage.setItem(key, JSON.stringify(value));
            }
          });
        } catch (error) {
          errors.push(`Error importing custom settings: ${error}`);
        }
      }
    } // End of legacy format handling
    
    return { success: errors.length === 0, errors, backup };
  }
  
  /**
   * Download settings as JSON file
   */
  static downloadSettings(settings: ExportedSettings, filename?: string): void {
    const date = new Date().toISOString().split('T')[0];
    const defaultFilename = `agv1-settings-${date}.json`;
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Read settings from uploaded file
   */
  static async readSettingsFile(file: File): Promise<ExportedSettings> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const settings = JSON.parse(content);
          resolve(settings);
        } catch (error) {
          reject(new Error('Invalid settings file format'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }
}