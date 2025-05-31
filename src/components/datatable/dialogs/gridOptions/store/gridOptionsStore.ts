import { create } from 'zustand';
import { DEFAULT_GRID_OPTIONS } from '../constants/defaultOptions';
import { GridOptionsProfile } from '../types';
import { isEqual, debounce } from 'lodash';

interface GridOptionsState {
  // Current options
  options: Record<string, any>;
  
  // Options that have been changed from defaults
  changedOptions: Record<string, any>;
  
  // Profiles
  profiles: GridOptionsProfile[];
  activeProfileId: string | null;
  
  // Actions
  initializeOptions: (currentOptions: Record<string, any>) => void;
  updateOption: (key: string, value: any) => void;
  updateMultipleOptions: (updates: Record<string, any>) => void;
  getModifiedCount: () => number;
  getCategoryModifiedCount: (keys: string[]) => number;
  isOptionModified: (key: string) => boolean;
  resetOption: (key: string) => void;
  resetAllOptions: () => void;
  resetCategoryOptions: (keys: string[]) => void;
  
  // Profile management
  loadProfiles: () => void;
  saveProfiles: () => void;
  createProfile: (name: string, description?: string) => void;
  updateProfile: (id: string, updates: Partial<GridOptionsProfile>) => void;
  deleteProfile: (id: string) => void;
  applyProfile: (id: string) => void;
  saveProfile: (id: string) => void;
  exportProfile: (id: string) => string | null;
  importProfile: (profileData: string) => boolean;
}

const STORAGE_KEY = 'grid-options-profiles';

// Helper to deep merge objects
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Calculate diff between two objects
function getDiff(obj1: any, obj2: any): Record<string, any> {
  const diff: Record<string, any> = {};
  
  Object.keys(obj2).forEach(key => {
    if (!isEqual(obj1[key], obj2[key])) {
      diff[key] = obj2[key];
    }
  });
  
  return diff;
}

export const useGridOptionsStore = create<GridOptionsState>((set, get) => ({
  options: { ...DEFAULT_GRID_OPTIONS },
  changedOptions: {},
  profiles: [],
  activeProfileId: null,
  
  initializeOptions: (currentOptions) => {
    const mergedOptions = deepMerge(DEFAULT_GRID_OPTIONS, currentOptions);
    const changedOptions = getDiff(DEFAULT_GRID_OPTIONS, mergedOptions);
    
    set({
      options: mergedOptions,
      changedOptions
    });
    
    // Load profiles
    get().loadProfiles();
  },
  
  updateOption: (key, value) => {
    const { options, changedOptions } = get();
    const newOptions = { ...options, [key]: value };
    
    // Check if value is different from default
    const isChanged = !isEqual(DEFAULT_GRID_OPTIONS[key], value);
    
    const newChangedOptions = { ...changedOptions };
    if (isChanged) {
      newChangedOptions[key] = value;
    } else {
      delete newChangedOptions[key];
    }
    
    set({
      options: newOptions,
      changedOptions: newChangedOptions
    });
  },
  
  updateMultipleOptions: (updates) => {
    const { options, changedOptions } = get();
    const newOptions = { ...options, ...updates };
    
    const newChangedOptions = { ...changedOptions };
    Object.keys(updates).forEach(key => {
      const isChanged = !isEqual(DEFAULT_GRID_OPTIONS[key], updates[key]);
      if (isChanged) {
        newChangedOptions[key] = updates[key];
      } else {
        delete newChangedOptions[key];
      }
    });
    
    set({
      options: newOptions,
      changedOptions: newChangedOptions
    });
  },
  
  getModifiedCount: () => {
    return Object.keys(get().changedOptions).length;
  },
  
  getCategoryModifiedCount: (keys) => {
    const { changedOptions } = get();
    return keys.filter(key => key in changedOptions).length;
  },
  
  isOptionModified: (key) => {
    return key in get().changedOptions;
  },
  
  resetOption: (key) => {
    const { options, changedOptions } = get();
    const newOptions = { ...options, [key]: DEFAULT_GRID_OPTIONS[key] };
    const newChangedOptions = { ...changedOptions };
    delete newChangedOptions[key];
    
    set({
      options: newOptions,
      changedOptions: newChangedOptions
    });
  },
  
  resetAllOptions: () => {
    set({
      options: { ...DEFAULT_GRID_OPTIONS },
      changedOptions: {}
    });
  },
  
  resetCategoryOptions: (keys) => {
    const { options, changedOptions } = get();
    const newOptions = { ...options };
    const newChangedOptions = { ...changedOptions };
    
    keys.forEach(key => {
      newOptions[key] = DEFAULT_GRID_OPTIONS[key];
      delete newChangedOptions[key];
    });
    
    set({
      options: newOptions,
      changedOptions: newChangedOptions
    });
  },
  
  // Profile management
  loadProfiles: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const profiles = JSON.parse(stored);
        set({ profiles });
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  },
  
  saveProfiles: debounce(() => {
    try {
      const { profiles } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  }, 500),
  
  createProfile: (name, description) => {
    const { profiles, changedOptions } = get();
    const newProfile: GridOptionsProfile = {
      id: `profile-${Date.now()}`,
      name,
      description,
      options: { ...changedOptions },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    set({ profiles: [...profiles, newProfile] });
    get().saveProfiles();
  },
  
  updateProfile: (id, updates) => {
    const { profiles } = get();
    const newProfiles = profiles.map(profile =>
      profile.id === id
        ? { ...profile, ...updates, updatedAt: Date.now() }
        : profile
    );
    
    set({ profiles: newProfiles });
    get().saveProfiles();
  },
  
  deleteProfile: (id) => {
    const { profiles } = get();
    set({ profiles: profiles.filter(p => p.id !== id) });
    get().saveProfiles();
  },
  
  applyProfile: (id) => {
    const { profiles } = get();
    const profile = profiles.find(p => p.id === id);
    
    if (profile) {
      const mergedOptions = deepMerge(DEFAULT_GRID_OPTIONS, profile.options);
      set({
        options: mergedOptions,
        changedOptions: profile.options,
        activeProfileId: id
      });
    }
  },
  
  saveProfile: (id) => {
    const { profiles, changedOptions } = get();
    const profileIndex = profiles.findIndex(p => p.id === id);
    
    if (profileIndex !== -1) {
      const newProfiles = [...profiles];
      newProfiles[profileIndex] = {
        ...newProfiles[profileIndex],
        options: { ...changedOptions },
        updatedAt: Date.now()
      };
      
      set({ profiles: newProfiles });
      get().saveProfiles();
    }
  },
  
  exportProfile: (id) => {
    const { profiles } = get();
    const profile = profiles.find(p => p.id === id);
    
    if (profile) {
      return JSON.stringify(profile, null, 2);
    }
    return null;
  },
  
  importProfile: (profileData) => {
    try {
      const profile = JSON.parse(profileData);
      if (profile && profile.name && profile.options) {
        const { profiles } = get();
        const newProfile: GridOptionsProfile = {
          ...profile,
          id: `profile-${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        set({ profiles: [...profiles, newProfile] });
        get().saveProfiles();
        return true;
      }
    } catch (error) {
      console.error('Failed to import profile:', error);
    }
    return false;
  }
}));