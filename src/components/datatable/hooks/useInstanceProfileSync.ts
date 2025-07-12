import { useCallback } from 'react';
import { useInstanceProfile } from '../ProfileStoreProvider';
import { GridProfile } from '@/stores/profile.store';
import { ColumnDef } from '../types';

/**
 * Custom hook for handling profile synchronization with the grid
 * Uses instance-specific profile store
 */
export function useInstanceProfileSync(
  setCurrentColumnDefs: (columns: ColumnDef[]) => void,
  setSelectedFont: (font: string) => void,
  setSelectedFontSize?: (size: string) => void,
  onDatasourceChange?: (datasourceId: string | undefined) => void
) {
  const getColumnDefs = useInstanceProfile((state) => state.getColumnDefs);
  
  const handleProfileChange = useCallback((profile: GridProfile) => {
    console.log('[useInstanceProfileSync] handleProfileChange:', {
      profileId: profile.id,
      profileName: profile.name,
      hasFont: !!profile.gridOptions?.font,
      font: profile.gridOptions?.font,
      hasFontSize: !!profile.gridOptions?.fontSize,
      fontSize: profile.gridOptions?.fontSize,
      hasDatasource: !!profile.datasourceId,
      datasourceId: profile.datasourceId
    });
    
    // Handle datasource change if callback provided
    if (onDatasourceChange) {
      console.log('[useInstanceProfileSync] Updating datasource from profile:', profile.datasourceId);
      onDatasourceChange(profile.datasourceId);
    }
    
    // Get column definitions from profile store (already processed)
    const profileColumnDefs = getColumnDefs(profile.id);
    
    if (profileColumnDefs && profileColumnDefs.length > 0) {
      console.log('[useInstanceProfileSync] Updating currentColumnDefs from profile:', {
        profileName: profile.name,
        columnCount: profileColumnDefs.length
      });
      
      setCurrentColumnDefs(profileColumnDefs as ColumnDef[]);
    } else {
      // Note: In the refactored version, we should get default columns from context
      console.log('[useInstanceProfileSync] No columns in profile, keeping current columns');
    }
    
    // Apply font from profile or reset to default
    setSelectedFont(profile.gridOptions?.font || 'monospace');
    
    // Apply font size from profile or reset to default
    if (setSelectedFontSize) {
      setSelectedFontSize(profile.gridOptions?.fontSize || '13');
    }
    
    // The profile manager component handles applying the grid state to the grid API using the optimizer
  }, [getColumnDefs, setCurrentColumnDefs, setSelectedFont, setSelectedFontSize, onDatasourceChange]);
  
  return {
    handleProfileChange,
  };
}