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

/**
 * Grid profile for storing grid state
 */
export interface GridProfile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  description?: string;
  columnSettings?: {
    columnCustomizations?: Record<string, ColumnCustomization>;
    baseColumnDefs?: ColumnDef[];
    templates?: Record<string, unknown>[];
    columnTemplates?: Record<string, unknown>[];
  };
  gridState?: GridState;
  gridOptions?: Record<string, unknown>;
  gridState_legacy?: GridState;
}

/**
 * Column customization settings
 */
export interface ColumnCustomization {
  field: string;
  headerName?: string;
  valueFormatter?: string;
  cellStyle?: Record<string, unknown>;
  cellClass?: string | string[];
  headerClass?: string | string[];
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  hide?: boolean;
  pinned?: 'left' | 'right' | null;
  sort?: 'asc' | 'desc' | null;
  sortIndex?: number;
  flex?: number;
  resizable?: boolean;
  sortable?: boolean;
  filter?: boolean | string | {
    type: string;
    params?: any;
    showFloatingFilter?: boolean;
  };
  floatingFilter?: boolean;
  editable?: boolean;
  cellEditor?: string;
  cellEditorParams?: unknown;
  headerTooltip?: string;
  tooltip?: string;
  wrapText?: boolean;
  autoHeight?: boolean;
  wrapHeaderText?: boolean;
  autoHeaderHeight?: boolean;
  
  // Additional properties for FormattingEngine compatibility
  format?: any;
  style?: StyleSettings;
  editor?: EditorSettings;
  general?: Record<string, any>;
  conditionalFormats?: ConditionalFormat[];
}

/**
 * Grid state
 */
export interface GridState {
  columnDefs?: ColumnDef[];
  columnCustomizations?: Record<string, ColumnCustomization>;
  baseColumnDefs?: ColumnDef[];
  columnState: unknown[];
  filterModel: unknown;
  sortModel: unknown[];
  templates?: Record<string, unknown>[];
  columnTemplates?: Record<string, unknown>[];
  font?: string;
  gridOptions?: Record<string, unknown>;
}

/**
 * Template definition
 */
export interface Template {
  id: string;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
  category?: string;
  tags?: string[];
}

/**
 * Data source configuration
 */
export interface DataSourceConfig {
  id: string;
  name: string;
  type: 'stomp' | 'rest';
  active: boolean;
  config: unknown;
  schema: unknown | null;
  columnDefs: ColumnDef[];
  createdAt: number;
  updatedAt: number;
  lastFetch?: number;
  lastError?: string;
}

/**
 * Format rule for conditional formatting
 */
export interface FormatRule {
  id: string;
  condition: {
    type: string;
    value: unknown;
    value2?: unknown;
  };
  format: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
    fontStyle?: string;
  };
  enabled: boolean;
}

/**
 * Style settings
 */
export interface StyleSettings {
  backgroundColor?: string;
  color?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  textDecoration?: string;
  border?: unknown;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  padding?: unknown;
  className?: string;
  highlight?: boolean;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Editor settings
 */
export interface EditorSettings {
  enabled?: boolean;
  editable?: boolean;
  type?: string;
  cellEditor?: string;
  params?: unknown;
  cellEditorParams?: unknown;
  onCellValueChanged?: unknown;
}

/**
 * Filter settings
 */
export interface FilterSettings {
  filter?: boolean | string;
  filterParams?: unknown;
  floatingFilter?: boolean;
  floatingFilterComponent?: string;
  floatingFilterComponentParams?: unknown;
}

/**
 * Format settings
 */
export interface FormatSettings {
  type?: 'number' | 'currency' | 'percent' | 'date' | 'text' | 'excel' | 'percentage' | 'custom';
  format?: string;
  precision?: number;
  prefix?: string;
  suffix?: string;
  dateFormat?: string;
  locale?: string;
  decimalPlaces?: number;
  thousandsSeparator?: boolean;
  negativeFormat?: string;
  currency?: string;
  multiply100?: boolean;
  customFunction?: string;
}

/**
 * Conditional format
 */
export interface ConditionalFormat {
  id: string;
  condition: {
    type: string;
    value: unknown;
    value2?: unknown;
  };
  style: StyleSettings;
  enabled: boolean;
  className?: string;
  operator?: string;
  value?: any;
  customExpression?: string;
}

/**
 * Excel format
 */
export interface ExcelFormat {
  formatCode: string;
  type: 'number' | 'currency' | 'percent' | 'date' | 'time' | 'datetime' | 'text';
  pattern?: string;
  format?: string;
}

/**
 * Visual format
 */
export interface VisualFormat {
  type: 'conditional' | 'gradient' | 'dataBar' | 'icon';
  rules?: FormatRule[];
  config?: unknown;
}