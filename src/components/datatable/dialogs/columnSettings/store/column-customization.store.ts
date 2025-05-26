import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ColDef as AgColDef } from 'ag-grid-community';

export interface DialogState {
  // Dialog state
  open: boolean;

  // Column management
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, AgColDef>;
  pendingChanges: Map<string, Partial<AgColDef>>;

  // UI state
  activeTab: string;
  applyMode: 'immediate' | 'onSave';
  showOnlyCommon: boolean;
  compareMode: boolean;
  searchTerm: string;
  cellDataTypeFilter: string;

  // Panel states
  bulkActionsPanelCollapsed: boolean;

  // Immediate apply callback
  onImmediateApply?: (columns: AgColDef[]) => void;

  // Template columns for quick copy
  templateColumns: Set<string>;
}

export interface DialogActions {
  // Dialog actions
  setOpen: (open: boolean) => void;

  // Column management
  setSelectedColumns: (columns: Set<string>) => void;
  setColumnDefinitions: (columns: Map<string, AgColDef>) => void;
  updateBulkProperty: (property: string, value: unknown) => void;
  updateBulkProperties: (properties: Record<string, unknown>) => void;
  applyChanges: () => AgColDef[];
  resetChanges: () => void;
  setOnImmediateApply: (callback?: (columns: AgColDef[]) => void) => void;

  // UI actions
  setActiveTab: (tab: string) => void;
  setApplyMode: (mode: 'immediate' | 'onSave') => void;
  setShowOnlyCommon: (show: boolean) => void;
  setCompareMode: (compare: boolean) => void;
  setSearchTerm: (term: string) => void;
  setCellDataTypeFilter: (filter: string) => void;

  // Panel actions
  setBulkActionsPanelCollapsed: (collapsed: boolean) => void;

  // Template column actions
  toggleTemplateColumn: (columnId: string) => void;
  clearTemplateColumns: () => void;
}

export type ColumnCustomizationStore = DialogState & DialogActions;

