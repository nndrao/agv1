import React from 'react';
import { Grid3x3, Info } from 'lucide-react';
import { OptionItem } from '../components/OptionItem';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ColumnFeaturesTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const ColumnFeaturesTab: React.FC<ColumnFeaturesTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Grid3x3 className="option-group-icon" />
            Column Behavior
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Suppress Drag Leave Hides Columns"
            description="Prevent column hiding when dragged out of grid"
            value={options.suppressDragLeaveHidesColumns}
            type="boolean"
            onChange={(value) => onChange('suppressDragLeaveHidesColumns', value)}
            optionKey="suppressDragLeaveHidesColumns"
          />
          
          <OptionItem
            label="Suppress Movable Columns"
            description="Prevent columns from being moved"
            value={options.suppressMovableColumns}
            type="boolean"
            onChange={(value) => onChange('suppressMovableColumns', value)}
            optionKey="suppressMovableColumns"
          />
          
          <OptionItem
            label="Suppress Field Dot Notation"
            description="Disable dot notation for accessing nested properties"
            value={options.suppressFieldDotNotation}
            type="boolean"
            onChange={(value) => onChange('suppressFieldDotNotation', value)}
            optionKey="suppressFieldDotNotation"
          />
          
          <OptionItem
            label="Suppress Auto Size"
            description="Prevent automatic column sizing"
            value={options.suppressAutoSize}
            type="boolean"
            onChange={(value) => onChange('suppressAutoSize', value)}
            optionKey="suppressAutoSize"
          />
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Grid3x3 className="option-group-icon" />
            Column Definitions
          </h3>
        </div>
        <div className="option-group-content">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">The following options are typically configured programmatically:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">autoGroupColumnDef</code> - Definition for auto-generated group column</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">columnTypes</code> - Define column types to reuse column definitions</li>
            </ul>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 mt-2 cursor-help">
                    <Info className="w-3 h-3" />
                    <span className="text-xs">These can be configured in the Column Customization dialog</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use the Column Settings button in the toolbar to customize individual columns</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
};