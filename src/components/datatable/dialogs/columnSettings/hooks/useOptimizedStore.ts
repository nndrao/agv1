import { useColumnCustomizationStore } from '../store/column-customization.store';
import { shallow } from 'zustand/shallow';

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
    toggleColumn: state.toggleColumn,
    applyChanges: state.applyChanges,
    resetChanges: state.resetChanges,
  }),
  shallow
);

// Combined selector for components that need multiple values
export const useColumnState = () => useColumnCustomizationStore(
  state => ({
    selectedColumns: state.selectedColumns,
    columnDefinitions: state.columnDefinitions,
    pendingChanges: state.pendingChanges,
  }),
  shallow
);