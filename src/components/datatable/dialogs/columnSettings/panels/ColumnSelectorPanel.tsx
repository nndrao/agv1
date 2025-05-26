import React, { useState, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Columns3, Filter } from 'lucide-react';
import { ColDef } from 'ag-grid-community';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { COLUMN_ICONS } from '../types';
import { useVirtualizer } from '@tanstack/react-virtual';
import '../column-customization-dialog.css';

export const ColumnSelectorPanel: React.FC = () => {
  const {
    selectedColumns,
    columnDefinitions,
    searchTerm,
    cellDataTypeFilter,
    setSelectedColumns,
    setSearchTerm,
    setCellDataTypeFilter
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

  // Filter columns based on search and cellDataType
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

    return filtered;
  }, [allColumns, searchTerm, cellDataTypeFilter]);

  // Prepare items for virtual scrolling (simple flat list)
  const flatItems = useMemo(() => {
    return filteredColumns.map(column => ({ type: 'column' as const, column }));
  }, [filteredColumns]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimated height per item
    overscan: 5
  });

  const toggleColumnSelection = (columnId: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnId)) {
      newSelected.delete(columnId);
    } else {
      newSelected.add(columnId);
    }
    setSelectedColumns(newSelected);
  };

  const selectAllFilteredColumns = () => {
    const newSelected = new Set(selectedColumns);
    filteredColumns.forEach(col => {
      const colId = col.field || col.colId || '';
      if (colId) {
        newSelected.add(colId);
      }
    });
    setSelectedColumns(newSelected);
  };

  const deselectAllFilteredColumns = () => {
    const newSelected = new Set(selectedColumns);
    filteredColumns.forEach(col => {
      const colId = col.field || col.colId || '';
      if (colId) {
        newSelected.delete(colId);
      }
    });
    setSelectedColumns(newSelected);
  };

  const isAllSelected = filteredColumns.length > 0 &&
    filteredColumns.every(col => selectedColumns.has(col.field || col.colId || ''));
  const isIndeterminate = filteredColumns.some(col => selectedColumns.has(col.field || col.colId || '')) &&
    !isAllSelected;

  // Count of filtered columns that are selected
  const filteredSelectedCount = filteredColumns.filter(col =>
    selectedColumns.has(col.field || col.colId || '')
  ).length;

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

        {/* CellDataType Filter */}
        <div className="mb-4">
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
              {availableCellDataTypes.map(type => (
                <SelectItem key={type} value={type} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span>{COLUMN_ICONS[type] || COLUMN_ICONS.default}</span>
                    <span className="capitalize">{type}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modern Selection Controls */}
        <div className="flex items-center gap-2.5 mb-4">
          <Checkbox
            checked={isAllSelected || isIndeterminate}
            onCheckedChange={(checked) => {
              if (checked && !isAllSelected) {
                selectAllFilteredColumns();
              } else {
                deselectAllFilteredColumns();
              }
            }}
            className={`checkbox-enhanced h-4 w-4 rounded ${isIndeterminate ? 'data-[state=checked]:bg-primary/50' : ''}`}
          />
          <span className="text-xs font-medium text-foreground">
            {(searchTerm || cellDataTypeFilter !== 'all') ? 'All Filtered' : 'All'}
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
                      selected={selectedColumns.has(item.column.field || item.column.colId || '')}
                      onToggle={() => toggleColumnSelection(item.column.field || item.column.colId || '')}
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
};

// Modern Column Item Component
const ColumnItem: React.FC<{
  column: ColDef;
  selected: boolean;
  onToggle: () => void;
}> = ({ column, selected, onToggle }) => {
  const iconKey = (column.cellDataType || column.type || 'default') as string;
  const icon = COLUMN_ICONS[iconKey] || COLUMN_ICONS.default;

  return (
    <div className="flex items-center gap-2.5 p-2 hover:bg-gradient-to-r hover:from-accent/30 hover:to-accent/10 rounded-lg transition-all duration-200 group cursor-pointer border border-transparent hover:border-border/30">
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        className="checkbox-enhanced h-4 w-4 rounded"
      />
      <span className="text-xs flex-1 truncate font-medium text-foreground group-hover:text-foreground">
        {column.headerName || column.field}
      </span>
      <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
    </div>
  );
};