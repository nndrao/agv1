import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { ColDef as AgColDef, ColumnState } from 'ag-grid-community';

// Use AG-Grid's ColDef directly
export type ColDef = AgColDef;

export interface DialogState {
  // Dialog state
  open: boolean;

  // Column management
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  columnState: Map<string, ColumnState>; // AG-Grid column state by colId
  pendingChanges: Map<string, Partial<ColDef>>;

  // UI state
  activeTab: string;
  showOnlyCommon: boolean;
  compareMode: boolean;
  searchTerm: string;
  cellDataTypeFilter: string;
  visibilityFilter: 'all' | 'visible' | 'hidden';
  uiMode: 'simple' | 'advanced';
  showPreviewPane: boolean;
  collapsedSections: Set<string>;
  quickFormatPinned: string[];

  // Panel states
  bulkActionsPanelCollapsed: boolean;
  showColumnDrawer: boolean;

  // Template columns for quick copy
  templateColumns: Set<string>;
}

export interface DialogActions {
  // Dialog actions
  setOpen: (open: boolean) => void;

  // Column management
  setSelectedColumns: (columns: Set<string>) => void;
  toggleColumnSelection: (columnId: string) => void;
  selectColumns: (columnIds: string[]) => void;
  deselectColumns: (columnIds: string[]) => void;
  setColumnDefinitions: (columns: Map<string, ColDef>) => void;
  setColumnState: (columnState: ColumnState[]) => void;
  updateBulkProperty: (property: string, value: unknown) => void;
  updateBulkProperties: (properties: Record<string, unknown>) => void;
  applyChanges: () => ColDef[];
  resetChanges: () => void;

  // UI actions
  setActiveTab: (tab: string) => void;
  setShowOnlyCommon: (show: boolean) => void;
  setCompareMode: (compare: boolean) => void;
  setSearchTerm: (term: string) => void;
  setCellDataTypeFilter: (filter: string) => void;
  setVisibilityFilter: (filter: 'all' | 'visible' | 'hidden') => void;
  setUiMode: (mode: 'simple' | 'advanced') => void;
  setShowPreviewPane: (show: boolean) => void;
  toggleSectionCollapse: (section: string) => void;
  setQuickFormatPinned: (formats: string[]) => void;
  toggleQuickFormat: (format: string) => void;

  // Panel actions
  setBulkActionsPanelCollapsed: (collapsed: boolean) => void;
  setShowColumnDrawer: (show: boolean) => void;

  // Template column actions
  toggleTemplateColumn: (columnId: string) => void;
  clearTemplateColumns: () => void;
}

export type ColumnCustomizationStore = DialogState & DialogActions;

// Performance optimization: memoized selectors
export const useSelectedColumns = () => useColumnCustomizationStore(state => state.selectedColumns);
export const useColumnDefinitions = () => useColumnCustomizationStore(state => state.columnDefinitions);
export const usePendingChanges = () => useColumnCustomizationStore(state => state.pendingChanges);

