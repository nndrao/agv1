import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  ChevronDown,
  Search,
  Filter,
  Eye,
  EyeOff,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Package,
  CircleDot,
  DollarSign,
  Settings,
  Columns3,
  Palette,
  Edit3,
  Move,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { ColDef } from 'ag-grid-community';

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

// Component to show customization details
const CustomizationDetails: React.FC<{ columnId: string; columnDef: ColDef }> = ({ columnId, columnDef }) => {
  const { pendingChanges, appliedTemplates, removeColumnCustomization, removeAppliedTemplate } = useColumnFormattingStore.getState();
  const pending = pendingChanges.get(columnId) || {};
  const effectiveColumn = { ...columnDef, ...pending };
  const appliedTemplate = appliedTemplates.get(columnId);
  const [deletedItems, setDeletedItems] = useState<Set<string>>(new Set());
  
  const handleRemoveCustomization = (type: string) => {
    const newDeletedItems = new Set(deletedItems);
    newDeletedItems.add(type);
    
    switch (type) {
      case 'Styling':
        removeColumnCustomization(columnId, 'style');
        break;
      case 'Formatter':
        removeColumnCustomization(columnId, 'formatter');
        break;
      case 'Filter':
        removeColumnCustomization(columnId, 'filter');
        break;
      case 'Editor':
        removeColumnCustomization(columnId, 'editor');
        break;
      case 'General':
        removeColumnCustomization(columnId, 'general');
        break;
      case 'Template':
        removeAppliedTemplate(columnId);
        break;
    }
    
    setDeletedItems(newDeletedItems);
  };
  
  const customizations = [];
  
  // Check for styling
  if (!deletedItems.has('Styling') && (effectiveColumn.cellStyle || effectiveColumn.headerStyle || 
      effectiveColumn.cellClass || effectiveColumn.headerClass)) {
    customizations.push({
      type: 'Styling',
      icon: Palette,
      details: [
        effectiveColumn.cellStyle && 'Cell styles',
        effectiveColumn.headerStyle && 'Header styles',
        effectiveColumn.cellClass && 'Cell classes',
        effectiveColumn.headerClass && 'Header classes'
      ].filter(Boolean)
    });
  }
  
  // Check for formatters
  if (!deletedItems.has('Formatter') && effectiveColumn.valueFormatter) {
    customizations.push({
      type: 'Formatter',
      icon: Hash,
      details: ['Value formatter applied']
    });
  }
  
  // Check for filters
  if (!deletedItems.has('Filter') && (effectiveColumn.filter || effectiveColumn.filterParams)) {
    customizations.push({
      type: 'Filter',
      icon: Filter,
      details: [
        effectiveColumn.filter && `Filter: ${effectiveColumn.filter}`,
        effectiveColumn.filterParams && 'Custom filter params'
      ].filter(Boolean)
    });
  }
  
  // Check for editors
  if (!deletedItems.has('Editor') && (effectiveColumn.cellEditor || effectiveColumn.cellEditorParams)) {
    customizations.push({
      type: 'Editor',
      icon: Edit3,
      details: [
        effectiveColumn.cellEditor && `Editor: ${effectiveColumn.cellEditor}`,
        effectiveColumn.cellEditorParams && 'Custom editor params'
      ].filter(Boolean)
    });
  }
  
  // Check for general settings
  const generalSettings = [];
  if (effectiveColumn.width) generalSettings.push(`Width: ${effectiveColumn.width}px`);
  if (effectiveColumn.pinned) generalSettings.push(`Pinned: ${effectiveColumn.pinned}`);
  if (effectiveColumn.lockPosition) generalSettings.push('Position locked');
  
  if (!deletedItems.has('General') && generalSettings.length > 0) {
    customizations.push({
      type: 'General',
      icon: Settings,
      details: generalSettings
    });
  }
  
  // Check for applied template
  if (!deletedItems.has('Template') && appliedTemplate) {
    customizations.push({
      type: 'Template',
      icon: Move,
      details: [`Template: ${appliedTemplate}`]
    });
  }
  
  return (
    <div className="space-y-3 min-w-[200px]">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Column Customizations</span>
      </div>
      
      {customizations.map((customization, index) => {
        const Icon = customization.icon;
        return (
          <div key={index} className="relative flex items-start justify-between gap-2 py-1 px-2 -mx-2 hover:bg-muted/50 rounded-sm transition-colors group">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">{customization.type}</span>
              </div>
              <ul className="ml-5 space-y-0.5">
                {customization.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="text-xs text-muted-foreground">
                    • {detail}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleRemoveCustomization(customization.type)}
              className="shrink-0 p-1 rounded-md border border-transparent hover:border-border hover:bg-accent transition-all duration-200 group/btn"
              aria-label={`Remove ${customization.type} customization`}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground group-hover/btn:text-foreground transition-colors" />
            </button>
          </div>
        );
      })}
      
      {customizations.length === 0 && (
        <p className="text-xs text-muted-foreground">No customizations applied</p>
      )}
    </div>
  );
};

