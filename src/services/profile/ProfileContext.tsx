/**
 * ProfileContext
 * 
 * React Context for providing ProfileManagementService throughout the app.
 * Includes provider component and hooks for accessing the service.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ProfileManagementService, ProfileServiceEvent, ProfileServiceEventListener } from './ProfileManagementService';
import { GridProfile } from '../../components/datatable/types';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter';

/**
 * Profile context state
 */
export interface ProfileContextState {
  // Service instance
  service: ProfileManagementService;
  
  // Current state
  profiles: GridProfile[];
  activeProfileId: string;
  activeProfile: GridProfile | null;
  
  // Loading/error state
  isLoading: boolean;
  error: Error | null;
  
  // Actions (convenience wrappers)
  createProfile: (name: string, description?: string, cloneFromId?: string) => Promise<GridProfile>;
  updateProfile: (profileId: string, updates: Partial<GridProfile>) => Promise<GridProfile>;
  deleteProfile: (profileId: string) => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  duplicateProfile: (profileId: string, newName: string) => Promise<GridProfile>;
  importProfile: (profileData: GridProfile) => Promise<GridProfile>;
  exportProfile: (profileId: string) => Promise<GridProfile>;
  refreshProfiles: () => Promise<void>;
}

/**
 * Profile context
 */
const ProfileContext = createContext<ProfileContextState | null>(null);

/**
 * Profile provider props
 */
export interface ProfileProviderProps {
  children: React.ReactNode;
  storageAdapter?: LocalStorageAdapter;
  autoInitialize?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Profile provider component
 */
export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
  storageAdapter,
  autoInitialize = true,
  onError
}) => {
  // Create service instance
  const service = useMemo(() => {
    return new ProfileManagementService({
      storageAdapter: storageAdapter || new LocalStorageAdapter(),
      autoMigrate: true,
      validateOnSave: true
    });
  }, [storageAdapter]);

  // State
  const [profiles, setProfiles] = useState<GridProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [activeProfile, setActiveProfile] = useState<GridProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load profiles
  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [loadedProfiles, loadedActiveId] = await Promise.all([
        service.getProfiles(),
        service.getActiveProfileId()
      ]);
      
      setProfiles(loadedProfiles);
      setActiveProfileId(loadedActiveId);
      
      const active = loadedProfiles.find(p => p.id === loadedActiveId) || null;
      setActiveProfile(active);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load profiles');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize service and load profiles
  useEffect(() => {
    if (autoInitialize) {
      service.initialize()
        .then(() => loadProfiles())
        .catch(err => {
          const error = err instanceof Error ? err : new Error('Failed to initialize profile service');
          setError(error);
          onError?.(error);
          setIsLoading(false);
        });
    }
  }, [service, autoInitialize]);

  // Subscribe to service events
  useEffect(() => {
    const handleEvent: ProfileServiceEventListener = (event: ProfileServiceEvent) => {
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
          }
          break;
          
        case 'profile-deleted':
          setProfiles(prev => prev.filter(p => p.id !== event.profileId));
          break;
          
        case 'active-profile-changed':
          setActiveProfileId(event.profileId);
          const newActive = profiles.find(p => p.id === event.profileId) || null;
          setActiveProfile(newActive);
          break;
          
        case 'profiles-imported':
          // Reload all profiles after import
          loadProfiles();
          break;
          
        case 'storage-error':
          setError(event.error);
          onError?.(event.error);
          break;
      }
    };

    return service.addEventListener(handleEvent);
  }, [service, activeProfileId, profiles, onError]);

  // Context value with convenience methods
  const contextValue: ProfileContextState = useMemo(() => ({
    service,
    profiles,
    activeProfileId,
    activeProfile,
    isLoading,
    error,
    
    // Convenience wrappers that handle state updates
    createProfile: async (name: string, description?: string, cloneFromId?: string) => {
      try {
        setError(null);
        const profile = await service.createProfile(name, description, cloneFromId);
        return profile;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create profile');
        setError(error);
        onError?.(error);
        throw error;
      }
    },
    
    updateProfile: async (profileId: string, updates: Partial<GridProfile>) => {
      try {
        setError(null);
        const profile = await service.updateProfile(profileId, updates);
        return profile;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update profile');
        setError(error);
        onError?.(error);
        throw error;
      }
    },
    
    deleteProfile: async (profileId: string) => {
      try {
        setError(null);
        await service.deleteProfile(profileId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete profile');
        setError(error);
        onError?.(error);
        throw error;
      }
    },
    
    setActiveProfile: async (profileId: string) => {
      try {
        setError(null);
        await service.setActiveProfile(profileId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to set active profile');
        setError(error);
        onError?.(error);
        throw error;
      }
    },
    
    duplicateProfile: async (profileId: string, newName: string) => {
      try {
        setError(null);
        const profile = await service.duplicateProfile(profileId, newName);
        return profile;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to duplicate profile');
        setError(error);
        onError?.(error);
        throw error;
      }
    },
    
    importProfile: async (profileData: GridProfile) => {
      try {
        setError(null);
        const profile = await service.importProfile(profileData);
        return profile;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to import profile');
        setError(error);
        onError?.(error);
        throw error;
      }
    },
    
    exportProfile: async (profileId: string) => {
      try {
        setError(null);
        const profile = await service.exportProfile(profileId);
        return profile;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to export profile');
        setError(error);
        onError?.(error);
        throw error;
      }
    },
    
    refreshProfiles: async () => {
      await loadProfiles();
    }
  }), [service, profiles, activeProfileId, activeProfile, isLoading, error, onError]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

/**
 * Hook to access profile context
 */
export const useProfileContext = (): ProfileContextState => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};

/**
 * Hook to access just the profile service
 */
export const useProfileService = (): ProfileManagementService => {
  const context = useProfileContext();
  return context.service;
};

/**
 * Hook to access profiles
 */
export const useProfiles = () => {
  const context = useProfileContext();
  return {
    profiles: context.profiles,
    isLoading: context.isLoading,
    error: context.error
  };
};

/**
 * Hook to access active profile
 */
export const useActiveProfile = () => {
  const context = useProfileContext();
  return {
    activeProfile: context.activeProfile,
    activeProfileId: context.activeProfileId,
    setActiveProfile: context.setActiveProfile
  };
};

/**
 * Hook for profile CRUD operations
 */
export const useProfileOperations = () => {
  const context = useProfileContext();
  return {
    createProfile: context.createProfile,
    updateProfile: context.updateProfile,
    deleteProfile: context.deleteProfile,
    duplicateProfile: context.duplicateProfile,
    importProfile: context.importProfile,
    exportProfile: context.exportProfile
  };
};