import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ColDef, ColumnState, FilterModel, SortModelItem } from 'ag-grid-community';

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
    // Column definitions with all customizations
    columnDefs: ColDef[];
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
  
  // Auto-save
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
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
    columnDefs: [],
    columnState: [],
    filterModel: {},
    sortModel: []
  }
});

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      // Initial state
      profiles: [createDefaultProfile()],
      activeProfileId: DEFAULT_PROFILE_ID,
      autoSave: true,
      
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
            // Clone the default profile's grid state
            columnDefs: [...(defaultProfile.gridState.columnDefs || [])],
            columnState: [...(defaultProfile.gridState.columnState || [])],
            filterModel: {},  // Start with no filters
            sortModel: []     // Start with no sorting
          } : {
            // Fallback to empty state if default profile not found
            columnDefs: [],
            columnState: [],
            filterModel: {},
            sortModel: []
          }
        };
        
        console.log('[ProfileStore] Creating new profile with default state:', {
          profileName: name,
          defaultProfileFound: !!defaultProfile,
          columnDefsCount: newProfile.gridState.columnDefs.length
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
        
        get().updateProfile(activeProfileId, {
          gridState: {
            ...activeProfile.gridState,
            ...gridState
          }
        });
      },
      
      // Auto-save settings
      setAutoSave: (enabled) => {
        set({ autoSave: enabled });
      },
    }),
    {
      name: 'grid-profile-storage',
      version: 3, // Increment version to trigger migration for headerStyle format
      migrate: (persistedState: PersistedState, version: number) => {
        let state = persistedState;
        
        // Migrate from version 1 to 2 (clean invalid properties)
        if (version < 2) {
          state = { ...state };
          
          if (state.profiles && Array.isArray(state.profiles)) {
            state.profiles = state.profiles.map((profile: GridProfile) => {
              if (profile.gridState && profile.gridState.columnDefs) {
                // Clean invalid properties from each column definition
                profile.gridState.columnDefs = profile.gridState.columnDefs.map((col: ColDef) => {
                  const cleaned = { ...col };
                  // Remove invalid properties that AG-Grid doesn't recognize
                  delete cleaned.valueFormat;
                  delete cleaned._hasFormatter;
                  delete cleaned.excelFormat;
                  return cleaned;
                });
              }
              return profile;
            });
          }
        }
        
        // Migrate from version 2 to 3 (convert headerStyle to new format)
        if (version < 3) {
          state = { ...state };
          
          if (state.profiles && Array.isArray(state.profiles)) {
            state.profiles = state.profiles.map((profile: GridProfile) => {
              if (profile.gridState && profile.gridState.columnDefs) {
                // Convert headerStyle objects to new format
                profile.gridState.columnDefs = profile.gridState.columnDefs.map((col: ColDef) => {
                  if (col.headerStyle && typeof col.headerStyle === 'object' && !col.headerStyle._isHeaderStyleConfig) {
                    // Convert old format to new format
                    col.headerStyle = {
                      _isHeaderStyleConfig: true,
                      regular: col.headerStyle,
                      floating: null // Old format didn't support floating filter styles
                    };
                  }
                  return col;
                });
              }
              return profile;
            });
          }
        }
        
        return state;
      },
    }
  )
);

// Convenience hooks
export const useProfiles = () => useProfileStore(state => state.profiles);
export const useActiveProfile = () => useProfileStore(state => 
  state.profiles.find(p => p.id === state.activeProfileId)
);