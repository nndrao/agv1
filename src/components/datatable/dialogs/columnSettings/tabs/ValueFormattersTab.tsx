import React from 'react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { PropertyGroup } from '../components/PropertyGroup';

export const ValueFormattersTab: React.FC = () => {
  const { selectedColumns } = useColumnCustomizationStore();
  
  return (
    <div className="p-4 space-y-4">
      {/* Two-column layout for better space utilization */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <PropertyGroup title="Number Formatters">
            <div className="text-xs text-muted-foreground">
              Number formatting options will be implemented here.
              {selectedColumns.size > 0 && (
                <div className="mt-2">
                  Selected columns: {selectedColumns.size}
                </div>
              )}
            </div>
          </PropertyGroup>
          
          <PropertyGroup title="Date Formatters">
            <div className="text-xs text-muted-foreground">
              Date formatting options will be implemented here.
            </div>
          </PropertyGroup>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <PropertyGroup title="Text Formatters">
            <div className="text-xs text-muted-foreground">
              Text formatting options will be implemented here.
            </div>
          </PropertyGroup>
          
          <PropertyGroup title="Custom Formatters">
            <div className="text-xs text-muted-foreground">
              Custom formatter functions will be implemented here.
            </div>
          </PropertyGroup>
        </div>
      </div>
    </div>
  );
};