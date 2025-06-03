import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModuleRegistry, themeQuartz, GridApi, ColDef as AgColDef } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { perfMonitor } from '@/lib/performance-monitor';
import { DataTableToolbar } from './data-table-toolbar';
import { useTheme } from '@/components/theme-provider';
import { ColumnCustomizationDialog } from './dialogs/columnSettings/ColumnCustomizationDialog';
import { useProfileStore, useActiveProfile, GridProfile } from '@/stores/profile.store';
import { DebugProfile } from './debug-profile';
import { profileOptimizer } from '@/lib/profile-optimizer';
import './alignment-styles.css';
import './format-styles.css';
import './profile-transitions.css';

ModuleRegistry.registerModules([AllEnterpriseModule]);

export interface ColumnDef extends Omit<AgColDef, 'field' | 'headerName' | 'type'> {
  field: string;
  headerName: string;
  type?: string | string[]; // For legacy/custom use, matching ag-grid's type
  cellDataType?: 'text' | 'number' | 'date' | 'boolean' | string | boolean; // ag-Grid v33+ optimization
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
  
  // Profile management - moved before state initialization
  const activeProfile = useActiveProfile();
  const { getColumnDefs, saveColumnCustomizations } = useProfileStore();
  
  const [selectedFont, setSelectedFont] = useState(() => {
    // Initialize with saved font if available
    return activeProfile?.gridState?.font || 'monospace';
  });
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  
  // Keep track of column definitions with styles since AG-Grid doesn't return them
  const columnDefsWithStylesRef = useRef<ColumnDef[]>([]);
  
