import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings2, Download, FileSpreadsheet, Sliders, Type, ALargeSmall } from "lucide-react";
import { ProfileManager } from "./ProfileManager";
import { GridApi, ColDef as AgColDef, ProcessCellForExportParams } from "ag-grid-community";
import { GridProfile } from "@/components/datatable/stores/profile.store";
import { useToast } from "@/hooks/use-toast";

const monospaceFonts = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Source Code Pro', label: 'Source Code Pro' },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
  { value: 'Roboto Mono', label: 'Roboto Mono' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'monospace', label: 'System Monospace' },
];

const fontSizes = [
  { value: '10', label: '10px' },
  { value: '11', label: '11px' },
  { value: '12', label: '12px' },
  { value: '13', label: '13px' },
  { value: '14', label: '14px' },
  { value: '15', label: '15px' },
  { value: '16', label: '16px' },
  { value: '18', label: '18px' },
  { value: '20', label: '20px' },
];

interface DataTableToolbarProps {
  selectedFont?: string;
  selectedFontSize?: string;
  onFontChange: (font: string) => void;
  onFontSizeChange?: (size: string) => void;
  onSpacingChange: (spacing: string) => void;
  onOpenColumnSettings?: () => void;
  onOpenGridOptions?: () => void;
  gridApi?: GridApi | null;
  onProfileChange?: (profile: GridProfile) => void;
  getColumnDefsWithStyles?: () => AgColDef[];
}

export function DataTableToolbar({ 
  selectedFont = 'monospace',
  selectedFontSize = '13',
  onFontChange,
  onFontSizeChange,
  onOpenColumnSettings,
  onOpenGridOptions,
  gridApi,
  onProfileChange,
  getColumnDefsWithStyles 
}: DataTableToolbarProps) {
  const { toast } = useToast();
  
  const handleExportExcel = () => {
    if (!gridApi) {
      toast({
        title: "Export failed",
        description: "Grid is not ready for export",
        variant: "destructive"
      });
      return;
    }
    
    try {
      gridApi.exportDataAsExcel({
        fileName: `data-export-${new Date().toISOString().split('T')[0]}.xlsx`,
        author: 'AG-Grid Export',
        sheetName: 'Data',
        processCellCallback: (params: ProcessCellForExportParams) => {
          const colDef = params.column.getColDef();
          // Use valueFormatter for export if available
          if (colDef.valueFormatter && typeof colDef.valueFormatter === 'function') {
            return colDef.valueFormatter({
              value: params.value,
              data: params.node?.data,
              node: params.node as any,
              colDef: colDef,
              column: params.column,
              api: params.api,
              context: params.context
            } as any);
          }
          return params.value;
        }
      });
      
      toast({
        title: "Export successful",
        description: "Data exported to Excel file",
      });
    } catch {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data",
        variant: "destructive"
      });
    }
  };
  
  const handleExportCsv = () => {
    if (!gridApi) {
      toast({
        title: "Export failed",
        description: "Grid is not ready for export",
        variant: "destructive"
      });
      return;
    }
    
    try {
      gridApi.exportDataAsCsv({
        fileName: `data-export-${new Date().toISOString().split('T')[0]}.csv`,
        processCellCallback: (params: ProcessCellForExportParams) => {
          const colDef = params.column.getColDef();
          // Use valueFormatter for export if available
          if (colDef.valueFormatter && typeof colDef.valueFormatter === 'function') {
            return colDef.valueFormatter({
              value: params.value,
              data: params.node?.data,
              node: params.node as any,
              colDef: colDef,
              column: params.column,
              api: params.api,
              context: params.context
            } as any);
          }
          return params.value;
        }
      });
      
      toast({
        title: "Export successful",
        description: "Data exported to CSV file",
      });
    } catch {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data",
        variant: "destructive"
      });
    }
  };
  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/40">
      <div className="flex items-center gap-4">
        <ProfileManager 
          gridApi={gridApi || null} 
          onProfileChange={onProfileChange}
          getColumnDefsWithStyles={getColumnDefsWithStyles}
        />
        <div className="border-l pl-4 flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <Select onValueChange={onFontChange} value={selectedFont}>
            <SelectTrigger id="font-select" className="w-[160px] h-8">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {monospaceFonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <ALargeSmall className="h-4 w-4 text-muted-foreground ml-2" />
          <Select onValueChange={onFontSizeChange} value={selectedFontSize}>
            <SelectTrigger id="font-size-select" className="w-[80px] h-8">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportExcel}
          className="h-8"
          disabled={!gridApi}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportCsv}
          className="h-8"
          disabled={!gridApi}
        >
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        {onOpenGridOptions && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenGridOptions}
            className="h-8"
          >
            <Sliders className="mr-2 h-4 w-4" />
            Grid Options
          </Button>
        )}
        {onOpenColumnSettings && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenColumnSettings}
            className="h-8"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Customize Columns
          </Button>
        )}
      </div>
    </div>
  );
}