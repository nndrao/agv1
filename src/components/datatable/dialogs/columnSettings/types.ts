import { ColDef as AgColDef } from 'ag-grid-community';

// Extend AG-Grid ColDef to include our custom properties
export interface ColDef extends AgColDef {
  valueFormat?: string;
}

export interface DialogState {
  // Selection state
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  
  // Edit state
  pendingChanges: Map<string, Partial<ColDef>>;
  bulkChanges: Partial<ColDef>;
  applyMode: 'override' | 'merge' | 'empty';
  
  // UI state
  activeTab: string;
  searchTerm: string;
  groupBy: 'none' | 'type' | 'dataType';
  showOnlyCommon: boolean;
  compareMode: boolean;
  
  // History
  undoStack: ChangeSet[];
  redoStack: ChangeSet[];
}

export interface ChangeSet {
  timestamp: number;
  changes: Map<string, Partial<ColDef>>;
  description: string;
}

export interface ColumnGroup {
  name: string;
  icon: string;
  columns: ColDef[];
  expanded: boolean;
}

export interface PropertyDefinition {
  name: keyof ColDef;
  label: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'style' | 'function' | 'json';
  group: string;
  tab: string;
  options?: { value: unknown; label: string }[];
  validation?: (value: unknown) => boolean | string;
  description?: string;
}

export interface MixedValueInfo {
  hasMultipleValues: boolean;
  values: unknown[];
  commonValue?: unknown;
}

export const COLUMN_ICONS: Record<string, string> = {
  'number': '📊',
  'numericColumn': '📊',
  'currency': '💰',
  'date': '📅',
  'dateColumn': '📅',
  'text': '📝',
  'textColumn': '📝',
  'boolean': '✓',
  'booleanColumn': '✓',
  'object': '📦',
  'default': '📋'
};