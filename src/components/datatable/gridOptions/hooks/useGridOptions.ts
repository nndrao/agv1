import { useCallback, useEffect, useState } from 'react';
import { GridOptionsConfig } from '../types';
import { useProfileStore } from '../../stores/profile.store';
import { useToast } from '@/hooks/use-toast';

interface UseGridOptionsReturn {
  gridOptions: GridOptionsConfig;
  updateGridOptions: (options: GridOptionsConfig) => void;
  applyGridOptions: (api: any) => void;
  hasUnsavedChanges: boolean;
  saveToProfile: () => void;
  resetToProfile: () => void;
}

export const useGridOptions = (gridApi?: any): UseGridOptionsReturn => {
  const { toast } = useToast();
  const getActiveProfile = useProfileStore(state => state.getActiveProfile);
  const saveGridOptions = useProfileStore(state => state.saveGridOptions);
  const [localOptions, setLocalOptions] = useState<GridOptionsConfig>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get current grid options from profile
  const activeProfile = getActiveProfile();
  const profileOptions: GridOptionsConfig = activeProfile?.gridOptions || {};

  // Initialize local options from profile
  useEffect(() => {
    setLocalOptions(profileOptions);
    setHasUnsavedChanges(false);
  }, [activeProfile?.id]);

  // Update grid options
  const updateGridOptions = useCallback((options: GridOptionsConfig) => {
    setLocalOptions(options);
    
    // Check if there are changes compared to profile
    const hasChanges = Object.keys(options).some(
      key => options[key as keyof GridOptionsConfig] !== profileOptions[key as keyof GridOptionsConfig]
    );
    setHasUnsavedChanges(hasChanges);
  }, [profileOptions]);

  // Apply grid options to AG-Grid
  const applyGridOptions = useCallback((api: any) => {
    if (!api) return;

    console.log('[useGridOptions] Applying grid options to grid:', {
      optionsCount: Object.keys(localOptions).length,
      options: localOptions
    });

    // Apply each option to the grid
    Object.entries(localOptions).forEach(([key, value]) => {
      if (value === undefined) return;

      switch (key) {
        // Size options
        case 'headerHeight':
          api.setGridOption('headerHeight', value);
          break;
        case 'rowHeight':
          api.setGridOption('rowHeight', value);
          break;
        case 'floatingFiltersHeight':
          api.setGridOption('floatingFiltersHeight', value);
          break;
        case 'groupHeaderHeight':
          api.setGridOption('groupHeaderHeight', value);
          break;
        
        // Behavior options
        case 'animateRows':
          api.setGridOption('animateRows', value);
          break;
        case 'pagination':
          api.setGridOption('pagination', value);
          break;
        case 'paginationPageSize':
          if (localOptions.pagination) {
            api.setGridOption('paginationPageSize', value);
          }
          break;
        case 'paginationPageSizeSelector':
          if (localOptions.pagination && Array.isArray(value)) {
            api.setGridOption('paginationPageSizeSelector', value);
          }
          break;
        
        // Selection options
        case 'rowSelection':
          api.setGridOption('rowSelection', value);
          break;
        case 'suppressRowDeselection':
          api.setGridOption('suppressRowDeselection', value);
          break;
        case 'suppressRowClickSelection':
          api.setGridOption('suppressRowClickSelection', value);
          break;
        case 'enableRangeSelection':
          api.setGridOption('enableRangeSelection', value);
          break;
        
        // Edit options
        case 'editType':
          api.setGridOption('editType', value);
          break;
        case 'singleClickEdit':
          api.setGridOption('singleClickEdit', value);
          break;
        case 'stopEditingWhenCellsLoseFocus':
          api.setGridOption('stopEditingWhenCellsLoseFocus', value);
          break;
        
        // Other options
        case 'enableRtl':
          api.setGridOption('enableRtl', value);
          break;
        case 'domLayout':
          api.setGridOption('domLayout', value);
          break;
        case 'rowBuffer':
          api.setGridOption('rowBuffer', value);
          break;
        case 'suppressColumnVirtualisation':
          api.setGridOption('suppressColumnVirtualisation', value);
          break;
        case 'suppressRowVirtualisation':
          api.setGridOption('suppressRowVirtualisation', value);
          break;
        
        // Row grouping options
        case 'groupDefaultExpanded':
        case 'groupMaintainOrder':
        case 'groupSelectsChildren':
        case 'groupIncludeFooter':
        case 'groupIncludeTotalFooter':
        case 'groupSuppressAutoColumn':
        case 'groupRemoveSingleChildren':
        case 'groupRemoveLowestSingleChildren':
        case 'groupDisplayType':
        case 'groupRowsSticky':
        case 'rowGroupPanelShow':
        case 'suppressRowGroupHidesColumns':
        case 'suppressMakeColumnVisibleAfterUnGroup':
          api.setGridOption(key, value);
          break;
          
        // Interaction options
        case 'rowDragManaged':
        case 'rowDragEntireRow':
        case 'rowDragMultiRow':
        case 'suppressMoveWhenRowDragging':
          api.setGridOption(key, value);
          break;
        
        // Clipboard options
        case 'copyHeadersToClipboard':
        case 'copyGroupHeadersToClipboard':
        case 'clipboardDelimiter':
        case 'suppressCopyRowsToClipboard':
        case 'suppressCopySingleCellRanges':
          api.setGridOption(key, value);
          break;
          
        // Tooltip options
        case 'tooltipShowDelay':
        case 'tooltipHideDelay':
        case 'tooltipMouseTrack':
          api.setGridOption(key, value);
          break;
        
        // Sidebar options
        case 'sideBar':
          // Handle boolean to object conversion for sidebar
          if (typeof value === 'boolean') {
            if (value) {
              // Show default sidebar with columns and filters panels
              api.setGridOption('sideBar', {
                toolPanels: [
                  {
                    id: 'columns',
                    labelDefault: 'Columns',
                    labelKey: 'columns',
                    iconKey: 'columns',
                    toolPanel: 'agColumnsToolPanel',
                  },
                  {
                    id: 'filters',
                    labelDefault: 'Filters',
                    labelKey: 'filters',
                    iconKey: 'filter',
                    toolPanel: 'agFiltersToolPanel',
                  },
                ],
              });
            } else {
              // Hide sidebar
              api.setGridOption('sideBar', false);
            }
          }
          break;
        case 'suppressMenuHide':
          api.setGridOption(key, value);
          break;
          
        // Status bar - skip individual panel options, they're handled below
        case 'statusBarPanelTotalAndFiltered':
        case 'statusBarPanelTotalRows':
        case 'statusBarPanelFilteredRows':
        case 'statusBarPanelSelectedRows':
        case 'statusBarPanelAggregation':
          // These are handled in the status bar construction below
          break;
        
        // UI preferences (font is not an AG-Grid option, handled separately)
        case 'font':
          // Font is handled by the parent component through callbacks
          console.log('[useGridOptions] Font change will be handled by parent component');
          break;
          
        // Add more options as needed
        default:
          // Try to set any other option directly
          try {
            api.setGridOption(key, value);
          } catch (e) {
            console.warn(`Failed to set grid option ${key}:`, e);
          }
      }
    });

    // Only refresh specific aspects based on what changed
    const needsLayoutRefresh = Object.keys(localOptions).some(key => 
      ['rowHeight', 'headerHeight', 'floatingFiltersHeight', 'groupHeaderHeight', 'domLayout'].includes(key)
    );
    
    if (needsLayoutRefresh) {
      // For height changes, we need to reset row heights
      if ('rowHeight' in localOptions) {
        api.resetRowHeights();
      }
      // Redraw rows for layout changes
      api.redrawRows();
    } else {
      // For other changes, use refreshCells without force to preserve styles
      // This will only refresh cells that have actually changed
      api.refreshCells();
    }
    
    // Note: Removed auto-sizing columns to preserve user's column widths
    // The user's saved column widths should be respected, not auto-sized
    
    // Handle status bar configuration based on enabled panels
    if ('statusBar' in localOptions || 
        'statusBarPanelTotalAndFiltered' in localOptions ||
        'statusBarPanelTotalRows' in localOptions ||
        'statusBarPanelFilteredRows' in localOptions ||
        'statusBarPanelSelectedRows' in localOptions ||
        'statusBarPanelAggregation' in localOptions) {
      
      const showStatusBar = localOptions.statusBar ?? false;
      
      if (showStatusBar) {
        // Build status panels array based on enabled options
        const statusPanels = [];
        
        // Total and Filtered Row Count (combined panel)
        if (localOptions.statusBarPanelTotalAndFiltered !== false) {
          statusPanels.push({
            statusPanel: 'agTotalAndFilteredRowCountComponent',
            align: 'left'
          });
        }
        
        // Total Row Count (separate panel)
        if (localOptions.statusBarPanelTotalRows === true) {
          statusPanels.push({
            statusPanel: 'agTotalRowCountComponent',
            align: 'center'
          });
        }
        
        // Filtered Row Count (separate panel)
        if (localOptions.statusBarPanelFilteredRows === true) {
          statusPanels.push({
            statusPanel: 'agFilteredRowCountComponent',
            align: 'center'
          });
        }
        
        // Selected Row Count
        if (localOptions.statusBarPanelSelectedRows !== false) {
          statusPanels.push({
            statusPanel: 'agSelectedRowCountComponent',
            align: 'center'
          });
        }
        
        // Aggregation Panel (sum, avg, min, max, count)
        if (localOptions.statusBarPanelAggregation !== false) {
          statusPanels.push({
            statusPanel: 'agAggregationComponent',
            align: 'right'
          });
        }
        
        // Apply the status bar configuration
        if (statusPanels.length > 0) {
          api.setGridOption('statusBar', { statusPanels });
        } else {
          // If no panels are enabled, hide the status bar
          api.setGridOption('statusBar', false);
        }
      } else {
        // Hide status bar
        api.setGridOption('statusBar', false);
      }
    }
  }, [localOptions]);

  // Save to profile
  const saveToProfile = useCallback(() => {
    const currentActiveProfile = getActiveProfile();
    
    if (!currentActiveProfile) {
      toast({
        title: 'No active profile',
        description: 'Please select a profile to save grid options.',
        variant: 'destructive',
      });
      return;
    }

    console.log('[useGridOptions] Saving grid options to profile:', {
      profileId: currentActiveProfile.id,
      gridOptionsCount: Object.keys(localOptions).length
    });

    // Use the new saveGridOptions method
    saveGridOptions(localOptions);

    setHasUnsavedChanges(false);

    toast({
      title: 'Grid options saved',
      description: `Options saved to "${currentActiveProfile.name}" profile.`,
    });
  }, [getActiveProfile, localOptions, saveGridOptions, toast]);

  // Reset to profile
  const resetToProfile = useCallback(() => {
    setLocalOptions(profileOptions);
    setHasUnsavedChanges(false);
    
    // Apply to grid if available
    if (gridApi) {
      applyGridOptions(gridApi);
    }

    toast({
      title: 'Grid options reset',
      description: 'Options have been reset to profile values.',
    });
  }, [profileOptions, gridApi, applyGridOptions, toast]);

  // Apply options when grid API becomes available
  useEffect(() => {
    if (gridApi) {
      applyGridOptions(gridApi);
    }
  }, [gridApi, applyGridOptions]);

  return {
    gridOptions: localOptions,
    updateGridOptions,
    applyGridOptions,
    hasUnsavedChanges,
    saveToProfile,
    resetToProfile
  };
};