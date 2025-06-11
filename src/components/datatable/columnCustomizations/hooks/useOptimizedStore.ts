import { useColumnCustomizationStore } from '../store/columnCustomization.store';
import { useMemo } from 'react';

// Optimized selectors for better performance
export const useSelectedColumns = () => useColumnCustomizationStore(state => state.selectedColumns);
export const useColumnDefinitions = () => useColumnCustomizationStore(state => state.columnDefinitions);
export const usePendingChanges = () => useColumnCustomizationStore(state => state.pendingChanges);

// Use shallow comparison for actions to prevent re-renders
export const useColumnActions = () => useColumnCustomizationStore(
  state => ({
    updateBulkProperty: state.updateBulkProperty,
    updateBulkProperties: state.updateBulkProperties,
    setSelectedColumns: state.setSelectedColumns,
    toggleColumnSelection: state.toggleColumnSelection,
    applyChanges: state.applyChanges,
    resetChanges: state.resetChanges,
  })
);

// Combined selector for components that need multiple values
export const useColumnState = () => useColumnCustomizationStore(
  state => ({
    selectedColumns: state.selectedColumns,
    columnDefinitions: state.columnDefinitions,
    pendingChanges: state.pendingChanges,
  })
);

// Optimized hook for apply operations with memoized values
export const useApplyOperations = () => {
  const applyChanges = useColumnCustomizationStore(state => state.applyChanges);
  const pendingChanges = useColumnCustomizationStore(state => state.pendingChanges);
  
  // Memoize pending changes count to avoid recalculation on every render
  const pendingChangesCount = useMemo(() => {
    return Array.from(pendingChanges.values()).reduce(
      (acc, changes) => acc + Object.keys(changes).length, 
      0
    );
  }, [pendingChanges]);
  
  // Memoize has changes check
  const hasChanges = pendingChanges.size > 0;
  
  return {
    applyChanges,
    pendingChangesCount,
    hasChanges
  };
};

// Hook for dialog controls
export const useDialogControls = () => {
  return useColumnCustomizationStore(
    state => ({
      open: state.open,
      setOpen: state.setOpen,
      activeTab: state.activeTab,
      setActiveTab: state.setActiveTab,
      bulkActionsPanelCollapsed: state.bulkActionsPanelCollapsed,
      setBulkActionsPanelCollapsed: state.setBulkActionsPanelCollapsed,
    })
  );
};