import React from 'react';
import { OptionItem } from '../components/OptionItem';

interface SortingFilteringTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const SortingFilteringTab: React.FC<SortingFilteringTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <span className="text-base">↕️</span>
            Sorting Options
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Multi Sort Key"
            description="Key to hold for multi-column sorting"
            value={options.multiSortKey}
            type="select"
            options={[
              { value: 'ctrl', label: 'Ctrl/Cmd' },
              { value: 'shift', label: 'Shift' },
              { value: 'alt', label: 'Alt' }
            ]}
            onChange={(value) => onChange('multiSortKey', value)}
            optionKey="multiSortKey"
          />
          
          <OptionItem
            label="Accented Sort"
            description="Use locale-specific rules for sorting accented characters"
            value={options.accentedSort}
            type="boolean"
            onChange={(value) => onChange('accentedSort', value)}
            optionKey="accentedSort"
          />
          
          <div className="option-item">
            <div className="option-info">
              <div className="option-label">
                <label className="text-sm font-medium">Sorting Order</label>
              </div>
              <p className="option-description">Order of sort cycles (default: ['asc', 'desc', null])</p>
            </div>
            <div className="option-control">
              <span className="text-sm text-muted-foreground">Configure programmatically</span>
            </div>
          </div>
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <span className="text-base">🔍</span>
            Filtering Options
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Enable Advanced Filter"
            description="Enable Advanced Filter feature"
            value={options.enableAdvancedFilter}
            type="boolean"
            onChange={(value) => onChange('enableAdvancedFilter', value)}
            optionKey="enableAdvancedFilter"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Quick Filter Text"
            description="Text for quick filtering across all columns"
            value={options.quickFilterText}
            type="string"
            onChange={(value) => onChange('quickFilterText', value)}
            optionKey="quickFilterText"
            placeholder="Enter filter text..."
          />
          
          <OptionItem
            label="Cache Quick Filter"
            description="Cache quick filter results for better performance"
            value={options.cacheQuickFilter}
            type="boolean"
            onChange={(value) => onChange('cacheQuickFilter', value)}
            optionKey="cacheQuickFilter"
          />
          
          <OptionItem
            label="Exclude Children When Filtering"
            description="Whether to exclude children when filtering tree data"
            value={options.excludeChildrenWhenTreeDataFiltering}
            type="boolean"
            onChange={(value) => onChange('excludeChildrenWhenTreeDataFiltering', value)}
            optionKey="excludeChildrenWhenTreeDataFiltering"
          />
        </div>
      </div>
    </div>
  );
};