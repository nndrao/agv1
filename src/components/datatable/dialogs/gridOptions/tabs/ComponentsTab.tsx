import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface ComponentsTabProps {
  options: AgGridReact['props'];
  onChange: (updates: Partial<AgGridReact['props']>) => void;
}

export function ComponentsTab({ options, onChange }: ComponentsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Custom Components</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="frameworkComponents">Framework Components</Label>
            <div className="text-sm text-muted-foreground">
              Configure custom components in code
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="loadingCellRenderer">Loading Cell Renderer</Label>
            <Switch
              id="loadingCellRenderer"
              checked={options.loadingCellRenderer !== undefined}
              onCheckedChange={(checked) => onChange({ 
                loadingCellRenderer: checked ? 'agLoadingCellRenderer' : undefined 
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="noRowsOverlayComponent">No Rows Overlay Component</Label>
            <Switch
              id="noRowsOverlayComponent"
              checked={options.noRowsOverlayComponent !== undefined}
              onCheckedChange={(checked) => onChange({ 
                noRowsOverlayComponent: checked ? 'agNoRowsOverlay' : undefined 
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="loadingOverlayComponent">Loading Overlay Component</Label>
            <Switch
              id="loadingOverlayComponent"
              checked={options.loadingOverlayComponent !== undefined}
              onCheckedChange={(checked) => onChange({ 
                loadingOverlayComponent: checked ? 'agLoadingOverlay' : undefined 
              })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Cell Renderers</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableGroupEdit">Enable Group Edit</Label>
            <Switch
              id="enableGroupEdit"
              checked={options.enableGroupEdit ?? false}
              onCheckedChange={(checked) => onChange({ enableGroupEdit: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="groupDefaultExpanded">Group Default Expanded</Label>
            <Input
              id="groupDefaultExpanded"
              type="number"
              min="-1"
              value={options.groupDefaultExpanded ?? 0}
              onChange={(e) => onChange({ groupDefaultExpanded: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoGroupColumnDef">Auto Group Column Definition</Label>
            <div className="text-sm text-muted-foreground">
              Configure in column definitions
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Cell Editors</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="popupParent">Popup Parent</Label>
            <Select
              value={options.popupParent ? 'body' : 'grid'}
              onValueChange={(value) => onChange({ 
                popupParent: value === 'body' ? document.body : undefined 
              })}
            >
              <SelectTrigger id="popupParent" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid Container</SelectItem>
                <SelectItem value="body">Document Body</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="stopEditingWhenCellsLoseFocus">Stop Editing When Focus Lost</Label>
            <Switch
              id="stopEditingWhenCellsLoseFocus"
              checked={options.stopEditingWhenCellsLoseFocus ?? false}
              onCheckedChange={(checked) => onChange({ stopEditingWhenCellsLoseFocus: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Filter Components</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="floatingFilter">Enable Floating Filters</Label>
            <Switch
              id="floatingFilter"
              checked={options.floatingFilter ?? false}
              onCheckedChange={(checked) => onChange({ floatingFilter: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="quickFilterText">Quick Filter Text</Label>
            <Input
              id="quickFilterText"
              type="text"
              value={options.quickFilterText || ''}
              onChange={(e) => onChange({ quickFilterText: e.target.value })}
              placeholder="Filter text..."
              className="w-[200px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cacheQuickFilter">Cache Quick Filter</Label>
            <Switch
              id="cacheQuickFilter"
              checked={options.cacheQuickFilter ?? false}
              onCheckedChange={(checked) => onChange({ cacheQuickFilter: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Tool Panels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sideBar">Enable Side Bar</Label>
            <Switch
              id="sideBar"
              checked={options.sideBar !== false}
              onCheckedChange={(checked) => onChange({ 
                sideBar: checked ? {
                  toolPanels: [
                    {
                      id: 'columns',
                      labelDefault: 'Columns',
                      labelKey: 'columns',
                      iconKey: 'columns',
                      toolPanel: 'agColumnsToolPanel',
                    },
                    {
                      id: 'filters',
                      labelDefault: 'Filters',
                      labelKey: 'filters',
                      iconKey: 'filter',
                      toolPanel: 'agFiltersToolPanel',
                    }
                  ],
                  defaultToolPanel: 'columns'
                } : false
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressMenuHide">Suppress Menu Hide</Label>
            <Switch
              id="suppressMenuHide"
              checked={options.suppressMenuHide ?? false}
              onCheckedChange={(checked) => onChange({ suppressMenuHide: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}