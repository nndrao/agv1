import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { 
  Square,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ArrowLeftRight,
  Edit3,
  Settings
} from 'lucide-react';
import { useColumnCustomizationStore } from '../../../dialogs/columnSettings/store/columnCustomization.store';
import type { TabContentProps } from '../../types';
import '../../ribbon-styles.css';

export const GeneralRibbonContent: React.FC<TabContentProps> = ({ selectedColumns }) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnCustomizationStore();

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
  const widthValue = getMixedValueLocal('width');
  const typeValue = getMixedValueLocal('type');
  const pinnedValue = getMixedValueLocal('pinned');
  const sortableValue = getMixedValueLocal('sortable');
  const resizableValue = getMixedValueLocal('resizable');
  const editableValue = getMixedValueLocal('editable');

  return (
    <div className="space-y-2">
      {/* Two-row compact layout */}
      <div className="grid grid-cols-12 gap-3">
        {/* Row 1: Identity and Size */}
        <div className="col-span-3 flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Header Name</Label>
          <Input 
            placeholder={selectedColumns.size > 1 ? "~Mixed~" : "Column Name"} 
            className="h-7 text-xs"
            disabled={selectedColumns.size > 1}
            value={headerNameValue.isMixed ? "" : (headerNameValue.value as string || "")}
            onChange={(e) => updateBulkProperty('headerName', e.target.value || undefined)}
          />
        </div>
        
        <div className="col-span-2 flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Width</Label>
          <div className="flex items-center gap-1">
            <Input 
              type="number" 
              placeholder={widthValue.isMixed ? "Mixed" : "Auto"} 
              className="h-7 text-xs"
              min="50"
              max="500"
              step="10"
              value={widthValue.isMixed ? "" : (widthValue.value as number || "")}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                updateBulkProperty('width', value);
              }}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>
        
        <div className="col-span-2 flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select 
            value={typeValue.isMixed ? "" : (typeValue.value as string || "text")}
            onValueChange={(value) => updateBulkProperty('type', value || undefined)}
          >
            <SelectTrigger className="h-7 text-xs">
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
        
        <div className="col-span-2 flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Pin</Label>
          <Select 
            value={pinnedValue.isMixed ? "" : (pinnedValue.value as string || "none")}
            onValueChange={(value) => updateBulkProperty('pinned', value === "none" ? undefined : value)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder={pinnedValue.isMixed ? "Mixed" : "None"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="flex items-center gap-1">
                  <Square className="h-3 w-3" />
                  None
                </span>
              </SelectItem>
              <SelectItem value="left">
                <span className="flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Left
                </span>
              </SelectItem>
              <SelectItem value="right">
                <span className="flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  Right
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Column behaviors as compact toggle chips */}
        <div className="col-span-3 flex items-end gap-1">
          <ToggleGroup 
            type="multiple" 
            size="sm" 
            className="flex-wrap"
            value={[
              (!sortableValue.isMixed && sortableValue.value !== false) ? 'sortable' : '',
              (!resizableValue.isMixed && resizableValue.value !== false) ? 'resizable' : '',
              (!editableValue.isMixed && editableValue.value === true) ? 'editable' : ''
            ].filter(Boolean)}
            onValueChange={(values) => {
              updateBulkProperty('sortable', values.includes('sortable'));
              updateBulkProperty('resizable', values.includes('resizable'));
              updateBulkProperty('editable', values.includes('editable'));
            }}
          >
            <ToggleGroupItem 
              value="sortable" 
              className="ribbon-toggle-group-item h-7 px-2 text-xs" 
              aria-label="Sortable"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Sort
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="resizable" 
              className="ribbon-toggle-group-item h-7 px-2 text-xs" 
              aria-label="Resizable"
            >
              <ArrowLeftRight className="h-3 w-3 mr-1" />
              Resize
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="editable" 
              className="ribbon-toggle-group-item h-7 px-2 text-xs" 
              aria-label="Editable"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      {/* Row 2: Quick toggles in a compact strip */}
      <div className="flex items-center gap-4 px-2 py-1 bg-muted/30 rounded-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Switch 
              id="initially-hidden" 
              className="h-4 w-7" 
              checked={!getMixedValueLocal('hide').isMixed && getMixedValueLocal('hide').value === true}
              onCheckedChange={(checked) => updateBulkProperty('hide', checked)}
            />
            <Label htmlFor="initially-hidden" className="text-xs cursor-pointer">
              Initially Hidden
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch 
              id="floating-filter" 
              className="h-4 w-7" 
              checked={!getMixedValueLocal('floatingFilter').isMixed && getMixedValueLocal('floatingFilter').value === true}
              onCheckedChange={(checked) => updateBulkProperty('floatingFilter', checked)}
            />
            <Label htmlFor="floating-filter" className="text-xs cursor-pointer">
              Floating Filter
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch 
              id="enable-filter" 
              className="h-4 w-7" 
              checked={!getMixedValueLocal('filter').isMixed && getMixedValueLocal('filter').value !== undefined}
              onCheckedChange={(checked) => updateBulkProperty('filter', checked ? 'agTextColumnFilter' : undefined)}
            />
            <Label htmlFor="enable-filter" className="text-xs cursor-pointer">
              Enable Filter
            </Label>
          </div>
        </div>
        
        <Separator orientation="vertical" className="h-4" />
        
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <Settings className="h-3 w-3 mr-1" />
          Advanced
        </Button>
      </div>
    </div>
  );
}; 