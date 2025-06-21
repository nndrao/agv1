/**
 * useProfileManagement Hook
 * 
 * A comprehensive hook for managing grid profiles with all CRUD operations,
 * state management, and utility functions.
 */

import { useCallback, useEffect, useState } from 'react';
import { ProfileManagementService, ExportedProfile, ProfileServiceEvent } from './ProfileManagementService';
import { GridProfile } from '../../components/datatable/types';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter';

/**
 * Hook options
 */
export interface UseProfileManagementOptions {
  service?: ProfileManagementService;
  autoLoad?: boolean;
  onError?: (error: Error) => void;
  onProfileChange?: (profile: GridProfile | null) => void;
}

/**
 * Hook return type
 */
export interface UseProfileManagementReturn {
  // State
  profiles: GridProfile[];
  activeProfile: GridProfile | null;
  activeProfileId: string;
  isLoading: boolean;
  error: Error | null;
  
  // Profile operations
  createProfile: (name: string, description?: string, cloneFromId?: string) => Promise<GridProfile>;
  updateProfile: (profileId: string, updates: Partial<GridProfile>) => Promise<GridProfile>;
  deleteProfile: (profileId: string) => Promise<void>;
  renameProfile: (profileId: string, newName: string) => Promise<GridProfile>;
  duplicateProfile: (profileId: string, newName: string) => Promise<GridProfile>;
  setActiveProfile: (profileId: string) => Promise<void>;
  
  // Import/Export
  importProfile: (profileData: GridProfile | ExportedProfile, options?: { setAsActive?: boolean }) => Promise<GridProfile>;
  exportProfile: (profileId: string) => Promise<ExportedProfile>;
  exportAllProfiles: () => Promise<ExportedProfile[]>;
  importFromJson: (jsonString: string) => Promise<{ imported: GridProfile[]; failed: any[] }>;
  exportToJson: (profileIds?: string[]) => Promise<string>;
  
  // Utility functions
  refreshProfiles: () => Promise<void>;
  validateProfile: (profile: GridProfile) => { valid: boolean; errors: string[]; warnings: string[] };
  getProfileById: (profileId: string) => GridProfile | undefined;
  hasUnsavedChanges: (profileId: string) => boolean;
  
  // Service access
  service: ProfileManagementService;
}

/**
 * useProfileManagement Hook
 */
