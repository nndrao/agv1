import { useCallback } from 'react';
import { GridProfile, useProfileStore } from '@/stores/profile.store';
import { ColumnDef } from '../types';

/**
 * Custom hook for handling profile synchronization with the grid
 */
export function useProfileSync(
  setCurrentColumnDefs: (columns: ColumnDef[]) => void,
  setSelectedFont: (font: string) => void
) {
  const { getColumnDefs } = useProfileStore();
  
  const handleProfileChange = useCallback((profile: GridProfile) => {
    console.log('[useProfileSync] handleProfileChange:', {
      profileId: profile.id,
      profileName: profile.name,
      hasFont: !!profile.gridState.font,
      font: profile.gridState.font
    });
    
    // Get column definitions from profile store (already processed)
    const profileColumnDefs = getColumnDefs(profile.id);
    
    if (profileColumnDefs && profileColumnDefs.length > 0) {
      console.log('[useProfileSync] Updating currentColumnDefs from profile:', {
        profileName: profile.name,
        columnCount: profileColumnDefs.length
      });
      
      setCurrentColumnDefs(profileColumnDefs as ColumnDef[]);
    } else {
      // Note: In the refactored version, we should get default columns from context
      console.log('[useProfileSync] No columns in profile, keeping current columns');
    }
    
    // Apply font from profile or reset to default
    setSelectedFont(profile.gridState.font || 'monospace');
    
    // The profile manager component handles applying the grid state to the grid API using the optimizer
  }, [getColumnDefs, setCurrentColumnDefs, setSelectedFont]);
  
  return {
    handleProfileChange,
  };
}