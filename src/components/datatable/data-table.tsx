import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModuleRegistry, themeQuartz, GridApi, ColDef as AgColDef } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { DataTableToolbar } from './data-table-toolbar';
import { useTheme } from '@/components/theme-provider';
import { ColumnCustomizationDialog } from './dialogs/columnSettings/ColumnCustomizationDialog';
import { useProfileStore, useActiveProfile, GridProfile } from '@/stores/profile.store';
import { DebugProfile } from './debug-profile';
import { useToast } from '@/hooks/use-toast';
import { createExcelFormatter } from './utils/formatters';
import './alignment-styles.css';
import './format-styles.css';

ModuleRegistry.registerModules([AllEnterpriseModule]);

// Interfaces for style configurations
interface HeaderStyleConfig {
  _isHeaderStyleConfig: boolean;
  regular?: React.CSSProperties;
  floating?: React.CSSProperties;
}

interface FormatterConfig {
  _isFormatterConfig: boolean;
  type: string;
  formatString?: string;
}

export interface ColumnDef extends Omit<AgColDef, 'field' | 'headerName' | 'type'> {
  field: string;
  headerName: string;
  type?: string | string[]; // For legacy/custom use, matching ag-grid's type
  cellDataType?: 'text' | 'number' | 'date' | 'boolean'; // ag-Grid v33+ optimization
}

interface DataTableProps {
  columnDefs: ColumnDef[];
  dataRow: Record<string, unknown>[];
}

// Function to set dark mode on document body for AG Grid
function setDarkMode(enabled: boolean) {
  document.body.dataset.agThemeMode = enabled ? "dark" : "light";
}

// Initialize AG Grid with dark mode by default
setDarkMode(true);

