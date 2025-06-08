import React, { memo, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, themeQuartz, GridApi } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { useTheme } from '@/components/datatable/ThemeProvider';
import { DebugProfile } from './DebugProfile';
import { useGridCallbacks } from './hooks/useGridCallbacks';
import { useDataTableContext } from './hooks/useDataTableContext';
import { ColumnDef } from './types';
import { DEFAULT_COL_DEF, DEFAULT_GRID_SPACING } from './utils/constants';
import './format-styles.css';
import './profile-transitions.css';

// Register AG-Grid modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

interface DataTableGridProps {
  columnDefs: ColumnDef[];
  rowData: Record<string, unknown>[];
  gridApiRef: React.MutableRefObject<GridApi | null>;
}

/**
 * Pure presentational component that renders the AG-Grid.
 * All state management and logic is handled by the container.
 */
export const DataTableGrid = memo(({ 
  columnDefs, 
  rowData,
  gridApiRef 
}: DataTableGridProps) => {
  const { theme: currentTheme } = useTheme();
  const { selectedFont } = useDataTableContext();
  const isDarkMode = currentTheme === 'dark';
  
  // Get memoized callbacks
  const {
    getContextMenuItems,
    onGridReady,
    onColumnMoved,
    onColumnResized,
    onColumnVisible,
    onToolPanelVisibleChanged,
    onSortChanged,
    onFilterChanged,
    excelStyles,
    defaultExcelExportParams,
  } = useGridCallbacks(gridApiRef, () => {});
  
  // Create theme configuration
  const theme = useMemo(() => {
    const lightTheme = {
      accentColor: "#6B7280",
      backgroundColor: "#F5F5F5",
      borderColor: "#D1D5DB",
      browserColorScheme: "light",
      buttonBorderRadius: 2,
      cellTextColor: "#374151",
      checkboxBorderRadius: 2,
      columnBorder: true,
      fontFamily: selectedFont,
      fontSize: 14,
      headerBackgroundColor: "#EEEFF1",
      headerFontFamily: selectedFont,
      headerFontSize: 14,
      headerFontWeight: 500,
      iconButtonBorderRadius: 1,
      iconSize: 12,
      inputBorderRadius: 2,
      oddRowBackgroundColor: "#F4F5F6",
      spacing: DEFAULT_GRID_SPACING,
      wrapperBorderRadius: 2,
    };

    const darkTheme = {
      accentColor: "#8AAAA7",
      backgroundColor: "#161b22",
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
      oddRowBackgroundColor: "#1f2328",
      spacing: DEFAULT_GRID_SPACING,
      wrapperBorderRadius: 2,
    };

    return themeQuartz
      .withParams(lightTheme, "light")
      .withParams(darkTheme, "dark");
  }, [selectedFont]);
  
  // Update document theme mode
  React.useEffect(() => {
    document.body.dataset.agThemeMode = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);
  
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={DEFAULT_COL_DEF}
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
        onGridReady={onGridReady}
        onColumnMoved={onColumnMoved}
        onColumnResized={onColumnResized}
        onColumnVisible={onColumnVisible}
        onToolPanelVisibleChanged={onToolPanelVisibleChanged}
        onSortChanged={onSortChanged}
        onFilterChanged={onFilterChanged}
        theme={theme}
        excelStyles={excelStyles}
        defaultExcelExportParams={defaultExcelExportParams}
      />
      
      <DebugProfile />
    </div>
  );
});

DataTableGrid.displayName = 'DataTableGrid';