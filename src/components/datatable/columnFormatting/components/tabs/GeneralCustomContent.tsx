import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { useMixedValue } from '../../hooks/useMixedValue';
import { CustomSection, CustomSwitch, CustomSelect } from '../common';
import type { TabContentProps } from '../../types';
import '../../custom-styles.css';

const TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' }
];

export const GeneralCustomContent: React.FC<TabContentProps> = ({ selectedColumns }) => {
  const { updateBulkProperty } = useColumnFormattingStore();

  // Use the new useMixedValue hook
  const headerNameValue = useMixedValue('headerName', selectedColumns);
  const typeValue = useMixedValue('type', selectedColumns);
  const floatingFilterValue = useMixedValue('floatingFilter', selectedColumns);
  const filterValue = useMixedValue('filter', selectedColumns);
  const editableValue = useMixedValue('editable', selectedColumns);

  return (
    <div className="space-y-2">
      {/* Two-row compact layout */}
      <div className="grid grid-cols-12 gap-3">
        {/* Row 1: Identity and Type */}
        <div className="col-span-5 flex flex-col gap-1">
          <CustomSection label="HEADER NAME">
            <Input 
              placeholder={selectedColumns.size > 1 ? "~Mixed~" : "Column Name"} 
              className="ribbon-input"
              disabled={selectedColumns.size > 1}
              value={headerNameValue.isMixed ? "" : (headerNameValue.value as string || "")}
              onChange={(e) => updateBulkProperty('headerName', e.target.value || undefined)}
            />
          </CustomSection>
        </div>
        
        <div className="col-span-3 flex flex-col gap-1">
          <CustomSection label="TYPE">
            <CustomSelect
              value={typeValue}
              onChange={(value) => updateBulkProperty('type', value || undefined)}
              options={TYPE_OPTIONS}
              placeholder="Text"
              showIcons={false}
            />
          </CustomSection>
        </div>
      </div>
      
      {/* Row 2: Quick toggles in a compact strip */}
      <div className="flex items-center gap-4 px-2 py-1 bg-muted/30 rounded-md">
        <div className="flex items-center gap-4">
          {/* Note: 'hide' property removed - column visibility should be managed separately, not in formatter */}
          <CustomSwitch
            id="floating-filter"
            label="Floating Filter"
            value={floatingFilterValue}
            onChange={(checked) => updateBulkProperty('floatingFilter', checked)}
          />
          
          <CustomSwitch
            id="enable-filter"
            label="Enable Filter"
            value={{
              ...filterValue,
              value: filterValue.value !== undefined
            }}
            onChange={(checked) => updateBulkProperty('filter', checked ? 'agTextColumnFilter' : undefined)}
          />
          
          <CustomSwitch
            id="editable"
            label="Editable"
            value={editableValue}
            onChange={(checked) => updateBulkProperty('editable', checked)}
          />
        </div>
        
        <Separator orientation="vertical" className="h-4" />
        
        <Button variant="ghost" size="sm" className="ribbon-action-ghost">
          <Settings className="ribbon-icon-xs mr-1" />
          Advanced
        </Button>
      </div>
    </div>
  );
};