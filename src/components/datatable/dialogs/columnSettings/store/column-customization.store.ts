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
}

export interface DialogActions {
  // Dialog actions
  setOpen: (open: boolean) => void;

  // Column management
  setSelectedColumns: (columns: Set<string>) => void;
  setColumnDefinitions: (columns: Map<string, AgColDef>) => void;
  updateBulkProperty: (property: string, value: unknown) => void;
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
      }),
    }
  )
);