import React from 'react';
import { OptionItem } from '../components/OptionItem';

interface SelectionTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const SelectionTab: React.FC<SelectionTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <span className="text-base">🎯</span>
            Row Selection
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Row Selection"
            description="Type of row selection"
            value={options.rowSelection}
            type="select"
            options={[
              { value: undefined, label: 'None' },
              { value: 'single', label: 'Single' },
              { value: 'multiple', label: 'Multiple' }
            ]}
            onChange={(value) => onChange('rowSelection', value === 'undefined' ? undefined : value)}
            optionKey="rowSelection"
          />
          
          <OptionItem
            label="Multi-Select with Click"
            description="Allow multiple row selection with single click (no need to hold Ctrl/Cmd)"
            value={options.rowMultiSelectWithClick}
            type="boolean"
            onChange={(value) => onChange('rowMultiSelectWithClick', value)}
            optionKey="rowMultiSelectWithClick"
          />
          
          <OptionItem
            label="Suppress Row Click Selection"
            description="Prevent rows from being selected when clicked"
            value={options.suppressRowClickSelection}
            type="boolean"
            onChange={(value) => onChange('suppressRowClickSelection', value)}
            optionKey="suppressRowClickSelection"
          />
          
          <OptionItem
            label="Suppress Row Deselection"
            description="Prevent rows from being deselected"
            value={options.suppressRowDeselection}
            type="boolean"
            onChange={(value) => onChange('suppressRowDeselection', value)}
            optionKey="suppressRowDeselection"
          />
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <span className="text-base">📱</span>
            Cell & Range Selection
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Suppress Cell Selection"
            description="Prevent cells from being selected"
            value={options.suppressCellSelection}
            type="boolean"
            onChange={(value) => onChange('suppressCellSelection', value)}
            optionKey="suppressCellSelection"
          />
          
          <OptionItem
            label="Enable Range Selection"
            description="Enable range selection (multiple cells)"
            value={options.enableRangeSelection}
            type="boolean"
            onChange={(value) => onChange('enableRangeSelection', value)}
            optionKey="enableRangeSelection"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Enable Range Handle"
            description="Show range handle for extending selection"
            value={options.enableRangeHandle}
            type="boolean"
            onChange={(value) => onChange('enableRangeHandle', value)}
            optionKey="enableRangeHandle"
            showEnterpriseBadge
          />
        </div>
      </div>
    </div>
  );
};