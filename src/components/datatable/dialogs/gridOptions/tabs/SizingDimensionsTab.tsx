import React from 'react';
import { Gauge, Ruler, Maximize2 } from 'lucide-react';
import { OptionItem } from '../components/OptionItem';

interface SizingDimensionsTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const SizingDimensionsTab: React.FC<SizingDimensionsTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Ruler className="option-group-icon" />
            Row Heights
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Group Header Height"
            description="Height in pixels for group header rows"
            value={options.groupHeaderHeight}
            type="number"
            onChange={(value) => onChange('groupHeaderHeight', value)}
            optionKey="groupHeaderHeight"
            min={10}
            max={500}
          />
          
          <OptionItem
            label="Group Row Height"
            description="Height in pixels for group rows"
            value={options.groupRowHeight}
            type="number"
            onChange={(value) => onChange('groupRowHeight', value)}
            optionKey="groupRowHeight"
            min={10}
            max={500}
          />
          
          <OptionItem
            label="Detail Row Height"
            description="Height of detail rows in master-detail view"
            value={options.detailRowHeight}
            type="number"
            onChange={(value) => onChange('detailRowHeight', value)}
            optionKey="detailRowHeight"
            showEnterpriseBadge
            min={50}
            max={1000}
          />
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Maximize2 className="option-group-icon" />
            Pivot Heights
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Pivot Header Height"
            description="Height in pixels for pivot header rows"
            value={options.pivotHeaderHeight}
            type="number"
            onChange={(value) => onChange('pivotHeaderHeight', value)}
            optionKey="pivotHeaderHeight"
            showEnterpriseBadge
            min={10}
            max={500}
          />
          
          <OptionItem
            label="Pivot Group Header Height"
            description="Height in pixels for pivot group header rows"
            value={options.pivotGroupHeaderHeight}
            type="number"
            onChange={(value) => onChange('pivotGroupHeaderHeight', value)}
            optionKey="pivotGroupHeaderHeight"
            showEnterpriseBadge
            min={10}
            max={500}
          />
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Gauge className="option-group-icon" />
            Other Dimensions
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Floating Filters Height"
            description="Height in pixels for floating filter row"
            value={options.floatingFiltersHeight}
            type="number"
            onChange={(value) => onChange('floatingFiltersHeight', value)}
            optionKey="floatingFiltersHeight"
            min={10}
            max={100}
          />
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          Size Configuration Tips
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Basic row and header heights are configured in the Basic tab</li>
          <li>• Use consistent heights for better visual alignment</li>
          <li>• Consider screen size and data density when setting heights</li>
          <li>• Test with your actual data to find optimal sizes</li>
          <li>• Remember that larger heights mean fewer visible rows</li>
        </ul>
      </div>
    </div>
  );
};