  const [currentColumnDefs, setCurrentColumnDefs] = useState<ColumnDef[]>(() => {
    // Try to get column definitions from profile (will use lightweight format if available)
    const savedColumnDefs = getColumnDefs();
    
    if (savedColumnDefs && savedColumnDefs.length > 0) {
      console.log('[DataTable] Initializing with saved columnDefs from profile:', {
        profileName: activeProfile?.name,
        columnCount: savedColumnDefs.length,
        hasLightweightFormat: !!(activeProfile?.gridState?.columnCustomizations),
        columnsWithFormatters: savedColumnDefs.filter((col: any) => col.valueFormatter).length,
        sampleColumns: savedColumnDefs.slice(0, 3).map(col => ({
          field: col.field,
          headerName: col.headerName,
          hasHeaderStyle: !!col.headerStyle,
          hasCellStyle: !!col.cellStyle,
          hasFormatter: !!col.valueFormatter,
          sortable: col.sortable,
          resizable: col.resizable,
          editable: col.editable
        }))
      });
      
      // Initialize the ref
      columnDefsWithStylesRef.current = savedColumnDefs as ColumnDef[];
      return savedColumnDefs as ColumnDef[];
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
        !activeProfile.gridState.columnCustomizations && 
        (!activeProfile.gridState.columnDefs || activeProfile.gridState.columnDefs.length === 0)) {
      console.log('[DataTable] Initializing default profile with base columnDefs:', {
        columnDefsCount: columnDefs.length,
        activeProfileId: activeProfile.id
      });
      // Save base column definitions for the default profile
      saveColumnCustomizations(columnDefs as AgColDef[], columnDefs as AgColDef[]);
    }
  }, [activeProfile, columnDefs, saveColumnCustomizations]);

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
    ] as string[];
  }, []);

  // Excel export configuration
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

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    if (gridApiRef.current) {
      gridApiRef.current.refreshCells({ force: true });
    }
    
    // Font changes are only saved when Save Profile button is clicked
  };


  const handleProfileChange = useCallback((profile: GridProfile) => {
    console.log('[DataTable] handleProfileChange:', {
      profileId: profile.id,
      profileName: profile.name,
      hasFont: !!profile.gridState.font,
      font: profile.gridState.font
    });
    
    // Get column definitions from profile store (already processed)
    const profileColumnDefs = getColumnDefs(profile.id);
    
    if (profileColumnDefs && profileColumnDefs.length > 0) {
      console.log('[DataTable] Updating currentColumnDefs from profile:', {
        profileName: profile.name,
        columnCount: profileColumnDefs.length
      });
      
      setCurrentColumnDefs(profileColumnDefs as ColumnDef[]);
      columnDefsWithStylesRef.current = profileColumnDefs as ColumnDef[];
    } else {
      // Reset to original column definitions if profile has none
      console.log('[DataTable] Resetting to original columnDefs');
      setCurrentColumnDefs(columnDefs);
      columnDefsWithStylesRef.current = columnDefs;
    }
    
    // Apply font from profile or reset to default
    setSelectedFont(profile.gridState.font || 'monospace');
    
    // The profile manager component handles applying the grid state to the grid API using the optimizer
  }, [columnDefs, getColumnDefs]);
  
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
        if ('field' in col && col.field) {
          currentColMap.set(col.field, col);
        } else if ('colId' in col && col.colId) {
          currentColMap.set(col.colId, col);
        }
      });
      
      // Merge the customizations with existing column definitions
      const mergedColumns = updatedColumns.map(updatedCol => {
        const field = updatedCol.field || updatedCol.colId;
        const currentCol = currentColMap.get(field);
        
        if (currentCol) {
          // Log what's happening with styles
          if (field === 'dailyPnL' || field === 'positionId') {
            console.log(`[DataTable] Column ${field} style update:`, {
              currentCellStyle: currentCol.cellStyle,
              updatedCellStyle: updatedCol.cellStyle,
              currentHeaderStyle: currentCol.headerStyle,
              updatedHeaderStyle: updatedCol.headerStyle
            });
          }
          
          // For columns being updated, use the updated version entirely
          // The store has already handled property removal/addition
          return updatedCol;
        }
        
        // If column not found in current state, return as is
        return updatedCol;
      });
      
      // Apply the merged column definitions
      gridApiRef.current.setGridOption('columnDefs', mergedColumns);
      
      // Log the applied columns
      console.log('[DataTable] Applied column definitions:', {
        totalColumns: mergedColumns.length,
        sampleColumn: mergedColumns[0],
        columnsWithCellStyle: mergedColumns.filter(col => col.cellStyle !== undefined).length,
        columnsWithHeaderStyle: mergedColumns.filter(col => col.headerStyle !== undefined).length
      });
      
      // Store the merged columns with styles for later retrieval
      columnDefsWithStylesRef.current = mergedColumns;
      
      // Update the currentColumnDefs state to ensure consistency
      setCurrentColumnDefs(mergedColumns);
      
      // Force complete grid refresh to ensure all styles are cleared
      // This is more aggressive but ensures styles are properly updated
      gridApiRef.current.setGridOption('columnDefs', []);
      gridApiRef.current.setGridOption('columnDefs', mergedColumns);
      
      // Force header refresh to ensure styles are applied
      gridApiRef.current.refreshHeader();
      
      // Also refresh cells to ensure cell styles are applied/cleared
      gridApiRef.current.refreshCells({ 
        force: true,
        suppressFlash: false 
      });
      
      // Redraw rows to ensure all styling is updated
      gridApiRef.current.redrawRows();
      
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
    
    // Clear optimizer cache for active profile since columns changed
    if (activeProfile) {
      profileOptimizer.clearCache(activeProfile.id);
    }
    
    // Column changes from dialog are only saved when Save Profile button is clicked
  }, [activeProfile]);

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
          onGridReady={async (params) => {
            perfMonitor.mark('grid-ready');
            perfMonitor.measureFromStart('gridInitTime');
            
            gridApiRef.current = params.api;
            
            console.log('[DataTable] onGridReady:', {
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
                    console.log(`[DataTable] Initial profile load progress: ${Math.round(progress * 100)}%`);
                  }
                }
              );
              
              // Apply font immediately (doesn't depend on grid state)
              if (activeProfile.gridState.font) {
                console.log('[DataTable] Applying font:', activeProfile.gridState.font);
                setSelectedFont(activeProfile.gridState.font);
              }
              
              perfMonitor.measureFromStart('gridFullyLoadedTime');
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
              const colDef = params.column.getColDef();
              // Use valueFormatter for export if available
              if (colDef.valueFormatter) {
                return typeof colDef.valueFormatter === 'function'
                  ? colDef.valueFormatter(params as any)
                  : params.value;
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