export const useColumnCustomizationStore = create<ColumnCustomizationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      open: false,
      selectedColumns: new Set<string>(),
      columnDefinitions: new Map<string, AgColDef>(),
      pendingChanges: new Map<string, Partial<AgColDef>>(),
      activeTab: 'general',
      applyMode: 'onSave',
      showOnlyCommon: false,
      compareMode: false,
      searchTerm: '',
      cellDataTypeFilter: 'all',
      bulkActionsPanelCollapsed: false,
      onImmediateApply: undefined,
      templateColumns: new Set<string>(),

      // Actions
      setOpen: (open) => set({ open }),

      setSelectedColumns: (columns) => set({ selectedColumns: columns }),

      setColumnDefinitions: (columns) => set({ columnDefinitions: columns }),

      updateBulkProperty: (property, value) => {
        const { selectedColumns, pendingChanges, applyMode, onImmediateApply, columnDefinitions } = get();
        const newPendingChanges = new Map(pendingChanges);


        selectedColumns.forEach(colId => {
          const existing = newPendingChanges.get(colId) || {};
          if (value === undefined) {
            // Remove the property if value is undefined
            const updatedExisting = { ...existing };
            delete updatedExisting[property as keyof AgColDef];
            if (Object.keys(updatedExisting).length === 0) {
              newPendingChanges.delete(colId);
            } else {
              newPendingChanges.set(colId, updatedExisting);
            }
          } else {
            // Special handling for headerStyle to prevent floating filter contamination
            if (property === 'headerStyle' && typeof value === 'object') {
              // Convert static style object to a callback function that only applies to headers
              const styleObject = value as React.CSSProperties;
              value = (params: any) => {
                // Only apply styles to the actual header, not floating filters
                if (!params.floatingFilter) {
                  return styleObject;
                }
                // Return null for floating filters to keep them unstyled
                return null;
              };
            }
            newPendingChanges.set(colId, { ...existing, [property]: value });
          }
        });

        set({ pendingChanges: newPendingChanges });

        // Apply immediately if in immediate mode
        if (applyMode === 'immediate' && onImmediateApply) {
          const updatedColumns: AgColDef[] = [];
          columnDefinitions.forEach((colDef, colId) => {
            const changes = newPendingChanges.get(colId);
            if (changes) {
              updatedColumns.push({ ...colDef, ...changes });
            } else {
              updatedColumns.push(colDef);
            }
          });
          onImmediateApply(updatedColumns);
        }
      },

      updateBulkProperties: (properties) => {
        const { selectedColumns, pendingChanges, applyMode, onImmediateApply, columnDefinitions } = get();
        const newPendingChanges = new Map(pendingChanges);

        selectedColumns.forEach(colId => {
          const existing = newPendingChanges.get(colId) || {};
          const updated = { ...existing };

          Object.entries(properties).forEach(([property, value]) => {
            if (value === undefined) {
              delete updated[property as keyof AgColDef];
            } else {
              // Special handling for headerStyle to prevent floating filter contamination
              if (property === 'headerStyle' && typeof value === 'object') {
                const styleObject = value as React.CSSProperties;
                updated[property as keyof AgColDef] = ((params: any) => {
                  if (!params.floatingFilter) {
                    return styleObject;
                  }
                  return null;
                }) as any;
              } else {
                updated[property as keyof AgColDef] = value as any;
              }
            }
          });

          if (Object.keys(updated).length === 0) {
            newPendingChanges.delete(colId);
          } else {
            newPendingChanges.set(colId, updated);
          }
        });

        set({ pendingChanges: newPendingChanges });

        // Apply immediately if in immediate mode - do it once for all properties
        if (applyMode === 'immediate' && onImmediateApply) {
          const updatedColumns: AgColDef[] = [];
          columnDefinitions.forEach((colDef, colId) => {
            const changes = newPendingChanges.get(colId);
            if (changes) {
              updatedColumns.push({ ...colDef, ...changes });
            } else {
              updatedColumns.push(colDef);
            }
          });
          onImmediateApply(updatedColumns);
        }
      },

      applyChanges: () => {
        const { columnDefinitions, pendingChanges } = get();
        const updatedColumns: AgColDef[] = [];

        columnDefinitions.forEach((colDef, colId) => {
          const changes = pendingChanges.get(colId);
          if (changes) {
            updatedColumns.push({ ...colDef, ...changes });
          } else {
            updatedColumns.push(colDef);
          }
        });

        // Clear pending changes after applying
        set({ pendingChanges: new Map() });

        return updatedColumns;
      },

      resetChanges: () => set({ pendingChanges: new Map() }),

      setOnImmediateApply: (callback) => set({ onImmediateApply: callback }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setApplyMode: (mode) => set({ applyMode: mode }),
      setShowOnlyCommon: (show) => set({ showOnlyCommon: show }),
      setCompareMode: (compare) => set({ compareMode: compare }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setCellDataTypeFilter: (filter) => set({ cellDataTypeFilter: filter }),
      setBulkActionsPanelCollapsed: (collapsed) => set({ bulkActionsPanelCollapsed: collapsed }),

      // Template column actions
      toggleTemplateColumn: (columnId) => {
        const { templateColumns } = get();
        const newTemplates = new Set(templateColumns);
        if (newTemplates.has(columnId)) {
          newTemplates.delete(columnId);
        } else {
          newTemplates.add(columnId);
        }
        set({ templateColumns: newTemplates });
      },

      clearTemplateColumns: () => set({ templateColumns: new Set() }),
    }),
    {
      name: 'column-customization-store',
      partialize: (state) => ({
        // Only persist UI preferences, not data
        applyMode: state.applyMode,
        activeTab: state.activeTab,
        showOnlyCommon: state.showOnlyCommon,
        compareMode: state.compareMode,
        cellDataTypeFilter: state.cellDataTypeFilter,
        bulkActionsPanelCollapsed: state.bulkActionsPanelCollapsed,
        templateColumns: Array.from(state.templateColumns), // Convert Set to Array for serialization
      }),
      onRehydrateStorage: () => (state) => {
        // Convert templateColumns back to Set after rehydration
        if (state && Array.isArray(state.templateColumns)) {
          state.templateColumns = new Set(state.templateColumns);
        }
      },
    }
  )
);