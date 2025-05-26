import React, { useState, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronDown, ChevronRight, Save, Columns3, Filter } from 'lucide-react';
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
    groupBy,
    setSelectedColumns,
    setSearchTerm,
    setGroupBy
  } = useColumnCustomizationStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['All Columns']));
  const parentRef = useRef<HTMLDivElement>(null);

  // Get all columns as array
  const allColumns = useMemo(() => {
    return Array.from(columnDefinitions.values());
  }, [columnDefinitions]);

  // Filter columns based on search
  const filteredColumns = useMemo(() => {
    if (!searchTerm) return allColumns;

    const term = searchTerm.toLowerCase();
    return allColumns.filter(col =>
      col.field?.toLowerCase().includes(term) ||
      col.headerName?.toLowerCase().includes(term)
    );
  }, [allColumns, searchTerm]);

  // Group columns and flatten for virtual scrolling
  const { groupedColumns, flatItems } = useMemo(() => {
    let groups;
    if (groupBy === 'none') {
      groups = [{ name: 'All Columns', columns: filteredColumns, icon: '📋' }];
    } else {
      // Group by type or dataType
      const groupsMap = new Map<string, ColDef[]>();

      filteredColumns.forEach(col => {
        let groupKey = 'default';
        if (groupBy === 'type' && col.type) {
          groupKey = col.type as string;
        } else if (groupBy === 'category' && col.cellDataType) {
          groupKey = col.cellDataType as string;
        }

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, []);
        }
        groupsMap.get(groupKey)!.push(col);
      });

      groups = Array.from(groupsMap.entries()).map(([key, cols]) => ({
        name: key,
        columns: cols,
        icon: COLUMN_ICONS[key] || COLUMN_ICONS.default
      }));
    }

    // Flatten items for virtual scrolling
    const items: Array<{ type: 'group' | 'column'; group?: string; column?: ColDef; icon?: string }> = [];

    groups.forEach(group => {
      if (groupBy !== 'none') {
        items.push({ type: 'group', group: group.name, icon: group.icon });
      }

      if (groupBy === 'none' || expandedGroups.has(group.name)) {
        group.columns.forEach(column => {
          items.push({ type: 'column', column, group: group.name });
        });
      }
    });

    return { groupedColumns: groups, flatItems: items };
  }, [filteredColumns, groupBy, expandedGroups]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimated height per item
    overscan: 5
  });

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm rounded-lg border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary/60 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {/* Modern Selection Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
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
              {searchTerm ? 'All Filtered' : 'All'}
            </span>
            {filteredSelectedCount > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium rounded-md bg-secondary/80 border border-secondary/40">
                {filteredSelectedCount}/{filteredColumns.length}
              </Badge>
            )}
          </div>

          <Select
            value={groupBy}
            onValueChange={(value: 'none' | 'type' | 'category') => setGroupBy(value)}
          >
            <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg border-border/60 bg-background/80 backdrop-blur-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border/60 bg-background/95 backdrop-blur-md">
              <SelectItem value="none" className="text-xs">None</SelectItem>
              <SelectItem value="type" className="text-xs">Type</SelectItem>
              <SelectItem value="category" className="text-xs">Category</SelectItem>
            </SelectContent>
          </Select>
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
                    {item.type === 'group' ? (
                      <button
                        onClick={() => toggleGroup(item.group!)}
                        className="flex items-center gap-2 w-full p-1.5 hover:bg-accent rounded-md transition-colors"
                      >
                        {expandedGroups.has(item.group!) ?
                          <ChevronDown className="h-3.5 w-3.5" /> :
                          <ChevronRight className="h-3.5 w-3.5" />
                        }
                        <span className="text-xs font-medium flex-1 text-left">
                          {item.icon} {item.group}
                        </span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {groupedColumns.find(g => g.name === item.group)?.columns.length || 0}
                        </Badge>
                      </button>
                    ) : (
                      <div className={groupBy !== 'none' ? "ml-4" : ""}>
                        <ColumnItem
                          column={item.column!}
                          selected={selectedColumns.has(item.column!.field || item.column!.colId || '')}
                          onToggle={() => toggleColumnSelection(item.column!.field || item.column!.colId || '')}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modern Save Selection Set */}
        <Button variant="outline" className="mt-4 w-full gap-2 h-9 rounded-lg border-border/60 bg-background/80 backdrop-blur-sm hover:bg-muted/50 transition-all duration-200" size="sm">
          <Save className="h-4 w-4" />
          <span className="text-sm font-medium">Save Set</span>
        </Button>
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