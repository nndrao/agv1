import React from 'react';
import { OptionItem } from '../components/OptionItem';

interface PaginationTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const PaginationTab: React.FC<PaginationTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <span className="text-base">📄</span>
            Pagination Settings
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Enable Pagination"
            description="Enable pagination for the grid"
            value={options.pagination}
            type="boolean"
            onChange={(value) => onChange('pagination', value)}
            optionKey="pagination"
          />
          
          <OptionItem
            label="Page Size"
            description="Number of rows per page"
            value={options.paginationPageSize}
            type="number"
            onChange={(value) => onChange('paginationPageSize', value)}
            optionKey="paginationPageSize"
            min={10}
            max={500}
            step={10}
          />
          
          <OptionItem
            label="Auto Page Size"
            description="Automatically adjust page size based on the height of the grid"
            value={options.paginationAutoPageSize}
            type="boolean"
            onChange={(value) => onChange('paginationAutoPageSize', value)}
            optionKey="paginationAutoPageSize"
          />
          
          <OptionItem
            label="Suppress Pagination Panel"
            description="Hide the pagination panel"
            value={options.suppressPaginationPanel}
            type="boolean"
            onChange={(value) => onChange('suppressPaginationPanel', value)}
            optionKey="suppressPaginationPanel"
          />
          
          <div className="option-item">
            <div className="option-info">
              <div className="option-label">
                <label className="text-sm font-medium">Page Size Selector</label>
              </div>
              <p className="option-description">Array of page sizes to display in the size selector (e.g., [10, 20, 50, 100])</p>
            </div>
            <div className="option-control">
              <span className="text-sm text-muted-foreground">Configure programmatically</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};