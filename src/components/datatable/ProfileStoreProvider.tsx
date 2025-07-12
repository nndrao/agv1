import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreApi } from 'zustand';
import { createInstanceProfileStore, type ProfileStore } from '@/stores/profile.store';

// Context to hold the instance-specific store
const ProfileStoreContext = createContext<StoreApi<ProfileStore> | null>(null);

// Map to cache stores by instanceId to avoid recreating them
const storeCache = new Map<string, StoreApi<ProfileStore>>();

interface ProfileStoreProviderProps {
  instanceId: string;
  children: React.ReactNode;
}

/**
 * Provider component that creates and provides an instance-specific profile store
 * Each DataTable instance gets its own isolated profile store
 */
export const ProfileStoreProvider: React.FC<ProfileStoreProviderProps> = ({ 
  instanceId, 
  children 
}) => {
  // Get or create store for this instance
  const [store] = useState(() => {
    // Check if store already exists in cache
    let existingStore = storeCache.get(instanceId);
    if (existingStore) {
      return existingStore;
    }
    
    // Create new store for this instance
    const newStore = createInstanceProfileStore(instanceId);
    storeCache.set(instanceId, newStore);
    return newStore;
  });

  // Cleanup on unmount - but keep store in cache for remounting
  useEffect(() => {
    return () => {
      // Optional: Remove from cache after some delay if needed
      // This allows for quick remounting without losing state
    };
  }, [instanceId]);

  return (
    <ProfileStoreContext.Provider value={store}>
      {children}
    </ProfileStoreContext.Provider>
  );
};

/**
 * Hook to access the instance-specific profile store
 * Must be used within ProfileStoreProvider
 */
export const useInstanceProfileStore = () => {
  const store = useContext(ProfileStoreContext);
  if (!store) {
    throw new Error('useInstanceProfileStore must be used within ProfileStoreProvider');
  }
  return store;
};

/**
 * Hook to use the instance profile store with a selector
 * Similar to useProfileStore but instance-scoped
 */
export function useInstanceProfile<T>(
  selector: (state: ProfileStore) => T
): T {
  const store = useInstanceProfileStore();
  // Use the zustand hook pattern
  // Cast store to the expected hook type
  return React.useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}