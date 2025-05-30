import React, { useMemo, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Columns3, Filter, Star, Eye, EyeOff, Hash, Type, Calendar, ToggleLeft, Package, CircleDot, DollarSign } from 'lucide-react';
import { ColDef } from 'ag-grid-community';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { COLUMN_ICONS } from '../types';
import { useVirtualizer } from '@tanstack/react-virtual';
import '../column-customization-dialog.css';

// Helper function to get icon component based on column type
const getColumnIcon = (type: string) => {
  switch (type) {
    case 'number':
    case 'numericColumn':
      return Hash;
    case 'currency':
      return DollarSign;
    case 'date':
    case 'dateColumn':
      return Calendar;
    case 'text':
    case 'textColumn':
      return Type;
    case 'boolean':
    case 'booleanColumn':
      return ToggleLeft;
    case 'object':
      return Package;
    default:
      return CircleDot;
  }
};

export const ColumnSelectorPanel: React.FC = React.memo(() => {
  const {
    selectedColumns,
    columnDefinitions,
    columnState,
    searchTerm,
    cellDataTypeFilter,
    visibilityFilter,
    templateColumns,
    toggleColumnSelection,
    selectColumns,
    deselectColumns,
    setSearchTerm,
    setCellDataTypeFilter,
    setVisibilityFilter,
    toggleTemplateColumn
  } = useColumnCustomizationStore();

  const parentRef = useRef<HTMLDivElement>(null);

  // Get all columns as array
  const allColumns = useMemo(() => {
    return Array.from(columnDefinitions.values());
  }, [columnDefinitions]);

  // Get available cellDataType options
  const availableCellDataTypes = useMemo(() => {
    const types = new Set<string>();
    allColumns.forEach(col => {
      if (col.cellDataType) {
        types.add(col.cellDataType);
      }
    });
    return Array.from(types).sort();
  }, [allColumns]);

  // Filter columns based on search, cellDataType, and visibility
  const filteredColumns = useMemo(() => {
    let filtered = allColumns;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(col =>
        col.field?.toLowerCase().includes(term) ||
        col.headerName?.toLowerCase().includes(term)
      );
    }

    // Filter by cellDataType
    if (cellDataTypeFilter && cellDataTypeFilter !== 'all') {
      filtered = filtered.filter(col => col.cellDataType === cellDataTypeFilter);
    }

    // Filter by visibility using column state
    if (visibilityFilter !== 'all') {
      // Debug logging
      console.log('[ColumnSelector] Visibility filter:', visibilityFilter);
      console.log('[ColumnSelector] Column state size:', columnState.size);
      console.log('[ColumnSelector] All columns count:', allColumns.length);
      
      // First, let's see what's in the column state
      if (columnState.size > 0) {
        console.log('[ColumnSelector] Column state keys:', Array.from(columnState.keys()).slice(0, 5));
      }
      
      filtered = filtered.filter(col => {
        // Try multiple ways to match column with state
        const field = col.field || '';
        const colId = col.colId || field;
        
        // Try to find column state by field first, then by colId
        let colState = columnState.get(field);
        if (!colState && field !== colId) {
          colState = columnState.get(colId);
        }
        
        // Check if column state exists at all - if not, the grid API might not be returning state for all columns
        // AG-Grid only includes columns in getColumnState if they have been modified from defaults
        // So if a column has no state, it means it's using default settings (visible)
        const isHidden = colState?.hide === true; // Only hidden if explicitly set to true
        
        // Debug for first few columns
        const colIndex = allColumns.indexOf(col);
        if (colIndex < 5) {
          console.log('[ColumnSelector] Column visibility check:', {
            index: colIndex,
            field: col.field,
            colId: colId,
            hasColState: !!colState,
            hide: colState?.hide,
            isHidden: isHidden,
            shouldShow: visibilityFilter === 'hidden' ? isHidden : !isHidden
          });
        }
        
        return visibilityFilter === 'hidden' ? isHidden : !isHidden;
      });
      
      console.log('[ColumnSelector] Filtered columns count:', filtered.length);
      console.log('[ColumnSelector] Showing:', visibilityFilter === 'visible' ? 'visible columns' : 'hidden columns');
    }

    return filtered;
  }, [allColumns, searchTerm, cellDataTypeFilter, visibilityFilter, columnState]);

  // Prepare items for virtual scrolling (simple flat list)
  const flatItems = useMemo(() => {
    return filteredColumns.map(column => ({ 
      type: 'column' as const, 
      column,
      id: column.field || column.colId || ''
    }));
  }, [filteredColumns]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimated height per item
    overscan: 5
  });

  const selectAllFilteredColumns = useCallback(() => {
    const columnIds = filteredColumns
      .map(col => col.field || col.colId || '')
      .filter(id => id && !selectedColumns.has(id));
    if (columnIds.length > 0) {
      selectColumns(columnIds);
    }
  }, [filteredColumns, selectedColumns, selectColumns]);

  const deselectAllFilteredColumns = useCallback(() => {
    const columnIds = filteredColumns
      .map(col => col.field || col.colId || '')
      .filter(id => id && selectedColumns.has(id));
    if (columnIds.length > 0) {
      deselectColumns(columnIds);
    }
  }, [filteredColumns, selectedColumns, deselectColumns]);

  const isAllSelected = useMemo(() => 
    filteredColumns.length > 0 &&
    filteredColumns.every(col => selectedColumns.has(col.field || col.colId || '')),
    [filteredColumns, selectedColumns]
  );
  const isIndeterminate = useMemo(() => 
    filteredColumns.some(col => selectedColumns.has(col.field || col.colId || '')) &&
    !isAllSelected,
    [filteredColumns, selectedColumns, isAllSelected]
  );

  // Count of filtered columns that are selected
  const filteredSelectedCount = useMemo(() => 
    filteredColumns.filter(col =>
      selectedColumns.has(col.field || col.colId || '')
    ).length,
    [filteredColumns, selectedColumns]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Modern Header */}
      <div className="px-4 py-3 border-b border-border/40 bg-gradient-to-r from-muted/15 to-muted/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <Columns3 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Columns</span>
          <Badge variant="outline" className="text-xs px-2 py-1 ml-auto font-medium rounded-md border-border/60">
            {filteredColumns.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        {/* Modern Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm rounded-lg border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary/60 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-4">
          {/* CellDataType Filter */}
          <Select
            value={cellDataTypeFilter}
            onValueChange={setCellDataTypeFilter}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-border/60 bg-background/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by data type" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border/60 bg-background/95 backdrop-blur-md">
              <SelectItem value="all" className="text-sm">All Data Types</SelectItem>
              {availableCellDataTypes.map(type => {
                const TypeIcon = getColumnIcon(type);
                return (
                  <SelectItem key={type} value={type} className="text-sm">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{type}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Visibility Filter */}
          <Select
            value={visibilityFilter}
            onValueChange={(value: 'all' | 'visible' | 'hidden') => setVisibilityFilter(value)}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-border/60 bg-background/80 backdrop-blur-sm">
              {visibilityFilter === 'visible' ? (
                <Eye className="h-4 w-4 mr-2" />
              ) : visibilityFilter === 'hidden' ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border/60 bg-background/95 backdrop-blur-md">
              <SelectItem value="all" className="text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>All Columns</span>
                </div>
              </SelectItem>
              <SelectItem value="visible" className="text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span>Visible Columns</span>
                </div>
              </SelectItem>
              <SelectItem value="hidden" className="text-sm">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4 text-red-600" />
                  <span>Hidden Columns</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modern Selection Controls */}
        <div className="flex items-center gap-2.5 mb-4">
          <Checkbox
            checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
            onCheckedChange={(checked) => {
              if (checked === true || checked === "indeterminate") {
                selectAllFilteredColumns();
              } else {
                deselectAllFilteredColumns();
              }
            }}
            className="checkbox-enhanced rounded"
          />
          <span className="text-xs font-medium text-foreground">
            {(searchTerm || cellDataTypeFilter !== 'all' || visibilityFilter !== 'all') ? 'All Filtered' : 'All'}
          </span>
          {filteredSelectedCount > 0 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium rounded-md bg-secondary/80 border border-secondary/40">
              {filteredSelectedCount}/{filteredColumns.length}
            </Badge>
          )}
        </div>

        {/* Virtual Column List */}
        <div className="flex-1 -mx-1">
          <div
            ref={parentRef}
            className="h-full overflow-auto px-1"
            style={{ contain: 'strict' }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = flatItems[virtualItem.index];

                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <ColumnItem
                      column={item.column}
                      columnId={item.id}
                      selected={selectedColumns.has(item.id)}
                      isTemplate={templateColumns instanceof Set ? templateColumns.has(item.id) : false}
                      isHidden={(() => {
                        // Try to find column state by field first, then by colId
                        const field = item.column.field || '';
                        const colId = item.column.colId || field;
                        let colState = columnState.get(field);
                        if (!colState && field !== colId) {
                          colState = columnState.get(colId);
                        }
                        return colState?.hide || false;
                      })()}
                      onToggle={toggleColumnSelection}
                      onToggleTemplate={toggleTemplateColumn}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
});

// Clean Column Item Component
const ColumnItem: React.FC<{
  column: ColDef;
  columnId: string;
  selected: boolean;
  isTemplate: boolean;
  isHidden: boolean;
  onToggle: (columnId: string) => void;
  onToggleTemplate: (columnId: string) => void;
}> = React.memo(({ column, columnId, selected, isTemplate, isHidden, onToggle, onToggleTemplate }) => {
  const iconKey = (column.cellDataType || column.type || 'text') as string;
  const IconComponent = getColumnIcon(iconKey);

  const handleToggle = useCallback(() => {
    onToggle(columnId);
  }, [columnId, onToggle]);

  const handleToggleTemplate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleTemplate(columnId);
  }, [columnId, onToggleTemplate]);

  return (
    <div 
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded hover:bg-muted/50 transition-colors group cursor-pointer ${
        selected ? 'bg-muted/30' : ''
      }`}
      onClick={handleToggle}
    >
      {selected && (
        <div className="selection-indicator absolute left-0 h-full" />
      )}
      <Checkbox
        checked={selected}
        onCheckedChange={handleToggle}
        onClick={(e) => e.stopPropagation()}
        className="checkbox-enhanced"
      />
      <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm flex-1 truncate flex items-center gap-2">
        <span className={isHidden ? 'opacity-50' : ''}>
          {column.headerName || column.field}
        </span>
        {isHidden && (
          <EyeOff className="h-3 w-3 text-muted-foreground" />
        )}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className={`h-5 w-5 p-0 transition-opacity ${
          isTemplate ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={handleToggleTemplate}
        title={isTemplate ? 'Remove from templates' : 'Add to templates'}
      >
        <Star 
          className={`h-3 w-3 transition-colors ${
            isTemplate ? 'text-yellow-500 fill-current' : 'text-muted-foreground hover:text-yellow-500'
          }`}
        />
      </Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.isTemplate === nextProps.isTemplate &&
    prevProps.isHidden === nextProps.isHidden &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.column.field === nextProps.column.field &&
    prevProps.column.headerName === nextProps.column.headerName &&
    prevProps.column.cellDataType === nextProps.column.cellDataType
  );
});