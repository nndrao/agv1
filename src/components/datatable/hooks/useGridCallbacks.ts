import { useCallback, useMemo } from 'react';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { useActiveProfile } from '@/components/datatable/stores/profile.store';
import { useDataTableContext } from './useDataTableContext';

/**
 * Custom hook for memoized grid callbacks to prevent unnecessary re-renders
 */
export function useGridCallbacks(
  gridApiRef: React.MutableRefObject<GridApi | null>,
  setSelectedFont: (font: string) => void
) {
  const activeProfile = useActiveProfile();
  const { setGridApi } = useDataTableContext();
  
  // Context menu items - now includes Format Column option
  const getContextMenuItems = useCallback((params: any) => {
    const defaultItems = [
      "autoSizeAll",
      "resetColumns",
      "separator",
      "copy",
      "copyWithHeaders",
      "paste",
      "separator",
      "export",
    ];
    
    // Only add Format Column for column headers, not cell context menus
    if (params.column) {
      return [
        {
          name: 'Format Column',
          action: () => {
            // Dispatch custom event with column info and click position
            const event = new CustomEvent('format-column', {
              detail: {
                colId: params.column.getColId(),
                colDef: params.column.getColDef(),
                x: params.event?.clientX || 0,
                y: params.event?.clientY || 0
              }
            });
            window.dispatchEvent(event);
          },
          icon: '<span class="ag-icon ag-icon-columns" style="font-size: 14px;">🎨</span>'
        },
        "separator",
        ...defaultItems
      ];
    }
    
    return defaultItems;
  }, []);
  
  // Grid ready handler
  const onGridReady = useCallback(async (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    
    // Update the state version of gridApi for components that need it
    if (setGridApi) {
      setGridApi(params.api);
    }
    
    console.log('[useGridCallbacks] onGridReady:', {
      hasActiveProfile: !!activeProfile,
      activeProfileId: activeProfile?.id,
      activeProfileName: activeProfile?.name,
      hasGridState: !!activeProfile?.gridState
    });
    
    // Load active profile on grid ready - SIMPLIFIED APPROACH
    if (activeProfile && activeProfile.gridState) {
      console.log('[useGridCallbacks] Applying active profile on grid ready:', {
        profileId: activeProfile.id,
        profileName: activeProfile.name,
        hasColumnState: !!activeProfile.gridState.columnState,
        columnStateLength: activeProfile.gridState.columnState?.length
      });
      
      try {
        // Apply states in a deterministic order with proper timing
        
        // 1. Apply column state (visibility, width, position, sort)
        if (activeProfile.gridState.columnState && activeProfile.gridState.columnState.length > 0) {
          console.log('[useGridCallbacks] Applying column state');
          params.api.applyColumnState({
            state: activeProfile.gridState.columnState,
            applyOrder: true
          });
        }
        
        // 2. Apply filter model
        if (activeProfile.gridState.filterModel) {
          console.log('[useGridCallbacks] Applying filter model');
          params.api.setFilterModel(activeProfile.gridState.filterModel);
        }
        
        // 3. Apply grid options
        if (activeProfile.gridState.gridOptions) {
          console.log('[useGridCallbacks] Applying grid options');
          const options = activeProfile.gridState.gridOptions;
          if (options.rowHeight) {
            params.api.resetRowHeights();
            params.api.setGridOption('rowHeight', options.rowHeight);
          }
          if (options.headerHeight) {
            params.api.setGridOption('headerHeight', options.headerHeight);
          }
        }
        
        // 4. Apply font
        if (activeProfile.gridState.font) {
          console.log('[useGridCallbacks] Applying font:', activeProfile.gridState.font);
          setSelectedFont(activeProfile.gridState.font);
        }
        
        console.log('[useGridCallbacks] Profile applied successfully');
      } catch (error) {
        console.error('[useGridCallbacks] Error applying profile:', error);
      }
    } else {
      console.log('[useGridCallbacks] No active profile or gridState to apply');
    }
  }, [activeProfile, setSelectedFont, setGridApi]);
  
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