export const ColumnSelectorTable: React.FC<{
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  onSelectionChange: (columns: Set<string>) => void;
}> = ({ selectedColumns, columnDefinitions, onSelectionChange }) => {
  const {
    searchTerm,
    cellDataTypeFilter,
    visibilityFilter,
    columnState,
    appliedTemplates,
    setSearchTerm,
    setCellDataTypeFilter,
    setVisibilityFilter,
  } = useColumnFormattingStore();

  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState('650px');
  const hasOpenedRef = useRef(false);

  // Set to visible columns when opening for the first time
  useEffect(() => {
    if (open && !hasOpenedRef.current) {
      setVisibilityFilter('visible');
      hasOpenedRef.current = true;
    }
  }, [open, setVisibilityFilter]);

  // Calculate max height based on viewport
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (open && popoverRef.current) {
        const rect = popoverRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const topOffset = rect.top;
        const bottomPadding = 40;
        const availableHeight = viewportHeight - topOffset - bottomPadding;
        const maxAllowedHeight = Math.min(availableHeight, 650);
        setMaxHeight(`${maxAllowedHeight}px`);
      }
    };

    if (open) {
      setTimeout(calculateMaxHeight, 10);
      window.addEventListener('resize', calculateMaxHeight);
      window.addEventListener('scroll', calculateMaxHeight);
      return () => {
        window.removeEventListener('resize', calculateMaxHeight);
        window.removeEventListener('scroll', calculateMaxHeight);
      };
    }
  }, [open]);

  // Get all columns as array
  const allColumns = useMemo(() => {
    return Array.from(columnDefinitions.values());
  }, [columnDefinitions]);

  // Get available cellDataType options
  const availableCellDataTypes = useMemo(() => {
    const types = new Set<string>();
    allColumns.forEach(col => {
      const dataType = col.cellDataType || col.type;
      if (dataType) {
        if (typeof dataType === 'string') {
          types.add(dataType);
        } else if (Array.isArray(dataType)) {
          dataType.forEach(dt => types.add(dt));
        } else {
          types.add('text');
        }
      } else {
        // Infer type from other column properties
        if (col.filter === 'agNumberColumnFilter' || col.valueFormatter || 
            col.field?.toLowerCase().includes('price') || 
            col.field?.toLowerCase().includes('amount')) {
          types.add('number');
        } else if (col.filter === 'agDateColumnFilter' || 
                   col.field?.toLowerCase().includes('date')) {
          types.add('date');
        } else if (col.cellEditor === 'agCheckboxCellEditor') {
          types.add('boolean');
        } else {
          types.add('text');
        }
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
      filtered = filtered.filter(col => {
        const dataType = col.cellDataType || col.type || '';
        return dataType === cellDataTypeFilter;
      });
    }

    // Filter by visibility using column state
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(col => {
        const field = col.field || '';
        const colId = col.colId || field;
        
        let colState = columnState.get(field);
        if (!colState && field !== colId) {
          colState = columnState.get(colId);
        }
        
        const isHidden = colState?.hide === true;
        return visibilityFilter === 'hidden' ? isHidden : !isHidden;
      });
    }

    return filtered;
  }, [allColumns, searchTerm, cellDataTypeFilter, visibilityFilter, columnState]);

  // Handle column toggle
  const handleToggleColumn = useCallback((columnId: string) => {
    const newSelection = new Set(selectedColumns);
    if (newSelection.has(columnId)) {
      newSelection.delete(columnId);
    } else {
      newSelection.add(columnId);
    }
    onSelectionChange(newSelection);
  }, [selectedColumns, onSelectionChange]);

  // Bulk selection handlers
  const selectAllFilteredColumns = useCallback(() => {
    const columnIds = filteredColumns
      .map(col => col.field || col.colId || '')
      .filter(id => id);
    
    if (columnIds.length > 0) {
      const newSelection = new Set(selectedColumns);
      columnIds.forEach(id => newSelection.add(id));
      onSelectionChange(newSelection);
    }
  }, [filteredColumns, selectedColumns, onSelectionChange]);

  const deselectAllFilteredColumns = useCallback(() => {
    const columnIds = filteredColumns
      .map(col => col.field || col.colId || '')
      .filter(id => id);
    
    if (columnIds.length > 0) {
      const newSelection = new Set(selectedColumns);
      columnIds.forEach(id => newSelection.delete(id));
      onSelectionChange(newSelection);
    }
  }, [filteredColumns, selectedColumns, onSelectionChange]);

  // Selection state calculations
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

  const filteredSelectedCount = useMemo(() => 
    filteredColumns.filter(col =>
      selectedColumns.has(col.field || col.colId || '')
    ).length,
    [filteredColumns, selectedColumns]
  );

  // Column display name for selector button
  const getDisplayText = () => {
    if (selectedColumns.size === 0) return "Select columns...";
    if (selectedColumns.size === 1) {
      const columnId = Array.from(selectedColumns)[0];
      const column = columnDefinitions.get(columnId);
      return column?.headerName || column?.field || columnId;
    }
    return `${selectedColumns.size} columns selected`;
  };

  // Get customization count for a column
  const getCustomizationCount = (columnId: string) => {
    const { pendingChanges } = useColumnFormattingStore.getState();
    const column = columnDefinitions.get(columnId);
    const pending = pendingChanges.get(columnId) || {};
    const effectiveColumn = { ...column, ...pending };
    
    let count = 0;
    const hasValue = (value: any) => value !== undefined && value !== null;
    
    if (hasValue(effectiveColumn.cellStyle) || hasValue(effectiveColumn.headerStyle) || 
        hasValue(effectiveColumn.cellClass) || hasValue(effectiveColumn.headerClass)) count++;
    if (hasValue(effectiveColumn.valueFormatter)) count++;
    if (hasValue(effectiveColumn.filter) || hasValue(effectiveColumn.filterParams)) count++;
    if (hasValue(effectiveColumn.cellEditor) || hasValue(effectiveColumn.cellEditorParams)) count++;
    if (hasValue(effectiveColumn.width) || hasValue(effectiveColumn.pinned) || 
        hasValue(effectiveColumn.lockPosition)) count++;
    
    const appliedTemplate = appliedTemplates.get(columnId);
    if (appliedTemplate) count++;
    
    return count;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-6 px-2 text-[11px] justify-between min-w-[100px] max-w-[160px] border border-border/60 bg-background/80 hover:bg-muted/50 transition-all duration-200"
        >
          <span className="truncate font-medium">{getDisplayText()}</span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        ref={popoverRef}
        className="w-[280px] p-0" 
        align="start"
        side="bottom"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={20}
      >
        <div className="flex flex-col w-full" style={{ height: maxHeight, maxHeight }}>
          {/* Header */}
          <div className="px-3 py-2 border-b border-border/40 bg-gradient-to-r from-muted/15 to-muted/5 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <Columns3 className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold tracking-tight">Columns</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 ml-auto font-medium rounded-md border-border/60">
                {filteredColumns.length}
              </Badge>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-3 overflow-hidden" style={{ minHeight: 0 }}>
            {/* Search Bar */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
              <Input
                placeholder="Search columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm rounded-md border-border/60 bg-background/80"
              />
            </div>

            {/* Type Filter */}
            <div className="mb-2">
              <Select
                value={cellDataTypeFilter}
                onValueChange={setCellDataTypeFilter}
              >
                <SelectTrigger className="h-8 text-sm rounded-md border-border/60 bg-background/80 w-full">
                  <Filter className="h-3.5 w-3.5 mr-2 shrink-0" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Types</SelectItem>
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
            </div>

            {/* Visibility Toggle */}
            <div className="mb-3">
              <ToggleGroup
                type="single"
                value={visibilityFilter}
                onValueChange={(value) => value && setVisibilityFilter(value as 'all' | 'visible' | 'hidden')}
                className="justify-start h-8"
              >
                <ToggleGroupItem
                  value="all"
                  aria-label="Show all columns"
                  className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Columns3 className="h-3.5 w-3.5 mr-1.5" />
                  All
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="visible"
                  aria-label="Show visible columns only"
                  className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Visible
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="hidden"
                  aria-label="Show hidden columns only"
                  className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                  Hidden
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Table container with proper scroll styling */}
            <div className="flex-1 min-h-0 border rounded-md bg-background overflow-hidden">
              <div className="h-full overflow-auto">
                <TooltipProvider>
                  <table className="w-full text-sm table-fixed">
                  <thead className="sticky top-0 bg-muted/50 border-b z-10">
                    <tr>
                      <th className="w-10 h-8">
                        <div className="flex items-center justify-center h-full">
                          <Checkbox
                            checked={isAllSelected ? true : (isIndeterminate ? "indeterminate" : false)}
                            onCheckedChange={(checked) => {
                              if (checked === true || checked === "indeterminate") {
                                selectAllFilteredColumns();
                              } else {
                                deselectAllFilteredColumns();
                              }
                            }}
                            className="rounded"
                          />
                        </div>
                      </th>
                      <th className="h-8 px-2 text-left text-xs font-medium text-muted-foreground">Column</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredColumns.map((column) => {
                      const columnId = column.field || column.colId || '';
                      const selected = selectedColumns.has(columnId);
                      const IconComponent = getColumnIcon((column.cellDataType || column.type || 'text') as string);
                      const colState = columnState.get(columnId);
                      const isHidden = colState?.hide || false;
                      const customizationCount = getCustomizationCount(columnId);
                      
                      return (
                        <tr 
                          key={columnId}
                          className={cn(
                            "border-b cursor-pointer hover:bg-muted/50 transition-colors",
                            selected && "bg-muted/30"
                          )}
                          onClick={() => handleToggleColumn(columnId)}
                        >
                          <td className="w-10 h-8">
                            <div className="flex items-center justify-center h-full">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => handleToggleColumn(columnId)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded"
                              />
                            </div>
                          </td>
                          <td className="h-8 px-2 pr-3">
                            <div className="flex items-center gap-1 min-w-0 max-w-full">
                              {customizationCount > 0 && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-4 w-4 shrink-0 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center hover:bg-primary/25 hover:border-primary/30 transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
                                      aria-label="View customization details"
                                    >
                                      <span className="text-[9px] font-semibold text-primary pointer-events-none">{customizationCount}</span>
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent side="left" align="center" className="w-auto p-3">
                                    <CustomizationDetails columnId={columnId} columnDef={column} />
                                  </PopoverContent>
                                </Popover>
                              )}
                              {isHidden ? (
                                <EyeOff className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                              ) : (
                                <Eye className="h-3 w-3 shrink-0 text-green-600 dark:text-green-500" />
                              )}
                              <IconComponent className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <span className={cn(
                                    "truncate text-xs min-w-0 overflow-hidden",
                                    isHidden && "opacity-50"
                                  )}>
                                    {column.headerName || column.field}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="max-w-xs">{column.headerName || column.field}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                  {filteredColumns.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">
                        No columns match your filters
                      </div>
                    </div>
                  )}
                </TooltipProvider>
              </div>
            </div>

            {/* Selection summary */}
            {filteredSelectedCount > 0 && (
              <div className="mt-2 text-xs text-muted-foreground text-center">
                {filteredSelectedCount} of {filteredColumns.length} selected
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};