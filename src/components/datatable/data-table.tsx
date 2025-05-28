import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModuleRegistry, themeQuartz, GridApi, ColDef as AgColDef } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { DataTableToolbar } from './data-table-toolbar';
import { useTheme } from '@/components/theme-provider';
import { ColumnCustomizationDialog } from './dialogs/columnSettings/ColumnCustomizationDialog';
import './alignment-styles.css';
import './format-styles.css';

ModuleRegistry.registerModules([AllEnterpriseModule]);

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
  const [selectedFont, setSelectedFont] = useState('monospace');
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [currentColumnDefs, setCurrentColumnDefs] = useState<ColumnDef[]>(columnDefs);
  // Fixed spacing value of 6 (normal)
  const gridSpacing = 6;

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
  };

  const handleApplyColumnChanges = useCallback((updatedColumns: AgColDef[]) => {
    // Update AG-Grid immediately
    if (gridApiRef.current) {
      gridApiRef.current.setGridOption('columnDefs', updatedColumns);
    }
    
    // Update React state only if necessary
    setCurrentColumnDefs(prevColumns => {
      // Check if we actually need to update
      const needsUpdate = updatedColumns.length !== prevColumns.length ||
        updatedColumns.some((col, idx) => col !== prevColumns[idx]);
      
      if (!needsUpdate) return prevColumns;
      
      // Only convert columns that need it
      return updatedColumns.map((col, idx) => {
        // Reuse existing column object if unchanged
        if (prevColumns[idx] && col === prevColumns[idx]) {
          return prevColumns[idx];
        }
        
        // Check if conversion is needed
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
  }, []);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <DataTableToolbar
        onFontChange={handleFontChange}
        onSpacingChange={() => {}} // Empty function to satisfy prop requirements
        onOpenColumnSettings={() => setShowColumnDialog(true)}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <AgGridReact
          ref={gridRef}
          rowData={dataRow}
          columnDefs={currentColumnDefs}
          defaultColDef={defaultColDef}
          cellSelection={true}
          suppressMenuHide={true}
          suppressHorizontalScroll={false}
          suppressVerticalScroll={false}
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
        onApply={handleApplyColumnChanges}
      />
    </div>
  );
}