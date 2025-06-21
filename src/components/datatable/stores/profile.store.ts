import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ColDef, ColumnState, FilterModel, SortModelItem } from 'ag-grid-community';
import { ColumnCustomization, serializeColumnCustomizations, deserializeColumnCustomizations } from './columnSerializer';
import { storageAdapter } from '@/lib/storage/storageAdapter';
import * as React from 'react';

interface PersistedState {
  profiles?: GridProfile[];
  activeProfileId?: string;
  lastExportedAt?: number;
  autoSave?: boolean;
}

// Profile data structure
export interface GridProfile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  description?: string;
  // Column settings from ribbon (cellStyle, valueFormatter, etc)
  columnSettings?: {
    // Lightweight column customizations (new format)
    columnCustomizations?: Record<string, ColumnCustomization>;
    // Base column definitions snapshot (for reference)
    baseColumnDefs?: ColDef[];
    // Templates
    templates?: Record<string, unknown>[];
    // Column customization templates
    columnTemplates?: Record<string, unknown>[];
  };
  // AG-Grid state from extractState (column order, visibility, filters, sorts)
  gridState?: {
    // Column state (order, visibility, width, etc.)
    columnState: ColumnState[];
    // Filter model
    filterModel: FilterModel;
    // Sort model
    sortModel: SortModelItem[];
    // --- Added properties for full compatibility ---
    // Column definitions with all customizations
    columnDefs?: ColDef[];
    // Lightweight column customizations (new format)
    columnCustomizations?: Record<string, ColumnCustomization>;
    // Base column definitions snapshot (for reference)
    baseColumnDefs?: ColDef[];
    // Templates
    templates?: Record<string, unknown>[];
    // Column customization templates
    columnTemplates?: Record<string, unknown>[];
    // UI preferences
    font?: string;
    // Other grid options
    gridOptions?: {
      rowHeight?: number;
      headerHeight?: number;
      floatingFiltersHeight?: number;
      groupHeaderHeight?: number;
      pivotHeaderHeight?: number;
      pivotGroupHeaderHeight?: number;
      animateRows?: boolean;
      pagination?: boolean;
      paginationPageSize?: number;
      font?: string;
      fontSize?: string;
    };
  };
  // Datasource configuration
  datasourceId?: string;

  // Grid options from editor (row height, header height, etc)
  gridOptions?: {
    rowHeight?: number;
    headerHeight?: number;
    floatingFiltersHeight?: number;
    groupHeaderHeight?: number;
    pivotHeaderHeight?: number;
    pivotGroupHeaderHeight?: number;
    animateRows?: boolean;
    pagination?: boolean;
    paginationPageSize?: number;
    // UI preferences
    font?: string;
    fontSize?: string;
  };
  // Legacy gridState for backward compatibility
  gridState_legacy?: {
    // Column definitions with all customizations (legacy - for backward compatibility)
    columnDefs?: ColDef[];
    // Lightweight column customizations (new format)
    columnCustomizations?: Record<string, ColumnCustomization>;
    // Base column definitions snapshot (for reference)
    baseColumnDefs?: ColDef[];
    // Column state (order, visibility, width, etc.)
    columnState: ColumnState[];
    // Filter model
    filterModel: FilterModel;
    // Sort model
    sortModel: SortModelItem[];
    // Templates
    templates?: Record<string, unknown>[];
    // Column customization templates
    columnTemplates?: Record<string, unknown>[];
    // UI preferences
    font?: string;
    // Other grid options
    gridOptions?: {
      rowHeight?: number;
      headerHeight?: number;
      floatingFiltersHeight?: number;
      groupHeaderHeight?: number;
      pivotHeaderHeight?: number;
      pivotGroupHeaderHeight?: number;
      animateRows?: boolean;
      pagination?: boolean;
      paginationPageSize?: number;
    };
  };
}

interface ProfileStore {
  // Profiles
  profiles: GridProfile[];
  activeProfileId: string;
  
