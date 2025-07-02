import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface ColumnSelectionState {
  selectedColumns: Set<string>;
  templateColumns: Set<string>;
}

export interface ColumnSelectionActions {
  // Selection management
  setSelectedColumns: (columns: Set<string>) => void;
  toggleColumnSelection: (columnId: string) => void;
  selectColumns: (columnIds: string[]) => void;
  deselectColumns: (columnIds: string[]) => void;
  clearSelection: () => void;
  
  // Template columns
  toggleTemplateColumn: (columnId: string) => void;
  clearTemplateColumns: () => void;
  
  // Utility functions
  isColumnSelected: (columnId: string) => boolean;
  isTemplateColumn: (columnId: string) => boolean;
  getSelectedCount: () => number;
}

export type ColumnSelectionStore = ColumnSelectionState & ColumnSelectionActions;

const initialState: ColumnSelectionState = {
  selectedColumns: new Set<string>(),
  templateColumns: new Set<string>(),
};

export const useColumnSelectionStore = create<ColumnSelectionStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Selection management
    setSelectedColumns: (columns) => set({ selectedColumns: new Set(columns) }),
    
    toggleColumnSelection: (columnId) => set((state) => {
      const newSelection = new Set(state.selectedColumns);
      if (newSelection.has(columnId)) {
        newSelection.delete(columnId);
      } else {
        newSelection.add(columnId);
      }
      return { selectedColumns: newSelection };
    }),
    
    selectColumns: (columnIds) => set((state) => {
      const newSelection = new Set(state.selectedColumns);
      columnIds.forEach((id) => newSelection.add(id));
      return { selectedColumns: newSelection };
    }),
    
    deselectColumns: (columnIds) => set((state) => {
      const newSelection = new Set(state.selectedColumns);
      columnIds.forEach((id) => newSelection.delete(id));
      return { selectedColumns: newSelection };
    }),
    
    clearSelection: () => set({ selectedColumns: new Set() }),

    // Template columns
    toggleTemplateColumn: (columnId) => set((state) => {
      const newTemplates = new Set(state.templateColumns);
      if (newTemplates.has(columnId)) {
        newTemplates.delete(columnId);
      } else {
        newTemplates.add(columnId);
      }
      return { templateColumns: newTemplates };
    }),
    
    clearTemplateColumns: () => set({ templateColumns: new Set() }),

    // Utility functions
    isColumnSelected: (columnId) => get().selectedColumns.has(columnId),
    isTemplateColumn: (columnId) => get().templateColumns.has(columnId),
    getSelectedCount: () => get().selectedColumns.size,
  }))
);