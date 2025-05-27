import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { ColDef as AgColDef } from 'ag-grid-community';
import { debounce } from 'lodash';

// Extend AG-Grid ColDef to include our custom properties
export interface ColDef extends AgColDef {
  valueFormat?: string;
}

export interface DialogState {
  // Dialog state
  open: boolean;

  // Column management
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  pendingChanges: Map<string, Partial<ColDef>>;

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
  onImmediateApply?: (columns: ColDef[]) => void;

  // Template columns for quick copy
  templateColumns: Set<string>;
}

export interface DialogActions {
  // Dialog actions
  setOpen: (open: boolean) => void;

  // Column management
  setSelectedColumns: (columns: Set<string>) => void;
  setColumnDefinitions: (columns: Map<string, ColDef>) => void;
  updateBulkProperty: (property: string, value: unknown) => void;
  updateBulkProperties: (properties: Record<string, unknown>) => void;
  applyChanges: () => ColDef[];
  resetChanges: () => void;
  setOnImmediateApply: (callback?: (columns: ColDef[]) => void) => void;

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

// Performance optimization: memoized selectors
export const useSelectedColumns = () => useColumnCustomizationStore(state => state.selectedColumns);
export const useColumnDefinitions = () => useColumnCustomizationStore(state => state.columnDefinitions);
export const usePendingChanges = () => useColumnCustomizationStore(state => state.pendingChanges);

// Create debounced apply function outside of the store
const debouncedApply = debounce((applyFn: () => void) => {
  applyFn();
}, 150);

export const useColumnCustomizationStore = create<ColumnCustomizationStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      // Initial state
      open: false,
      selectedColumns: new Set<string>(),
      columnDefinitions: new Map<string, ColDef>(),
      pendingChanges: new Map<string, Partial<ColDef>>(),
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
        if (selectedColumns.size === 0) return;
        
        const newPendingChanges = new Map(pendingChanges);

        // Batch updates for performance
        const processedValue = property === 'headerStyle' && typeof value === 'object'
          ? (params: { floatingFilter?: boolean }) => (!params.floatingFilter ? value : null)
          : value;

        selectedColumns.forEach(colId => {
          const existing = newPendingChanges.get(colId) || {};
          if (value === undefined) {
            const updated = { ...existing };
            delete updated[property as keyof ColDef];
            if (Object.keys(updated).length === 0) {
              newPendingChanges.delete(colId);
            } else {
              newPendingChanges.set(colId, updated);
            }
          } else {
            newPendingChanges.set(colId, { ...existing, [property]: processedValue });
          }
        });

        set({ pendingChanges: newPendingChanges });

        // Apply immediately if in immediate mode with debouncing
        if (applyMode === 'immediate' && onImmediateApply) {
          debouncedApply(() => {
            const updatedColumns = Array.from(columnDefinitions.entries()).map(([colId, colDef]) => {
              const changes = newPendingChanges.get(colId);
              return changes ? { ...colDef, ...changes } : colDef;
            });
            onImmediateApply(updatedColumns);
          });
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
              delete updated[property as keyof ColDef];
            } else {
              // Special handling for headerStyle to prevent floating filter contamination
              if (property === 'headerStyle' && typeof value === 'object') {
                const styleObject = value as React.CSSProperties;
                updated[property as keyof ColDef] = ((params: { floatingFilter?: boolean }) => {
                  if (!params.floatingFilter) {
                    return styleObject;
                  }
                  return null;
                }) as any;
              } else {
                updated[property as keyof ColDef] = value as any;
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

        // Apply immediately if in immediate mode with debouncing
        if (applyMode === 'immediate' && onImmediateApply) {
          debouncedApply(() => {
            const updatedColumns: ColDef[] = [];
            columnDefinitions.forEach((colDef, colId) => {
              const changes = newPendingChanges.get(colId);
              if (changes) {
                updatedColumns.push({ ...colDef, ...changes });
              } else {
                updatedColumns.push(colDef);
              }
            });
            onImmediateApply(updatedColumns);
          });
        }
      },

      applyChanges: () => {
        const { columnDefinitions, pendingChanges } = get();
        const updatedColumns: ColDef[] = [];

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
  )
);