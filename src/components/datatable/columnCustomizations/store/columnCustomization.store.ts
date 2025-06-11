import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { ColDef as AgColDef, ColumnState } from 'ag-grid-community';
import { createCellStyleFunction, hasConditionalStyling } from '@/components/datatable/utils/styleUtils';
import { FormatterFunction, CellStyleFunction } from '@/components/datatable/types';

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
  
  // Applied templates tracking
  appliedTemplates: Map<string, { templateId: string; templateName: string; appliedAt: number }>;
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
  
  // Customization removal
  removeColumnCustomization: (columnId: string, type: string) => void;
  clearAllCustomizations: () => number;
  
  // Template tracking
  setAppliedTemplate: (columnId: string, templateId: string, templateName: string) => void;
  removeAppliedTemplate: (columnId: string) => void;
}

export type ColumnCustomizationStore = DialogState & DialogActions;


/**
 * Ensure a column has a cellStyle function if its valueFormatter has conditional styling
 * Returns true if the column was modified
 */
function ensureCellStyleForValueFormatter(column: ColDef): boolean {
  // Check if valueFormatter has conditional styling
  if (column.valueFormatter && typeof column.valueFormatter === 'function') {
    const formatString = (column.valueFormatter as FormatterFunction).__formatString;
    
    if (formatString && hasConditionalStyling(formatString)) {
      // Check if cellStyle already exists and is properly configured
      if (!column.cellStyle || 
          (typeof column.cellStyle === 'function' && 
           (column.cellStyle as CellStyleFunction).__formatString !== formatString)) {
        
        console.log('[Store] Creating cellStyle for conditional formatting:', {
          field: column.field,
          formatString,
          hasExistingCellStyle: !!column.cellStyle,
          existingCellStyleType: typeof column.cellStyle
        });
        
        // Extract base style if it exists
        let baseStyle: React.CSSProperties = {};
        if (column.cellStyle) {
          if (typeof column.cellStyle === 'object') {
            baseStyle = column.cellStyle;
          } else if (typeof column.cellStyle === 'function' && (column.cellStyle as CellStyleFunction).__baseStyle) {
            baseStyle = (column.cellStyle as CellStyleFunction).__baseStyle || {};
          }
        }
        
        // Create cellStyle function
        const styleFunc = createCellStyleFunction(formatString, baseStyle);
        
        // Attach metadata for future serialization
        Object.defineProperty(styleFunc, '__formatString', { 
          value: formatString, 
          writable: false,
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(styleFunc, '__baseStyle', { 
          value: baseStyle, 
          writable: false,
          enumerable: false,
          configurable: true
        });
        
        column.cellStyle = styleFunc;
        return true; // Column was modified
      }
    }
  }
  return false; // Column was not modified
}

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
      appliedTemplates: new Map<string, { templateId: string; templateName: string; appliedAt: number }>(),
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
          // console.log('[Store] Setting column state, array length:', columnStateArray.length);
          let _visibleCount = 0;
          let _hiddenCount = 0;
          
          columnStateArray.forEach(colState => {
            stateMap.set(colState.colId, colState);
            if (colState.hide) {
              _hiddenCount++;
            } else {
              _visibleCount++;
            }
          });
          
          // console.log('[Store] Column state summary:', {
          //   total: columnStateArray.length,
          //   visible: visibleCount,
          //   hidden: hiddenCount,
          //   stateMapSize: stateMap.size
          // });
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

        // List of properties that should be explicitly cleared (set to undefined)
        const clearableProperties = [
          'cellStyle', 'headerStyle', 'cellClass', 'headerClass', 'cellClassRules',
          'valueFormatter', 'valueGetter', 'valueSetter', 'useValueFormatterForExport',
          'filter', 'filterParams', 'floatingFilter', 'floatingFilterComponent', 
          'floatingFilterComponentParams', 'suppressHeaderMenuButton', 
          'suppressFiltersToolPanel', 'filterValueGetter',
          'editable', 'cellEditor', 'cellEditorParams', 'cellEditorPopup',
          'cellEditorPopupPosition', 'singleClickEdit', 'stopEditingWhenCellsLoseFocus',
          'cellEditorSelector', 'cellRenderer', 'cellRendererParams', 'cellRendererSelector',
          'wrapText', 'autoHeight', 'rowSpan', 'colSpan', 'textAlign', 'verticalAlign',
          'headerTooltip', 'headerComponent', 'headerComponentParams', 'headerTextAlign',
          'headerCheckboxSelection', 'headerCheckboxSelectionFilteredOnly',
          'wrapHeaderText', 'autoHeaderHeight', 'sortable', 'sort', 'sortingOrder',
          'comparator', 'unSortIcon', 'aggFunc', 'allowedAggFuncs',
          'pinned', 'lockPosition', 'lockPinned', 'lockVisible',
          'width', 'minWidth', 'maxWidth', 'flex', 'resizable', 'suppressSizeToFit',
          'initialWidth', 'initialHide', 'initialPinned',
          'tooltip', 'tooltipField', 'tooltipValueGetter', 'tooltipComponent',
          'tooltipComponentParams', 'suppressKeyboardEvent', 'suppressNavigable',
          'suppressPaste', 'checkboxSelection', 'showDisabledCheckboxes'
        ];

        // Pre-allocate array with exact size for better performance
        const updatedColumns = new Array(columnDefinitions.size);
        let index = 0;
        
        // Process columns in a single pass with minimal object creation
        for (const [colId, colDef] of columnDefinitions) {
          const changes = pendingChanges.get(colId);
          if (changes && Object.keys(changes).length > 0) {
            // Start with the original column to preserve all properties
            const mergedColumn = { ...colDef };
            
            // Apply changes
            Object.entries(changes).forEach(([key, value]) => {
              if (value === undefined && clearableProperties.includes(key)) {
                // Explicitly set clearable properties to undefined
                delete (mergedColumn as Record<string, unknown>)[key];
              } else if (value !== undefined) {
                // Set new values
                (mergedColumn as Record<string, unknown>)[key] = value;
              }
            });
            
            // Check if we need to create cellStyle for conditional formatting
            ensureCellStyleForValueFormatter(mergedColumn);
            
            updatedColumns[index] = mergedColumn;
          } else {
            // Even for unchanged columns, ensure cellStyle exists if needed
            const columnCopy = { ...colDef };
            if (ensureCellStyleForValueFormatter(columnCopy)) {
              updatedColumns[index] = columnCopy;
            } else {
              // Reuse existing object reference for unchanged columns
              updatedColumns[index] = colDef;
            }
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
      
      removeColumnCustomization: (columnId, type) => {
        const { columnDefinitions, pendingChanges } = get();
        const column = columnDefinitions.get(columnId);
        if (!column) return;
        
        const newPendingChanges = new Map(pendingChanges);
        const existing = newPendingChanges.get(columnId) || {};
        const updated = { ...existing };
        
        // Also update the column definitions immediately for UI feedback
        const newColumnDefinitions = new Map(columnDefinitions);
        const updatedColumn = { ...column };
        
        // Remove customizations based on type by setting them to undefined
        // This will override any existing values in the original column definition
        switch (type) {
          case 'style':
            updated.cellStyle = undefined;
            updated.headerStyle = undefined;
            updated.cellClass = undefined;
            updated.headerClass = undefined;
            // Also remove from column definition for immediate UI update
            delete updatedColumn.cellStyle;
            delete updatedColumn.headerStyle;
            delete updatedColumn.cellClass;
            delete updatedColumn.headerClass;
            break;
          case 'formatter':
            updated.valueFormatter = undefined;
            delete updatedColumn.valueFormatter;
            break;
          case 'filter':
            updated.filter = undefined;
            updated.filterParams = undefined;
            delete updatedColumn.filter;
            delete updatedColumn.filterParams;
            break;
          case 'editor':
            updated.cellEditor = undefined;
            updated.cellEditorParams = undefined;
            delete updatedColumn.cellEditor;
            delete updatedColumn.cellEditorParams;
            break;
          case 'general':
            updated.width = undefined;
            updated.minWidth = undefined;
            updated.maxWidth = undefined;
            updated.pinned = undefined;
            updated.lockPosition = undefined;
            updated.lockVisible = undefined;
            delete updatedColumn.width;
            delete updatedColumn.minWidth;
            delete updatedColumn.maxWidth;
            delete updatedColumn.pinned;
            delete updatedColumn.lockPosition;
            delete updatedColumn.lockVisible;
            break;
        }
        
        // Update both column definitions and pending changes
        newColumnDefinitions.set(columnId, updatedColumn);
        newPendingChanges.set(columnId, updated);
        
        set({ 
          columnDefinitions: newColumnDefinitions,
          pendingChanges: newPendingChanges 
        });
        
        console.log('[Store] Removed customization:', { columnId, type, updatedChanges: updated });
      },
      
      clearAllCustomizations: () => {
        const { columnDefinitions } = get();
        
        console.log('[Store] Clearing all customizations from all columns');
        
        // Create new pending changes for all columns
        const newPendingChanges = new Map<string, Partial<ColDef>>();
        
        let clearedCount = 0;
        
        // Comprehensive list of all customization properties to clear
        const customizationProperties = [
          // Data type and basic properties
          'cellDataType', 'type', 'valueGetter', 'valueSetter',
          
          // Filter configurations
          'filter', 'filterParams', 'floatingFilter', 'floatingFilterComponent', 'floatingFilterComponentParams',
          'suppressHeaderMenuButton', 'suppressFiltersToolPanel', 'filterValueGetter',
          
          // Editor configurations
          'editable', 'cellEditor', 'cellEditorParams', 'cellEditorPopup', 'cellEditorPopupPosition',
          'singleClickEdit', 'stopEditingWhenCellsLoseFocus', 'cellEditorSelector',
          
          // Format configurations
          'valueFormatter', 'useValueFormatterForExport',
          'cellClass', 'cellClassRules', 'cellStyle',
          
          // Header configurations
          'headerClass', 'headerStyle', 'headerTooltip', 'headerComponent', 'headerComponentParams',
          'headerTextAlign', 'headerCheckboxSelection', 'headerCheckboxSelectionFilteredOnly',
          'wrapHeaderText', 'autoHeaderHeight',
          
          // Cell renderer
          'cellRenderer', 'cellRendererParams', 'cellRendererSelector',
          
          // Layout and display
          'wrapText', 'autoHeight', 'rowSpan', 'colSpan',
          'textAlign', 'verticalAlign',
          
          // Sorting and aggregation
          'sortable', 'sort', 'sortingOrder', 'comparator',
          'unSortIcon', 'aggFunc', 'allowedAggFuncs',
          
          // Pinning and sizing
          'pinned', 'lockPosition', 'lockPinned', 'lockVisible',
          'width', 'minWidth', 'maxWidth', 'flex',
          'resizable', 'suppressSizeToFit',
          'initialWidth', 'initialHide', 'initialPinned',
          
          // Tooltips
          'tooltip', 'tooltipField', 'tooltipValueGetter', 'tooltipComponent', 'tooltipComponentParams',
          
          // Other properties
          'suppressKeyboardEvent', 'suppressNavigable', 'suppressPaste',
          'checkboxSelection', 'showDisabledCheckboxes'
        ];
        
        // Process all columns
        for (const [columnId, _column] of columnDefinitions) {
          const pendingChanges: Partial<ColDef> = {};
          
          // Set all customization properties to undefined
          customizationProperties.forEach(prop => {
            delete (pendingChanges as Record<string, unknown>)[prop];
          });
          
          // Add to pending changes (will be applied when user clicks Apply)
          newPendingChanges.set(columnId, pendingChanges);
          clearedCount++;
        }
        
        // Clear applied templates as well
        const templateCount = get().appliedTemplates.size;
        const newAppliedTemplates = new Map<string, { templateId: string; templateName: string; appliedAt: number }>();
        
        // Update store with pending changes (not applied yet)
        set({ 
          pendingChanges: newPendingChanges,
          appliedTemplates: newAppliedTemplates
        });
        
        const totalCleared = clearedCount + (templateCount > 0 ? templateCount : 0);
        console.log('[Store] Set pending clear for', clearedCount, 'columns and', templateCount, 'templates');
        
        return totalCleared;
      },
      
      setAppliedTemplate: (columnId, templateId, templateName) => {
        const { appliedTemplates } = get();
        const newAppliedTemplates = new Map(appliedTemplates);
        newAppliedTemplates.set(columnId, {
          templateId,
          templateName,
          appliedAt: Date.now()
        });
        set({ appliedTemplates: newAppliedTemplates });
      },
      
      removeAppliedTemplate: (columnId) => {
        const { appliedTemplates } = get();
        const newAppliedTemplates = new Map(appliedTemplates);
        newAppliedTemplates.delete(columnId);
        set({ appliedTemplates: newAppliedTemplates });
        console.log('[Store] Removed template from column:', columnId, 'Remaining templates:', newAppliedTemplates.size);
      },
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
          appliedTemplates: Array.from(state.appliedTemplates.entries()), // Convert Map to Array
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
            if (Array.isArray(state.appliedTemplates)) {
              state.appliedTemplates = new Map(state.appliedTemplates);
            }
          }
        },
      }
    )
  )
);