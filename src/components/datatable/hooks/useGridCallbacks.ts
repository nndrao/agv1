import { useCallback, useMemo } from 'react';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { useActiveProfile, useProfileStore } from '@/components/datatable/stores/profile.store';
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
  const getContextMenuItems = useCallback((params: any): any => {
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
      hasGridState: !!activeProfile?.gridState,
      hasGridOptions: !!activeProfile?.gridOptions,
      hasColumnSettings: !!activeProfile?.columnSettings
    });
    
    // Load active profile on grid ready - FOLLOW SAME ORDER AS PROFILE SWITCH
    if (activeProfile) {
      console.log('[useGridCallbacks] Applying active profile on grid ready:', {
        profileId: activeProfile.id,
        profileName: activeProfile.name,
        hasColumnState: !!activeProfile.gridState?.columnState,
        columnStateLength: activeProfile.gridState?.columnState?.length
      });
      
      try {
        // CRITICAL: Apply in the same order as ProfileManager does
        
        // 1. Apply grid options FIRST (row height, header height, etc)
        if (activeProfile.gridOptions) {
          console.log('[useGridCallbacks] Step 1: Applying grid options');
          const options = activeProfile.gridOptions;
          
          // Apply each grid option
          Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined && key !== 'font') {
              try {
                params.api.setGridOption(key as any, value);
              } catch (e) {
                console.warn(`[useGridCallbacks] Failed to set grid option ${key}:`, e);
              }
            }
          });
          
          // Reset row heights if row height was changed
          if (options.rowHeight) {
            params.api.resetRowHeights();
          }
        }
        
        // 2. Get and apply column definitions from profile (includes customizations)
        const { getColumnDefs } = useProfileStore.getState();
        const profileColumnDefs = getColumnDefs(activeProfile.id);
        
        if (profileColumnDefs && profileColumnDefs.length > 0) {
          console.log('[useGridCallbacks] Step 2: Setting column definitions from profile:', {
            columnCount: profileColumnDefs.length,
            hasCustomizations: profileColumnDefs.some((col: any) => col.cellStyle || col.valueFormatter)
          });
          
          // This will trigger the grid to use the profile's column definitions
          // instead of the default ones, preventing auto-sizing
          params.api.setGridOption('columnDefs', profileColumnDefs);
          
          // Small delay to ensure column definitions are processed
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // 3. Apply grid state (column state, filters, sorts) with delays
        setTimeout(() => {
          if (activeProfile.gridState) {
            // Apply column state (width, visibility, order)
            if (activeProfile.gridState.columnState && activeProfile.gridState.columnState.length > 0) {
              console.log('[useGridCallbacks] Step 3a: Applying column state');
              params.api.applyColumnState({
                state: activeProfile.gridState.columnState,
                applyOrder: true
              });
            }
            
            // Apply filter model
            setTimeout(() => {
              if (activeProfile.gridState.filterModel) {
                console.log('[useGridCallbacks] Step 3b: Applying filter model');
                params.api.setFilterModel(activeProfile.gridState.filterModel);
              }
              
              // Apply sort model
              setTimeout(() => {
                if (activeProfile.gridState.sortModel && activeProfile.gridState.sortModel.length > 0) {
                  console.log('[useGridCallbacks] Step 3c: Applying sort model');
                  const sortState = activeProfile.gridState.sortModel.map(sort => ({
                    colId: sort.colId,
                    sort: sort.sort,
                    sortIndex: sort.sortIndex
                  }));
                  params.api.applyColumnState({ state: sortState });
                }
              }, 50);
            }, 50);
          }
        }, 100);
        
        // 4. Apply font
        if (activeProfile.gridOptions?.font) {
          console.log('[useGridCallbacks] Step 4: Applying font:', activeProfile.gridOptions.font);
          setSelectedFont(activeProfile.gridOptions.font);
        }
        
        console.log('[useGridCallbacks] Profile applied successfully');
      } catch (error) {
        console.error('[useGridCallbacks] Error applying profile:', error);
      }
    } else {
      console.log('[useGridCallbacks] No active profile to apply');
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