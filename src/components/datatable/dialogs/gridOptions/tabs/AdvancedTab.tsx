import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface AdvancedTabProps {
  options: AgGridReact['props'];
  onChange: (updates: Partial<AgGridReact['props']>) => void;
}

export function AdvancedTab({ options, onChange }: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Localization</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="localeText">Locale Text</Label>
            <div className="text-sm text-muted-foreground">
              Configure locale text in code
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="getLocaleText">Custom Locale Text Function</Label>
            <Switch
              id="getLocaleText"
              checked={options.getLocaleText !== undefined}
              onCheckedChange={(checked) => onChange({ 
                getLocaleText: checked ? ((params: any) => params.defaultValue) : undefined 
              })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Context Menu</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="allowContextMenuWithControlKey">Allow Context Menu with Control Key</Label>
            <Switch
              id="allowContextMenuWithControlKey"
              checked={options.allowContextMenuWithControlKey ?? false}
              onCheckedChange={(checked) => onChange({ allowContextMenuWithControlKey: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressContextMenu">Suppress Context Menu</Label>
            <Switch
              id="suppressContextMenu"
              checked={options.suppressContextMenu ?? false}
              onCheckedChange={(checked) => onChange({ suppressContextMenu: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="preventDefaultOnContextMenu">Prevent Default on Context Menu</Label>
            <Switch
              id="preventDefaultOnContextMenu"
              checked={options.preventDefaultOnContextMenu ?? false}
              onCheckedChange={(checked) => onChange({ preventDefaultOnContextMenu: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="getContextMenuItems">Custom Context Menu Items</Label>
            <Switch
              id="getContextMenuItems"
              checked={options.getContextMenuItems !== undefined}
              onCheckedChange={(checked) => onChange({ 
                getContextMenuItems: checked ? (() => ['copy', 'copyWithHeaders', 'paste']) : undefined 
              })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Accessibility</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableBrowserTooltips">Enable Browser Tooltips</Label>
            <Switch
              id="enableBrowserTooltips"
              checked={options.enableBrowserTooltips ?? false}
              onCheckedChange={(checked) => onChange({ enableBrowserTooltips: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ensureDomOrder">Ensure DOM Order</Label>
            <Switch
              id="ensureDomOrder"
              checked={options.ensureDomOrder ?? false}
              onCheckedChange={(checked) => onChange({ ensureDomOrder: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enableRtl">Enable Right-to-Left</Label>
            <Switch
              id="enableRtl"
              checked={options.enableRtl ?? false}
              onCheckedChange={(checked) => onChange({ enableRtl: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Miscellaneous</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="debug">Debug Mode</Label>
            <Switch
              id="debug"
              checked={options.debug ?? false}
              onCheckedChange={(checked) => onChange({ debug: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="maintainColumnOrder">Maintain Column Order</Label>
            <Switch
              id="maintainColumnOrder"
              checked={options.maintainColumnOrder ?? false}
              onCheckedChange={(checked) => onChange({ maintainColumnOrder: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="alignedGrids">Aligned Grids</Label>
            <div className="text-sm text-muted-foreground">
              Configure aligned grids in code
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="tabIndex">Tab Index</Label>
            <Input
              id="tabIndex"
              type="number"
              value={options.tabIndex ?? 0}
              onChange={(e) => onChange({ tabIndex: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rowClassRules">Row Class Rules</Label>
            <div className="text-sm text-muted-foreground">
              Configure row class rules in code
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isRowMaster">Is Row Master Function</Label>
            <Switch
              id="isRowMaster"
              checked={options.isRowMaster !== undefined}
              onCheckedChange={(checked) => onChange({ 
                isRowMaster: checked ? ((dataItem: any) => false) : undefined 
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressPropertyNamesCheck">Suppress Property Names Check</Label>
            <Switch
              id="suppressPropertyNamesCheck"
              checked={options.suppressPropertyNamesCheck ?? false}
              onCheckedChange={(checked) => onChange({ suppressPropertyNamesCheck: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Grid API</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="onGridReady">Grid Ready Callback</Label>
            <div className="text-sm text-muted-foreground">
              Configure in code
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="onGridPreDestroyed">Grid Pre-Destroyed Callback</Label>
            <div className="text-sm text-muted-foreground">
              Configure in code
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="processDataFromClipboard">Process Data from Clipboard</Label>
            <Switch
              id="processDataFromClipboard"
              checked={options.processDataFromClipboard !== undefined}
              onCheckedChange={(checked) => onChange({ 
                processDataFromClipboard: checked ? ((params: any) => params.data) : undefined 
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="processCellForClipboard">Process Cell for Clipboard</Label>
            <Switch
              id="processCellForClipboard"
              checked={options.processCellForClipboard !== undefined}
              onCheckedChange={(checked) => onChange({ 
                processCellForClipboard: checked ? ((params: any) => params.value) : undefined 
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}