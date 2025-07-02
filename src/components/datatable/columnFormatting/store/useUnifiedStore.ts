import { useUIPreferencesStore } from './domains/uiPreferences.store';
import { useColumnSelectionStore } from './domains/columnSelection.store';
import { useColumnDataStore } from './domains/columnData.store';
import type { ColumnFormattingStore } from './columnFormatting.store';

/**
 * Hook that provides a unified interface matching the original store API
 * This ensures backward compatibility while using the new domain-specific stores
 */
export function useUnifiedColumnFormattingStore(): ColumnFormattingStore {
  const uiStore = useUIPreferencesStore();
  const selectionStore = useColumnSelectionStore();
  const dataStore = useColumnDataStore();

  // Create a unified store object that matches the original interface
  return {
    // Dialog state
    open: dataStore.open,
    setOpen: dataStore.setOpen,

    // Column management - from selection store
    selectedColumns: selectionStore.selectedColumns,
    setSelectedColumns: selectionStore.setSelectedColumns,
    toggleColumnSelection: selectionStore.toggleColumnSelection,
    selectColumns: selectionStore.selectColumns,
    deselectColumns: selectionStore.deselectColumns,
    
    // Column data - from data store
    columnDefinitions: dataStore.columnDefinitions,
    columnState: dataStore.columnState,
    pendingChanges: dataStore.pendingChanges,
    setColumnDefinitions: dataStore.setColumnDefinitions,
    setColumnState: dataStore.setColumnState,
    updateBulkProperty: (property: string, value: unknown) => {
      dataStore.updateBulkProperty(property, value, selectionStore.selectedColumns);
    },
    updateBulkProperties: (properties: Record<string, unknown>) => {
      dataStore.updateBulkProperties(properties, selectionStore.selectedColumns);
    },
    applyChanges: dataStore.applyChanges,
    resetChanges: dataStore.resetChanges,

    // UI state - from UI preferences store
    activeTab: uiStore.activeTab,
    showOnlyCommon: uiStore.showOnlyCommon,
    compareMode: uiStore.compareMode,
    searchTerm: uiStore.searchTerm,
    cellDataTypeFilter: uiStore.cellDataTypeFilter,
    visibilityFilter: uiStore.visibilityFilter,
    uiMode: uiStore.uiMode,
    showPreviewPane: uiStore.showPreviewPane,
    collapsedSections: uiStore.collapsedSections,
    quickFormatPinned: uiStore.quickFormatPinned,
    
    // UI actions - from UI preferences store
    setActiveTab: uiStore.setActiveTab,
    setShowOnlyCommon: uiStore.setShowOnlyCommon,
    setCompareMode: uiStore.setCompareMode,
    setSearchTerm: uiStore.setSearchTerm,
    setCellDataTypeFilter: uiStore.setCellDataTypeFilter,
    setVisibilityFilter: uiStore.setVisibilityFilter,
    setUiMode: uiStore.setUiMode,
    setShowPreviewPane: uiStore.setShowPreviewPane,
    toggleSectionCollapse: uiStore.toggleSectionCollapse,
    setQuickFormatPinned: uiStore.setQuickFormatPinned,
    toggleQuickFormat: uiStore.toggleQuickFormat,

    // Panel states - from UI preferences store
    bulkActionsPanelCollapsed: uiStore.bulkActionsPanelCollapsed,
    showColumnDrawer: uiStore.showColumnDrawer,
    setBulkActionsPanelCollapsed: uiStore.setBulkActionsPanelCollapsed,
    setShowColumnDrawer: uiStore.setShowColumnDrawer,

    // Template columns - from selection store
    templateColumns: selectionStore.templateColumns,
    toggleTemplateColumn: selectionStore.toggleTemplateColumn,
    clearTemplateColumns: selectionStore.clearTemplateColumns,
    
    // Applied templates - from data store
    appliedTemplates: dataStore.appliedTemplates,
    setAppliedTemplate: dataStore.setAppliedTemplate,
    removeAppliedTemplate: dataStore.removeAppliedTemplate,
    
    // Customization removal - from data store
    removeColumnCustomization: dataStore.removeColumnCustomization,
    clearAllCustomizations: dataStore.clearAllCustomizations,
    clearSelectedColumnsCustomizations: () => {
      return dataStore.clearSelectedColumnsCustomizations(selectionStore.selectedColumns);
    },
  };
}

/**
 * Individual store hooks for components that only need specific domains
 */
export { useUIPreferencesStore } from './domains/uiPreferences.store';
export { useColumnSelectionStore } from './domains/columnSelection.store';
export { useColumnDataStore } from './domains/columnData.store';