import React from 'react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { PropertyGroup } from '../components/PropertyGroup';

export const ValueFormattersTab: React.FC = () => {
  const { selectedColumns } = useColumnCustomizationStore();
  
  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Value Formatters">
        <div className="text-sm text-muted-foreground">
          Value formatters configuration will be implemented here.
          {selectedColumns.size > 0 && (
            <div className="mt-2">
              Selected columns: {selectedColumns.size}
            </div>
          )}
        </div>
      </PropertyGroup>
    </div>
  );
};