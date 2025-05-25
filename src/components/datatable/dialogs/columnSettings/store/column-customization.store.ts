import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { ColDef } from 'ag-grid-community';
import { DialogState } from '../types/column-customization.types';

// Enable Immer's MapSet plugin
enableMapSet();

interface ColumnCustomizationStore extends DialogState {
  // Actions
  setSelectedColumns: (columns: string[]) => void;
  toggleColumnSelection: (columnId: string) => void;
  selectAllColumns: () => void;
  deselectAllColumns: () => void;
  
  updateColumnProperty: (columnId: string, property: string, value: any) => void;
  updateBulkProperty: (property: string, value: any) => void;
  
  applyChanges: () => void;
  discardChanges: () => void;
  
  undo: () => void;
  redo: () => void;
  
  setActiveTab: (tab: string) => void;
  setSearchTerm: (term: string) => void;
  setGroupBy: (groupBy: 'none' | 'type' | 'dataType') => void;
  setApplyMode: (mode: 'override' | 'merge' | 'empty') => void;
  setColumnDefinitions: (columns: Map<string, ColDef>) => void;
}

export const useColumnCustomizationStore = create<ColumnCustomizationStore>()(
  immer((set) => ({
    // Initial state
    selectedColumns: new Set(),
    columnDefinitions: new Map(),
    pendingChanges: new Map(),
    bulkChanges: {},
    applyMode: 'override',
    activeTab: 'general',
    searchTerm: '',
    groupBy: 'none',
    showOnlyCommon: false,
    compareMode: false,
    undoStack: [],
    redoStack: [],
    
    // Action implementations
    setSelectedColumns: (columns) => set((state) => {
      state.selectedColumns = new Set(columns);
    }),
    
    toggleColumnSelection: (columnId) => set((state) => {
      if (state.selectedColumns.has(columnId)) {
        state.selectedColumns.delete(columnId);
      } else {
        state.selectedColumns.add(columnId);
      }
    }),
    
    selectAllColumns: () => set((state) => {
      const allColumnIds = Array.from(state.columnDefinitions.keys());
      state.selectedColumns = new Set(allColumnIds);
    }),
    
    deselectAllColumns: () => set((state) => {
      state.selectedColumns = new Set();
    }),
    
    updateColumnProperty: (columnId, property, value) => set((state) => {
      if (!state.pendingChanges.has(columnId)) {
        state.pendingChanges.set(columnId, {});
      }
      const changes = state.pendingChanges.get(columnId)!;
      (changes as Record<string, unknown>)[property] = value;
    }),
    
    updateBulkProperty: (property, value) => set((state) => {
      state.selectedColumns.forEach(columnId => {
        if (!state.pendingChanges.has(columnId)) {
          state.pendingChanges.set(columnId, {});
        }
        const changes = state.pendingChanges.get(columnId)!;
        (changes as Record<string, unknown>)[property] = value;
      });
      (state.bulkChanges as Record<string, unknown>)[property] = value;
    }),
    
    applyChanges: () => set((state) => {
      if (state.pendingChanges.size === 0) return;
      
      // Add to undo stack
      state.undoStack.push({
        timestamp: Date.now(),
        changes: new Map(state.pendingChanges),
        description: `Updated ${state.pendingChanges.size} columns`
      });
      
      // Clear pending changes and redo stack
      state.pendingChanges.clear();
      state.bulkChanges = {};
      state.redoStack = [];
    }),
    
    discardChanges: () => set((state) => {
      state.pendingChanges.clear();
      state.bulkChanges = {};
    }),
    
    undo: () => set((state) => {
      if (state.undoStack.length === 0) return;
      
      const changeSet = state.undoStack.pop()!;
      state.redoStack.push(changeSet);
      
      // Restore previous state
      changeSet.changes.forEach((changes, columnId) => {
        const colDef = state.columnDefinitions.get(columnId);
        if (colDef) {
          // Revert changes
          Object.keys(changes).forEach(key => {
            delete (colDef as any)[key];
          });
        }
      });
    }),
    
    redo: () => set((state) => {
      if (state.redoStack.length === 0) return;
      
      const changeSet = state.redoStack.pop()!;
      state.undoStack.push(changeSet);
      
      // Reapply changes
      changeSet.changes.forEach((changes, columnId) => {
        const colDef = state.columnDefinitions.get(columnId);
        if (colDef) {
          Object.assign(colDef, changes);
        }
      });
    }),
    
    setActiveTab: (tab) => set((state) => {
      state.activeTab = tab;
    }),
    
    setSearchTerm: (term) => set((state) => {
      state.searchTerm = term;
    }),
    
    setGroupBy: (groupBy) => set((state) => {
      state.groupBy = groupBy;
    }),
    
    setApplyMode: (mode) => set((state) => {
      state.applyMode = mode;
    }),
    
    setColumnDefinitions: (columns) => set((state) => {
      state.columnDefinitions = columns;
    }),
  }))
);