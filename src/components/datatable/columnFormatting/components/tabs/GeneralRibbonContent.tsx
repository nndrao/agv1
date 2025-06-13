import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings
} from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import type { TabContentProps } from '../../types';
import '../../ribbon-styles.css';

export const GeneralRibbonContent: React.FC<TabContentProps> = ({ selectedColumns }) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnFormattingStore();

  // Helper function to get mixed values for multi-column editing
  const getMixedValueLocal = (property: string) => {
    const values = new Set();
    const allValues: unknown[] = [];

    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);

      // Check pending changes first, then fall back to column definition
      let value;
      if (pendingChange && property in pendingChange) {
        value = pendingChange[property as keyof typeof pendingChange];
      } else if (colDef) {
        value = colDef[property as keyof typeof colDef];
      }

      values.add(value);
      allValues.push(value);
    });

    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true, values: allValues };
  };

  const headerNameValue = getMixedValueLocal('headerName');
  const typeValue = getMixedValueLocal('type');

  return (
    <div className="space-y-2">
      {/* Two-row compact layout */}
      <div className="grid grid-cols-12 gap-3">
        {/* Row 1: Identity and Type */}
        <div className="col-span-5 flex flex-col gap-1">
          <Label className="ribbon-section-header">HEADER NAME</Label>
          <Input 
            placeholder={selectedColumns.size > 1 ? "~Mixed~" : "Column Name"} 
            className="ribbon-input"
            disabled={selectedColumns.size > 1}
            value={headerNameValue.isMixed ? "" : (headerNameValue.value as string || "")}
            onChange={(e) => updateBulkProperty('headerName', e.target.value || undefined)}
          />
        </div>
        
        <div className="col-span-3 flex flex-col gap-1">
          <Label className="ribbon-section-header">TYPE</Label>
          <Select 
            value={typeValue.isMixed ? "" : (typeValue.value as string || "text")}
            onValueChange={(value) => updateBulkProperty('type', value || undefined)}
          >
            <SelectTrigger className="ribbon-select-trigger">
              <SelectValue placeholder={typeValue.isMixed ? "Mixed" : "Text"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="numeric">Numeric</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Row 2: Quick toggles in a compact strip */}
      <div className="flex items-center gap-4 px-2 py-1 bg-muted/30 rounded-md">
        <div className="flex items-center gap-4">
          {/* Note: 'hide' property removed - column visibility should be managed separately, not in formatter */}
          <div className="flex items-center gap-1.5">
            <Switch 
              id="floating-filter"
              checked={!getMixedValueLocal('floatingFilter').isMixed && getMixedValueLocal('floatingFilter').value === true}
              onCheckedChange={(checked) => updateBulkProperty('floatingFilter', checked)}
            />
            <Label htmlFor="floating-filter" className="cursor-pointer">
              Floating Filter
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch 
              id="enable-filter"
              checked={!getMixedValueLocal('filter').isMixed && getMixedValueLocal('filter').value !== undefined}
              onCheckedChange={(checked) => updateBulkProperty('filter', checked ? 'agTextColumnFilter' : undefined)}
            />
            <Label htmlFor="enable-filter" className="cursor-pointer">
              Enable Filter
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch 
              id="editable"
              checked={!getMixedValueLocal('editable').isMixed && getMixedValueLocal('editable').value === true}
              onCheckedChange={(checked) => updateBulkProperty('editable', checked)}
            />
            <Label htmlFor="editable" className="cursor-pointer">
              Editable
            </Label>
          </div>
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