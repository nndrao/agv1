import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Save,
  Hash,
  DollarSign,
  Calendar,
  Type,
  ToggleLeft,
  Box,
  FileText
} from 'lucide-react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { ColDef, GridApi } from 'ag-grid-community';

interface ColumnSelectorPanelProps {
  gridApi: GridApi;
}

export const ColumnSelectorPanel: React.FC<ColumnSelectorPanelProps> = () => {
  const {
    selectedColumns,
    searchTerm,
    groupBy,
    setSearchTerm,
    setGroupBy,
    toggleColumnSelection,
    selectAllColumns,
    deselectAllColumns,
    columnDefinitions
  } = useColumnCustomizationStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['All Columns']));

  // Get all columns from store
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

  // Group columns
  const groupedColumns = useMemo(() => {
    if (groupBy === 'none') {
      return [{ name: 'All Columns', columns: filteredColumns, Icon: FileText }];
    }
    
    // Group by type or dataType
    const groups = new Map<string, ColDef[]>();
    
    filteredColumns.forEach(col => {
      const groupKey = groupBy === 'type' 
        ? col.type || 'default' 
        : ((col as Record<string, unknown>).cellDataType as string) || 'text';
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(col);
    });
    
    return Array.from(groups.entries()).map(([key, cols]) => ({
      name: key,
      columns: cols,
      Icon: getIconForType(key)
    }));
  }, [filteredColumns, groupBy]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const isAllSelected = selectedColumns.size === allColumns.length && allColumns.length > 0;
  const isIndeterminate = selectedColumns.size > 0 && selectedColumns.size < allColumns.length;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search columns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isIndeterminate ? "indeterminate" : isAllSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                selectAllColumns();
              } else {
                deselectAllColumns();
              }
            }}
          />
          <span className="text-sm">Select All</span>
        </div>
        
        <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
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

      {/* Column List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {groupedColumns.map((group) => (
            <div key={group.name}>
              {groupBy !== 'none' && (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-md transition-colors"
                >
                  {expandedGroups.has(group.name) ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                  <group.Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {group.name} ({group.columns.length})
                  </span>
                </button>
              )}
              
              {(groupBy === 'none' || expandedGroups.has(group.name)) && (
                <div className="space-y-1 ml-6">
                  {group.columns.map((col) => (
                    <ColumnItem
                      key={col.field || col.colId}
                      column={col}
                      selected={selectedColumns.has(col.field || col.colId || '')}
                      onToggle={() => toggleColumnSelection(col.field || col.colId || '')}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Save Selection Set */}
      <Button variant="outline" className="mt-4 w-full" size="sm">
        <Save className="h-4 w-4 mr-2" />
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
  const dataType = ((column as Record<string, unknown>).cellDataType as string) || 'text';
  const IconComponent = getIconForType(dataType);
  
  return (
    <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors">
      <Checkbox checked={selected} onCheckedChange={onToggle} />
      <span className="text-sm flex-1">{column.headerName || column.field}</span>
      <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
};

// Helper function to get icons
const getIconForType = (type: string) => {
  const icons: Record<string, React.FC<{ className?: string }>> = {
    'number': Hash,
    'currency': DollarSign,
    'date': Calendar,
    'text': Type,
    'boolean': ToggleLeft,
    'object': Box,
    'default': FileText
  };
  return icons[type] || icons.default;
};