  // Migration state
  migrationPending: boolean;
  migrationInProgress: boolean;
  
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Actions
  createProfile: (name: string, description?: string) => GridProfile;
  updateProfile: (profileId: string, updates: Partial<GridProfile>) => void;
  deleteProfile: (profileId: string) => void;
  renameProfile: (profileId: string, newName: string) => void;
  setActiveProfile: (profileId: string) => void;
  getActiveProfile: () => GridProfile | undefined;
  duplicateProfile: (profileId: string, newName: string) => GridProfile;
  importProfile: (profileData: GridProfile) => void;
  exportProfile: (profileId: string) => GridProfile | undefined;
  saveCurrentState: (gridState: Partial<GridProfile['gridState']>) => void;
  
  // Lightweight column serialization
  saveColumnCustomizations: (columnDefs: ColDef[], baseColumnDefs?: ColDef[]) => void;
  getColumnDefs: (profileId?: string) => ColDef[] | undefined;
  
  // Separate save methods for new structure
  saveColumnSettings: (columnCustomizations: Record<string, ColumnCustomization>, baseColumnDefs?: ColDef[]) => void;
  saveGridState: (state: { columnState?: ColumnState[], filterModel?: FilterModel, sortModel?: SortModelItem[] }) => void;
  saveGridOptions: (options: GridProfile['gridOptions']) => void;
  
  // Auto-save
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  
  // Migration
  performDeferredMigration: () => Promise<void>;
}

// Default profile ID
const DEFAULT_PROFILE_ID = 'default-profile';

