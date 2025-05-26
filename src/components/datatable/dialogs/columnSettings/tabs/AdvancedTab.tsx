import React from 'react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { PropertyGroup } from '../components/PropertyGroup';

export const AdvancedTab: React.FC = () => {
  const { selectedColumns } = useColumnCustomizationStore();
  
  return (
    <div className="p-4 space-y-4">
      {/* Two-column layout for better space utilization */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <PropertyGroup title="Performance">
            <div className="text-xs text-muted-foreground">
              Performance optimization options will be implemented here.
              {selectedColumns.size > 0 && (
                <div className="mt-2">
                  Selected columns: {selectedColumns.size}
                </div>
              )}
            </div>
          </PropertyGroup>
          
          <PropertyGroup title="Aggregation">
            <div className="text-xs text-muted-foreground">
              Column aggregation functions will be implemented here.
            </div>
          </PropertyGroup>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <PropertyGroup title="Grouping & Pivoting">
            <div className="text-xs text-muted-foreground">
              Row grouping and pivot options will be implemented here.
            </div>
          </PropertyGroup>
          
          <PropertyGroup title="Custom Properties">
            <div className="text-xs text-muted-foreground">
              Custom column properties will be implemented here.
            </div>
          </PropertyGroup>
        </div>
      </div>
    </div>
  );
};