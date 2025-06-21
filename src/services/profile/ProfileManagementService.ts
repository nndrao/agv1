/**
 * ProfileManagementService
 * 
 * Service for managing grid profiles with support for CRUD operations,
 * versioning, migration, and import/export functionality.
 * Works with existing localStorage data structure via StorageAdapter.
 */

import { storageAdapter as defaultStorageAdapter } from '@/lib/storage/storageAdapter';

// Storage keys
const STORAGE_KEYS = {
  PROFILES: 'grid-profile-storage',
} as const;

interface StorageAdapter {
  get(key: string, defaultValue?: any): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
}
import { GridProfile } from '../../components/datatable/types';
import { ColumnCustomization } from '../../components/datatable/stores/columnSerializer';

/**
 * Profile export format with metadata
 */
export interface ExportedProfile extends GridProfile {
  exportedAt: number;
  exportVersion: string;
  appVersion?: string;
}

/**
 * Profile validation result
 */
export interface ProfileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Profile migration result
 */
export interface ProfileMigrationResult {
  success: boolean;
  migratedProfile?: GridProfile;
  error?: string;
}

/**
 * Service options
 */
export interface ProfileManagementServiceOptions {
  storageAdapter?: StorageAdapter;
  autoMigrate?: boolean;
  validateOnSave?: boolean;
}

/**
 * Profile service events
 */
export type ProfileServiceEvent = 
  | { type: 'profile-created'; profile: GridProfile }
  | { type: 'profile-updated'; profile: GridProfile }
  | { type: 'profile-deleted'; profileId: string }
  | { type: 'active-profile-changed'; profileId: string }
  | { type: 'profiles-imported'; count: number }
  | { type: 'storage-error'; error: Error };

/**
 * Event listener type
 */
export type ProfileServiceEventListener = (event: ProfileServiceEvent) => void;

/**
 * ProfileManagementService
 */
export class ProfileManagementService {
  private storageAdapter: StorageAdapter;
  private autoMigrate: boolean;
  private validateOnSave: boolean;
  private eventListeners: Set<ProfileServiceEventListener> = new Set();
  private migrationCache: Map<string, GridProfile> = new Map();

  // Constants
  private readonly CURRENT_VERSION = 4;
  private readonly EXPORT_VERSION = '1.0.0';
  private readonly DEFAULT_PROFILE_ID = 'default-profile';

  constructor(options: ProfileManagementServiceOptions = {}) {
    this.storageAdapter = options.storageAdapter || defaultStorageAdapter;
    this.autoMigrate = options.autoMigrate !== false;
    this.validateOnSave = options.validateOnSave !== false;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.autoMigrate) {
      await this.migrateProfiles();
    }
    
