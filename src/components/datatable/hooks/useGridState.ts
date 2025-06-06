import { useState, useCallback } from 'react';
import { useProfileStore, useActiveProfile } from '@/stores/profile.store';
import { ColumnDef } from '../types';

/**
 * Custom hook for managing DataTable grid state
 */
export function useGridState(initialColumnDefs: ColumnDef[]) {
  const activeProfile = useActiveProfile();
  const { getColumnDefs } = useProfileStore();
  
  // Initialize font from active profile
  const [selectedFont, setSelectedFont] = useState(() => {
    return activeProfile?.gridState?.font || 'monospace';
  });
  
  // Dialog visibility
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  
  // Initialize column definitions from profile or use defaults
  const [currentColumnDefs, setCurrentColumnDefs] = useState<ColumnDef[]>(() => {
    // Try to get column definitions from profile (will use lightweight format if available)
    const savedColumnDefs = getColumnDefs();
    
    if (savedColumnDefs && savedColumnDefs.length > 0) {
      console.log('[useGridState] Initializing with saved columnDefs from profile:', {
        profileName: activeProfile?.name,
        columnCount: savedColumnDefs.length,
        hasLightweightFormat: !!(activeProfile?.gridState?.columnCustomizations),
        columnsWithFormatters: savedColumnDefs.filter((col: any) => col.valueFormatter).length,
      });
      
      return savedColumnDefs as ColumnDef[];
    }
    
    console.log('[useGridState] Initializing with default columnDefs');
    return initialColumnDefs;
  });
  
  // Font change handler
  const handleFontChange = useCallback((font: string) => {
    setSelectedFont(font);
    // Font changes are only saved when Save Profile button is clicked
  }, []);
  
  // Update column definitions
  const updateColumnDefs = useCallback((columns: ColumnDef[]) => {
    setCurrentColumnDefs(columns);
  }, []);
  
  return {
    // State
    currentColumnDefs,
    selectedFont,
    showColumnDialog,
    
    // Actions
    setCurrentColumnDefs: updateColumnDefs,
    setSelectedFont: handleFontChange,
    setShowColumnDialog,
  };
}