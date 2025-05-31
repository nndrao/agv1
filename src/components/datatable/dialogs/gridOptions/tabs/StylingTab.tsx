import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface StylingTabProps {
  options: AgGridReact['props'];
  onChange: (updates: Partial<AgGridReact['props']>) => void;
}

export function StylingTab({ options, onChange }: StylingTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Row Styling</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="rowClass">Row Class</Label>
            <Input
              id="rowClass"
              type="text"
              value={options.rowClass || ''}
              onChange={(e) => onChange({ rowClass: e.target.value })}
              placeholder="CSS class name"
              className="w-[200px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="getRowClass">Dynamic Row Class</Label>
            <Switch
              id="getRowClass"
              checked={options.getRowClass !== undefined}
              onCheckedChange={(checked) => onChange({ getRowClass: checked ? (() => '') : undefined })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="getRowStyle">Dynamic Row Style</Label>
            <Switch
              id="getRowStyle"
              checked={options.getRowStyle !== undefined}
              onCheckedChange={(checked) => onChange({ getRowStyle: checked ? (() => ({})) : undefined })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rowSelection">Row Selection Style</Label>
            <Select
              value={options.rowSelection || 'single'}
              onValueChange={(value) => onChange({ rowSelection: value as any })}
            >
              <SelectTrigger id="rowSelection" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="multiple">Multiple</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Cell Styling</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="cellClass">Cell Class</Label>
            <Input
              id="cellClass"
              type="text"
              value={options.defaultColDef?.cellClass || ''}
              onChange={(e) => onChange({ 
                defaultColDef: { ...options.defaultColDef, cellClass: e.target.value }
              })}
              placeholder="CSS class name"
              className="w-[200px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cellSelection">Enable Cell Selection</Label>
            <Switch
              id="cellSelection"
              checked={options.cellSelection ?? false}
              onCheckedChange={(checked) => onChange({ cellSelection: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enableRangeSelection">Enable Range Selection</Label>
            <Switch
              id="enableRangeSelection"
              checked={options.enableRangeSelection ?? false}
              onCheckedChange={(checked) => onChange({ enableRangeSelection: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enableRangeHandle">Enable Range Handle</Label>
            <Switch
              id="enableRangeHandle"
              checked={options.enableRangeHandle ?? false}
              onCheckedChange={(checked) => onChange({ enableRangeHandle: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Header Styling</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="headerClass">Header Class</Label>
            <Input
              id="headerClass"
              type="text"
              value={options.defaultColDef?.headerClass || ''}
              onChange={(e) => onChange({ 
                defaultColDef: { ...options.defaultColDef, headerClass: e.target.value }
              })}
              placeholder="CSS class name"
              className="w-[200px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="floatingFiltersHeight">Floating Filters Height</Label>
            <Input
              id="floatingFiltersHeight"
              type="number"
              min="0"
              value={options.floatingFiltersHeight ?? 50}
              onChange={(e) => onChange({ floatingFiltersHeight: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="headerHeight">Header Height</Label>
            <Input
              id="headerHeight"
              type="number"
              min="0"
              value={options.headerHeight ?? 25}
              onChange={(e) => onChange({ headerHeight: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="groupHeaderHeight">Group Header Height</Label>
            <Input
              id="groupHeaderHeight"
              type="number"
              min="0"
              value={options.groupHeaderHeight ?? 25}
              onChange={(e) => onChange({ groupHeaderHeight: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Grid Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="animateRows">Animate Rows</Label>
            <Switch
              id="animateRows"
              checked={options.animateRows ?? false}
              onCheckedChange={(checked) => onChange({ animateRows: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enableCellChangeFlash">Enable Cell Change Flash</Label>
            <Switch
              id="enableCellChangeFlash"
              checked={options.enableCellChangeFlash ?? false}
              onCheckedChange={(checked) => onChange({ enableCellChangeFlash: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rowBuffer">Row Buffer</Label>
            <Input
              id="rowBuffer"
              type="number"
              min="0"
              value={options.rowBuffer ?? 10}
              onChange={(e) => onChange({ rowBuffer: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rowHeight">Row Height</Label>
            <Input
              id="rowHeight"
              type="number"
              min="0"
              value={options.rowHeight ?? 25}
              onChange={(e) => onChange({ rowHeight: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}