export function useProfileManagement(options: UseProfileManagementOptions = {}): UseProfileManagementReturn {
  // Initialize service
  const service = options.service || new ProfileManagementService({
    storageAdapter: new LocalStorageAdapter(),
    autoMigrate: true,
    validateOnSave: true
  });

  // State
  const [profiles, setProfiles] = useState<GridProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [activeProfile, setActiveProfile] = useState<GridProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());

  // Load profiles from service
  const loadProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize service if needed
      await service.initialize();
      
      // Load data
      const [loadedProfiles, loadedActiveId] = await Promise.all([
        service.getProfiles(),
        service.getActiveProfileId()
      ]);
      
      setProfiles(loadedProfiles);
      setActiveProfileId(loadedActiveId);
      
      // Find and set active profile
      const active = loadedProfiles.find(p => p.id === loadedActiveId) || null;
      setActiveProfile(active);
      
      // Notify callback
      options.onProfileChange?.(active);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load profiles');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [service, options]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadProfiles();
    }
  }, [loadProfiles, options.autoLoad]);

  // Subscribe to service events
  useEffect(() => {
    const handleEvent = (event: ProfileServiceEvent) => {
      switch (event.type) {
        case 'profile-created':
          setProfiles(prev => [...prev, event.profile]);
          break;
          
        case 'profile-updated':
          setProfiles(prev => prev.map(p => 
            p.id === event.profile.id ? event.profile : p
          ));
          if (event.profile.id === activeProfileId) {
            setActiveProfile(event.profile);
            options.onProfileChange?.(event.profile);
          }
          // Clear unsaved changes for this profile
          setUnsavedChanges(prev => {
            const next = new Set(prev);
            next.delete(event.profile.id);
            return next;
          });
          break;
          
        case 'profile-deleted':
          setProfiles(prev => prev.filter(p => p.id !== event.profileId));
          if (event.profileId === activeProfileId) {
            // Active profile was deleted, load new active
            service.getActiveProfileId().then(newActiveId => {
              setActiveProfileId(newActiveId);
              const newActive = profiles.find(p => p.id === newActiveId) || null;
              setActiveProfile(newActive);
              options.onProfileChange?.(newActive);
            });
          }
          // Clear unsaved changes for this profile
          setUnsavedChanges(prev => {
            const next = new Set(prev);
            next.delete(event.profileId);
            return next;
          });
          break;
          
        case 'active-profile-changed':
          setActiveProfileId(event.profileId);
          const newActive = profiles.find(p => p.id === event.profileId) || null;
          setActiveProfile(newActive);
          options.onProfileChange?.(newActive);
          break;
          
        case 'profiles-imported':
          // Reload all profiles after import
          loadProfiles();
          break;
          
        case 'storage-error':
          setError(event.error);
          options.onError?.(event.error);
          break;
      }
    };

    return service.addEventListener(handleEvent);
  }, [service, activeProfileId, profiles, loadProfiles, options]);

  // Wrapped operations with error handling
  const createProfile = useCallback(async (
    name: string, 
    description?: string, 
    cloneFromId?: string
  ): Promise<GridProfile> => {
    try {
      setError(null);
      const profile = await service.createProfile(name, description, cloneFromId);
      return profile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create profile');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const updateProfile = useCallback(async (
    profileId: string, 
    updates: Partial<GridProfile>
  ): Promise<GridProfile> => {
    try {
      setError(null);
      const profile = await service.updateProfile(profileId, updates);
      return profile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const deleteProfile = useCallback(async (profileId: string): Promise<void> => {
    try {
      setError(null);
      await service.deleteProfile(profileId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete profile');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const renameProfile = useCallback(async (
    profileId: string, 
    newName: string
  ): Promise<GridProfile> => {
    try {
      setError(null);
      const profile = await service.renameProfile(profileId, newName);
      return profile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to rename profile');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const duplicateProfile = useCallback(async (
    profileId: string, 
    newName: string
  ): Promise<GridProfile> => {
    try {
      setError(null);
      const profile = await service.duplicateProfile(profileId, newName);
      return profile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to duplicate profile');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const setActiveProfile = useCallback(async (profileId: string): Promise<void> => {
    try {
      setError(null);
      await service.setActiveProfile(profileId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set active profile');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const importProfile = useCallback(async (
    profileData: GridProfile | ExportedProfile,
    importOptions?: { setAsActive?: boolean }
  ): Promise<GridProfile> => {
    try {
      setError(null);
      const profile = await service.importProfile(profileData, {
        generateNewId: true,
        setAsActive: importOptions?.setAsActive,
        validateBeforeImport: true
      });
      return profile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to import profile');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const exportProfile = useCallback(async (profileId: string): Promise<ExportedProfile> => {
    try {
      setError(null);
      const profile = await service.exportProfile(profileId);
      return profile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to export profile');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const exportAllProfiles = useCallback(async (): Promise<ExportedProfile[]> => {
    try {
      setError(null);
      const profiles = await service.exportProfiles();
      return profiles;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to export profiles');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const importFromJson = useCallback(async (
    jsonString: string
  ): Promise<{ imported: GridProfile[]; failed: any[] }> => {
    try {
      setError(null);
      const result = await service.importFromJson(jsonString, {
        generateNewIds: true,
        skipInvalid: true
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to import from JSON');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const exportToJson = useCallback(async (profileIds?: string[]): Promise<string> => {
    try {
      setError(null);
      const json = await service.exportToJson(profileIds);
      return json;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to export to JSON');
      setError(error);
      options.onError?.(error);
      throw error;
    }
  }, [service, options]);

  const refreshProfiles = useCallback(async (): Promise<void> => {
    await loadProfiles();
  }, [loadProfiles]);

  const validateProfile = useCallback((profile: GridProfile) => {
    return service.validateProfile(profile);
  }, [service]);

  const getProfileById = useCallback((profileId: string): GridProfile | undefined => {
    return profiles.find(p => p.id === profileId);
  }, [profiles]);

  const hasUnsavedChanges = useCallback((profileId: string): boolean => {
    return unsavedChanges.has(profileId);
  }, [unsavedChanges]);

  return {
    // State
    profiles,
    activeProfile,
    activeProfileId,
    isLoading,
    error,
    
    // Profile operations
    createProfile,
    updateProfile,
    deleteProfile,
    renameProfile,
    duplicateProfile,
    setActiveProfile,
    
    // Import/Export
    importProfile,
    exportProfile,
    exportAllProfiles,
    importFromJson,
    exportToJson,
    
    // Utility functions
    refreshProfiles,
    validateProfile,
    getProfileById,
    hasUnsavedChanges,
    
    // Service access
    service
  };
}

/**
 * Convenience hook for just the active profile
 */
export function useActiveProfileOnly() {
  const { activeProfile, activeProfileId, setActiveProfile, isLoading, error } = useProfileManagement({
    autoLoad: true
  });
  
  return {
    profile: activeProfile,
    profileId: activeProfileId,
    setProfile: setActiveProfile,
    isLoading,
    error
  };
}

/**
 * Convenience hook for profile CRUD operations only
 */
export function useProfileCrud() {
  const {
    createProfile,
    updateProfile,
    deleteProfile,
    renameProfile,
    duplicateProfile,
    error
  } = useProfileManagement({
    autoLoad: false // Don't load all profiles if just doing CRUD
  });
  
  return {
    create: createProfile,
    update: updateProfile,
    delete: deleteProfile,
    rename: renameProfile,
    duplicate: duplicateProfile,
    error
  };
}