// Create default profile
const createDefaultProfile = (): GridProfile => {
  const profile = {
    id: DEFAULT_PROFILE_ID,
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
  
  console.log('[ProfileStore] Creating default profile:', {
    id: profile.id,
    name: profile.name,
    hasColumnSettings: true,
    baseColumnsCount: 0
  });
  
  return profile;
};

// Deferred migration function
async function performMigration(state: PersistedState): Promise<PersistedState> {
        // perfMonitor.mark('migration-start');
  
  const newState = { ...state };
  
  // Migrate from version 1 to 2 (clean invalid properties)
  if (state.profiles && Array.isArray(state.profiles)) {
    newState.profiles = state.profiles.map((profile: GridProfile) => {
      const newProfile = { ...profile };
      
      if (profile.gridState && profile.gridState.columnDefs && newProfile.gridState) {
        // Clean invalid properties from each column definition
        newProfile.gridState.columnDefs = profile.gridState.columnDefs.map((col: any) => {
          const cleaned = { ...col } as any;
          // Remove invalid properties that AG-Grid doesn't recognize
          delete cleaned.valueFormat;
          delete cleaned._hasFormatter;
          delete cleaned.excelFormat;
          return cleaned;
        });
        // Convert headerStyle objects to new format
        newProfile.gridState.columnDefs = newProfile.gridState.columnDefs.map((col: ColDef) => {
          if (col.headerStyle && typeof col.headerStyle === 'object' && !(col.headerStyle as any)._isHeaderStyleConfig) {
            // Convert old format to new format
            col.headerStyle = {
              _isHeaderStyleConfig: true,
              regular: col.headerStyle,
              floating: null
            } as any;
          }
          return col;
        });
      }
      
      // Migrate to new structure if needed
      if (!newProfile.columnSettings && !newProfile.gridOptions) {
        // This is an old profile, migrate it
        console.log('[ProfileStore Migration] Migrating profile to new structure:', {
          profileId: newProfile.id,
          profileName: newProfile.name
        });
        
        // Extract column settings
        if (newProfile.gridState) {
          // Move column-related settings to columnSettings
          newProfile.columnSettings = {
            columnCustomizations: newProfile.gridState.columnCustomizations || {},
            baseColumnDefs: newProfile.gridState.baseColumnDefs || [],
            templates: newProfile.gridState.templates,
            columnTemplates: newProfile.gridState.columnTemplates
          };
          
          // Move grid options to separate property
          if (newProfile.gridState.gridOptions) {
            newProfile.gridOptions = {
              ...newProfile.gridState.gridOptions,
              font: newProfile.gridState.font
            };
          } else {
            newProfile.gridOptions = {
              font: newProfile.gridState.font
            };
          }
          
          // Keep only AG-Grid state in gridState
          const cleanGridState = {
            columnState: newProfile.gridState.columnState || [],
            filterModel: newProfile.gridState.filterModel || {},
            sortModel: newProfile.gridState.sortModel || []
          };
          
          // Replace the entire gridState with clean version
          newProfile.gridState = cleanGridState;
        }
      }
      
      // Convert to lightweight format if needed (for old columnDefs format)
      if (newProfile.gridState_legacy && newProfile.gridState_legacy.columnDefs && 
          newProfile.gridState_legacy.columnDefs.length > 0 && 
          !newProfile.columnSettings) {
        
        const baseColumns = newProfile.gridState_legacy.columnDefs.map((col: ColDef) => ({
          field: col.field,
          headerName: col.field,
          cellDataType: col.cellDataType
        }));
        
        const customizations = serializeColumnCustomizations(newProfile.gridState_legacy.columnDefs, baseColumns);
        
        console.log('[ProfileStore Migration] Converting legacy columnDefs to new format:', {
          profileId: newProfile.id,
          profileName: newProfile.name,
          originalSize: JSON.stringify(newProfile.gridState_legacy.columnDefs).length,
          newSize: JSON.stringify(customizations).length,
          reduction: `${Math.round((1 - JSON.stringify(customizations).length / JSON.stringify(newProfile.gridState_legacy.columnDefs).length) * 100)}%`
        });
        
        // Create new structure
        newProfile.columnSettings = {
          columnCustomizations: customizations,
          baseColumnDefs: baseColumns
        };
        
        // Clean up gridState to only have AG-Grid state
        const cleanGridState = {
          columnState: newProfile.gridState_legacy.columnState || [],
          filterModel: newProfile.gridState_legacy.filterModel || {},
          sortModel: newProfile.gridState_legacy.sortModel || []
        };
        newProfile.gridState = cleanGridState;
        
        // Move grid options if they exist
        if (newProfile.gridState_legacy.gridOptions) {
          newProfile.gridOptions = newProfile.gridState_legacy.gridOptions;
        }
      }
      
      return newProfile;
    });
  }
  
      // perfMonitor.mark('migration-end');
    // perfMonitor.measure('migrationTime', 'migration-start', 'migration-end');
  
  return newState;
}

import { customProfileStorage } from '@/utils/customProfileStorage';

// Use custom storage for better debugging
const profileStorageAdapter = customProfileStorage;

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      // Initial state - will be overridden by persisted state if it exists
      profiles: [createDefaultProfile()],  // Start with default profile to prevent empty state
      activeProfileId: DEFAULT_PROFILE_ID,
      autoSave: true,
      migrationPending: false,
      migrationInProgress: false,
      _hasHydrated: false,
      
      // Hydration state
      setHasHydrated: (state) => {
        set({ _hasHydrated: state }, false); // false = don't trigger middleware (no save)
      },
      
      // Create new profile
      createProfile: (name, description) => {
        const state = get();
        
        // Get the default profile to clone its settings
        const defaultProfile = state.profiles.find(p => p.id === DEFAULT_PROFILE_ID);
        
        const newProfile: GridProfile = {
          id: `profile-${Date.now()}`,
          name,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          // Clone column settings from default
          columnSettings: defaultProfile?.columnSettings ? {
            columnCustomizations: { ...(defaultProfile.columnSettings.columnCustomizations || {}) },
            baseColumnDefs: [...(defaultProfile.columnSettings.baseColumnDefs || [])]
          } : {
            columnCustomizations: {},
            baseColumnDefs: []
          },
          // Start with clean grid state (no filters/sorts)
          gridState: {
            columnState: [...((defaultProfile?.gridState?.columnState as ColumnState[]) || [])],
            filterModel: {},  // Start with no filters
            sortModel: []     // Start with no sorting
          },
          // Clone grid options from default
          gridOptions: defaultProfile?.gridOptions ? { ...defaultProfile.gridOptions } : {}
        };
        
        console.log('[ProfileStore] Creating new profile with default state:', {
          profileName: name,
          defaultProfileFound: !!defaultProfile,
          customizationsCount: Object.keys(newProfile.columnSettings?.columnCustomizations || {}).length
        });
        
        set(state => ({
          profiles: [...state.profiles, newProfile]
        }));
        
        // Force immediate persistence
        console.log('[ProfileStore] Forcing persistence after profile creation');
        const store = useProfileStore.getState();
        const persistApi = (useProfileStore as any).persist;
        if (persistApi?.rehydrate) {
          persistApi.rehydrate();
        }
        
        return newProfile;
      },
      
      // Update existing profile
      updateProfile: (profileId, updates) => {
        console.log('[ProfileStore] updateProfile called:', {
          profileId,
          updates,
          hasColumnSettings: !!updates.columnSettings,
          hasGridState: !!updates.gridState,
          hasGridOptions: !!updates.gridOptions,
          // Legacy check
          hasLegacyGridState: !!updates.gridState && ('columnCustomizations' in updates.gridState || 'columnDefs' in updates.gridState)
        });
        
        set(state => {
          const updatedProfiles = state.profiles.map(profile => {
            if (profile.id === profileId) {
              // Deep merge each section separately to preserve existing data
              const updatedProfile = {
                ...profile,
                updatedAt: Date.now()
              };
              
              // Update column settings if provided
              if (updates.columnSettings) {
                updatedProfile.columnSettings = {
                  ...profile.columnSettings,
                  ...updates.columnSettings
                };
              }
              
              // Update grid state if provided
              if (updates.gridState) {
                // Check if this is legacy format (has columnCustomizations or columnDefs)
                if ('columnCustomizations' in updates.gridState || 'columnDefs' in updates.gridState) {
                  // This is legacy format, keep it as-is for backward compatibility
                  updatedProfile.gridState = {
                    ...profile.gridState,
                    ...updates.gridState
                  };
                } else {
                  // This is new format, update only AG-Grid state
                  updatedProfile.gridState = {
                    ...profile.gridState,
                    ...updates.gridState
                  };
                }
              }
              
              // Update grid options if provided
              if (updates.gridOptions) {
                updatedProfile.gridOptions = {
                  ...profile.gridOptions,
                  ...updates.gridOptions
                };
              }
              
              // Handle other top-level updates (name, description, etc)
              Object.keys(updates).forEach(key => {
                if (key !== 'columnSettings' && key !== 'gridState' && key !== 'gridOptions') {
                  (updatedProfile as any)[key] = (updates as any)[key];
                }
              });
              
              console.log('[ProfileStore] Profile updated:', {
                profileId,
                profileName: updatedProfile.name,
                hasColumnSettings: !!updatedProfile.columnSettings,
                customizationsCount: Object.keys(updatedProfile.columnSettings?.columnCustomizations || {}).length,
                hasGridState: !!updatedProfile.gridState,
                columnStateCount: updatedProfile.gridState?.columnState?.length || 0,
                hasGridOptions: !!updatedProfile.gridOptions,
                gridOptionsCount: Object.keys(updatedProfile.gridOptions || {}).length
              });
              
              return updatedProfile;
            }
            return profile;
          });
          
          return { profiles: updatedProfiles };
        });
      },
      
      // Delete profile (cannot delete default or active profile)
      deleteProfile: (profileId) => {
        const { activeProfileId, profiles } = get();
        
        // Add protection against accidental mass deletion
        if (profiles.length <= 1) {
          console.warn('[ProfileStore] Cannot delete the last profile');
          return;
        }
        
        // Cannot delete default profile
        if (profileId === DEFAULT_PROFILE_ID) {
          console.warn('Cannot delete default profile');
          return;
        }
        
        const profileToDelete = profiles.find(p => p.id === profileId);
        if (!profileToDelete) {
          console.warn(`Profile ${profileId} not found`);
          return;
        }
        
        console.log('[ProfileStore] Deleting profile:', {
          profileId,
          profileName: profileToDelete.name,
          isActiveProfile: profileId === activeProfileId,
          willSwitchToDefault: profileId === activeProfileId,
          currentProfileCount: profiles.length
        });
        
        // If deleting active profile, switch to default
        if (profileId === activeProfileId) {
          console.log('[ProfileStore] Switching to default profile after deletion');
          set({ activeProfileId: DEFAULT_PROFILE_ID });
        }
        
        // Remove the profile from the list
        set(state => ({
          profiles: state.profiles.filter(p => p.id !== profileId)
        }));
        
        console.log('[ProfileStore] Profile deleted successfully:', {
          deletedProfile: profileToDelete.name,
          newActiveProfileId: profileId === activeProfileId ? DEFAULT_PROFILE_ID : activeProfileId,
          remainingProfiles: get().profiles.length
        });
      },
      
      // Rename profile
      renameProfile: (profileId, newName) => {
        set(state => ({
          profiles: state.profiles.map(profile => 
            profile.id === profileId
              ? { ...profile, name: newName, updatedAt: Date.now() }
              : profile
          )
        }));
      },
      
      // Set active profile
      setActiveProfile: (profileId) => {
        const { profiles } = get();
        const profileExists = profiles.some(p => p.id === profileId);
        
        console.log('[ProfileStore] setActiveProfile called:', {
          profileId,
          profileExists,
          availableProfiles: profiles.map(p => ({ id: p.id, name: p.name }))
        });
        
        if (profileExists) {
          set({ activeProfileId: profileId });
          console.log('[ProfileStore] Active profile set to:', profileId);
        } else {
          console.warn(`[ProfileStore] Profile ${profileId} not found`);
        }
      },
      
      // Get active profile
      getActiveProfile: () => {
        const { profiles, activeProfileId } = get();
        const activeProfile = profiles.find(p => p.id === activeProfileId);
        
        // Reduced logging - only log when profile is not found
        if (!activeProfile) {
          console.warn('[ProfileStore] Active profile not found:', activeProfileId);
        }
        
        return activeProfile;
      },
      
      // Duplicate profile
      duplicateProfile: (profileId, newName) => {
        const { profiles } = get();
        const sourceProfile = profiles.find(p => p.id === profileId);
        
        if (!sourceProfile) {
          throw new Error(`Profile ${profileId} not found`);
        }
        
        // Deep clone the profile
        const clonedData = JSON.parse(JSON.stringify(sourceProfile));
        
        const duplicatedProfile: GridProfile = {
          ...clonedData,
          id: `profile-${Date.now()}`,
          name: newName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
          // Ensure new structure is preserved
          columnSettings: clonedData.columnSettings || {
            columnCustomizations: {},
            baseColumnDefs: []
          },
          gridState: clonedData.gridState || {
            columnState: [],
            filterModel: {},
            sortModel: []
          },
          gridOptions: clonedData.gridOptions || {}
        };
        
        set(state => ({
          profiles: [...state.profiles, duplicatedProfile]
        }));
        
        return duplicatedProfile;
      },
      
      // Import profile
      importProfile: (profileData) => {
        const newProfile: GridProfile = {
          ...profileData,
          id: `profile-${Date.now()}`, // Generate new ID to avoid conflicts
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
        };
        
        set(state => ({
          profiles: [...state.profiles, newProfile]
        }));
      },
      
      // Export profile
      exportProfile: (profileId) => {
        const { profiles } = get();
        return profiles.find(p => p.id === profileId);
      },
      
      // Save current state to active profile (legacy method for backward compatibility)
      saveCurrentState: (gridState) => {
        const { activeProfileId, profiles } = get();
        const activeProfile = profiles.find(p => p.id === activeProfileId);
        
        console.log('[ProfileStore] saveCurrentState called (legacy):', {
          activeProfileId,
          hasActiveProfile: !!activeProfile,
          gridStateKeys: gridState ? Object.keys(gridState) : [],
          columnDefsCount: gridState?.columnDefs?.length,
          columnStateCount: gridState?.columnState?.length
        });
        
        if (!activeProfile) {
          console.warn('[ProfileStore] No active profile found for saving');
          return;
        }
        
        if (!gridState) return;
        
        // Route to appropriate new save methods
        if ((gridState as any).columnDefs) {
          // Save column customizations using the new method
          const baseColumns = activeProfile.columnSettings?.baseColumnDefs || [];
          const customizations = serializeColumnCustomizations((gridState as any).columnDefs, baseColumns);
          get().saveColumnSettings(customizations, baseColumns);
        }
        
        // Save grid state (column state, filters, sorts)
        if (gridState.columnState || gridState.filterModel || gridState.sortModel) {
          get().saveGridState({
            columnState: gridState.columnState,
            filterModel: gridState.filterModel,
            sortModel: gridState.sortModel
          });
        }
        
        // Save grid options if present
        if ((gridState as any).gridOptions) {
          get().saveGridOptions((gridState as any).gridOptions);
        }
      },
      
      // Save column customizations in lightweight format (legacy method)
      saveColumnCustomizations: (columnDefs, baseColumnDefs) => {
        const { activeProfileId } = get();
        const activeProfile = get().getActiveProfile();
        
        if (!activeProfile) {
          console.warn('[ProfileStore] No active profile found for saving column customizations');
          return;
        }
        
        // Ensure we have base columns - use provided ones or fall back to current columns
        const actualBaseColumns = baseColumnDefs || activeProfile.columnSettings?.baseColumnDefs || columnDefs;
        
        const customizations = serializeColumnCustomizations(
          columnDefs, 
          actualBaseColumns
        );
        
        console.log('[ProfileStore] Saving column customizations (legacy):', {
          profileId: activeProfileId,
          customizationsCount: Object.keys(customizations).length,
          baseColumnsCount: actualBaseColumns.length,
          size: `${(JSON.stringify(customizations).length / 1024).toFixed(2)}KB`
        });
        
        // Use the new saveColumnSettings method
        get().saveColumnSettings(customizations, actualBaseColumns);
      },
      
      // New method: Save column settings (from ribbon)
      saveColumnSettings: (columnCustomizations, baseColumnDefs) => {
        const { activeProfileId } = get();
        const activeProfile = get().getActiveProfile();
        
        if (!activeProfile) {
          console.warn('[ProfileStore] No active profile found for saving column settings');
          return;
        }
        
        console.log('[ProfileStore] Saving column settings:', {
          profileId: activeProfileId,
          customizationsCount: Object.keys(columnCustomizations).length,
          baseColumnsCount: baseColumnDefs?.length || 0
        });
        
        get().updateProfile(activeProfileId, {
          columnSettings: {
            ...activeProfile.columnSettings,
            columnCustomizations: columnCustomizations,
            baseColumnDefs: baseColumnDefs || activeProfile.columnSettings?.baseColumnDefs || []
          }
        });
      },
      
      // New method: Save grid state (from AG-Grid extractState)
      saveGridState: (state) => {
        const { activeProfileId } = get();
        const activeProfile = get().getActiveProfile();
        
        if (!activeProfile) {
          console.warn('[ProfileStore] No active profile found for saving grid state');
          return;
        }
        
        console.log('[ProfileStore] Saving grid state:', {
          profileId: activeProfileId,
          hasColumnState: !!state.columnState,
          columnStateCount: state.columnState?.length || 0,
          hasFilterModel: !!state.filterModel,
          hasSortModel: !!state.sortModel
        });
        
        const updatedGridState: GridProfile['gridState'] = {
          columnState: state.columnState !== undefined ? state.columnState : activeProfile.gridState?.columnState || [],
          filterModel: state.filterModel !== undefined ? state.filterModel : activeProfile.gridState?.filterModel || {},
          sortModel: state.sortModel !== undefined ? state.sortModel : activeProfile.gridState?.sortModel || []
        };
        
        get().updateProfile(activeProfileId, {
          gridState: updatedGridState
        });
      },
      
      // New method: Save grid options (from editor)
      saveGridOptions: (options) => {
        const { activeProfileId } = get();
        const activeProfile = get().getActiveProfile();
        
        if (!activeProfile) {
          console.warn('[ProfileStore] No active profile found for saving grid options');
          return;
        }
        
        console.log('[ProfileStore] Saving grid options:', {
          profileId: activeProfileId,
          optionsCount: Object.keys(options || {}).length
        });
        
        get().updateProfile(activeProfileId, {
          gridOptions: {
            ...activeProfile.gridOptions,
            ...options
          }
        });
      },
      
      // Get column definitions (reconstruct from lightweight format if needed)
      getColumnDefs: (profileId) => {
        const { profiles, activeProfileId } = get();
        const id = profileId || activeProfileId;
        const profile = profiles.find(p => p.id === id);
        
        console.log('[ProfileStore] getColumnDefs called:', {
          profileId,
          activeProfileId,
          found: !!profile,
          profileName: profile?.name,
          hasColumnSettings: !!profile?.columnSettings,
          hasCustomizations: !!(profile?.columnSettings?.columnCustomizations),
          hasBaseColumns: !!(profile?.columnSettings?.baseColumnDefs),
          // Check legacy format too
          hasLegacyGridState: !!profile?.gridState_legacy,
          hasLegacyCustomizations: !!(profile?.gridState_legacy?.columnCustomizations)
        });
        
        if (!profile) return undefined;
        
        // First check new structure
        if (profile.columnSettings?.columnCustomizations && profile.columnSettings?.baseColumnDefs && profile.columnSettings.baseColumnDefs.length > 0) {
          console.log('[ProfileStore] Reconstructing columnDefs from new columnSettings format', {
            customizationsCount: Object.keys(profile.columnSettings.columnCustomizations).length,
            baseColumnsCount: profile.columnSettings.baseColumnDefs.length
          });
          const reconstructed = deserializeColumnCustomizations(
            profile.columnSettings.columnCustomizations,
            profile.columnSettings.baseColumnDefs
          );
          console.log('[ProfileStore] Column definitions reconstructed:', {
            totalColumns: reconstructed.length,
            columnsWithFormatters: reconstructed.filter(col => col.valueFormatter).length
          });
          return reconstructed;
        }
        
        // Fall back to legacy gridState format if available
        if (profile.gridState_legacy?.columnCustomizations && profile.gridState_legacy?.baseColumnDefs && profile.gridState_legacy.baseColumnDefs.length > 0) {
          console.log('[ProfileStore] Reconstructing columnDefs from legacy gridState format', {
            customizationsCount: Object.keys(profile.gridState_legacy.columnCustomizations).length,
            baseColumnsCount: profile.gridState_legacy.baseColumnDefs.length
          });
          const reconstructed = deserializeColumnCustomizations(
            profile.gridState_legacy.columnCustomizations,
            profile.gridState_legacy.baseColumnDefs
          );
          return reconstructed;
        }
        
        // Fall back to legacy columnDefs if available
        if (profile.gridState_legacy?.columnDefs) {
          console.log('[ProfileStore] Using legacy columnDefs format');
          return profile.gridState_legacy.columnDefs;
        }
        
        // Return empty array if no column definitions available
        return [];
      },
      
      // Auto-save settings
      setAutoSave: (enabled) => {
        set({ autoSave: enabled });
      },
      
      // Perform deferred migration
      performDeferredMigration: async () => {
        const state = get();
        if (state.migrationInProgress) return;
        
        console.log('[ProfileStore] Checking if migration is needed...');
        
        set({ migrationInProgress: true });
        
        try {
          // Get the current persisted state
          const storageKey = 'grid-profile-storage';
          const stored = await storageAdapter.get(storageKey, null);
          
          if (stored) {
            const parsedData = stored;
            const currentVersion = parsedData.version || 1;
            
            console.log('[ProfileStore] Current storage version:', currentVersion);
            
            if (currentVersion < 4) {
              console.log('[ProfileStore] Performing deferred migration from version', currentVersion);
              
              // Perform migration
              const migratedState = await performMigration(parsedData.state);
              
              // Only update if we actually have migrated data
              if (migratedState && migratedState.profiles && migratedState.profiles.length > 0) {
                console.log('[ProfileStore] Migration resulted in profiles:', migratedState.profiles.map(p => ({ id: p.id, name: p.name })));
                
                // Update the store
                set({
                  profiles: migratedState.profiles,
                  activeProfileId: migratedState.activeProfileId || DEFAULT_PROFILE_ID,
                  autoSave: migratedState.autoSave !== undefined ? migratedState.autoSave : true,
                  migrationPending: false,
                  migrationInProgress: false
                });
                
                // Update storage with new version
                const newData = {
                  ...parsedData,
                  version: 4,
                  state: migratedState
                };
                await storageAdapter.set(storageKey, newData);
                
                console.log('[ProfileStore] Migration completed successfully');
              } else {
                console.log('[ProfileStore] Migration returned no profiles, keeping current state');
                set({ migrationPending: false, migrationInProgress: false });
              }
            } else {
              console.log('[ProfileStore] No migration needed, already at version', currentVersion);
              set({ migrationPending: false, migrationInProgress: false });
            }
          } else {
            console.log('[ProfileStore] No stored data found, skipping migration');
            set({ migrationPending: false, migrationInProgress: false });
          }
        } catch (error) {
          console.error('[ProfileStore] Migration failed:', error);
        } finally {
          set({ migrationInProgress: false, migrationPending: false });
        }
      }
    }),
    {
      name: 'grid-profile-storage',
      storage: profileStorageAdapter,
      version: 4,
      // DO NOT USE migrate - it's causing the profiles to be lost
      // migrate: (persistedState: unknown, version: number) => {
      //   // Migration is causing profiles to be lost
      //   return persistedState;
      // },
      // Handle rehydration properly
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('[ProfileStore] Rehydration error:', error);
            return;
          }
          
          if (!state) {
            console.error('[ProfileStore] No state in rehydration callback');
            return;
          }
          
          // Check localStorage directly to ensure we have all profiles
          const stored = localStorage.getItem('grid-profile-storage');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const storedProfiles = parsed.state?.profiles || [];
              
              // If localStorage has more profiles, use those
              if (storedProfiles.length > state.profiles.length) {
                state.profiles = storedProfiles;
                state.activeProfileId = parsed.state?.activeProfileId || storedProfiles[0].id;
              }
            } catch (e) {
              console.error('[ProfileStore] Error checking localStorage during rehydration:', e);
            }
          }
          
          // Mark as hydrated
          state.setHasHydrated(true);
          
          // Only add default profile if we truly have no profiles
          if (state.profiles.length === 0) {
            const defaultProfile = createDefaultProfile();
            state.profiles = [defaultProfile];
            state.activeProfileId = DEFAULT_PROFILE_ID;
          } else {
            // Ensure the default profile exists
            if (!state.profiles.find(p => p.id === DEFAULT_PROFILE_ID)) {
              state.profiles.unshift(createDefaultProfile());
            }
            
            // Ensure activeProfileId is valid
            if (!state.profiles.find(p => p.id === state.activeProfileId)) {
              state.activeProfileId = state.profiles[0].id;
            }
          }
        };
      },
      // Only persist essential data
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        autoSave: state.autoSave
      })
    }
  )
);