export const useColumnCustomizationStore = create<ColumnCustomizationStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      // Initial state
      open: false,
      selectedColumns: new Set<string>(),
      columnDefinitions: new Map<string, ColDef>(),
      columnState: new Map<string, ColumnState>(),
      pendingChanges: new Map<string, Partial<ColDef>>(),
      activeTab: 'general',
      showOnlyCommon: false,
      compareMode: false,
      searchTerm: '',
      cellDataTypeFilter: 'all',
      visibilityFilter: 'all',
      bulkActionsPanelCollapsed: false,
      templateColumns: new Set<string>(),
      uiMode: 'simple',
      showPreviewPane: false,
      collapsedSections: new Set<string>(),
      quickFormatPinned: ['number', 'currency', 'percentage', 'date', 'text'],
      showColumnDrawer: false,

      // Actions
      setOpen: (open) => set({ open }),

      setSelectedColumns: (columns) => set({ selectedColumns: columns }),
      
      toggleColumnSelection: (columnId: string) => {
        const { selectedColumns } = get();
        const newSelected = new Set(selectedColumns);
        if (newSelected.has(columnId)) {
          newSelected.delete(columnId);
        } else {
          newSelected.add(columnId);
        }
        set({ selectedColumns: newSelected });
      },
      
      selectColumns: (columnIds: string[]) => {
        const { selectedColumns } = get();
        const newSelected = new Set(selectedColumns);
        columnIds.forEach(id => newSelected.add(id));
        set({ selectedColumns: newSelected });
      },
      
      deselectColumns: (columnIds: string[]) => {
        const { selectedColumns } = get();
        const newSelected = new Set(selectedColumns);
        columnIds.forEach(id => newSelected.delete(id));
        set({ selectedColumns: newSelected });
      },

      setColumnDefinitions: (columns) => set({ columnDefinitions: columns }),

      setColumnState: (columnStateArray) => {
        const stateMap = new Map();
        if (columnStateArray) {
          console.log('[Store] Setting column state, array length:', columnStateArray.length);
          let visibleCount = 0;
          let hiddenCount = 0;
          
          columnStateArray.forEach(colState => {
            stateMap.set(colState.colId, colState);
            if (colState.hide) {
              hiddenCount++;
            } else {
              visibleCount++;
            }
          });
          
          console.log('[Store] Column state summary:', {
            total: columnStateArray.length,
            visible: visibleCount,
            hidden: hiddenCount,
            stateMapSize: stateMap.size
          });
        }
        set({ columnState: stateMap });
      },

      updateBulkProperty: (property, value) => {
        const { selectedColumns, pendingChanges } = get();
        if (selectedColumns.size === 0) return;
        
        // Prevent editing field property
        if (property === 'field') {
          console.warn('[Store] Field property cannot be edited');
          return;
        }
        
        // Prevent bulk editing of headerName
        if (property === 'headerName' && selectedColumns.size > 1) {
          console.warn('[Store] Header Name cannot be edited for multiple columns');
          return;
        }
        
        // Reuse existing Map for better performance
        const newPendingChanges = new Map(pendingChanges);

        // Process all updates in a single pass
        if (value === undefined) {
          // Delete property from selected columns
          for (const colId of selectedColumns) {
            const existing = newPendingChanges.get(colId);
            if (existing && property in existing) {
              const updated = { ...existing };
              delete updated[property as keyof ColDef];
              if (Object.keys(updated).length === 0) {
                newPendingChanges.delete(colId);
              } else {
                newPendingChanges.set(colId, updated);
              }
            }
          }
        } else {
          // Add/update property for selected columns
          for (const colId of selectedColumns) {
            const existing = newPendingChanges.get(colId);
            newPendingChanges.set(colId, existing ? { ...existing, [property]: value } : { [property]: value });
          }
        }

        set({ pendingChanges: newPendingChanges });
      },

      updateBulkProperties: (properties) => {
        const { selectedColumns, pendingChanges } = get();
        
        // Filter out field and headerName for safety
        const filteredProperties = { ...properties };
        
        // Always remove field from bulk updates
        delete filteredProperties.field;
        
        // Remove headerName if multiple columns are selected
        if (selectedColumns.size > 1) {
          delete filteredProperties.headerName;
        }
        
        const newPendingChanges = new Map(pendingChanges);

        selectedColumns.forEach(colId => {
          const existing = newPendingChanges.get(colId) || {};
          const updated = { ...existing };

          Object.entries(filteredProperties).forEach(([property, value]) => {
            if (value === undefined) {
              delete updated[property as keyof ColDef];
            } else {
              // For headerStyle, just save the style object directly
              // We'll convert it to a function when loading from storage
              (updated as Record<string, unknown>)[property] = value;
            }
          });

          if (Object.keys(updated).length === 0) {
            newPendingChanges.delete(colId);
          } else {
            newPendingChanges.set(colId, updated);
          }
        });

        set({ pendingChanges: newPendingChanges });

        // Never apply immediately - changes are only saved when Apply buttons are clicked
      },

      applyChanges: () => {
        const startTime = performance.now();
        const { columnDefinitions, pendingChanges } = get();
        
        // Early return if no changes
        if (pendingChanges.size === 0) {
          console.log('[ColumnCustomizationStore] No pending changes, returning original columns');
          return Array.from(columnDefinitions.values());
        }

        console.log('[ColumnCustomizationStore] applyChanges called:', {
          columnDefinitionsCount: columnDefinitions.size,
          pendingChangesCount: pendingChanges.size
        });

        // Pre-allocate array with exact size for better performance
        const updatedColumns = new Array(columnDefinitions.size);
        let index = 0;
        
        // Process columns in a single pass with minimal object creation
        for (const [colId, colDef] of columnDefinitions) {
          const changes = pendingChanges.get(colId);
          if (changes && Object.keys(changes).length > 0) {
            // Only create new object if there are changes
            updatedColumns[index] = { ...colDef, ...changes };
          } else {
            // Reuse existing object reference for unchanged columns
            updatedColumns[index] = colDef;
          }
          index++;
        }

        // Clear pending changes immediately
        set({ pendingChanges: new Map() });

        const endTime = performance.now();
        console.log('[ColumnCustomizationStore] applyChanges completed:', {
          totalColumns: updatedColumns.length,
          columnsWithChanges: pendingChanges.size,
          executionTime: `${(endTime - startTime).toFixed(2)}ms`
        });

        return updatedColumns;
      },

      resetChanges: () => set({ pendingChanges: new Map() }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setShowOnlyCommon: (show) => set({ showOnlyCommon: show }),
      setCompareMode: (compare) => set({ compareMode: compare }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setCellDataTypeFilter: (filter) => set({ cellDataTypeFilter: filter }),
      setVisibilityFilter: (filter) => set({ visibilityFilter: filter }),
      setBulkActionsPanelCollapsed: (collapsed) => set({ bulkActionsPanelCollapsed: collapsed }),
      setUiMode: (mode) => set({ uiMode: mode }),
      setShowPreviewPane: (show) => set({ showPreviewPane: show }),
      toggleSectionCollapse: (section) => {
        const { collapsedSections } = get();
        const newCollapsed = new Set(collapsedSections);
        if (newCollapsed.has(section)) {
          newCollapsed.delete(section);
        } else {
          newCollapsed.add(section);
        }
        set({ collapsedSections: newCollapsed });
      },
      setQuickFormatPinned: (formats) => set({ quickFormatPinned: formats }),
      toggleQuickFormat: (format) => {
        const { quickFormatPinned } = get();
        const newPinned = quickFormatPinned.includes(format)
          ? quickFormatPinned.filter(f => f !== format)
          : [...quickFormatPinned, format];
        set({ quickFormatPinned: newPinned });
      },
      setShowColumnDrawer: (show) => set({ showColumnDrawer: show }),

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
          activeTab: state.activeTab,
          showOnlyCommon: state.showOnlyCommon,
          compareMode: state.compareMode,
          cellDataTypeFilter: state.cellDataTypeFilter,
          visibilityFilter: state.visibilityFilter,
          bulkActionsPanelCollapsed: state.bulkActionsPanelCollapsed,
          templateColumns: Array.from(state.templateColumns), // Convert Set to Array for serialization
          uiMode: state.uiMode,
          showPreviewPane: state.showPreviewPane,
          collapsedSections: Array.from(state.collapsedSections), // Convert Set to Array
          quickFormatPinned: state.quickFormatPinned,
          showColumnDrawer: state.showColumnDrawer,
        }),
        onRehydrateStorage: () => (state) => {
          // Convert Sets back from Arrays after rehydration
          if (state) {
            if (Array.isArray(state.templateColumns)) {
              state.templateColumns = new Set(state.templateColumns);
            }
            if (Array.isArray(state.collapsedSections)) {
              state.collapsedSections = new Set(state.collapsedSections);
            }
          }
        },
      }
    )
  )
);