    // Ensure default profile exists
    await this.ensureDefaultProfile();
  }

  /**
   * Get all profiles
   */
  async getProfiles(): Promise<GridProfile[]> {
    const storage = await this.storageAdapter.get<{
      state: { profiles: GridProfile[]; activeProfileId: string; autoSave?: boolean };
      version: number;
    }>(STORAGE_KEYS.PROFILES);

    if (!storage || !storage.state || !storage.state.profiles) {
      return [];
    }

    return storage.state.profiles;
  }

  /**
   * Get a specific profile by ID
   */
  async getProfile(profileId: string): Promise<GridProfile | null> {
    const profiles = await this.getProfiles();
    return profiles.find(p => p.id === profileId) || null;
  }

  /**
   * Get the active profile ID
   */
  async getActiveProfileId(): Promise<string> {
    const storage = await this.getStorageData();
    return storage?.state?.activeProfileId || this.DEFAULT_PROFILE_ID;
  }

  /**
   * Get the active profile
   */
  async getActiveProfile(): Promise<GridProfile | null> {
    const activeId = await this.getActiveProfileId();
    return this.getProfile(activeId);
  }

  /**
   * Create a new profile
   */
  async createProfile(
    name: string, 
    description?: string,
    cloneFromId?: string
  ): Promise<GridProfile> {
    const profiles = await this.getProfiles();
    
    // Create new profile
    const newProfile: GridProfile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false,
      columnSettings: {
        columnCustomizations: {},
        baseColumnDefs: []
      },
      gridState: {
        columnState: [],
        filterModel: {},
        sortModel: []
      },
      gridOptions: {}
    };

    // Clone from existing profile if specified
    if (cloneFromId) {
      const sourceProfile = profiles.find(p => p.id === cloneFromId);
      if (sourceProfile) {
        // Deep clone settings
        newProfile.columnSettings = JSON.parse(JSON.stringify(sourceProfile.columnSettings || {}));
        newProfile.gridState = JSON.parse(JSON.stringify(sourceProfile.gridState || {}));
        newProfile.gridOptions = JSON.parse(JSON.stringify(sourceProfile.gridOptions || {}));
      }
    } else {
      // Clone from default profile
      const defaultProfile = profiles.find(p => p.id === this.DEFAULT_PROFILE_ID);
      if (defaultProfile) {
        newProfile.columnSettings = JSON.parse(JSON.stringify(defaultProfile.columnSettings || {}));
        newProfile.gridState = {
          columnState: JSON.parse(JSON.stringify(defaultProfile.gridState?.columnState || [])),
          filterModel: {}, // Start with clean filters
          sortModel: []    // Start with clean sorts
        };
        newProfile.gridOptions = JSON.parse(JSON.stringify(defaultProfile.gridOptions || {}));
      }
    }

    // Validate if enabled
    if (this.validateOnSave) {
      const validation = this.validateProfile(newProfile);
      if (!validation.valid) {
        throw new Error(`Invalid profile: ${validation.errors.join(', ')}`);
      }
    }

    // Save to storage
    await this.saveProfiles([...profiles, newProfile]);
    
    // Emit event
    this.emitEvent({ type: 'profile-created', profile: newProfile });
    
    return newProfile;
  }

  /**
   * Update an existing profile
   */
  async updateProfile(
    profileId: string, 
    updates: Partial<GridProfile>
  ): Promise<GridProfile> {
    const profiles = await this.getProfiles();
    const profileIndex = profiles.findIndex(p => p.id === profileId);
    
    if (profileIndex === -1) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Cannot update certain fields of default profile
    if (profileId === this.DEFAULT_PROFILE_ID) {
      delete updates.id;
      delete updates.isDefault;
      delete updates.name; // Optionally prevent renaming default
    }

    // Create updated profile
    const updatedProfile: GridProfile = {
      ...profiles[profileIndex],
      ...updates,
      updatedAt: Date.now()
    };

    // Deep merge for nested objects
    if (updates.columnSettings) {
      updatedProfile.columnSettings = {
        ...profiles[profileIndex].columnSettings,
        ...updates.columnSettings
      };
    }
    
    if (updates.gridState) {
      updatedProfile.gridState = {
        ...profiles[profileIndex].gridState,
        ...updates.gridState
      };
    }
    
    if (updates.gridOptions) {
      updatedProfile.gridOptions = {
        ...profiles[profileIndex].gridOptions,
        ...updates.gridOptions
      };
    }

    // Validate if enabled
    if (this.validateOnSave) {
      const validation = this.validateProfile(updatedProfile);
      if (!validation.valid) {
        throw new Error(`Invalid profile update: ${validation.errors.join(', ')}`);
      }
    }

    // Update in array
    const newProfiles = [...profiles];
    newProfiles[profileIndex] = updatedProfile;
    
    // Save to storage
    await this.saveProfiles(newProfiles);
    
    // Emit event
    this.emitEvent({ type: 'profile-updated', profile: updatedProfile });
    
    return updatedProfile;
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    if (profileId === this.DEFAULT_PROFILE_ID) {
      throw new Error('Cannot delete the default profile');
    }

    const profiles = await this.getProfiles();
    const activeProfileId = await this.getActiveProfileId();
    
    // Check if profile exists
    if (!profiles.find(p => p.id === profileId)) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Filter out the profile
    const newProfiles = profiles.filter(p => p.id !== profileId);
    
    // If deleting active profile, switch to default
    let newActiveId = activeProfileId;
    if (profileId === activeProfileId) {
      newActiveId = this.DEFAULT_PROFILE_ID;
    }
    
    // Save changes
    await this.saveProfilesAndActiveId(newProfiles, newActiveId);
    
    // Emit event
    this.emitEvent({ type: 'profile-deleted', profileId });
  }

  /**
   * Rename a profile
   */
  async renameProfile(profileId: string, newName: string): Promise<GridProfile> {
    if (profileId === this.DEFAULT_PROFILE_ID && newName !== 'Default') {
      throw new Error('Cannot rename the default profile');
    }

    return this.updateProfile(profileId, { name: newName });
  }

  /**
   * Duplicate a profile
   */
  async duplicateProfile(profileId: string, newName: string): Promise<GridProfile> {
    const sourceProfile = await this.getProfile(profileId);
    if (!sourceProfile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    return this.createProfile(newName, sourceProfile.description, profileId);
  }

  /**
   * Set the active profile
   */
  async setActiveProfile(profileId: string): Promise<void> {
    const profiles = await this.getProfiles();
    
    // Verify profile exists
    if (!profiles.find(p => p.id === profileId)) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Update storage
    const storage = await this.getStorageData();
    if (storage) {
      storage.state.activeProfileId = profileId;
      await this.storageAdapter.set(STORAGE_KEYS.PROFILES, storage);
    }
    
    // Emit event
    this.emitEvent({ type: 'active-profile-changed', profileId });
  }

  /**
   * Import a profile
   */
  async importProfile(
    profileData: ExportedProfile | GridProfile,
    options: { 
      generateNewId?: boolean; 
      setAsActive?: boolean;
      validateBeforeImport?: boolean;
    } = {}
  ): Promise<GridProfile> {
    const profiles = await this.getProfiles();
    
    // Prepare the profile
    const importedProfile: GridProfile = {
      ...profileData,
      id: options.generateNewId ? `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : profileData.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false // Never import as default
    };

    // Validate if requested
    if (options.validateBeforeImport !== false) {
      const validation = this.validateProfile(importedProfile);
      if (!validation.valid) {
        throw new Error(`Invalid profile: ${validation.errors.join(', ')}`);
      }
    }

    // Check for ID conflicts
    if (profiles.find(p => p.id === importedProfile.id)) {
      importedProfile.id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add to profiles
    const newProfiles = [...profiles, importedProfile];
    await this.saveProfiles(newProfiles);

    // Set as active if requested
    if (options.setAsActive) {
      await this.setActiveProfile(importedProfile.id);
    }
    
    // Emit event
    this.emitEvent({ type: 'profile-created', profile: importedProfile });
    
    return importedProfile;
  }

  /**
   * Import multiple profiles
   */
  async importProfiles(
    profilesData: (ExportedProfile | GridProfile)[],
    options: { 
      generateNewIds?: boolean;
      skipInvalid?: boolean;
    } = {}
  ): Promise<{ imported: GridProfile[]; failed: Array<{ profile: any; error: string }> }> {
    const imported: GridProfile[] = [];
    const failed: Array<{ profile: any; error: string }> = [];

    for (const profileData of profilesData) {
      try {
        const profile = await this.importProfile(profileData, {
          generateNewId: options.generateNewIds,
          validateBeforeImport: !options.skipInvalid
        });
        imported.push(profile);
      } catch (error) {
        if (!options.skipInvalid) {
          throw error;
        }
        failed.push({ 
          profile: profileData, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Emit event
    if (imported.length > 0) {
      this.emitEvent({ type: 'profiles-imported', count: imported.length });
    }

    return { imported, failed };
  }

  /**
   * Export a profile
   */
  async exportProfile(profileId: string): Promise<ExportedProfile> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    const exportedProfile: ExportedProfile = {
      ...profile,
      exportedAt: Date.now(),
      exportVersion: this.EXPORT_VERSION,
      appVersion: process.env.REACT_APP_VERSION
    };

    return exportedProfile;
  }

  /**
   * Export multiple profiles
   */
  async exportProfiles(profileIds?: string[]): Promise<ExportedProfile[]> {
    const profiles = await this.getProfiles();
    const profilesToExport = profileIds 
      ? profiles.filter(p => profileIds.includes(p.id))
      : profiles;

    return profilesToExport.map(profile => ({
      ...profile,
      exportedAt: Date.now(),
      exportVersion: this.EXPORT_VERSION,
      appVersion: process.env.REACT_APP_VERSION
    }));
  }

  /**
   * Export all profiles as JSON string
   */
  async exportToJson(profileIds?: string[]): Promise<string> {
    const profiles = await this.exportProfiles(profileIds);
    return JSON.stringify(profiles, null, 2);
  }

  /**
   * Import profiles from JSON string
   */
  async importFromJson(
    jsonString: string,
    options: { generateNewIds?: boolean; skipInvalid?: boolean } = {}
  ): Promise<{ imported: GridProfile[]; failed: Array<{ profile: any; error: string }> }> {
    try {
      const data = JSON.parse(jsonString);
      const profiles = Array.isArray(data) ? data : [data];
      return this.importProfiles(profiles, options);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate a profile
   */
  validateProfile(profile: GridProfile): ProfileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!profile.id) errors.push('Profile ID is required');
    if (!profile.name) errors.push('Profile name is required');
    if (typeof profile.createdAt !== 'number') errors.push('Created timestamp is required');
    if (typeof profile.updatedAt !== 'number') errors.push('Updated timestamp is required');

    // Structure validation
    if (profile.columnSettings && typeof profile.columnSettings !== 'object') {
      errors.push('Column settings must be an object');
    }
    
    if (profile.gridState && typeof profile.gridState !== 'object') {
      errors.push('Grid state must be an object');
    }
    
    if (profile.gridOptions && typeof profile.gridOptions !== 'object') {
      errors.push('Grid options must be an object');
    }

    // Check for legacy structure
    if (profile.gridState_legacy) {
      warnings.push('Profile contains legacy grid state - consider migration');
    }

    // Check for missing new structure
    if (!profile.columnSettings && !profile.gridState_legacy) {
      warnings.push('Profile missing column settings - may need migration');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Migrate profiles to latest version
   */
  async migrateProfiles(): Promise<void> {
    const storage = await this.getStorageData();
    if (!storage) return;

    const currentVersion = storage.version || 1;
    if (currentVersion >= this.CURRENT_VERSION) return;

    console.log(`[ProfileManagementService] Migrating profiles from version ${currentVersion} to ${this.CURRENT_VERSION}`);

    // Perform migration
    const migratedProfiles = await Promise.all(
      storage.state.profiles.map(profile => this.migrateProfile(profile))
    );

    // Update storage
    storage.state.profiles = migratedProfiles;
    storage.version = this.CURRENT_VERSION;
    await this.storageAdapter.set(STORAGE_KEYS.PROFILES, storage);

    console.log('[ProfileManagementService] Migration completed');
  }

  /**
   * Migrate a single profile
   */
  private async migrateProfile(profile: GridProfile): Promise<GridProfile> {
    // Check cache first
    if (this.migrationCache.has(profile.id)) {
      return this.migrationCache.get(profile.id)!;
    }

    const migrated = { ...profile };

    // Migrate from old structure to new structure
    if (!migrated.columnSettings && !migrated.gridOptions) {
      console.log(`[ProfileManagementService] Migrating profile ${profile.id} to new structure`);
      
      // Extract from gridState if present
      if (migrated.gridState && typeof migrated.gridState === 'object') {
        const gridState = migrated.gridState as any;
        
        // Move column-related settings
        migrated.columnSettings = {
          columnCustomizations: gridState.columnCustomizations || {},
          baseColumnDefs: gridState.baseColumnDefs || [],
          templates: gridState.templates,
          columnTemplates: gridState.columnTemplates
        };
        
        // Move grid options
        migrated.gridOptions = {
          ...gridState.gridOptions,
          font: gridState.font
        };
        
        // Keep only AG-Grid state
        migrated.gridState = {
          columnState: gridState.columnState || [],
          filterModel: gridState.filterModel || {},
          sortModel: gridState.sortModel || []
        };
        
        // Store legacy data for backward compatibility
        migrated.gridState_legacy = gridState;
      }
    }

    // Clean invalid properties from column definitions
    if (migrated.gridState_legacy?.columnDefs) {
      migrated.gridState_legacy.columnDefs = migrated.gridState_legacy.columnDefs.map((col: any) => {
        const cleaned = { ...col };
        delete cleaned.valueFormat;
        delete cleaned._hasFormatter;
        delete cleaned.excelFormat;
        return cleaned;
      });
    }

    // Cache the result
    this.migrationCache.set(profile.id, migrated);
    
    return migrated;
  }

  /**
   * Ensure default profile exists
   */
  private async ensureDefaultProfile(): Promise<void> {
    const profiles = await this.getProfiles();
    
    if (!profiles.find(p => p.id === this.DEFAULT_PROFILE_ID)) {
      const defaultProfile: GridProfile = {
        id: this.DEFAULT_PROFILE_ID,
        name: 'Default',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: true,
        columnSettings: {
          columnCustomizations: {},
          baseColumnDefs: []
        },
        gridState: {
          columnState: [],
          filterModel: {},
          sortModel: []
        },
        gridOptions: {}
      };
      
      await this.saveProfiles([defaultProfile, ...profiles]);
    }
  }

  /**
   * Get storage data
   */
  private async getStorageData() {
    return this.storageAdapter.get<{
      state: { profiles: GridProfile[]; activeProfileId: string; autoSave?: boolean };
      version: number;
    }>(STORAGE_KEYS.PROFILES);
  }

  /**
   * Save profiles to storage
   */
  private async saveProfiles(profiles: GridProfile[]): Promise<void> {
    const storage = await this.getStorageData();
    
    if (storage) {
      storage.state.profiles = profiles;
    } else {
      // Create new storage structure
      await this.storageAdapter.set(STORAGE_KEYS.PROFILES, {
        state: {
          profiles,
          activeProfileId: this.DEFAULT_PROFILE_ID,
          autoSave: true
        },
        version: this.CURRENT_VERSION
      });
      return;
    }
    
    await this.storageAdapter.set(STORAGE_KEYS.PROFILES, storage);
  }

  /**
   * Save profiles and active ID
   */
  private async saveProfilesAndActiveId(profiles: GridProfile[], activeProfileId: string): Promise<void> {
    const storage = await this.getStorageData();
    
    if (storage) {
      storage.state.profiles = profiles;
      storage.state.activeProfileId = activeProfileId;
      await this.storageAdapter.set(STORAGE_KEYS.PROFILES, storage);
    }
  }

  /**
   * Add event listener
   */
  addEventListener(listener: ProfileServiceEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: ProfileServiceEventListener): void {
    this.eventListeners.delete(listener);
  }

  /**
   * Emit event
   */
  private emitEvent(event: ProfileServiceEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[ProfileManagementService] Event listener error:', error);
      }
    });
  }

  /**
   * Clear migration cache
   */
  clearMigrationCache(): void {
    this.migrationCache.clear();
  }

  /**
   * Get service statistics
   */
  async getStatistics(): Promise<{
    totalProfiles: number;
    activeProfileId: string;
    storageVersion: number;
    hasLegacyProfiles: boolean;
  }> {
    const storage = await this.getStorageData();
    const profiles = storage?.state?.profiles || [];
    
    return {
      totalProfiles: profiles.length,
      activeProfileId: storage?.state?.activeProfileId || this.DEFAULT_PROFILE_ID,
      storageVersion: storage?.version || 1,
      hasLegacyProfiles: profiles.some(p => !!p.gridState_legacy)
    };
  }
}

// Export singleton instance for convenience
export const profileManagementService = new ProfileManagementService();