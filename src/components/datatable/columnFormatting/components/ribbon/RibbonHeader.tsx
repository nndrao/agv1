import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { 
  Save,
  RotateCcw,
  X,
  GripHorizontal,
  Eraser
} from 'lucide-react';
import { SimpleTemplateControls } from './SimpleTemplateControls';
import { ColumnSelectorTable } from './ColumnSelectorTable';
import type { RibbonHeaderProps } from '../../types';

export const RibbonHeader: React.FC<RibbonHeaderProps> = ({
  selectedColumns,
  columnDefinitions,
  hasChanges,
  onSelectionChange,
  onApply,
  onReset,
  onClose,
  onDragStart,
  onClearSelected
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
            <ColumnSelectorTable
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
          {selectedColumns.size > 0 && onClearSelected && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-7 px-2.5 text-xs hover:bg-muted/50 transition-all duration-200 text-orange-600 dark:text-orange-400"
                  onClick={onClearSelected}
                >
                  <Eraser className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline ml-1.5 font-medium">Clear</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="ribbon-tooltip">Clear all formatting from selected columns</TooltipContent>
            </Tooltip>
          )}
          
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