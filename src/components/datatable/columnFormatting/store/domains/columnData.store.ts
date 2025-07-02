import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ColDef as AgColDef, ColumnState } from 'ag-grid-community';
import { createCellStyleFunction, hasConditionalStyling } from '@/components/datatable/utils/styleUtils';
import { FormatterFunction, CellStyleFunction } from '@/components/datatable/types';
import { useOperationProgressStore } from './operationProgress.store';

export type ColDef = AgColDef;

export interface ColumnDataState {
  // Column definitions from AG-Grid
  columnDefinitions: Map<string, ColDef>;
  
  // AG-Grid column state (width, position, etc.)
  columnState: Map<string, ColumnState>;
  
  // Pending changes to be applied
  pendingChanges: Map<string, Partial<ColDef>>;
  
  // Applied templates tracking
  appliedTemplates: Map<string, { templateId: string; templateName: string; appliedAt: number }>;
  
  // Dialog open state (needed for coordination)
  open: boolean;
}

export interface ColumnDataActions {
  // Dialog state
  setOpen: (open: boolean) => void;
  
  // Column definitions management
  setColumnDefinitions: (columns: Map<string, ColDef>) => void;
  setColumnState: (columnState: ColumnState[]) => void;
  
  // Pending changes management
  updateBulkProperty: (property: string, value: unknown, selectedColumns: Set<string>) => void;
  updateBulkProperties: (properties: Record<string, unknown>, selectedColumns: Set<string>) => void;
  updateColumnProperty: (columnId: string, property: string, value: unknown) => void;
  
  // Apply/Reset changes
  applyChanges: () => ColDef[];
  resetChanges: () => void;
  
  // Customization removal
  removeColumnCustomization: (columnId: string, type: string) => void;
  clearAllCustomizations: () => number;
  clearSelectedColumnsCustomizations: (selectedColumns: Set<string>) => number;
  
  // Template tracking
  setAppliedTemplate: (columnId: string, templateId: string, templateName: string) => void;
  removeAppliedTemplate: (columnId: string) => void;
  
  // Utility functions
  getPendingChangesForColumn: (columnId: string) => Partial<ColDef> | undefined;
  hasChanges: () => boolean;
  getCustomizationCount: (columnId: string) => number;
}

export type ColumnDataStore = ColumnDataState & ColumnDataActions;

// Helper function to ensure cellStyle for conditional formatting
function ensureCellStyleForValueFormatter(column: ColDef): boolean {
  if (!column.valueFormatter || typeof column.valueFormatter !== 'function') {
    return false;
  }

  const formatter = column.valueFormatter as FormatterFunction;
  const formatString = formatter.__formatString;
  
  if (!formatString || !hasConditionalStyling(formatString)) {
    return false;
  }

  if (!column.cellStyle || typeof column.cellStyle !== 'function') {
    column.cellStyle = createCellStyleFunction(formatString, {});
    return true;
  }

  const existingStyle = column.cellStyle as CellStyleFunction;
  if (existingStyle.__formatString !== formatString) {
    const baseStyle = existingStyle.__baseStyle || {};
    column.cellStyle = createCellStyleFunction(formatString, baseStyle);
    return true;
  }

  return false;
}

// Clean column definition to remove state properties
function cleanColumnDefinition(column: ColDef): ColDef {
  const {
    width,
    flex,
    hide,
    pinned,
    sort,
    sortIndex,
    aggFunc,
    rowGroup,
    rowGroupIndex,
    pivot,
    pivotIndex,
    ...cleanedColumn
  } = column as any;
  
  return cleanedColumn;
}

const initialState: ColumnDataState = {
  columnDefinitions: new Map(),
  columnState: new Map(),
  pendingChanges: new Map(),
  appliedTemplates: new Map(),
  open: false,
};

