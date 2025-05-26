import React from 'react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { PropertyGroup } from '../components/PropertyGroup';

export const EditorsTab: React.FC = () => {
  const { selectedColumns } = useColumnCustomizationStore();
  
  return (
    <div className="p-4 space-y-4">
      {/* Two-column layout for better space utilization */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <PropertyGroup title="Editor Types">
            <div className="text-xs text-muted-foreground">
              Cell editor type configuration will be implemented here.
              {selectedColumns.size > 0 && (
                <div className="mt-2">
                  Selected columns: {selectedColumns.size}
                </div>
              )}
            </div>
          </PropertyGroup>
          
          <PropertyGroup title="Input Validation">
            <div className="text-xs text-muted-foreground">
              Input validation rules will be implemented here.
            </div>
          </PropertyGroup>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <PropertyGroup title="Editor Options">
            <div className="text-xs text-muted-foreground">
              Editor configuration options will be implemented here.
            </div>
          </PropertyGroup>
          
          <PropertyGroup title="Custom Editors">
            <div className="text-xs text-muted-foreground">
              Custom editor components will be implemented here.
            </div>
          </PropertyGroup>
        </div>
      </div>
    </div>
  );
};