import type { ColDef } from 'ag-grid-community';

export interface FloatingRibbonUIProps {
  targetColumn?: string;
  initialPosition?: { x: number; y: number };
  onClose?: () => void;
  columnDefs?: ColDef[];
  columnState?: any[];
  onApply?: (updatedColumnDefs: ColDef[]) => void;
}

export interface RibbonHeaderProps {
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  hasChanges: boolean;
  onSelectionChange: (columns: Set<string>) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export interface RibbonTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedColumns: Set<string>;
}

export interface RibbonContentProps {
  activeTab: string;
  selectedColumns: Set<string>;
  formatCategory: string;
  setFormatCategory: (category: string) => void;
  currentFormat: string;
  setCurrentFormat: (format: string) => void;
  showConditionalDialog: boolean;
  setShowConditionalDialog: (show: boolean) => void;
  advancedFilterTab: string;
  setAdvancedFilterTab: (tab: string) => void;
}

export interface RibbonPreviewProps {
  activeTab: string;
  selectedColumns: Set<string>;
  currentFormat?: string;
}

export interface TabContentProps {
  selectedColumns: Set<string>;
}

export interface FormatTabProps extends TabContentProps {
  formatCategory: string;
  setFormatCategory: (category: string) => void;
  currentFormat: string;
  setCurrentFormat: (format: string) => void;
  showConditionalDialog: boolean;
  setShowConditionalDialog: (show: boolean) => void;
}

export interface FilterTabProps extends TabContentProps {
  advancedFilterTab: string;
  setAdvancedFilterTab: (tab: string) => void;
}

export interface MixedValue<T = unknown> {
  value: T;
  isMixed: boolean;
  values?: unknown[];
}

export type RibbonTab = 'general' | 'styling' | 'format' | 'filter' | 'editor';

export type FormatCategory = 'numbers' | 'currency' | 'percent' | 'datetime' | 'text'; 