export const useColumnDataStore = create<ColumnDataStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Dialog state
    setOpen: (open) => set({ open }),

    // Column definitions management
    setColumnDefinitions: (columns) => set({ columnDefinitions: new Map(columns) }),
    
    setColumnState: (columnState) => set({
      columnState: new Map(columnState.map((state) => [state.colId, state])),
    }),

    // Pending changes management
    updateBulkProperty: (property, value, selectedColumns) => {
      const operationId = `bulk-update-${Date.now()}`;
      const progressStore = useOperationProgressStore.getState();
      
      // Start progress tracking for large operations
      if (selectedColumns.size > 10) {
        progressStore.startOperation(
          operationId,
          'bulk-update',
          `Updating ${property} for ${selectedColumns.size} columns`,
          selectedColumns.size
        );
      }
      
      set((state) => {
        const newPendingChanges = new Map(state.pendingChanges);
        let processed = 0;
        
        selectedColumns.forEach((colId) => {
          const existing = newPendingChanges.get(colId) || {};
          newPendingChanges.set(colId, { ...existing, [property]: value });
          
          processed++;
          // Update progress for large operations
          if (selectedColumns.size > 10 && processed % 5 === 0) {
            progressStore.updateProgress(operationId, processed);
          }
        });
        
        // Complete the operation
        if (selectedColumns.size > 10) {
          progressStore.completeOperation(operationId);
        }
        
        return { pendingChanges: newPendingChanges };
      });
    },

    updateBulkProperties: (properties, selectedColumns) => {
      set((state) => {
        const newPendingChanges = new Map(state.pendingChanges);
        
        selectedColumns.forEach((colId) => {
          const existing = newPendingChanges.get(colId) || {};
          newPendingChanges.set(colId, { ...existing, ...properties });
        });
        
        return { pendingChanges: newPendingChanges };
      });
    },

    updateColumnProperty: (columnId, property, value) => {
      set((state) => {
        const newPendingChanges = new Map(state.pendingChanges);
        const existing = newPendingChanges.get(columnId) || {};
        newPendingChanges.set(columnId, { ...existing, [property]: value });
        return { pendingChanges: newPendingChanges };
      });
    },

    // Apply changes
    applyChanges: () => {
      const state = get();
      const updatedColumns: ColDef[] = [];
      const operationId = `apply-changes-${Date.now()}`;
      const progressStore = useOperationProgressStore.getState();
      
      // Count columns with changes
      const columnsWithChanges = Array.from(state.pendingChanges.entries())
        .filter(([_, changes]) => Object.keys(changes).length > 0);
      
      if (columnsWithChanges.length > 10) {
        progressStore.startOperation(
          operationId,
          'apply-changes',
          `Applying changes to ${columnsWithChanges.length} columns`,
          columnsWithChanges.length
        );
      }
      
      let processed = 0;
      state.columnDefinitions.forEach((colDef, colId) => {
        const changes = state.pendingChanges.get(colId);
        if (changes && Object.keys(changes).length > 0) {
          const updatedColumn = { ...colDef, ...changes };
          ensureCellStyleForValueFormatter(updatedColumn);
          updatedColumns.push(cleanColumnDefinition(updatedColumn));
          
          processed++;
          if (columnsWithChanges.length > 10 && processed % 5 === 0) {
            progressStore.updateProgress(operationId, processed);
          }
        }
      });
      
      // Complete the operation
      if (columnsWithChanges.length > 10) {
        progressStore.completeOperation(
          operationId,
          `Successfully applied changes to ${updatedColumns.length} columns`
        );
      }
      
      // Clear pending changes after applying
      set({ pendingChanges: new Map() });
      
      return updatedColumns;
    },

    // Reset changes
    resetChanges: () => set({ pendingChanges: new Map() }),

    // Customization removal
    removeColumnCustomization: (columnId, type) => {
      set((state) => {
        const newPendingChanges = new Map(state.pendingChanges);
        const existing = newPendingChanges.get(columnId) || {};
        
        switch (type) {
          case 'format':
            newPendingChanges.set(columnId, {
              ...existing,
              valueFormatter: undefined,
              cellStyle: undefined,
              cellClass: undefined,
            });
            break;
          case 'style':
            newPendingChanges.set(columnId, {
              ...existing,
              cellStyle: undefined,
              cellClass: undefined,
              headerClass: undefined,
            });
            break;
          case 'filter':
            newPendingChanges.set(columnId, {
              ...existing,
              filter: undefined,
              filterParams: undefined,
              floatingFilter: undefined,
            });
            break;
          case 'editor':
            newPendingChanges.set(columnId, {
              ...existing,
              cellEditor: undefined,
              cellEditorParams: undefined,
              editable: undefined,
            });
            break;
        }
        
        return { pendingChanges: newPendingChanges };
      });
    },

    clearAllCustomizations: () => {
      const state = get();
      const newPendingChanges = new Map<string, Partial<ColDef>>();
      
      state.columnDefinitions.forEach((_, colId) => {
        newPendingChanges.set(colId, {
          valueFormatter: undefined,
          cellStyle: undefined,
          cellClass: undefined,
          headerClass: undefined,
          filter: undefined,
          filterParams: undefined,
          floatingFilter: undefined,
          cellEditor: undefined,
          cellEditorParams: undefined,
          editable: undefined,
        });
      });
      
      set({ pendingChanges: newPendingChanges });
      return newPendingChanges.size;
    },

    clearSelectedColumnsCustomizations: (selectedColumns) => {
      set((state) => {
        const newPendingChanges = new Map(state.pendingChanges);
        
        selectedColumns.forEach((colId) => {
          newPendingChanges.set(colId, {
            valueFormatter: undefined,
            cellStyle: undefined,
            cellClass: undefined,
            headerClass: undefined,
            filter: undefined,
            filterParams: undefined,
            floatingFilter: undefined,
            cellEditor: undefined,
            cellEditorParams: undefined,
            editable: undefined,
          });
        });
        
        return { pendingChanges: newPendingChanges };
      });
      
      return selectedColumns.size;
    },

    // Template tracking
    setAppliedTemplate: (columnId, templateId, templateName) => {
      set((state) => {
        const newAppliedTemplates = new Map(state.appliedTemplates);
        newAppliedTemplates.set(columnId, {
          templateId,
          templateName,
          appliedAt: Date.now(),
        });
        return { appliedTemplates: newAppliedTemplates };
      });
    },

    removeAppliedTemplate: (columnId) => {
      set((state) => {
        const newAppliedTemplates = new Map(state.appliedTemplates);
        newAppliedTemplates.delete(columnId);
        return { appliedTemplates: newAppliedTemplates };
      });
    },

    // Utility functions
    getPendingChangesForColumn: (columnId) => get().pendingChanges.get(columnId),
    
    hasChanges: () => get().pendingChanges.size > 0,
    
    getCustomizationCount: (columnId) => {
      const state = get();
      const colDef = state.columnDefinitions.get(columnId);
      const changes = state.pendingChanges.get(columnId) || {};
      
      let count = 0;
      
      // Check for customizations
      const hasFormat = changes.valueFormatter !== undefined || colDef?.valueFormatter;
      const hasStyle = changes.cellStyle !== undefined || colDef?.cellStyle || 
                      changes.cellClass !== undefined || colDef?.cellClass ||
                      changes.headerClass !== undefined || colDef?.headerClass;
      const hasFilter = changes.filter !== undefined || colDef?.filter;
      const hasEditor = changes.cellEditor !== undefined || colDef?.cellEditor;
      
      if (hasFormat) count++;
      if (hasStyle) count++;
      if (hasFilter) count++;
      if (hasEditor) count++;
      
      return count;
    },
  }))
);