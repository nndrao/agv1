import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useColumnFormattingStore } from '../store/columnFormatting.store';
import { useInstanceProfile } from '@/components/datatable/ProfileStoreProvider';
import type { ColDef, ColumnState } from 'ag-grid-community';
import type { RibbonTab, FormatCategory } from '../types';

type MixedValue = any | 'mixed' | undefined;

interface UseRibbonStateProps {
  targetColumn?: string;
  columnDefs?: ColDef[];
  columnState?: ColumnState[];
  onApply?: (updatedColumnDefs: ColDef[]) => void;
  onClose?: () => void;
}

export const useInstanceRibbonState = ({
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
    setVisibilityFilter,
    clearSelectedColumnsCustomizations
  } = useColumnFormattingStore();

  // Instance-specific profile store integration
  const getActiveProfile = useInstanceProfile((state) => state.getActiveProfile);

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
      console.log('[useInstanceRibbonState] Initializing with columnDefs:', {
        totalColumns: columnDefs.length,
        hasColumnState: !!columnState,
        stateLength: columnState?.length || 0
      });
      
      // Convert column definitions array to Map for the store
      const columnMap = new Map<string, ColDef>();
      columnDefs.forEach(col => {
        const colId = col.field || col.colId || '';
        if (colId) {
          columnMap.set(colId, col);
        }
      });
      setColumnDefinitions(columnMap);
      
      // Set column state if provided
      if (columnState && columnState.length > 0) {
        console.log('[useInstanceRibbonState] Setting column state:', {
          stateLength: columnState.length,
          firstColumn: columnState[0]?.colId,
          hiddenColumns: columnState.filter(cs => cs.hide === true).length
        });
        setColumnState(columnState);
      }
      
      // Pre-select the target column if specified
      if (targetColumn) {
        console.log('[useInstanceRibbonState] Pre-selecting target column:', targetColumn);
        setSelectedColumns(new Set([targetColumn]));
      }
      
      // Set visibility filter to show only visible columns by default
      setVisibilityFilter('visible');
      
      setHasInitialized(true);
    }
  }, [columnDefs, columnState, targetColumn, setColumnDefinitions, setColumnState, setSelectedColumns, setVisibilityFilter, hasInitialized]);

  // Update column state when it changes from props
  useEffect(() => {
    if (hasInitialized && columnState && columnState.length > 0) {
      console.log('[useInstanceRibbonState] Updating column state:', {
        stateLength: columnState.length,
        hiddenColumns: columnState.filter(cs => cs.hide === true).length
      });
      setColumnState(columnState);
    }
  }, [columnState, setColumnState, hasInitialized]);

  // Load profile customizations for selected columns
  useEffect(() => {
    if (selectedColumns.size > 0 && columnDefs) {
      console.log('[useInstanceRibbonState] Loading customizations for selected columns:', Array.from(selectedColumns));
      
      const activeProfile = getActiveProfile();
      if (activeProfile?.columnSettings?.columnCustomizations) {
        console.log('[useInstanceRibbonState] Found customizations in active profile:', {
          profileName: activeProfile.name,
          customizationCount: Object.keys(activeProfile.columnSettings.columnCustomizations).length
        });
        
        // Apply customizations from profile to selected columns
        selectedColumns.forEach(colId => {
          const customization = activeProfile.columnSettings?.columnCustomizations?.[colId];
          if (customization) {
            console.log('[useInstanceRibbonState] Applying customization for column:', colId, customization);
            // The store should handle applying these customizations
          }
        });
      }
    }
  }, [selectedColumns, columnDefs, getActiveProfile]);

  // Utility functions
  const getSelectedColumnDefs = useCallback(() => {
    const selectedDefs: ColDef[] = [];
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      if (colDef) {
        selectedDefs.push(colDef);
      }
    });
    return selectedDefs;
  }, [columnDefinitions, selectedColumns]);

  const getMixedValue = useCallback((
    getter: (col: ColDef) => any
  ): MixedValue => {
    const selectedDefs = getSelectedColumnDefs();
    if (selectedDefs.length === 0) return undefined;
    
    const firstValue = getter(selectedDefs[0]);
    const hasMultiple = selectedDefs.some(col => getter(col) !== firstValue);
    
    return hasMultiple ? 'mixed' : firstValue;
  }, [getSelectedColumnDefs]);

  // Handlers
  const handleApply = useCallback(() => {
    console.log('[useInstanceRibbonState] Applying changes:', {
      selectedColumnsCount: selectedColumns.size,
      pendingChangesCount: Object.keys(pendingChanges).length,
      hasOnApply: !!onApply
    });
    
    try {
      // Apply all pending changes to column definitions
      const updatedDefs = applyChanges();
      
      if (onApply && updatedDefs) {
        console.log('[useInstanceRibbonState] Calling onApply with updated definitions:', {
          columnCount: updatedDefs.length,
          modifiedColumns: Object.keys(pendingChanges)
        });
        onApply(updatedDefs);
        
        // Show success toast
        const modifiedCount = Object.keys(pendingChanges).length;
        if (modifiedCount > 0) {
          toast.success(`Updated ${modifiedCount} column${modifiedCount > 1 ? 's' : ''}`);
        }
      }
    } catch (error) {
      console.error('[useInstanceRibbonState] Error applying changes:', error);
      toast.error('Failed to apply changes');
    }
  }, [selectedColumns, pendingChanges, applyChanges, onApply]);

  const handleReset = useCallback(() => {
    console.log('[useInstanceRibbonState] Resetting changes');
    resetChanges();
    toast.info('Changes reset');
  }, [resetChanges]);

  const handleTabChange = useCallback((tab: RibbonTab) => {
    console.log('[useInstanceRibbonState] Changing tab to:', tab);
    setActiveTab(tab);
  }, []);

  return {
    // State
    activeTab,
    formatCategory,
    currentFormat,
    showConditionalDialog,
    advancedFilterTab,
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    
    // Setters
    setActiveTab: handleTabChange,
    setFormatCategory: (category: string) => setFormatCategory(category as FormatCategory),
    setCurrentFormat,
    setShowConditionalDialog,
    setAdvancedFilterTab,
    setSelectedColumns,
    
    // Utilities
    getMixedValue,
    getSelectedColumnDefs,
    
    // Actions
    updateBulkProperty,
    clearSelectedColumnsCustomizations,
    handleApply,
    handleReset,
  };
};