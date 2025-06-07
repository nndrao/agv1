import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Type,
  DollarSign,
  Percent,
  Hash,
  Calendar,
  Filter,
  SortAsc,
  Columns,
  Settings,
  X,
  GripHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataTableContext } from './hooks/useDataTableContext';

interface FloatingRibbonProps {
  targetColumn?: string;
  initialPosition?: { x: number; y: number };
  onClose?: () => void;
}

export const FloatingRibbon: React.FC<FloatingRibbonProps> = ({ 
  targetColumn,
  initialPosition,
  onClose
}) => {
  const [position, setPosition] = useState(initialPosition || { x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  const { gridApiRef } = useDataTableContext();
  
  // Get column definition from grid API
  const getColumnDef = () => {
    if (!gridApiRef.current || !targetColumn) return null;
    const column = gridApiRef.current.getColumn(targetColumn);
    return column?.getColDef();
  };

  // Update column definition directly on the grid
  const updateColumnProperty = (property: string, value: any) => {
    if (!gridApiRef.current || !targetColumn) return;
    
    const colDef = getColumnDef();
    if (!colDef) return;
    
    // Update the column definition
    (colDef as any)[property] = value;
    
    // Refresh the grid to apply changes
    gridApiRef.current.refreshCells({ force: true });
    gridApiRef.current.refreshHeader();
  };

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.ribbon-content')) return;
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 0);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Save position
        localStorage.setItem('floating-ribbon-position', JSON.stringify(position));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, position]);

  // Get current values for the target column
  const getCurrentAlignment = () => {
    const colDef = getColumnDef();
    if (!colDef) return '';
    
    const cellClass = colDef.cellClass || '';
    if (typeof cellClass === 'string') {
      if (cellClass.includes('text-left')) return 'left';
      if (cellClass.includes('text-center')) return 'center';
      if (cellClass.includes('text-right')) return 'right';
    }
    return '';
  };

  const getCurrentStyles = () => {
    const colDef = getColumnDef();
    if (!colDef) return [];
    
    const styles: string[] = [];
    const cellStyle = colDef.cellStyle;
    
    if (cellStyle && typeof cellStyle === 'object') {
      if ((cellStyle as any).fontWeight === 'bold') styles.push('bold');
      if ((cellStyle as any).fontStyle === 'italic') styles.push('italic');
      if ((cellStyle as any).textDecoration === 'underline') styles.push('underline');
    } else if (typeof cellStyle === 'function') {
      // Check base style from function metadata
      const baseStyle = (cellStyle as any).__baseStyle;
      if (baseStyle) {
        if (baseStyle.fontWeight === 'bold') styles.push('bold');
        if (baseStyle.fontStyle === 'italic') styles.push('italic');
        if (baseStyle.textDecoration === 'underline') styles.push('underline');
      }
    }
    
    return styles;
  };

  const handleAlignmentChange = (value: string) => {
    if (!value) return;
    
    const colDef = getColumnDef();
    if (!colDef) return;
    
    const currentClass = colDef.cellClass || '';
    
    // Remove existing alignment classes
    let newClass = typeof currentClass === 'string' 
      ? currentClass.split(' ').filter(c => 
          !c.includes('text-left') && 
          !c.includes('text-center') && 
          !c.includes('text-right')
        ).join(' ')
      : '';
    
    // Add new alignment
    newClass = `${newClass} text-${value}`.trim();
    
    updateColumnProperty('cellClass', newClass);
  };

  const applyFormat = (format: string) => {
    const formatTemplates: Record<string, string> = {
      currency: '$#,##0.00',
      percent: '0.00%',
      number: '#,##0.00',
      'color-positive': '[>0][Green]#,##0.00;[<0][Red]#,##0.00;#,##0.00',
      date: 'YYYY-MM-DD'
    };
    
    const formatString = formatTemplates[format];
    if (formatString) {
      // Import the formatter creation logic
      import('./utils/formatters').then(({ createExcelFormatter, createCellStyleFunction }) => {
        const formatter = createExcelFormatter(formatString);
        updateColumnProperty('valueFormatter', formatter);
        
        // For color formats, also update cell style
        if (format === 'color-positive') {
          const colDef = getColumnDef();
          const existingBaseStyle = colDef?.cellStyle && typeof colDef.cellStyle === 'function' 
            ? (colDef.cellStyle as any).__baseStyle || {}
            : colDef?.cellStyle || {};
            
          const cellStyleFn = createCellStyleFunction(formatString, existingBaseStyle);
          updateColumnProperty('cellStyle', cellStyleFn);
        }
      });
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  if (!targetColumn) return null;

  return (
    <Card
      ref={dragRef}
      className={cn(
        "fixed z-50 shadow-xl border backdrop-blur-sm bg-background/95",
        isDragging && "cursor-grabbing opacity-90"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '420px',
        maxWidth: '500px'
      }}
    >
      <div 
        className="flex items-center gap-2 px-3 py-2 bg-muted/50 cursor-grab"
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Format: {getColumnDef()?.headerName || targetColumn || 'Column'}
        </span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="ribbon-content p-3 space-y-3">
        {/* Font Formatting */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Style:</span>
          <ToggleGroup 
            type="multiple" 
            size="sm"
            value={getCurrentStyles()}
            onValueChange={(values) => {
              const colDef = getColumnDef();
              if (!colDef) return;
              
              // Build new style object
              const newStyle: React.CSSProperties = {};
              
              if (values.includes('bold')) newStyle.fontWeight = 'bold';
              if (values.includes('italic')) newStyle.fontStyle = 'italic';
              if (values.includes('underline')) newStyle.textDecoration = 'underline';
              
              // Get existing styles and merge
              const existingStyle = colDef.cellStyle || {};
              
              const baseStyle = typeof existingStyle === 'function' 
                ? (existingStyle as any).__baseStyle || {}
                : existingStyle;
              
              const mergedStyle = { ...baseStyle, ...newStyle };
              
              // Remove style properties if not selected
              if (!values.includes('bold')) delete mergedStyle.fontWeight;
              if (!values.includes('italic')) delete mergedStyle.fontStyle;
              if (!values.includes('underline')) delete mergedStyle.textDecoration;
              
              updateColumnProperty('cellStyle', Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined);
            }}
          >
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold className="h-3 w-3" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic className="h-3 w-3" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline className="h-3 w-3" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Separator />

        {/* Alignment */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Align:</span>
          <ToggleGroup 
            type="single" 
            size="sm"
            value={getCurrentAlignment()}
            onValueChange={handleAlignmentChange}
          >
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft className="h-3 w-3" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter className="h-3 w-3" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight className="h-3 w-3" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Separator />

        {/* Quick Format */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Format:</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => applyFormat('currency')}
              title="Currency"
            >
              <DollarSign className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => applyFormat('percent')}
              title="Percentage"
            >
              <Percent className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => applyFormat('number')}
              title="Number"
            >
              <Hash className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => applyFormat('date')}
              title="Date"
            >
              <Calendar className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Color Format */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Color:</span>
          <Select onValueChange={applyFormat}>
            <SelectTrigger className="h-7 w-32">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="color-positive">+/- Colors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {/* Add filter logic */}}
          >
            <Filter className="h-3 w-3 mr-1" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {/* Add sort logic */}}
          >
            <SortAsc className="h-3 w-3 mr-1" />
            Sort
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              // Dispatch event to open column settings for this specific column
              const event = new CustomEvent('open-column-settings', {
                detail: { colId: targetColumn }
              });
              window.dispatchEvent(event);
              handleClose();
            }}
          >
            <Settings className="h-3 w-3 mr-1" />
            More
          </Button>
        </div>
      </div>
    </Card>
  );
};