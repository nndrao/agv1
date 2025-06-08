import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useColumnCustomizationStore } from '../../dialogs/columnSettings/store/columnCustomization.store';
import type { ColDef } from 'ag-grid-community';
import type { MixedValue, RibbonTab, FormatCategory } from '../types';

interface UseRibbonStateProps {
  targetColumn?: string;
  columnDefs?: ColDef[];
  columnState?: any[];
  onApply?: (updatedColumnDefs: ColDef[]) => void;
  onClose?: () => void;
}

export const useRibbonState = ({
  targetColumn,
  columnDefs,
  columnState,
  onApply,
  onClose
}: UseRibbonStateProps) => {
  // Store integration
  const {
    selectedColumns,
    setSelectedColumns,
    columnDefinitions,
    setColumnDefinitions,
    setColumnState,
    pendingChanges,
    updateBulkProperty,
    applyChanges,
    resetChanges
  } = useColumnCustomizationStore();

  // Local state
  const [activeTab, setActiveTab] = useState<RibbonTab>('styling');
  const [formatCategory, setFormatCategory] = useState<FormatCategory>('numbers');
  const [currentFormat, setCurrentFormat] = useState('#,##0.00');
  const [showConditionalDialog, setShowConditionalDialog] = useState(false);
  const [advancedFilterTab, setAdvancedFilterTab] = useState('general');

  // Initialize store with provided column definitions
  useEffect(() => {
    if (columnDefs && columnDefs.length > 0) {
      const columnMap = new Map();
      columnDefs.forEach(colDef => {
        if (colDef.field || colDef.colId) {
          columnMap.set(colDef.field || colDef.colId!, colDef);
        }
      });
      setColumnDefinitions(columnMap);

      // Select target column if provided
      if (targetColumn) {
        setSelectedColumns(new Set([targetColumn]));
      }
    }
  }, [columnDefs, targetColumn, setColumnDefinitions, setSelectedColumns]);

  // Set column state when provided
  useEffect(() => {
    if (columnState) {
      setColumnState(columnState);
    }
  }, [columnState, setColumnState]);

  // Helper function to get mixed values for multi-column editing
  const getMixedValue = useCallback((property: string): MixedValue => {
    const values = new Set();
    const allValues: unknown[] = [];

    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);

      // Check pending changes first, then fall back to column definition
      let value;
      if (pendingChange && property in pendingChange) {
        value = pendingChange[property as keyof typeof pendingChange];
      } else if (colDef) {
        value = colDef[property as keyof typeof colDef];
      }

      values.add(value);
      allValues.push(value);
    });

    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true, values: allValues };
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Helper functions for styling preview
  const getCurrentAlignment = useCallback(() => {
    const cellClassValue = getMixedValue('cellClass');
    const cellClass = (typeof cellClassValue.value === 'string' ? cellClassValue.value : '').trim();
    
    if (cellClass.includes('text-center') || cellClass.includes('justify-center')) return 'center';
    if (cellClass.includes('text-right') || cellClass.includes('justify-end')) return 'right';
    return 'left';
  }, [getMixedValue]);

  const getCurrentStyles = useCallback(() => {
    const cellStyleValue = getMixedValue('cellStyle');
    const styles: string[] = [];
    
    if (cellStyleValue.value && typeof cellStyleValue.value === 'object') {
      const styleObj = cellStyleValue.value as React.CSSProperties;
      if (styleObj.fontWeight === 'bold' || styleObj.fontWeight === '700') styles.push('bold');
      if (styleObj.fontStyle === 'italic') styles.push('italic');
      if (styleObj.textDecoration === 'underline') styles.push('underline');
    }
    
    return styles;
  }, [getMixedValue]);

  // Apply changes and close
  const handleApply = useCallback(() => {
    try {
      const updatedColumnDefs = applyChanges();
      if (onApply) {
        onApply(updatedColumnDefs);
      }
      toast.success(`Applied changes to ${selectedColumns.size} column${selectedColumns.size === 1 ? '' : 's'}`);
      onClose?.();
    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error('Failed to apply changes');
    }
  }, [applyChanges, onApply, selectedColumns.size, onClose]);

  // Reset changes
  const handleReset = useCallback(() => {
    resetChanges();
    toast.success('Reset all pending changes');
  }, [resetChanges]);

  // Wrapper functions to match interface types
  const handleSetActiveTab = useCallback((tab: string) => {
    setActiveTab(tab as RibbonTab);
  }, []);

  const handleSetFormatCategory = useCallback((category: string) => {
    setFormatCategory(category as FormatCategory);
  }, []);

  const handleSetAdvancedFilterTab = useCallback((tab: string) => {
    setAdvancedFilterTab(tab);
  }, []);

  return {
    // Store state
    selectedColumns,
    setSelectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty,
    
    // Local state
    activeTab,
    setActiveTab: handleSetActiveTab,
    formatCategory,
    setFormatCategory: handleSetFormatCategory,
    currentFormat,
    setCurrentFormat,
    showConditionalDialog,
    setShowConditionalDialog,
    advancedFilterTab,
    setAdvancedFilterTab: handleSetAdvancedFilterTab,
    
    // Helper functions
    getMixedValue,
    getCurrentAlignment,
    getCurrentStyles,
    
    // Actions
    handleApply,
    handleReset
  };
}; 