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

  // Panel states
  bulkActionsPanelCollapsed: boolean;
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

  // UI actions
  setActiveTab: (tab: string) => void;
  setApplyMode: (mode: 'immediate' | 'onSave') => void;
  setShowOnlyCommon: (show: boolean) => void;
  setCompareMode: (compare: boolean) => void;
  setSearchTerm: (term: string) => void;

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
      bulkActionsPanelCollapsed: false,

      // Actions
      setOpen: (open) => set({ open }),

      setSelectedColumns: (columns) => set({ selectedColumns: columns }),

      setColumnDefinitions: (columns) => set({ columnDefinitions: columns }),

      updateBulkProperty: (property, value) => {
        const { selectedColumns, pendingChanges } = get();
        const newPendingChanges = new Map(pendingChanges);

        selectedColumns.forEach(colId => {
          const existing = newPendingChanges.get(colId) || {};
          newPendingChanges.set(colId, { ...existing, [property]: value });
        });

        set({ pendingChanges: newPendingChanges });
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

      setActiveTab: (tab) => set({ activeTab: tab }),
      setApplyMode: (mode) => set({ applyMode: mode }),
      setShowOnlyCommon: (show) => set({ showOnlyCommon: show }),
      setCompareMode: (compare) => set({ compareMode: compare }),
      setSearchTerm: (term) => set({ searchTerm: term }),
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
        bulkActionsPanelCollapsed: state.bulkActionsPanelCollapsed,
      }),
    }
  )
);