// Convenience hooks
export const useProfiles = () => useProfileStore(state => state.profiles);
export const useActiveProfile = () => {
  // perfMonitor.mark('profile-load-start');
  const activeProfileId = useProfileStore(state => state.activeProfileId);
  const profile = useProfileStore(state => 
    state.profiles.find(p => p.id === activeProfileId)
  );
  // perfMonitor.mark('profile-load-end');
  // perfMonitor.measure('profileLoadTime', 'profile-load-start', 'profile-load-end');
  return profile;
};

// Hook to check if store has hydrated
export const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = React.useState(false);
  
  React.useEffect(() => {
    const unsubscribe = useProfileStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    
    // Check if already hydrated
    if (useProfileStore.getState()._hasHydrated) {
      setHasHydrated(true);
    }
    
    return unsubscribe;
  }, []);
  
  return hasHydrated;
};

// Perform migration on idle - TEMPORARILY DISABLED FOR DEBUGGING
if (typeof window !== 'undefined') {
  console.log('[ProfileStore] Migration check disabled for debugging');
  // const store = useProfileStore.getState();
  // 
  // if ('requestIdleCallback' in window) {
  //   requestIdleCallback(() => {
  //     if (store.migrationPending) {
  //       store.performDeferredMigration();
  //     }
  //   }, { timeout: 5000 });
  // } else {
  //   setTimeout(() => {
  //     if (store.migrationPending) {
  //       store.performDeferredMigration();
  //     }
  //   }, 2000);
  // }
}