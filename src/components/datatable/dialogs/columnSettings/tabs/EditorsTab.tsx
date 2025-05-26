import React from 'react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { PropertyGroup } from '../components/PropertyGroup';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const EditorsTab: React.FC = () => {
  const { selectedColumns } = useColumnCustomizationStore();
  
  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Cell Editors">
        <div className="text-sm text-muted-foreground">
          Cell editor configuration will be implemented here.
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