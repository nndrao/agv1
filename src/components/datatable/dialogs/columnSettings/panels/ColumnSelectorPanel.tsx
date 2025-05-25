import React, { useState, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { ColDef } from 'ag-grid-community';
import { DialogState, COLUMN_ICONS } from '../types';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ColumnSelectorPanelProps {
  state: DialogState;
  setState: React.Dispatch<React.SetStateAction<DialogState>>;
}

export const ColumnSelectorPanel: React.FC<ColumnSelectorPanelProps> = ({ state, setState }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['All Columns']));
  const parentRef = useRef<HTMLDivElement>(null);

  // Get all columns as array
  const allColumns = useMemo(() => {
    return Array.from(state.columnDefinitions.values());
  }, [state.columnDefinitions]);

  // Filter columns based on search
  const filteredColumns = useMemo(() => {
    if (!state.searchTerm) return allColumns;
    
    const term = state.searchTerm.toLowerCase();
    return allColumns.filter(col => 
      col.field?.toLowerCase().includes(term) ||
      col.headerName?.toLowerCase().includes(term)
    );
  }, [allColumns, state.searchTerm]);

  // Group columns and flatten for virtual scrolling
  const { groupedColumns, flatItems } = useMemo(() => {
    let groups;
    if (state.groupBy === 'none') {
      groups = [{ name: 'All Columns', columns: filteredColumns, icon: '📋' }];
    } else {
      // Group by type or dataType
      const groupsMap = new Map<string, ColDef[]>();
      
      filteredColumns.forEach(col => {
        let groupKey = 'default';
        if (state.groupBy === 'type' && col.type) {
          groupKey = col.type as string;
        } else if (state.groupBy === 'dataType' && col.cellDataType) {
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
      if (state.groupBy !== 'none') {
        items.push({ type: 'group', group: group.name, icon: group.icon });
      }
      
      if (state.groupBy === 'none' || expandedGroups.has(group.name)) {
        group.columns.forEach(column => {
          items.push({ type: 'column', column, group: group.name });
        });
      }
    });

    return { groupedColumns: groups, flatItems: items };
  }, [filteredColumns, state.groupBy, expandedGroups]);

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
    setState(prev => {
      const newSelected = new Set(prev.selectedColumns);
      if (newSelected.has(columnId)) {
        newSelected.delete(columnId);
      } else {
        newSelected.add(columnId);
      }
      return { ...prev, selectedColumns: newSelected };
    });
  };

  const selectAllColumns = () => {
    setState(prev => ({
      ...prev,
      selectedColumns: new Set(filteredColumns.map(col => col.field || col.colId || ''))
    }));
  };

  const deselectAllColumns = () => {
    setState(prev => ({
      ...prev,
      selectedColumns: new Set()
    }));
  };

  const isAllSelected = filteredColumns.length > 0 && 
    filteredColumns.every(col => state.selectedColumns.has(col.field || col.colId || ''));
  const isIndeterminate = filteredColumns.some(col => state.selectedColumns.has(col.field || col.colId || '')) && 
    !isAllSelected;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search columns..."
          value={state.searchTerm}
          onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
          className="pl-10 h-9"
        />
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected || isIndeterminate}
            onCheckedChange={(checked) => {
              if (checked && !isAllSelected) {
                selectAllColumns();
              } else {
                deselectAllColumns();
              }
            }}
            className={isIndeterminate ? 'data-[state=checked]:bg-primary/50' : ''}
          />
          <span className="text-sm">Select All</span>
        </div>
        
        <Select 
          value={state.groupBy} 
          onValueChange={(value: 'none' | 'type' | 'dataType') => 
            setState(prev => ({ ...prev, groupBy: value }))
          }
        >
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Grouping</SelectItem>
            <SelectItem value="type">Group by Type</SelectItem>
            <SelectItem value="dataType">Group by Data Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Virtual Column List */}
      <div className="flex-1 -mx-2">
        <div 
          ref={parentRef}
          className="h-full overflow-auto px-2"
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
                      className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      {expandedGroups.has(item.group!) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                      <span className="text-sm font-medium flex-1 text-left">
                        {item.icon} {item.group} ({groupedColumns.find(g => g.name === item.group)?.columns.length || 0})
                      </span>
                    </button>
                  ) : (
                    <div className={state.groupBy !== 'none' ? "ml-6" : ""}>
                      <ColumnItem
                        column={item.column!}
                        selected={state.selectedColumns.has(item.column!.field || item.column!.colId || '')}
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

      {/* Save Selection Set */}
      <Button variant="outline" className="mt-4 w-full gap-2" size="sm">
        <Save className="h-4 w-4" />
        Save Selection Set
      </Button>
    </div>
  );
};

// Column Item Component
const ColumnItem: React.FC<{
  column: ColDef;
  selected: boolean;
  onToggle: () => void;
}> = ({ column, selected, onToggle }) => {
  const iconKey = (column.cellDataType || column.type || 'default') as string;
  const icon = COLUMN_ICONS[iconKey] || COLUMN_ICONS.default;
  
  return (
    <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors">
      <Checkbox 
        checked={selected} 
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span className="text-sm flex-1 truncate">{column.headerName || column.field}</span>
      <span className="text-xs">{icon}</span>
    </div>
  );
};