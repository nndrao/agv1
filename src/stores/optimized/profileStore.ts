import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ColumnState, FilterModel, SortModelItem } from 'ag-grid-community';
import { storageAdapter } from '@/lib/storage/storageAdapter';

// Simplified profile structure
export interface Profile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  
  // Core grid state
  gridState: {
    columnState: ColumnState[];
    filterModel: FilterModel;
    sortModel: SortModelItem[];
  };
  
  // Column customizations (lightweight)
  columnCustomizations: Record<string, any>;
  
  // Grid options
  gridOptions: Record<string, any>;
}

interface ProfileStore {
  // State
  profiles: Profile[];
  activeProfileId: string | null;
  
  // Profile management
  createProfile: (name: string) => Profile;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  
  // Grid state management
  saveGridState: (state: Profile['gridState']) => void;
  saveColumnCustomizations: (customizations: Record<string, any>) => void;
  saveGridOptions: (options: Record<string, any>) => void;
  
  // Utilities
  getActiveProfile: () => Profile | null;
  exportProfiles: () => string;
  importProfiles: (data: string) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      
      createProfile: (name: string) => {
        const newProfile: Profile = {
          id: `profile-${Date.now()}`,
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          gridState: {
            columnState: [],
            filterModel: {},
            sortModel: [],
          },
          columnCustomizations: {},
          gridOptions: {},
        };
        
        set(state => ({
          profiles: [...state.profiles, newProfile],
          activeProfileId: newProfile.id,
        }));
        
        return newProfile;
      },
      
      updateProfile: (id: string, updates: Partial<Profile>) => {
        set(state => ({
          profiles: state.profiles.map(profile =>
            profile.id === id
              ? { ...profile, ...updates, updatedAt: Date.now() }
              : profile
          ),
        }));
      },
      
      deleteProfile: (id: string) => {
        set(state => {
          const newProfiles = state.profiles.filter(p => p.id !== id);
          const newActiveId = state.activeProfileId === id
            ? newProfiles[0]?.id || null
            : state.activeProfileId;
          
          return {
            profiles: newProfiles,
            activeProfileId: newActiveId,
          };
        });
      },
      
      setActiveProfile: (id: string) => {
        set({ activeProfileId: id });
      },
      
      saveGridState: (gridState: Profile['gridState']) => {
        const { activeProfileId, profiles } = get();
        if (!activeProfileId) return;
        
        set({
          profiles: profiles.map(profile =>
            profile.id === activeProfileId
              ? { ...profile, gridState, updatedAt: Date.now() }
              : profile
          ),
        });
      },
      
      saveColumnCustomizations: (customizations: Record<string, any>) => {
        const { activeProfileId, profiles } = get();
        if (!activeProfileId) return;
        
        set({
          profiles: profiles.map(profile =>
            profile.id === activeProfileId
              ? { 
                  ...profile, 
                  columnCustomizations: { ...profile.columnCustomizations, ...customizations },
                  updatedAt: Date.now() 
                }
              : profile
          ),
        });
      },
      
      saveGridOptions: (options: Record<string, any>) => {
        const { activeProfileId, profiles } = get();
        if (!activeProfileId) return;
        
        set({
          profiles: profiles.map(profile =>
            profile.id === activeProfileId
              ? { 
                  ...profile, 
                  gridOptions: { ...profile.gridOptions, ...options },
                  updatedAt: Date.now() 
                }
              : profile
          ),
        });
      },
      
      getActiveProfile: () => {
        const { profiles, activeProfileId } = get();
        return profiles.find(p => p.id === activeProfileId) || null;
      },
      
      exportProfiles: () => {
        const { profiles } = get();
        return JSON.stringify(profiles, null, 2);
      },
      
      importProfiles: (data: string) => {
        try {
          const imported = JSON.parse(data);
          if (Array.isArray(imported)) {
            set({ profiles: imported });
          }
        } catch (error) {
          console.error('Failed to import profiles:', error);
          throw new Error('Invalid profile data');
        }
      },
    }),
    {
      name: 'agv1-profiles-optimized',
      storage: {
        getItem: async (name: string) => {
          const value = await storageAdapter.get(name);
          return value;
        },
        setItem: async (name: string, value: any) => {
          await storageAdapter.set(name, value);
        },
        removeItem: async (name: string) => {
          await storageAdapter.remove(name);
        },
      } as any,
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
      }),
    }
  )
);