export function DataTable({ columnDefs, dataRow }: DataTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const { theme: currentTheme } = useTheme();
  const gridApiRef = useRef<GridApi | null>(null);
  const isDarkMode = currentTheme === 'dark';
  const { toast } = useToast();
  
  // Profile management - moved before state initialization
  const activeProfile = useActiveProfile();
  const { updateProfile } = useProfileStore();
  
  const [selectedFont, setSelectedFont] = useState(() => {
    // Initialize with saved font if available
    return activeProfile?.gridState?.font || 'monospace';
  });
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  
  // Keep track of column definitions with styles since AG-Grid doesn't return them
  const columnDefsWithStylesRef = useRef<ColumnDef[]>([]);
  
  const [currentColumnDefs, setCurrentColumnDefs] = useState<ColumnDef[]>(() => {
    // Initialize with saved column definitions if available
    if (activeProfile?.gridState?.columnDefs?.length > 0) {
      console.log('[DataTable] Initializing with saved columnDefs from profile:', {
        profileName: activeProfile.name,
        columnCount: activeProfile.gridState.columnDefs.length,
        sampleColumns: activeProfile.gridState.columnDefs.slice(0, 3).map(col => ({
          field: col.field,
          headerName: col.headerName,
          hasHeaderStyle: !!col.headerStyle,
          hasCellStyle: !!col.cellStyle,
          sortable: col.sortable,
          resizable: col.resizable,
          editable: col.editable
        }))
      });
      // Process column definitions to restore headerStyle functions
      const processed = activeProfile.gridState.columnDefs.map(col => {
        const processedCol = { ...col };
        
        // Clean invalid properties
        delete processedCol.valueFormat;
        delete processedCol._hasFormatter;
        delete processedCol.excelFormat;
        
        // Convert headerStyle objects back to functions
        if (processedCol.headerStyle) {
          if (typeof processedCol.headerStyle === 'object') {
            const styleConfig = processedCol.headerStyle as HeaderStyleConfig;
            
            // Check if it's our special format with regular/floating styles
            if (styleConfig._isHeaderStyleConfig) {
              console.log('[DataTable] Initial state - Converting headerStyle config for column:', {
                field: processedCol.field,
                hasRegular: !!styleConfig.regular,
                hasFloating: !!styleConfig.floating
              });
              
              processedCol.headerStyle = ((params: { floatingFilter?: boolean }) => {
                console.log('[DataTable] Initial headerStyle function called:', {
                  field: processedCol.field,
                  floatingFilter: params?.floatingFilter
                });
                
                if (params?.floatingFilter) {
                  return styleConfig.floating || null;
                }
                return styleConfig.regular || null;
              }) as AgColDef['headerStyle'];
            } else {
              // Legacy format - just a style object
              const styleObject = processedCol.headerStyle as React.CSSProperties;
              console.log('[DataTable] Initial state - Converting legacy headerStyle for column:', {
                field: processedCol.field,
                styleObject: styleObject
              });
              
              processedCol.headerStyle = ((params: { floatingFilter?: boolean }) => {
                if (!params?.floatingFilter) {
                  return styleObject;
                }
                return null;
              }) as AgColDef['headerStyle'];
            }
          }
        }
        
        // Recreate valueFormatter from saved config
        if (processedCol.valueFormatter && typeof processedCol.valueFormatter === 'object') {
          const formatterConfig = processedCol.valueFormatter as FormatterConfig;
          
          if (formatterConfig._isFormatterConfig && formatterConfig.type === 'excel' && formatterConfig.formatString) {
            console.log('[DataTable] Recreating valueFormatter from config:', {
              field: processedCol.field,
              formatString: formatterConfig.formatString
            });
            
            // Recreate the formatter function
            const formatter = createExcelFormatter(formatterConfig.formatString);
            processedCol.valueFormatter = formatter;
            processedCol.exportValueFormatter = formatter;
          } else {
            // Invalid formatter config, remove it
            delete processedCol.valueFormatter;
            delete processedCol.exportValueFormatter;
          }
        }
        
        return processedCol;
      });
      // Initialize the ref
      columnDefsWithStylesRef.current = processed;
      return processed;
    }
    console.log('[DataTable] Initializing with default columnDefs');
    columnDefsWithStylesRef.current = columnDefs;
    return columnDefs;
  });
  // Fixed spacing value of 6 (normal)
  const gridSpacing = 6;

  // Initialize default profile with column definitions if empty
  useEffect(() => {
    if (activeProfile && activeProfile.id === 'default-profile' && 
        (!activeProfile.gridState.columnDefs || activeProfile.gridState.columnDefs.length === 0)) {
      console.log('[DataTable] Initializing default profile with columnDefs:', {
        columnDefsCount: columnDefs.length,
        activeProfileId: activeProfile.id
      });
      updateProfile('default-profile', {
        gridState: {
          ...activeProfile.gridState,
          columnDefs: columnDefs
        }
      });
    }
  }, [activeProfile, columnDefs, updateProfile]);

  const theme = useMemo(() => {
    const lightTheme = {
      accentColor: "#8AAAA7",
      backgroundColor: "#F7F7F7",
      borderColor: "#23202029",
      browserColorScheme: "light",
      buttonBorderRadius: 2,
      cellTextColor: "#000000",
      checkboxBorderRadius: 2,
      columnBorder: true,
      fontFamily: selectedFont,
      fontSize: 14,
      headerBackgroundColor: "#EFEFEFD6",
      headerFontFamily: selectedFont,
      headerFontSize: 14,
      headerFontWeight: 500,
      iconButtonBorderRadius: 1,
      iconSize: 12,
      inputBorderRadius: 2,
      oddRowBackgroundColor: "#EEF1F1E8",
      spacing: gridSpacing,
      wrapperBorderRadius: 2,
    };

    const darkTheme = {
      accentColor: "#8AAAA7",
      backgroundColor: "#1f2836",
      borderRadius: 2,
      checkboxBorderRadius: 2,
      columnBorder: true,
      fontFamily: selectedFont,
      browserColorScheme: "dark",
      chromeBackgroundColor: {
        ref: "foregroundColor",
        mix: 0.07,
        onto: "backgroundColor",
      },
      fontSize: 14,
      foregroundColor: "#FFF",
      headerFontFamily: selectedFont,
      headerFontSize: 14,
      iconSize: 12,
      inputBorderRadius: 2,
      oddRowBackgroundColor: "#2A2E35",
      spacing: gridSpacing,
      wrapperBorderRadius: 2,
    };

    return themeQuartz
      .withParams(lightTheme, "light")
      .withParams(darkTheme, "dark");
  }, [selectedFont]);

  // Update AG Grid theme when app theme changes
  useEffect(() => {
    setDarkMode(isDarkMode);
  }, [isDarkMode]);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    filter: true,
    floatingFilter: true,
    enableValue: true,
    enableRowGroup: true,
    enablePivot: true,
    resizable: true,
    sortable: true,
    // Enable value formatter for Excel export by default
    useValueFormatterForExport: true,
  }), []);

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

  // Excel export configuration
  const excelStyles = useMemo(() => [
    {
      id: 'header',
      font: { bold: true },
      alignment: { horizontal: 'Center', vertical: 'Center' }
    },
    {
      id: 'ag-numeric-cell',
      alignment: { horizontal: 'Right' }
    },
    {
      id: 'ag-currency-cell',
      numberFormat: { format: '$#,##0.00' },
      alignment: { horizontal: 'Right' }
    },
    {
      id: 'ag-percentage-cell',
      numberFormat: { format: '0.00%' },
      alignment: { horizontal: 'Right' }
    }
  ], []);

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    if (gridApiRef.current) {
      gridApiRef.current.refreshCells({ force: true });
    }
    
    // Font changes are only saved when Save Profile button is clicked
  };

  // Function to apply grid states after column definitions
  const applyGridStates = useCallback((api: GridApi, gridState: Partial<GridProfile['gridState']>) => {
    console.log('[DataTable] Applying grid states after column customizations');
    
    // Apply states in a specific order with delays to ensure proper application
    setTimeout(() => {
      // 1. Apply column state (order, width, visibility)
      if (gridState.columnState) {
        console.log('[DataTable] Applying columnState:', {
          count: gridState.columnState.length
        });
        api.applyColumnState({
          state: gridState.columnState,
          applyOrder: true
        });
      }
      
      // 2. Apply filter model after column state
      setTimeout(() => {
        if (gridState.filterModel) {
          console.log('[DataTable] Applying filterModel:', {
            filterCount: Object.keys(gridState.filterModel).length
          });
          api.setFilterModel(gridState.filterModel);
        }
        
        // 3. Apply sort model after filters
        setTimeout(() => {
          if (gridState.sortModel) {
            console.log('[DataTable] Applying sortModel:', {
              sortCount: gridState.sortModel.length
            });
            api.applyColumnState({
              state: gridState.sortModel.map(sort => ({
                colId: sort.colId,
                sort: sort.sort,
                sortIndex: sort.sortIndex
              }))
            });
          }
          
          // 4. Final refresh to ensure everything is applied
          setTimeout(() => {
            console.log('[DataTable] Final refresh after all states applied');
            api.refreshCells({ force: true });
            api.refreshHeader();
            api.redrawRows();
            
            // Show success toast for profile application
            if (activeProfile) {
              toast({
                title: 'Profile loaded successfully',
                description: `Applied settings from "${activeProfile.name}" profile`,
              });
            }
          }, 50);
        }, 50);
      }, 50);
    }, 100); // Initial delay to ensure column definitions are fully applied
  }, [activeProfile, toast]);

  const handleProfileChange = useCallback((profile: GridProfile) => {
    console.log('[DataTable] handleProfileChange:', {
      profileId: profile.id,
      profileName: profile.name,
      hasFont: !!profile.gridState.font,
      font: profile.gridState.font,
      hasColumnDefs: !!profile.gridState.columnDefs,
      columnDefsCount: profile.gridState.columnDefs?.length
    });
    
    // IMPORTANT: Clear the column definitions ref to prevent old styles from persisting
    columnDefsWithStylesRef.current = [];
    
    // Apply column definitions from profile or reset to original if none
    if (profile.gridState.columnDefs && profile.gridState.columnDefs.length > 0) {
      console.log('[DataTable] Updating currentColumnDefs from profile:', {
        profileName: profile.name,
        columnCount: profile.gridState.columnDefs.length,
        sampleColumns: profile.gridState.columnDefs.slice(0, 3).map(col => ({
          field: col.field,
          headerName: col.headerName,
          hasHeaderStyle: !!col.headerStyle,
          hasCellStyle: !!col.cellStyle,
          sortable: col.sortable,
          resizable: col.resizable,
          editable: col.editable
        }))
      });
      
      // Process column definitions to restore headerStyle functions
      const processedDefs = profile.gridState.columnDefs.map(col => {
        const processedCol = { ...col };
        
        // Clean invalid properties
        delete processedCol.valueFormat;
        delete processedCol._hasFormatter;
        delete processedCol.excelFormat;
        
        // Convert headerStyle objects back to functions
        if (processedCol.headerStyle) {
          if (typeof processedCol.headerStyle === 'object') {
            const styleConfig = processedCol.headerStyle as HeaderStyleConfig;
            
            // Check if it's our special format with regular/floating styles
            if (styleConfig._isHeaderStyleConfig) {
              console.log('[DataTable] Profile change - Converting headerStyle config for column:', {
                field: processedCol.field,
                hasRegular: !!styleConfig.regular,
                hasFloating: !!styleConfig.floating
              });
              
              processedCol.headerStyle = ((params: { floatingFilter?: boolean }) => {
                if (params?.floatingFilter) {
                  return styleConfig.floating || null;
                }
                return styleConfig.regular || null;
              }) as AgColDef['headerStyle'];
            } else {
              // Legacy format - just a style object
              const styleObject = processedCol.headerStyle as React.CSSProperties;
              console.log('[DataTable] Profile change - Converting legacy headerStyle for column:', {
                field: processedCol.field,
                styleObject: styleObject
              });
              
              processedCol.headerStyle = ((params: { floatingFilter?: boolean }) => {
                if (!params?.floatingFilter) {
                  return styleObject;
                }
                return null;
              }) as AgColDef['headerStyle'];
            }
          }
        }
        
        // Recreate valueFormatter from saved config
        if (processedCol.valueFormatter && typeof processedCol.valueFormatter === 'object') {
          const formatterConfig = processedCol.valueFormatter as FormatterConfig;
          
          if (formatterConfig._isFormatterConfig && formatterConfig.type === 'excel' && formatterConfig.formatString) {
            console.log('[DataTable] Profile change - Recreating valueFormatter from config:', {
              field: processedCol.field,
              formatString: formatterConfig.formatString
            });
            
            // Recreate the formatter function
            const formatter = createExcelFormatter(formatterConfig.formatString);
            processedCol.valueFormatter = formatter;
            processedCol.exportValueFormatter = formatter;
            
          } else {
            // Invalid formatter config, remove it
            delete processedCol.valueFormatter;
            delete processedCol.exportValueFormatter;
          }
        }
        
        
        return processedCol;
      });
      
      setCurrentColumnDefs(processedDefs);
      // Update the ref as well
      columnDefsWithStylesRef.current = processedDefs;
    } else {
      // Reset to original column definitions if profile has none
      console.log('[DataTable] Resetting to original columnDefs');
      setCurrentColumnDefs(columnDefs);
      columnDefsWithStylesRef.current = columnDefs;
    }
    
    // Apply font from profile or reset to default
    setSelectedFont(profile.gridState.font || 'monospace');
    
    // The profile manager component handles applying the grid state to the grid API
  }, [columnDefs]);
  
  const handleApplyColumnChanges = useCallback((updatedColumns: AgColDef[]) => {
    console.log('[DataTable] handleApplyColumnChanges:', {
      updatedColumnsCount: updatedColumns.length,
      hasGridApi: !!gridApiRef.current,
      hasCustomizations: updatedColumns.some(col => 
        col.cellStyle || col.valueFormatter || col.cellClass
      ),
      firstColumn: updatedColumns[0]?.field
    });
    
    // IMPORTANT: We need to preserve the current column state (width, position, visibility)
    // and only update the customization properties
    if (gridApiRef.current) {
      // Get current column state to preserve
      const currentColumnState = gridApiRef.current.getColumnState();
      const currentFilterModel = gridApiRef.current.getFilterModel();
      const currentSortModel = gridApiRef.current.getColumnState().filter(col => col.sort);
      const currentColumnDefs = gridApiRef.current.getColumnDefs() || [];
      
      console.log('[DataTable] Preserving AG-Grid state:', {
        columnStateCount: currentColumnState.length,
        visibleColumns: currentColumnState.filter(cs => !cs.hide).length,
        hiddenColumns: currentColumnState.filter(cs => cs.hide).length,
        pinnedColumns: currentColumnState.filter(cs => cs.pinned).length,
        sortedColumns: currentSortModel.length,
        hasFilters: Object.keys(currentFilterModel).length > 0
      });
      
      // Create a map of current columns for quick lookup
      const currentColMap = new Map();
      currentColumnDefs.forEach(col => {
        if (col.field || col.colId) {
          currentColMap.set(col.field || col.colId, col);
        }
      });
      
      // Merge the customizations with existing column definitions
      const mergedColumns = updatedColumns.map(updatedCol => {
        const field = updatedCol.field || updatedCol.colId;
        const currentCol = currentColMap.get(field);
        
        if (currentCol) {
          // Start with ALL current column properties to preserve everything
          const mergedCol = { ...currentCol };
          
          // Only update properties that are explicitly defined in updatedCol
          // This ensures we don't accidentally clear any properties
          if (updatedCol.headerName !== undefined) mergedCol.headerName = updatedCol.headerName;
          if (updatedCol.field !== undefined) mergedCol.field = updatedCol.field;
          
          // Style and class properties - always update these as they might be cleared
          if ('cellStyle' in updatedCol) mergedCol.cellStyle = updatedCol.cellStyle;
          if ('headerStyle' in updatedCol) mergedCol.headerStyle = updatedCol.headerStyle;
          if ('cellClass' in updatedCol) mergedCol.cellClass = updatedCol.cellClass;
          if ('headerClass' in updatedCol) mergedCol.headerClass = updatedCol.headerClass;
          
          // Formatter and value properties
          if ('valueFormatter' in updatedCol) mergedCol.valueFormatter = updatedCol.valueFormatter;
          if ('exportValueFormatter' in updatedCol) mergedCol.exportValueFormatter = updatedCol.exportValueFormatter;
          if ('valueGetter' in updatedCol) mergedCol.valueGetter = updatedCol.valueGetter;
          if ('valueSetter' in updatedCol) mergedCol.valueSetter = updatedCol.valueSetter;
          
          
          // Filter properties
          if (updatedCol.filter !== undefined) mergedCol.filter = updatedCol.filter;
          if ('filterParams' in updatedCol) mergedCol.filterParams = updatedCol.filterParams;
          if (updatedCol.floatingFilter !== undefined) mergedCol.floatingFilter = updatedCol.floatingFilter;
          
          // Boolean properties - only update if explicitly set
          if (updatedCol.sortable !== undefined) mergedCol.sortable = updatedCol.sortable;
          if (updatedCol.resizable !== undefined) mergedCol.resizable = updatedCol.resizable;
          if (updatedCol.editable !== undefined) mergedCol.editable = updatedCol.editable;
          if (updatedCol.wrapText !== undefined) mergedCol.wrapText = updatedCol.wrapText;
          if (updatedCol.autoHeight !== undefined) mergedCol.autoHeight = updatedCol.autoHeight;
          if (updatedCol.wrapHeaderText !== undefined) mergedCol.wrapHeaderText = updatedCol.wrapHeaderText;
          if (updatedCol.autoHeaderHeight !== undefined) mergedCol.autoHeaderHeight = updatedCol.autoHeaderHeight;
          
          // Width properties - only update if explicitly set
          if (updatedCol.initialWidth !== undefined) mergedCol.initialWidth = updatedCol.initialWidth;
          if (updatedCol.minWidth !== undefined) mergedCol.minWidth = updatedCol.minWidth;
          if (updatedCol.maxWidth !== undefined) mergedCol.maxWidth = updatedCol.maxWidth;
          
          // Initial state properties
          if (updatedCol.initialHide !== undefined) mergedCol.initialHide = updatedCol.initialHide;
          if (updatedCol.initialPinned !== undefined) mergedCol.initialPinned = updatedCol.initialPinned;
          
          // Type properties
          if (updatedCol.type !== undefined) mergedCol.type = updatedCol.type;
          if (updatedCol.cellDataType !== undefined) mergedCol.cellDataType = updatedCol.cellDataType;
          
          // Editor properties
          if ('cellEditor' in updatedCol) mergedCol.cellEditor = updatedCol.cellEditor;
          if ('cellEditorParams' in updatedCol) mergedCol.cellEditorParams = updatedCol.cellEditorParams;
          
          return mergedCol;
        }
        
        // If column not found in current state, return as is
        return updatedCol;
      });
      
      // Apply the merged column definitions
      gridApiRef.current.setGridOption('columnDefs', mergedColumns);
      
      // Store the merged columns with styles for later retrieval
      columnDefsWithStylesRef.current = mergedColumns;
      
      // Force header refresh to ensure styles are applied
      gridApiRef.current.refreshHeader();
      
      // Restore the column state, filters, and sorts to preserve user's current view
      // Small delay to ensure column definitions are fully applied
      setTimeout(() => {
        if (gridApiRef.current) {
          // Restore column state (width, position, visibility, pinning)
          if (currentColumnState) {
            console.log('[DataTable] Restoring column state after customization');
            gridApiRef.current.applyColumnState({
              state: currentColumnState,
              applyOrder: true
            });
          }
          
          // Restore filters
          if (currentFilterModel && Object.keys(currentFilterModel).length > 0) {
            console.log('[DataTable] Restoring filters:', currentFilterModel);
            gridApiRef.current.setFilterModel(currentFilterModel);
          }
          
          // Restore sorts
          if (currentSortModel && currentSortModel.length > 0) {
            console.log('[DataTable] Restoring sorts:', currentSortModel);
            const sortState = currentSortModel.map(col => ({
              colId: col.colId,
              sort: col.sort,
              sortIndex: col.sortIndex
            }));
            gridApiRef.current.applyColumnState({
              state: sortState
            });
          }
          
          // Force a final refresh to ensure everything is applied correctly
          gridApiRef.current.refreshCells({ force: true });
        }
        
        // Don't show toast here as this is called frequently during editing
        // Toast will be shown when the user saves the profile
      }, 50); // Small delay to ensure column definitions are fully applied
    }
    
    // Update React state
    setCurrentColumnDefs(() => {
      // Only update if there are actual changes
      return updatedColumns.map((col) => {
        if (col.field && col.headerName) {
          return col as ColumnDef;
        }
        
        return {
          ...col,
          field: col.field || '',
          headerName: col.headerName || col.field || ''
        };
      });
    });
    
    // Column changes from dialog are only saved when Save Profile button is clicked
  }, [toast]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <DataTableToolbar
        onFontChange={handleFontChange}
        onSpacingChange={() => {}} // Empty function to satisfy prop requirements
        onOpenColumnSettings={() => setShowColumnDialog(true)}
        gridApi={gridApiRef.current}
        onProfileChange={handleProfileChange}
        getColumnDefsWithStyles={() => columnDefsWithStylesRef.current}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <AgGridReact
          ref={gridRef}
          rowData={dataRow}
          columnDefs={currentColumnDefs}
          defaultColDef={defaultColDef}
          maintainColumnOrder={true}
          cellSelection={true}
          suppressMenuHide={true}
          suppressHorizontalScroll={false}
          alwaysShowVerticalScroll={true}
          sideBar={{
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
          }}
          getContextMenuItems={getContextMenuItems}
          onGridReady={(params) => {
            gridApiRef.current = params.api;
            
            console.log('[DataTable] onGridReady:', {
              hasActiveProfile: !!activeProfile,
              activeProfileId: activeProfile?.id,
              activeProfileName: activeProfile?.name,
              hasGridState: !!activeProfile?.gridState,
              columnDefsInProfile: activeProfile?.gridState?.columnDefs?.length,
              columnDefsDefault: columnDefs.length
            });
            
            // Load active profile on grid ready
            if (activeProfile && activeProfile.gridState) {
              const { gridState } = activeProfile;
              
              // Apply column definitions first (includes all customizations)
              if (gridState.columnDefs && gridState.columnDefs.length > 0) {
                console.log('[DataTable] Applying profile columnDefs on grid ready:', {
                  count: gridState.columnDefs.length,
                  hasCustomizations: gridState.columnDefs.some(col => 
                    col.cellStyle || col.valueFormatter || col.cellClass || col.headerClass
                  )
                });
                
                // Process column definitions to restore headerStyle functions
                const processedColumnDefs = gridState.columnDefs.map(col => {
                  const processed = { ...col };
                  
                  // Clean invalid properties
                  delete processed.valueFormat;
                  delete processed._hasFormatter;
                  delete processed.excelFormat;
                  
                  // Convert headerStyle objects back to functions
                  if (processed.headerStyle) {
                    if (typeof processed.headerStyle === 'object') {
                      const styleConfig = processed.headerStyle as HeaderStyleConfig;
                      
                      // Check if it's our special format with regular/floating styles
                      if (styleConfig._isHeaderStyleConfig) {
                        console.log('[DataTable] Converting headerStyle config for column:', {
                          field: processed.field,
                          hasRegular: !!styleConfig.regular,
                          hasFloating: !!styleConfig.floating
                        });
                        
                        processed.headerStyle = ((params: { floatingFilter?: boolean }) => {
                          console.log('[DataTable] headerStyle function called:', {
                            field: processed.field,
                            floatingFilter: params?.floatingFilter
                          });
                          
                          if (params?.floatingFilter) {
                            return styleConfig.floating || null;
                          }
                          return styleConfig.regular || null;
                        }) as AgColDef['headerStyle'];
                      } else {
                        // Legacy format - just a style object
                        const styleObject = processed.headerStyle as React.CSSProperties;
                        console.log('[DataTable] Converting legacy headerStyle for column:', {
                          field: processed.field,
                          styleObject: styleObject
                        });
                        
                        processed.headerStyle = ((params: { floatingFilter?: boolean }) => {
                          if (!params?.floatingFilter) {
                            return styleObject;
                          }
                          return null;
                        }) as AgColDef['headerStyle'];
                      }
                    }
                  }
                  
                  // Recreate valueFormatter from saved config
                  if (processed.valueFormatter && typeof processed.valueFormatter === 'object') {
                    const formatterConfig = processed.valueFormatter as FormatterConfig;
                    
                    if (formatterConfig._isFormatterConfig && formatterConfig.type === 'excel' && formatterConfig.formatString) {
                      console.log('[DataTable] onGridReady - Recreating valueFormatter from config:', {
                        field: processed.field,
                        formatString: formatterConfig.formatString
                      });
                      
                      // Recreate the formatter function
                      const formatter = createExcelFormatter(formatterConfig.formatString);
                      processed.valueFormatter = formatter;
                      processed.exportValueFormatter = formatter;
                    } else {
                      // Invalid formatter config, remove it
                      delete processed.valueFormatter;
                      delete processed.exportValueFormatter;
                    }
                  }
                  
                  return processed;
                });
                
                // Log sample columns with customizations
                const customizedCols = processedColumnDefs.filter(col => 
                  col.cellClass || col.headerClass || col.cellStyle || col.headerStyle
                ).slice(0, 5);
                customizedCols.forEach(col => {
                  console.log('[DataTable] Column with customizations:', {
                    field: col.field,
                    cellClass: col.cellClass,
                    headerClass: col.headerClass,
                    hasCellStyle: !!col.cellStyle,
                    hasHeaderStyle: !!col.headerStyle,
                    cellStyleType: typeof col.cellStyle,
                    headerStyleType: typeof col.headerStyle,
                    cellStyle: typeof col.cellStyle === 'object' ? col.cellStyle : 'function',
                    headerStyle: typeof col.headerStyle === 'object' ? col.headerStyle : 'function'
                  });
                });
                
                params.api.setGridOption('columnDefs', processedColumnDefs);
                setCurrentColumnDefs(processedColumnDefs);
                // Store the processed columns with styles
                columnDefsWithStylesRef.current = processedColumnDefs;
                
                // Force header refresh to ensure styles are applied
                params.api.refreshHeader();
                
                // Apply states after columnDefs are set
                applyGridStates(params.api, gridState);
              } else {
                console.log('[DataTable] No columnDefs in profile, using default');
                // Even with default columns, apply saved states
                if (gridState) {
                  applyGridStates(params.api, gridState);
                }
              }
                
              
              // Apply font immediately (doesn't depend on grid state)
              if (gridState.font) {
                console.log('[DataTable] Applying font:', gridState.font);
                setSelectedFont(gridState.font);
              }
              
              // Debug: Check if classes are actually applied after all states
              setTimeout(() => {
                const headerCells = document.querySelectorAll('.ag-header-cell');
                const cellsWithClasses = Array.from(headerCells).filter(h => 
                  h.className.includes('header-align-') || h.className.includes('header-valign-')
                );
                console.log('[DataTable] Headers with alignment classes:', cellsWithClasses.length);
                if (cellsWithClasses.length > 0) {
                  console.log('[DataTable] Sample header classes:', cellsWithClasses[0].className);
                }
                
                const cells = document.querySelectorAll('.ag-cell');
                const cellsWithAlignment = Array.from(cells).filter(c => 
                  c.className.includes('cell-align-') || c.className.includes('cell-valign-')
                );
                console.log('[DataTable] Cells with alignment classes:', cellsWithAlignment.length);
                
                // Check if styles are actually working
                if (cellsWithAlignment.length > 0) {
                  const computedStyle = window.getComputedStyle(cellsWithAlignment[0]);
                  console.log('[DataTable] Cell computed text-align:', computedStyle.textAlign);
                  console.log('[DataTable] Cell computed justify-content:', computedStyle.justifyContent);
                }
              }, 500); // Check after all states have been applied
            } else {
              console.log('[DataTable] No active profile or gridState to apply');
            }
          }}
          // Column moved event - no auto-save
          onColumnMoved={() => {
            // State changes are only saved when Save Profile button is clicked
          }}
          // Column resized event - no auto-save
          onColumnResized={() => {
            // State changes are only saved when Save Profile button is clicked
          }}
          // Column visible event - no auto-save
          onColumnVisible={() => {
            // State changes are only saved when Save Profile button is clicked
          }}
          // Tool panel visibility changed - no auto-save
          onToolPanelVisibleChanged={() => {
            // State changes are only saved when Save Profile button is clicked
          }}
          // Sort changed event - no auto-save
          onSortChanged={() => {
            // State changes are only saved when Save Profile button is clicked
          }}
          // Filter changed event - no auto-save
          onFilterChanged={() => {
            // State changes are only saved when Save Profile button is clicked
          }}
          theme={theme}
          excelStyles={excelStyles}
          defaultExcelExportParams={{
            // Apply column formatting to Excel export
            processCellCallback: (params) => {
              // Use the exportValueFormatter if available, otherwise valueFormatter
              if (params.column.getColDef().exportValueFormatter) {
                return params.column.getColDef().exportValueFormatter(params);
              } else if (params.column.getColDef().valueFormatter) {
                return params.column.getColDef().valueFormatter(params);
              }
              return params.value;
            },
            // Include column headers with formatting
            processHeaderCallback: (params) => {
              return params.column.getColDef().headerName || params.column.getColId();
            }
          }}
        />
      </div>

      <ColumnCustomizationDialog
        open={showColumnDialog}
        onOpenChange={setShowColumnDialog}
        columnDefs={currentColumnDefs}
        columnState={(() => {
          if (!gridApiRef.current) return undefined;
          
          // Get column state which includes visibility info
          const columnState = gridApiRef.current.getColumnState();
          
          // Also get all columns to ensure we have complete data
          const allColumns = gridApiRef.current.getColumns();
          
          console.log('[DataTable] Getting column state for dialog:', {
            columnStateLength: columnState?.length,
            allColumnsLength: allColumns?.length,
            visibleColumns: allColumns?.filter(col => col.isVisible()).length,
            hiddenColumns: allColumns?.filter(col => !col.isVisible()).length
          });
          
          // Create a complete state by merging column state with actual column visibility
          if (allColumns) {
            const completeState = allColumns.map(column => {
              const colId = column.getColId();
              const existingState = columnState?.find(cs => cs.colId === colId);
              
              return {
                colId: colId,
                hide: !column.isVisible(),
                ...existingState
              };
            });
            
            return completeState;
          }
          
          return columnState;
        })()}
        onApply={handleApplyColumnChanges}
      />
      
      <DebugProfile />
    </div>
  );
}