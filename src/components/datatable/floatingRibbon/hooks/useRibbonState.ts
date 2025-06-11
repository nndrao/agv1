import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useColumnCustomizationStore } from '../../dialogs/columnSettings/store/columnCustomization.store';
import { useProfileStore } from '../../stores/profile.store';
import type { ColDef, ColumnState } from 'ag-grid-community';
import type { MixedValue, RibbonTab, FormatCategory } from '../types';

interface UseRibbonStateProps {
  targetColumn?: string;
  columnDefs?: ColDef[];
  columnState?: ColumnState[];
  onApply?: (updatedColumnDefs: ColDef[]) => void;
  onClose?: () => void;
}

export const useRibbonState = ({
  targetColumn,
  columnDefs,
  columnState,
  onApply
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
    resetChanges,
    setVisibilityFilter
  } = useColumnCustomizationStore();

  // Profile store integration
  const { saveColumnSettings, getActiveProfile } = useProfileStore();

  // Local state
  const [activeTab, setActiveTab] = useState<RibbonTab>('styling');
  const [formatCategory, setFormatCategory] = useState<FormatCategory>('numbers');
  const [currentFormat, setCurrentFormat] = useState('#,##0.00');
  const [showConditionalDialog, setShowConditionalDialog] = useState(false);
  const [advancedFilterTab, setAdvancedFilterTab] = useState('general');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Reset visibility filter only on initial mount
  useEffect(() => {
    if (!hasInitialized && columnDefs && columnDefs.length > 0) {
      setVisibilityFilter('all');
      setHasInitialized(true);
    }
  }, [hasInitialized, columnDefs, setVisibilityFilter]);

  // Initialize store with provided column definitions and hydrate from active profile
  useEffect(() => {
    if (columnDefs && columnDefs.length > 0) {
      console.log('[RibbonState] Initializing with columnDefs:', {
        columnDefsCount: columnDefs.length,
        targetColumn,
        hasActiveProfile: !!getActiveProfile()
      });

      // Only reset visibility filter on initial mount, not on column selection changes
      // This preserves user's filter choices when selecting/deselecting columns

      // Create column map from provided columnDefs
      const columnMap = new Map();
      columnDefs.forEach(colDef => {
        if (colDef.field || colDef.colId) {
          columnMap.set(colDef.field || colDef.colId!, colDef);
        }
      });
      setColumnDefinitions(columnMap);

      // Select target column if provided, otherwise select first column
      if (targetColumn) {
        setSelectedColumns(new Set([targetColumn]));
      } else if (columnDefs.length > 0) {
        // Check current selection first to avoid unnecessary updates
        const currentSelection = useColumnCustomizationStore.getState().selectedColumns;
        if (currentSelection.size === 0) {
          // Select first column if none selected
          const firstColId = columnDefs[0].field || columnDefs[0].colId;
          if (firstColId) {
            setSelectedColumns(new Set([firstColId]));
          }
        }
      }
    }
  }, [columnDefs, targetColumn, setColumnDefinitions, setSelectedColumns, getActiveProfile, setVisibilityFilter]);

  // Set column state when provided
  useEffect(() => {
    if (columnState) {
      console.log('[RibbonState] Setting column state:', {
        columnStateCount: columnState.length,
        hasVisibilityInfo: columnState.some(cs => cs.hide !== undefined)
      });
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
    } else if (typeof cellStyleValue.value === 'function') {
      // Check base style metadata for function-based styles
      const styleFunction = cellStyleValue.value as any;
      const baseStyle = styleFunction.__baseStyle;
      if (baseStyle) {
        if (baseStyle.fontWeight === 'bold' || baseStyle.fontWeight === '700') styles.push('bold');
        if (baseStyle.fontStyle === 'italic') styles.push('italic');
        if (baseStyle.textDecoration === 'underline') styles.push('underline');
      }
    }
    
    return styles;
  }, [getMixedValue]);

  // Enhanced apply changes - only updates grid, doesn't save to profile
  const handleApply = useCallback(() => {
    try {
      console.log('[RibbonState] Applying changes:', {
        selectedColumnsCount: selectedColumns.size,
        pendingChangesCount: pendingChanges.size,
        hasOnApply: !!onApply
      });

      // Apply changes to get updated column definitions
      const updatedColumnDefs = applyChanges();
      
      console.log('[RibbonState] Updated column definitions:', {
        totalColumns: updatedColumnDefs.length,
        columnsWithStyles: updatedColumnDefs.filter(col => col.cellStyle).length,
        columnsWithFormatters: updatedColumnDefs.filter(col => col.valueFormatter).length,
        sampleColumn: updatedColumnDefs.find(col => col.cellStyle || col.valueFormatter)
      });
      
      // Call the onApply callback to update the grid
      // This updates the grid but doesn't save to the profile/localStorage
      if (onApply) {
        onApply(updatedColumnDefs);
      }

      toast.success(`Applied changes to ${selectedColumns.size} column${selectedColumns.size === 1 ? '' : 's'}`);
      
      // Note: Don't close automatically - let user decide when to close
      // onClose?.();
    } catch (error) {
      console.error('[RibbonState] Error applying changes:', error);
      toast.error('Failed to apply changes');
    }
  }, [applyChanges, onApply, selectedColumns.size]);

  // Reset changes
  const handleReset = useCallback(() => {
    resetChanges();
    toast.success('Reset all pending changes');
  }, [resetChanges]);


  // Direct pass-through to store's updateBulkProperty
  // The StylingRibbonContent component now handles all the cellStyle/headerStyle logic
  // exactly matching the column settings dialog patterns
  const handleUpdateBulkProperty = useCallback((property: string, value: unknown) => {
    console.log('[RibbonState] Updating bulk property:', {
      property,
      value: typeof value === 'function' ? 'function' : value,
      selectedColumnsCount: selectedColumns.size
    });

    // Direct pass-through - let the components handle the logic
    updateBulkProperty(property, value);
  }, [updateBulkProperty, selectedColumns.size]);

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
    updateBulkProperty: handleUpdateBulkProperty, // Use enhanced version
    
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