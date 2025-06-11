import { 
  ValueFormatterParams, 
  ColDef as AgColDef,
  GridApi,
  GridReadyEvent,
  CellValueChangedEvent,
  SortChangedEvent,
  FilterChangedEvent,
  ColumnResizedEvent,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnVisibleEvent
} from 'ag-grid-community';

// CellStyleParams type definition for AG-Grid v33+
export interface CellStyleParams {
  value: any;
  data: any;
  node: any;
  colDef: any;
  column: any;
  context: any;
  api: GridApi;
}

/**
 * Enhanced column definition with required fields
 */
export interface ColumnDef extends Omit<AgColDef, 'field' | 'headerName' | 'type'> {
  field: string;
  headerName: string;
  type?: string | string[]; // For legacy/custom use
  cellDataType?: 'text' | 'number' | 'date' | 'boolean' | string | boolean; // ag-Grid v33+ optimization
}

/**
 * Metadata attached to formatter functions for serialization
 */
export interface FormatterMetadata {
  __formatString: string;
  __formatterType: 'excel' | 'visual' | 'custom';
  __visualRules?: SerializedFormattingRule[];
  __visualDefaultFallback?: SerializedDefaultFallback;
}

/**
 * Metadata attached to cell style functions
 */
export interface CellStyleMetadata {
  __formatString?: string;
  __baseStyle?: React.CSSProperties;
  __cacheKey?: string;
}

/**
 * Enhanced formatter function type with metadata
 */
export type FormatterFunction = ((params: ValueFormatterParams) => string) & FormatterMetadata;

/**
 * Enhanced cell style function type with metadata
 */
export type CellStyleFunction = ((params: CellStyleParams) => React.CSSProperties | undefined) & CellStyleMetadata;

/**
 * Serialized formatting rule for visual formatter
 */
export interface SerializedFormattingRule {
  id: string;
  condition: {
    type: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'greaterEqual' | 'lessEqual' | 'between' | 'isEmpty' | 'isNotEmpty';
    value: string;
    value2?: string;
  };
  display: {
    type: 'text' | 'original' | 'custom';
    text: string;
  };
  styling: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline' | 'line-through';
    textAlign?: 'left' | 'center' | 'right';
    border?: {
      width: number;
      style: 'solid' | 'dashed' | 'dotted' | 'double';
      color: string;
      sides: {
        top: boolean;
        right: boolean;
        bottom: boolean;
        left: boolean;
      };
    };
    padding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  enabled: boolean;
}

/**
 * Serialized default fallback for visual formatter
 */
export interface SerializedDefaultFallback {
  display: {
    type: 'original' | 'text';
    text: string;
  };
  styling: SerializedFormattingRule['styling'];
}

/**
 * Props for DataTable component
 */
export interface DataTableProps {
  columnDefs: ColumnDef[];
  dataRow: Record<string, unknown>[];
}

/**
 * Context value for DataTable
 */
export interface DataTableContextValue {
  processedColumns: ColumnDef[];
  selectedFont: string;
  selectedFontSize: string;
  handleFontChange: (font: string) => void;
  handleFontSizeChange: (size: string) => void;
  showColumnDialog: boolean;
  setShowColumnDialog: (show: boolean) => void;
  gridApiRef: React.MutableRefObject<GridApi | null>;
  getColumnDefsWithStyles: () => ColumnDef[];
  setGridApi?: (api: GridApi | null) => void;
}

/**
 * Grid event types
 */
export type GridEvent = 
  | GridReadyEvent
  | CellValueChangedEvent
  | SortChangedEvent
  | FilterChangedEvent
  | ColumnResizedEvent
  | ColumnMovedEvent
  | ColumnPinnedEvent
  | ColumnVisibleEvent;

/**
 * Column property type for bulk updates
 */
export interface ColumnProperty {
  key: string;
  value: unknown;
  type?: 'style' | 'format' | 'general';
}

/**
 * Template properties for bulk actions
 */
export interface TemplateProperty {
  property: string;
  value: unknown;
  type?: string;
}