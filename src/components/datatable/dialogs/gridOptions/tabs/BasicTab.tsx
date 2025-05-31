import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Settings, Database } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { OptionItem } from '../components/OptionItem';

interface BasicTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const BasicTab: React.FC<BasicTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Settings className="option-group-icon" />
            Grid Configuration
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Row Height"
            description="Height in pixels for each row"
            value={options.rowHeight}
            type="number"
            onChange={(value) => onChange('rowHeight', value)}
            optionKey="rowHeight"
          />
          
          <OptionItem
            label="Header Height"
            description="Height in pixels for the header row"
            value={options.headerHeight}
            type="number"
            onChange={(value) => onChange('headerHeight', value)}
            optionKey="headerHeight"
          />
          
          <OptionItem
            label="Row Model Type"
            description="The row model to use for data management"
            value={options.rowModelType}
            type="select"
            options={[
              { value: 'clientSide', label: 'Client Side' },
              { value: 'infinite', label: 'Infinite' },
              { value: 'serverSide', label: 'Server Side (Enterprise)' },
              { value: 'viewport', label: 'Viewport' }
            ]}
            onChange={(value) => onChange('rowModelType', value)}
            optionKey="rowModelType"
            showEnterpriseBadge={options.rowModelType === 'serverSide'}
          />
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Database className="option-group-icon" />
            Data Configuration
          </h3>
        </div>
        <div className="option-group-content">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">The following options are typically configured programmatically:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">rowData</code> - The data to be displayed</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">columnDefs</code> - Column definitions</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">defaultColDef</code> - Default column settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};