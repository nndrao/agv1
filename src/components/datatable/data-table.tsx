import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModuleRegistry, themeQuartz, GridApi, ColDef as AgColDef, GetContextMenuItemsParams } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { DataTableToolbar } from './data-table-toolbar';
import { useTheme } from '@/components/theme-provider';
import { ColumnCustomizationDialog } from './dialogs/columnSettings/ColumnCustomizationDialog';

ModuleRegistry.registerModules([AllEnterpriseModule]);

export interface ColumnDef extends Omit<AgColDef, 'field' | 'headerName' | 'type'> {
  field: string;
  headerName: string;
  type?: string | string[]; // For legacy/custom use, matching ag-grid's type
  columnDataType?: 'text' | 'number' | 'date' | 'boolean'; // ag-Grid v33+ optimization
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
  }), []);

  const getContextMenuItems = useCallback((_params: GetContextMenuItemsParams) => {
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

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    if (gridApiRef.current) {
      gridApiRef.current.refreshCells({ force: true });
    }
  };

  const handleApplyColumnChanges = (updatedColumns: AgColDef[]) => {
    // Convert back to ColumnDef type, preserving all properties
    const convertedColumns: ColumnDef[] = updatedColumns.map(col => ({
      ...col,
      field: col.field || '',
      headerName: col.headerName || col.field || '',
      columnDataType: col.cellDataType as 'text' | 'number' | 'date' | 'boolean' | undefined
    }));
    setCurrentColumnDefs(convertedColumns);
    if (gridApiRef.current) {
      gridApiRef.current.setGridOption('columnDefs', updatedColumns);
    }
  };

  return (
    <div className="h-full w-full flex flex-col box-border overflow-hidden">
      <DataTableToolbar 
        onFontChange={handleFontChange} 
        onSpacingChange={() => {}} // Empty function to satisfy prop requirements
        onOpenColumnSettings={() => setShowColumnDialog(true)}
      />
      
      <div className="flex-1 overflow-hidden">
        <AgGridReact
          ref={gridRef}
          rowData={dataRow}
          columnDefs={currentColumnDefs}
          defaultColDef={defaultColDef}
          enableRangeSelection={true}
          enableFillHandle={true}
          suppressMenuHide={true}
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
          getContextMenuItems={getContextMenuItems as any}
          onGridReady={(params) => {
            gridApiRef.current = params.api;
          }}
          theme={theme}
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