import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ColDef, ColumnState, FilterModel, SortModelItem } from 'ag-grid-community';
import { ColumnCustomization, serializeColumnCustomizations, deserializeColumnCustomizations } from './column-serializer';
import { perfMonitor } from '@/lib/performance-monitor';

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
  gridState: {
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
  
  // Auto-save
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  
  // Migration
  performDeferredMigration: () => Promise<void>;
}

// Default profile ID
const DEFAULT_PROFILE_ID = 'default-profile';

// Create default profile
const createDefaultProfile = (): GridProfile => ({
  id: DEFAULT_PROFILE_ID,
  name: 'Default',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isDefault: true,
  gridState: {
    columnCustomizations: {},
    columnState: [],
    filterModel: {},
    sortModel: []
  }
});

// Deferred migration function
async function performMigration(state: PersistedState): Promise<PersistedState> {
  perfMonitor.mark('migration-start');
  
  let newState = { ...state };
  
  // Migrate from version 1 to 2 (clean invalid properties)
  if (state.profiles && Array.isArray(state.profiles)) {
    newState.profiles = state.profiles.map((profile: GridProfile) => {
      const newProfile = { ...profile };
      
      if (profile.gridState && profile.gridState.columnDefs) {
        // Clean invalid properties from each column definition
        newProfile.gridState.columnDefs = profile.gridState.columnDefs.map((col: ColDef) => {
          const cleaned = { ...col };
          // Remove invalid properties that AG-Grid doesn't recognize
          delete cleaned.valueFormat;
          delete cleaned._hasFormatter;
          delete cleaned.excelFormat;
          return cleaned;
        });
      }
      
      // Convert headerStyle objects to new format
      if (newProfile.gridState && newProfile.gridState.columnDefs) {
        newProfile.gridState.columnDefs = newProfile.gridState.columnDefs.map((col: ColDef) => {
          if (col.headerStyle && typeof col.headerStyle === 'object' && !col.headerStyle._isHeaderStyleConfig) {
            // Convert old format to new format
            col.headerStyle = {
              _isHeaderStyleConfig: true,
              regular: col.headerStyle,
              floating: null
            };
          }
          return col;
        });
      }
      
      // Convert to lightweight format if needed
      if (newProfile.gridState && newProfile.gridState.columnDefs && 
          newProfile.gridState.columnDefs.length > 0 && 
          !newProfile.gridState.columnCustomizations) {
        
        const baseColumns = newProfile.gridState.columnDefs.map((col: ColDef) => ({
          field: col.field,
          headerName: col.field,
          cellDataType: col.cellDataType
        }));
        
        const customizations = serializeColumnCustomizations(newProfile.gridState.columnDefs, baseColumns);
        
        console.log('[ProfileStore Migration] Converting profile to lightweight format:', {
          profileId: newProfile.id,
          profileName: newProfile.name,
          originalSize: JSON.stringify(newProfile.gridState.columnDefs).length,
          newSize: JSON.stringify(customizations).length,
          reduction: `${Math.round((1 - JSON.stringify(customizations).length / JSON.stringify(newProfile.gridState.columnDefs).length) * 100)}%`
        });
        
        // Update to new format
        newProfile.gridState.columnCustomizations = customizations;
        newProfile.gridState.baseColumnDefs = baseColumns;
        // Remove legacy columnDefs after migration
        delete newProfile.gridState.columnDefs;
      }
      
      return newProfile;
    });
  }
  
  perfMonitor.mark('migration-end');
  perfMonitor.measure('migrationTime', 'migration-start', 'migration-end');
  
  return newState;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      // Initial state
      profiles: [createDefaultProfile()],
      activeProfileId: DEFAULT_PROFILE_ID,
      autoSave: true,
      migrationPending: false,
      migrationInProgress: false,
      
      // Create new profile
      createProfile: (name, description) => {
        const state = get();
        
        // Get the default profile to clone its grid state
        const defaultProfile = state.profiles.find(p => p.id === DEFAULT_PROFILE_ID);
        
        const newProfile: GridProfile = {
          id: `profile-${Date.now()}`,
          name,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          gridState: defaultProfile?.gridState ? {
            // Clone the default profile's grid state using new lightweight format
            columnCustomizations: { ...(defaultProfile.gridState.columnCustomizations || {}) },
            baseColumnDefs: [...(defaultProfile.gridState.baseColumnDefs || [])],
            columnState: [...(defaultProfile.gridState.columnState || [])],
            filterModel: {},  // Start with no filters
            sortModel: []     // Start with no sorting
          } : {
            // Fallback to empty state if default profile not found
            columnCustomizations: {},
            baseColumnDefs: [],
            columnState: [],
            filterModel: {},
            sortModel: []
          }
        };
        
        console.log('[ProfileStore] Creating new profile with default state:', {
          profileName: name,
          defaultProfileFound: !!defaultProfile,
          customizationsCount: Object.keys(newProfile.gridState.columnCustomizations || {}).length
        });
        
        set(state => ({
          profiles: [...state.profiles, newProfile]
        }));
        
        return newProfile;
      },
      
      // Update existing profile
      updateProfile: (profileId, updates) => {
        console.log('[ProfileStore] updateProfile called:', {
          profileId,
          updates,
          hasGridState: !!updates.gridState,
          columnDefsCount: updates.gridState?.columnDefs?.length
        });
        
        set(state => {
          const updatedProfiles = state.profiles.map(profile => {
            if (profile.id === profileId) {
              const updatedProfile = {
                ...profile,
                ...updates,
                updatedAt: Date.now(),
                gridState: updates.gridState
                  ? {
                      ...profile.gridState,
                      ...updates.gridState
                    }
                  : profile.gridState
              };
              console.log('[ProfileStore] Profile updated:', {
                profileId,
                profileName: updatedProfile.name,
                columnDefsCount: updatedProfile.gridState?.columnDefs?.length,
                hasColumnState: !!updatedProfile.gridState?.columnState
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
        const { activeProfileId } = get();
        
        // Cannot delete default profile
        if (profileId === DEFAULT_PROFILE_ID) {
          console.warn('Cannot delete default profile');
          return;
        }
        
        // If deleting active profile, switch to default
        if (profileId === activeProfileId) {
          set({ activeProfileId: DEFAULT_PROFILE_ID });
        }
        
        set(state => ({
          profiles: state.profiles.filter(p => p.id !== profileId)
        }));
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
        
        console.log('[ProfileStore] getActiveProfile:', {
          activeProfileId,
          found: !!activeProfile,
          profileName: activeProfile?.name,
          hasGridState: !!activeProfile?.gridState,
          columnDefsCount: activeProfile?.gridState?.columnDefs?.length
        });
        
        return activeProfile;
      },
      
      // Duplicate profile
      duplicateProfile: (profileId, newName) => {
        const { profiles } = get();
        const sourceProfile = profiles.find(p => p.id === profileId);
        
        if (!sourceProfile) {
          throw new Error(`Profile ${profileId} not found`);
        }
        
        const duplicatedProfile: GridProfile = {
          ...JSON.parse(JSON.stringify(sourceProfile)), // Deep clone
          id: `profile-${Date.now()}`,
          name: newName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
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
      
      // Save current state to active profile
      saveCurrentState: (gridState) => {
        const { activeProfileId, profiles } = get();
        const activeProfile = profiles.find(p => p.id === activeProfileId);
        
        console.log('[ProfileStore] saveCurrentState called:', {
          activeProfileId,
          hasActiveProfile: !!activeProfile,
          gridStateKeys: Object.keys(gridState),
          columnDefsCount: gridState.columnDefs?.length,
          columnStateCount: gridState.columnState?.length
        });
        
        if (!activeProfile) {
          console.warn('[ProfileStore] No active profile found for saving');
          return;
        }
        
        // If columnDefs are provided, convert to lightweight format
        if (gridState.columnDefs) {
          const baseColumns = activeProfile.gridState.baseColumnDefs || [];
          const customizations = serializeColumnCustomizations(gridState.columnDefs, baseColumns);
          
          console.log('[ProfileStore] Converting columnDefs to lightweight format:', {
            columnDefsCount: gridState.columnDefs.length,
            customizationsCount: Object.keys(customizations).length,
            sizeReduction: `${Math.round((1 - JSON.stringify(customizations).length / JSON.stringify(gridState.columnDefs).length) * 100)}%`
          });
          
          get().updateProfile(activeProfileId, {
            gridState: {
              ...activeProfile.gridState,
              ...gridState,
              columnCustomizations: customizations,
              // Keep base columns for reference (only update if not set)
              baseColumnDefs: activeProfile.gridState.baseColumnDefs || gridState.columnDefs,
              // Remove full columnDefs to save space
              columnDefs: undefined
            }
          });
        } else {
          get().updateProfile(activeProfileId, {
            gridState: {
              ...activeProfile.gridState,
              ...gridState
            }
          });
        }
      },
      
      // Save column customizations in lightweight format
      saveColumnCustomizations: (columnDefs, baseColumnDefs) => {
        const { activeProfileId } = get();
        const activeProfile = get().getActiveProfile();
        
        if (!activeProfile) {
          console.warn('[ProfileStore] No active profile found for saving column customizations');
          return;
        }
        
        const customizations = serializeColumnCustomizations(
          columnDefs, 
          baseColumnDefs || activeProfile.gridState.baseColumnDefs || columnDefs
        );
        
        console.log('[ProfileStore] Saving column customizations:', {
          profileId: activeProfileId,
          customizationsCount: Object.keys(customizations).length,
          size: `${(JSON.stringify(customizations).length / 1024).toFixed(2)}KB`
        });
        
        get().updateProfile(activeProfileId, {
          gridState: {
            ...activeProfile.gridState,
            columnCustomizations: customizations,
            baseColumnDefs: baseColumnDefs || activeProfile.gridState.baseColumnDefs || columnDefs,
            // Remove legacy full columnDefs
            columnDefs: undefined
          }
        });
      },
      
      // Get column definitions (reconstruct from lightweight format if needed)
      getColumnDefs: (profileId) => {
        const { profiles, activeProfileId } = get();
        const id = profileId || activeProfileId;
        const profile = profiles.find(p => p.id === id);
        
        if (!profile) return undefined;
        
        // If we have the new lightweight format
        if (profile.gridState.columnCustomizations && profile.gridState.baseColumnDefs) {
          console.log('[ProfileStore] Reconstructing columnDefs from lightweight format');
          return deserializeColumnCustomizations(
            profile.gridState.columnCustomizations,
            profile.gridState.baseColumnDefs
          );
        }
        
        // Fall back to legacy format
        return profile.gridState.columnDefs;
      },
      
      // Auto-save settings
      setAutoSave: (enabled) => {
        set({ autoSave: enabled });
      },
      
      // Perform deferred migration
      performDeferredMigration: async () => {
        const state = get();
        if (state.migrationInProgress) return;
        
        set({ migrationInProgress: true });
        
        try {
          // Get the current persisted state
          const storageKey = 'grid-profile-storage';
          const stored = localStorage.getItem(storageKey);
          
          if (stored) {
            const parsedData = JSON.parse(stored);
            const currentVersion = parsedData.version || 1;
            
            if (currentVersion < 4) {
              console.log('[ProfileStore] Performing deferred migration from version', currentVersion);
              
              // Perform migration
              const migratedState = await performMigration(parsedData.state);
              
              // Update the store
              set({
                profiles: migratedState.profiles || [createDefaultProfile()],
                activeProfileId: migratedState.activeProfileId || DEFAULT_PROFILE_ID,
                autoSave: migratedState.autoSave !== undefined ? migratedState.autoSave : true,
                migrationPending: false,
                migrationInProgress: false
              });
              
              // Update localStorage with new version
              const newData = {
                ...parsedData,
                version: 4,
                state: migratedState
              };
              localStorage.setItem(storageKey, JSON.stringify(newData));
              
              console.log('[ProfileStore] Migration completed successfully');
            }
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
      version: 4,
      // Skip migration during initialization - will be done on demand
      migrate: (persistedState: PersistedState, version: number) => {
        if (version < 4) {
          // Mark that migration is needed but don't do it now
          console.log('[ProfileStore] Migration needed, will defer until after initialization');
          return {
            ...persistedState,
            migrationPending: true
          };
        }
        return persistedState;
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
  perfMonitor.mark('profile-load-start');
  const profile = useProfileStore(state => 
    state.profiles.find(p => p.id === state.activeProfileId)
  );
  perfMonitor.mark('profile-load-end');
  perfMonitor.measure('profileLoadTime', 'profile-load-start', 'profile-load-end');
  return profile;
};

// Perform migration on idle
if (typeof window !== 'undefined') {
  const store = useProfileStore.getState();
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      if (store.migrationPending) {
        store.performDeferredMigration();
      }
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      if (store.migrationPending) {
        store.performDeferredMigration();
      }
    }, 2000);
  }
}