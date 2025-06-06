import { useCallback, useMemo } from 'react';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { profileOptimizer } from '@/lib/profile-optimizer';
import { useActiveProfile } from '@/stores/profile.store';

/**
 * Custom hook for memoized grid callbacks to prevent unnecessary re-renders
 */
export function useGridCallbacks(
  gridApiRef: React.MutableRefObject<GridApi | null>,
  setSelectedFont: (font: string) => void
) {
  const activeProfile = useActiveProfile();
  
  // Context menu items - memoized as they never change
  const getContextMenuItems = useCallback(() => {
    return [
      "autoSizeAll",
      "resetColumns",
      "separator",
      "copy",
      "copyWithHeaders",
      "paste",
      "separator",
      "export",
    ];
  }, []);
  
  // Grid ready handler
  const onGridReady = useCallback(async (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    
    console.log('[useGridCallbacks] onGridReady:', {
      hasActiveProfile: !!activeProfile,
      activeProfileId: activeProfile?.id,
      activeProfileName: activeProfile?.name,
      hasGridState: !!activeProfile?.gridState
    });
    
    // Load active profile on grid ready using the optimizer
    if (activeProfile && activeProfile.gridState) {
      // The column definitions are already set in the grid from the initial state
      // Just apply the grid states (column state, filters, sorts)
      await profileOptimizer.applyProfile(
        params.api,
        activeProfile,
        null, // No previous profile on initial load
        {
          showTransition: false, // No transition on initial load
          onProgress: (progress) => {
            console.log(`[useGridCallbacks] Initial profile load progress: ${Math.round(progress * 100)}%`);
          }
        }
      );
      
      // Apply font immediately (doesn't depend on grid state)
      if (activeProfile.gridState.font) {
        console.log('[useGridCallbacks] Applying font:', activeProfile.gridState.font);
        setSelectedFont(activeProfile.gridState.font);
      }
    } else {
      console.log('[useGridCallbacks] No active profile or gridState to apply');
    }
  }, [activeProfile, setSelectedFont]);
  
  // Column event handlers - no auto-save, only saved when Save Profile button is clicked
  const onColumnMoved = useCallback(() => {
    // State changes are only saved when Save Profile button is clicked
  }, []);
  
  const onColumnResized = useCallback(() => {
    // State changes are only saved when Save Profile button is clicked
  }, []);
  
  const onColumnVisible = useCallback(() => {
    // State changes are only saved when Save Profile button is clicked
  }, []);
  
  const onToolPanelVisibleChanged = useCallback(() => {
    // State changes are only saved when Save Profile button is clicked
  }, []);
  
  const onSortChanged = useCallback(() => {
    // State changes are only saved when Save Profile button is clicked
  }, []);
  
  const onFilterChanged = useCallback(() => {
    // State changes are only saved when Save Profile button is clicked
  }, []);
  
  // Excel export styles
  const excelStyles = useMemo(() => [
    {
      id: 'header',
      font: { bold: true },
      alignment: { horizontal: 'Center' as const, vertical: 'Center' as const }
    },
    {
      id: 'ag-numeric-cell',
      alignment: { horizontal: 'Right' as const }
    },
    {
      id: 'ag-currency-cell',
      numberFormat: { format: '$#,##0.00' },
      alignment: { horizontal: 'Right' as const }
    },
    {
      id: 'ag-percentage-cell',
      numberFormat: { format: '0.00%' },
      alignment: { horizontal: 'Right' as const }
    }
  ], []);
  
  // Default Excel export params
  const defaultExcelExportParams = useMemo(() => ({
    // Apply column formatting to Excel export
    processCellCallback: (params: any) => {
      const colDef = params.column.getColDef();
      // Use valueFormatter for export if available
      if (colDef.valueFormatter) {
        return typeof colDef.valueFormatter === 'function'
          ? colDef.valueFormatter(params)
          : params.value;
      }
      return params.value;
    },
    // Include column headers with formatting
    processHeaderCallback: (params: any) => {
      return params.column.getColDef().headerName || params.column.getColId();
    }
  }), []);
  
  return {
    // Event handlers
    getContextMenuItems,
    onGridReady,
    onColumnMoved,
    onColumnResized,
    onColumnVisible,
    onToolPanelVisibleChanged,
    onSortChanged,
    onFilterChanged,
    
    // Export configuration
    excelStyles,
    defaultExcelExportParams,
  };
}