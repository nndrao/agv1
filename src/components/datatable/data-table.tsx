import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModuleRegistry, themeQuartz, GridApi } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { DataTableToolbar } from './data-table-toolbar';
import { useTheme } from '@/components/theme-provider';
import { ColumnCustomizationDialog } from './dialogs/columnSettings/ColumnCustomizationDialog';
import { useColumnCustomizationStore } from './dialogs/columnSettings/store/column-customization.store';

ModuleRegistry.registerModules([AllEnterpriseModule]);

export interface ColumnDef {
  field: string;
  headerName: string;
  type?: string; // For legacy/custom use
  columnDataType?: 'text' | 'number' | 'date' | 'boolean'; // ag-Grid v33+ optimization
}

interface DataTableProps {
  columnDefs: ColumnDef[];
  dataRow: Record<string, any>[];
}

// Function to set dark mode on document body for AG Grid
function setDarkMode(enabled: boolean) {
  document.body.dataset.agThemeMode = enabled ? "dark" : "light";
}

// Initialize AG Grid with dark mode by default
setDarkMode(true);

export function DataTable({ columnDefs: initialColumnDefs, dataRow }: DataTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const { theme: currentTheme } = useTheme();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const isDarkMode = currentTheme === 'dark';
  const [selectedFont, setSelectedFont] = useState('monospace');
  const [showColumnCustomization, setShowColumnCustomization] = useState(false);
  // Use state for column definitions to allow updates
  const [columnDefs, setColumnDefs] = useState(initialColumnDefs);
  // Fixed spacing value of 6 (normal)
  const gridSpacing = 6;
  
  // Get the loadFromLocalStorage function from the store
  const { loadFromLocalStorage } = useColumnCustomizationStore();

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
    enableValue: true,
    enableRowGroup: true,
    enablePivot: true,
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

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
  };

  return (
    <div className="h-full w-full flex flex-col box-border overflow-hidden">
      <DataTableToolbar 
        onFontChange={handleFontChange} 
        onSpacingChange={() => {}} // Empty function to satisfy prop requirements
        onColumnSettingsClick={() => setShowColumnCustomization(true)}
      />
      
      <div className="flex-1 overflow-hidden">
        <AgGridReact
          ref={gridRef}
          rowData={dataRow}
          columnDefs={columnDefs}
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
          getContextMenuItems={getContextMenuItems}
          onGridReady={(params) => {
            setGridApi(params.api);
            
            // Load saved column settings from local storage
            const savedSettings = loadFromLocalStorage();
            if (savedSettings && savedSettings.size > 0) {
              const currentColDefs = params.api.getColumnDefs() || [];
              const updatedColDefs = currentColDefs.map(colDef => {
                const colId = colDef.field || colDef.colId || '';
                const savedColSettings = savedSettings.get(colId);
                
                if (savedColSettings) {
                  // Merge saved settings with current column definition
                  return { ...colDef, ...savedColSettings };
                }
                return colDef;
              });
              
              // Apply the updated column definitions
              params.api.setGridOption('columnDefs', updatedColDefs);
              setColumnDefs(updatedColDefs as ColumnDef[]);
              
              console.log('Applied saved column settings from local storage');
            }
          }}
          theme={theme}
        />
      </div>
      
      {gridApi ? (
        <ColumnCustomizationDialog
          open={showColumnCustomization}
          onOpenChange={setShowColumnCustomization}
          gridApi={gridApi}
          onColumnDefsChange={setColumnDefs}
        />
      ) : null}
    </div>
  );
}