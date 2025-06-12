import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown,
  Search,
  Save,
  RotateCcw,
  X,
  GripHorizontal,
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
  Palette,
  Edit3,
  Settings,
  Columns3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { CustomizationBadges, CustomizationType } from '../controls/CustomizationBadges';
import { SimpleTemplateControls } from './SimpleTemplateControls';
import { parseColorValue } from '@/components/datatable/utils/styleUtils';
import type { RibbonHeaderProps } from '../../types';
import { ColDef } from 'ag-grid-community';

// Helper function to get icon component based on column type (replicated from original)
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

// Enhanced Column Selector with all original features  
const ColumnSelectorDropdown: React.FC<{
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  onSelectionChange: (columns: Set<string>) => void;
}> = ({ selectedColumns, columnDefinitions, onSelectionChange }) => {
  const {
    searchTerm,
    cellDataTypeFilter,
    visibilityFilter,
    columnState,
    templateColumns,
    appliedTemplates,
    setSearchTerm,
    setCellDataTypeFilter,
    setVisibilityFilter,
    toggleTemplateColumn
  } = useColumnFormattingStore();

  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState('650px');
  const parentRef = useRef<HTMLDivElement>(null);

  // Don't reset filters when dropdown opens - maintain user's selections

  // Calculate max height based on viewport
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (open && popoverRef.current) {
        const rect = popoverRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const topOffset = rect.top;
        const bottomPadding = 40; // Space from bottom of viewport
        const availableHeight = viewportHeight - topOffset - bottomPadding;
        const maxAllowedHeight = Math.min(availableHeight, 650);
        setMaxHeight(`${maxAllowedHeight}px`);
      }
    };

    if (open) {
      // Small delay to ensure popover is rendered
      setTimeout(calculateMaxHeight, 10);
      
      // Recalculate on window resize and scroll
      window.addEventListener('resize', calculateMaxHeight);
      window.addEventListener('scroll', calculateMaxHeight);

      return () => {
        window.removeEventListener('resize', calculateMaxHeight);
        window.removeEventListener('scroll', calculateMaxHeight);
      };
    }
  }, [open]);

  // Get all columns as array (replicated logic)
  const allColumns = useMemo(() => {
    return Array.from(columnDefinitions.values());
  }, [columnDefinitions]);

  // Get available cellDataType options (replicated logic)
  const availableCellDataTypes = useMemo(() => {
    const types = new Set<string>();
    allColumns.forEach(col => {
      // Check cellDataType first, then fall back to type
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
            col.field?.toLowerCase().includes('amount') ||
            col.field?.toLowerCase().includes('qty') ||
            col.field?.toLowerCase().includes('quantity')) {
          types.add('number');
        } else if (col.filter === 'agDateColumnFilter' || 
                   col.field?.toLowerCase().includes('date') ||
                   col.field?.toLowerCase().includes('time')) {
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

  // Filter columns based on search, cellDataType, and visibility (replicated logic)
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

    // ALWAYS filter by visibility - show only visible columns by default
    // Users can explicitly choose "All Columns" if they want to see hidden ones
    const effectiveVisibilityFilter = visibilityFilter === 'all' ? 'visible' : visibilityFilter;
    
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
      
      return effectiveVisibilityFilter === 'hidden' ? isHidden : !isHidden;
    });

    return filtered;
  }, [allColumns, searchTerm, cellDataTypeFilter, visibilityFilter, columnState]);

  // Handle column toggle with proper synchronization
  const handleToggleColumn = useCallback((columnId: string) => {
    // Create new selection set and update parent
    const newSelection = new Set(selectedColumns);
    if (newSelection.has(columnId)) {
      newSelection.delete(columnId);
    } else {
      newSelection.add(columnId);
    }
    
    // Update parent which will update the store
    onSelectionChange(newSelection);
  }, [selectedColumns, onSelectionChange]);

  // Bulk selection handlers
  const selectAllFilteredColumns = useCallback(() => {
    const columnIds = filteredColumns
      .map(col => col.field || col.colId || '')
      .filter(id => id);
    
    if (columnIds.length > 0) {
      // Create new set with all filtered columns
      const newSelection = new Set(selectedColumns);
      columnIds.forEach(id => newSelection.add(id));
      
      // Update parent which will update the store
      onSelectionChange(newSelection);
    }
  }, [filteredColumns, selectedColumns, onSelectionChange]);

  const deselectAllFilteredColumns = useCallback(() => {
    const columnIds = filteredColumns
      .map(col => col.field || col.colId || '')
      .filter(id => id);
    
    if (columnIds.length > 0) {
      // Create new set without filtered columns
      const newSelection = new Set(selectedColumns);
      columnIds.forEach(id => newSelection.delete(id));
      
      // Update parent which will update the store
      onSelectionChange(newSelection);
    }
  }, [filteredColumns, selectedColumns, onSelectionChange]);

  // Selection state calculations (replicated logic)
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

  // Prepare items for rendering
  const flatItems = useMemo(() => {
    return filteredColumns.map(column => ({ 
      type: 'column' as const, 
      column,
      id: column.field || column.colId || ''
    }));
  }, [filteredColumns]);

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
        className="w-[320px] p-0" 
        align="start"
        side="bottom"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={20}
        collisionBoundary={undefined}
        sticky="always"
        onInteractOutside={(e) => {
          // Prevent closing when clicking inside the popover
          const target = e.target as HTMLElement;
          if (popoverRef.current?.contains(target)) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex flex-col w-full overflow-hidden" style={{ height: maxHeight, maxHeight }}>
          {/* Modern Header */}
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
            {/* Modern Search Bar */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
              <Input
                placeholder="Search columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm rounded-md border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary/60 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            {/* Filters */}
            <div className="space-y-2 mb-3">
              {/* CellDataType Filter */}
              <Select
                value={cellDataTypeFilter}
                onValueChange={setCellDataTypeFilter}
              >
                <SelectTrigger className="h-8 text-sm rounded-md border-border/60 bg-background/80 backdrop-blur-sm">
                  <Filter className="h-3.5 w-3.5 mr-2" />
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
                value={visibilityFilter === 'all' ? 'visible' : visibilityFilter}
                onValueChange={(value: 'all' | 'visible' | 'hidden') => setVisibilityFilter(value)}
              >
                <SelectTrigger className="h-8 text-sm rounded-md border-border/60 bg-background/80 backdrop-blur-sm">
                  {(visibilityFilter === 'visible' || visibilityFilter === 'all') ? (
                    <Eye className="h-3.5 w-3.5 mr-2" />
                  ) : visibilityFilter === 'hidden' ? (
                    <EyeOff className="h-3.5 w-3.5 mr-2" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 mr-2" />
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
                      <Eye 
                        className="h-4 w-4" 
                        style={{ 
                          color: parseColorValue('green', document.documentElement.classList.contains('dark'))
                        }} 
                      />
                      <span>Visible Columns</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hidden" className="text-sm">
                    <div className="flex items-center gap-2">
                      <EyeOff 
                        className="h-4 w-4" 
                        style={{ 
                          color: parseColorValue('red', document.documentElement.classList.contains('dark'))
                        }} 
                      />
                      <span>Hidden Columns</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Modern Selection Controls */}
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                checked={isAllSelected ? true : (isIndeterminate ? "indeterminate" : false)}
                onCheckedChange={(checked) => {
                  if (checked === true || checked === "indeterminate") {
                    selectAllFilteredColumns();
                  } else {
                    deselectAllFilteredColumns();
                  }
                }}
                className="rounded h-4 w-4"
              />
              <span className="text-xs font-medium text-foreground">
                {(searchTerm || cellDataTypeFilter !== 'all' || visibilityFilter !== 'all') ? 'All Filtered' : 'All'}
              </span>
              {filteredSelectedCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-medium rounded bg-secondary/80 border border-secondary/40">
                  {filteredSelectedCount}/{filteredColumns.length}
                </Badge>
              )}
            </div>

            {/* Virtual Column List */}
            <div className="flex-1 -mx-1 overflow-hidden" style={{ minHeight: '200px' }}>
              <div
                ref={parentRef}
                className="h-full overflow-auto px-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-border/80"
              >
                <div className="space-y-1">
                  {/* Non-virtualized rendering for debugging */}
                  {flatItems.map((item) => (
                    <ColumnItem
                      key={item.id}
                      column={item.column}
                      columnId={item.id}
                      selected={selectedColumns.has(item.id)}
                      isTemplate={templateColumns instanceof Set ? templateColumns.has(item.id) : false}
                      isHidden={(() => {
                        const field = item.column.field || '';
                        const colId = item.column.colId || field;
                        let colState = columnState.get(field);
                        if (!colState && field !== colId) {
                          colState = columnState.get(colId);
                        }
                        return colState?.hide || false;
                      })()}
                      appliedTemplate={appliedTemplates.get(item.id)}
                      onToggle={handleToggleColumn}
                      onToggleTemplate={toggleTemplateColumn}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Enhanced Column Item Component with all features from ColumnSelectorPanel
const ColumnItem: React.FC<{
  column: ColDef;
  columnId: string;
  selected: boolean;
  isTemplate: boolean;
  isHidden: boolean;
  appliedTemplate?: { templateId: string; templateName: string; appliedAt: number };
  onToggle: (columnId: string) => void;
  onToggleTemplate: (columnId: string) => void;
}> = React.memo(({ column, columnId, selected, isHidden, appliedTemplate, onToggle }) => {
  const { removeColumnCustomization, removeAppliedTemplate, pendingChanges } = useColumnFormattingStore();
  const [isHoveringTemplate, setIsHoveringTemplate] = useState(false);
  const iconKey = (column.cellDataType || column.type || 'text') as string;
  const IconComponent = getColumnIcon(iconKey);

  // Detect customizations including template info
  const customizations = useMemo(() => {
    const customs: CustomizationType[] = [];
    
    // Get pending changes for this column
    const pending = pendingChanges.get(columnId) || {};
    
    // Merge original column with pending changes to get effective column state
    const effectiveColumn = { ...column, ...pending };
    
    // Helper function to check if a value exists and is not undefined
    const hasValue = (value: any) => value !== undefined && value !== null;
    
    // Check for styling customizations
    const hasStyle = hasValue(effectiveColumn.cellStyle) || hasValue(effectiveColumn.headerStyle) || 
                     hasValue(effectiveColumn.cellClass) || hasValue(effectiveColumn.headerClass);
    if (hasStyle) {
      let styleCount = 0;
      if (hasValue(effectiveColumn.cellStyle)) styleCount++;
      if (hasValue(effectiveColumn.headerStyle)) styleCount++;
      if (hasValue(effectiveColumn.cellClass)) styleCount++;
      if (hasValue(effectiveColumn.headerClass)) styleCount++;
      customs.push({ 
        type: 'style', 
        label: 'Styling customizations', 
        icon: Palette,
        count: styleCount
      });
    }

    // Check for formatter
    if (hasValue(effectiveColumn.valueFormatter)) {
      customs.push({ 
        type: 'formatter', 
        label: 'Value formatter', 
        icon: Hash 
      });
    }

    // Check for filter
    if (hasValue(effectiveColumn.filter) || hasValue(effectiveColumn.filterParams)) {
      customs.push({ 
        type: 'filter', 
        label: 'Filter settings', 
        icon: Filter 
      });
    }

    // Check for editor
    if (hasValue(effectiveColumn.cellEditor) || hasValue(effectiveColumn.cellEditorParams)) {
      customs.push({ 
        type: 'editor', 
        label: 'Cell editor', 
        icon: Edit3 
      });
    }

    // Check for general settings (width, pinning, etc)
    const hasGeneral = hasValue(effectiveColumn.width) || hasValue(effectiveColumn.minWidth) || hasValue(effectiveColumn.maxWidth) || 
                      hasValue(effectiveColumn.pinned) || hasValue(effectiveColumn.lockPosition) || hasValue(effectiveColumn.lockVisible);
    if (hasGeneral) {
      let generalCount = 0;
      if (hasValue(effectiveColumn.width) || hasValue(effectiveColumn.minWidth) || hasValue(effectiveColumn.maxWidth)) generalCount++;
      if (hasValue(effectiveColumn.pinned)) generalCount++;
      if (hasValue(effectiveColumn.lockPosition) || hasValue(effectiveColumn.lockVisible)) generalCount++;
      customs.push({ 
        type: 'general', 
        label: 'General settings', 
        icon: Settings,
        count: generalCount
      });
    }

    return customs;
  }, [column, columnId, pendingChanges]);

  const handleToggle = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onToggle(columnId);
  }, [columnId, onToggle]);


  const handleRemoveCustomization = useCallback((type: string) => {
    removeColumnCustomization(columnId, type);
  }, [columnId, removeColumnCustomization]);

  return (
    <div 
      className={`relative flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 transition-colors group cursor-pointer ${
        selected ? 'bg-muted/30' : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
    >
      {selected && (
        <div className="absolute left-0 h-full w-0.5 bg-primary rounded-r" />
      )}
      <Checkbox
        checked={selected}
        onCheckedChange={() => {
          // Handle the change directly when checkbox is clicked
          handleToggle();
        }}
        onClick={(e) => {
          // Stop propagation to prevent the parent div's onClick from firing
          e.stopPropagation();
        }}
        className="shrink-0 h-4 w-4"
      />
      <IconComponent className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-xs flex-1 flex items-center gap-1 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`truncate ${isHidden ? 'opacity-50' : ''}`}>
              {column.headerName || column.field}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {column.headerName || column.field}
          </TooltipContent>
        </Tooltip>
        {isHidden && (
          <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </span>
      
      {/* Customization Count with Popover - moved to the right */}
      {(customizations.length > 0 || appliedTemplate) && (
        <Popover>
          <PopoverTrigger asChild>
            <div 
              className="h-4 w-4 shrink-0 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors ml-auto"
              title={`${customizations.length + (appliedTemplate ? 1 : 0)} customization${customizations.length + (appliedTemplate ? 1 : 0) !== 1 ? 's' : ''} applied`}
            >
              <span className="text-[9px] font-medium text-primary">{customizations.length + (appliedTemplate ? 1 : 0)}</span>
            </div>
          </PopoverTrigger>
          <PopoverContent side="left" align="center" className="w-auto p-3">
            <div className="space-y-2">
              {appliedTemplate && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Template:</p>
                  <div 
                    className="relative inline-block"
                    onMouseEnter={() => setIsHoveringTemplate(true)}
                    onMouseLeave={() => setIsHoveringTemplate(false)}
                  >
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs px-2 py-0.5 transition-all",
                        isHoveringTemplate && "pr-7"
                      )}
                    >
                      {appliedTemplate.templateName}
                    </Badge>
                    {isHoveringTemplate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[ColumnSelector] Removing template:', appliedTemplate.templateName, 'from column:', columnId);
                          removeAppliedTemplate(columnId);
                          setIsHoveringTemplate(false);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        aria-label="Remove template"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              {customizations.length > 0 && (
                <>
                  <p className="text-xs font-medium mb-2">Customizations:</p>
                  <CustomizationBadges
                    customizations={customizations}
                    onRemove={handleRemoveCustomization}
                    className="flex-wrap"
                    maxVisible={10} // Show all in popover
                  />
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});

ColumnItem.displayName = 'ColumnItem';

export const RibbonHeader: React.FC<RibbonHeaderProps> = ({
  selectedColumns,
  columnDefinitions,
  hasChanges,
  onSelectionChange,
  onApply,
  onReset,
  onClose,
  onDragStart
}) => {
  return (
    <TooltipProvider>
      <div 
        className="flex items-center px-3 py-2 h-full bg-muted/20 backdrop-blur-sm border-b border-border/50 shadow-sm"
      >
        {/* Left: Drag handle and title */}
        <div onMouseDown={onDragStart} className="flex items-center gap-2 cursor-move group">
          <GripHorizontal className="ribbon-drag-handle h-3.5 w-3.5 group-hover:text-muted-foreground transition-colors" />
          <span className="text-xs text-foreground font-semibold tracking-wide whitespace-nowrap">Column Customization</span>
        </div>

        {/* Spacer to create exact 100px gap */}
        <div className="w-[100px]"></div>

        {/* Middle: Column selector and template controls */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Label className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">Columns:</Label>
            <ColumnSelectorDropdown
              selectedColumns={selectedColumns}
              columnDefinitions={columnDefinitions}
              onSelectionChange={onSelectionChange}
            />
          </div>

          <Separator orientation="vertical" className="h-4 opacity-50" />

          {/* Simplified Template Controls */}
          <SimpleTemplateControls 
            selectedColumns={selectedColumns}
            columnDefinitions={columnDefinitions}
          />
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="h-7 px-2.5 text-xs hover:bg-muted/50 transition-all duration-200"
                onClick={onReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1.5 font-medium">Reset</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="ribbon-tooltip">Reset all changes</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                className="h-7 px-2.5 text-xs font-medium shadow-sm hover:shadow transition-all duration-200"
                onClick={onApply}
                disabled={!hasChanges}
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1.5">Apply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="ribbon-tooltip">Apply changes to grid</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-200 ml-2"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="ribbon-tooltip">Close ribbon</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}; 