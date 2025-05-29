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

  // Panel states
  bulkActionsPanelCollapsed: boolean;

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
        
        // Use the existing Map when possible
        const newPendingChanges = pendingChanges.size > 0 ? new Map(pendingChanges) : new Map();

        // Don't convert headerStyle to function here - do it only when applying
        const processedValue = value;

        // Use batch update for better performance
        const updates: Array<[string, Partial<ColDef>]> = [];
        
        selectedColumns.forEach(colId => {
          const existing = newPendingChanges.get(colId);
          
          if (value === undefined) {
            if (existing && property in existing) {
              const updated = { ...existing };
              delete updated[property as keyof ColDef];
              if (Object.keys(updated).length === 0) {
                newPendingChanges.delete(colId);
              } else {
                updates.push([colId, updated]);
              }
            }
          } else {
            const updated = existing ? { ...existing, [property]: processedValue } : { [property]: processedValue };
            updates.push([colId, updated]);
          }
        });
        
        // Apply all updates at once
        updates.forEach(([colId, changes]) => {
          newPendingChanges.set(colId, changes);
        });

        set({ pendingChanges: newPendingChanges });

        // Never apply immediately - changes are only saved when Apply buttons are clicked
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
        const { columnDefinitions, pendingChanges } = get();
        
        console.log('[ColumnCustomizationStore] applyChanges called:', {
          columnDefinitionsCount: columnDefinitions.size,
          pendingChangesCount: pendingChanges.size,
          pendingChangesDetails: Array.from(pendingChanges.entries()).map(([colId, changes]) => ({
            colId,
            changes: Object.keys(changes)
          }))
        });
        
        // Early return if no changes
        if (pendingChanges.size === 0) {
          console.log('[ColumnCustomizationStore] No pending changes, returning original columns');
          return Array.from(columnDefinitions.values());
        }

        // Only update columns that have changes
        const updatedColumns: ColDef[] = [];
        const changedColIds = new Set(pendingChanges.keys());
        
        // Process columns in a single pass
        for (const [colId, colDef] of columnDefinitions) {
          if (changedColIds.has(colId)) {
            const changes = pendingChanges.get(colId)!;
            // Process changes to handle special cases
            const processedChanges = { ...changes };
            
            // Only spread if we have actual changes
            const updatedCol = Object.keys(processedChanges).length > 0 ? { ...colDef, ...processedChanges } : colDef;
            updatedColumns.push(updatedCol);
            
            console.log('[ColumnCustomizationStore] Applied changes to column:', {
              colId,
              field: colDef.field,
              headerName: updatedCol.headerName,
              changesApplied: Object.keys(changes),
              changesDetail: changes,
              hasValueFormatter: !!updatedCol.valueFormatter,
              hasCellStyle: !!updatedCol.cellStyle,
              hasHeaderStyle: !!updatedCol.headerStyle,
              hasCellClass: !!updatedCol.cellClass,
              hasHeaderClass: !!updatedCol.headerClass,
              cellStyleType: typeof updatedCol.cellStyle,
              headerStyleType: typeof updatedCol.headerStyle,
              headerStyle: updatedCol.headerStyle,
              sortable: updatedCol.sortable,
              resizable: updatedCol.resizable,
              editable: updatedCol.editable
            });
          } else {
            // Reuse existing object reference for unchanged columns
            updatedColumns.push(colDef);
          }
        }

        console.log('[ColumnCustomizationStore] Total columns updated:', {
          totalColumns: updatedColumns.length,
          columnsWithChanges: changedColIds.size,
          columnsWithCustomizations: updatedColumns.filter(col => 
            col.cellStyle || col.valueFormatter || col.cellClass || col.headerClass
          ).length
        });

        // Batch state update
        set({ 
          pendingChanges: new Map(),
          columnDefinitions: new Map(Array.from(columnDefinitions.entries()))
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