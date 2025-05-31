import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface EditingTabProps {
  options: AgGridReact['props'];
  onChange: (updates: Partial<AgGridReact['props']>) => void;
}

export function EditingTab({ options, onChange }: EditingTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Cell Editing</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="readOnlyEdit">Read Only Edit</Label>
            <Switch
              id="readOnlyEdit"
              checked={options.readOnlyEdit ?? false}
              onCheckedChange={(checked) => onChange({ readOnlyEdit: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="singleClickEdit">Single Click Edit</Label>
            <Switch
              id="singleClickEdit"
              checked={options.singleClickEdit ?? false}
              onCheckedChange={(checked) => onChange({ singleClickEdit: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="stopEditingWhenCellsLoseFocus">Stop Editing When Focus Lost</Label>
            <Switch
              id="stopEditingWhenCellsLoseFocus"
              checked={options.stopEditingWhenCellsLoseFocus ?? false}
              onCheckedChange={(checked) => onChange({ stopEditingWhenCellsLoseFocus: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enterNavigatesVertically">Enter Navigates Vertically</Label>
            <Switch
              id="enterNavigatesVertically"
              checked={options.enterNavigatesVertically ?? false}
              onCheckedChange={(checked) => onChange({ enterNavigatesVertically: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enterNavigatesVerticallyAfterEdit">Enter Navigates After Edit</Label>
            <Switch
              id="enterNavigatesVerticallyAfterEdit"
              checked={options.enterNavigatesVerticallyAfterEdit ?? false}
              onCheckedChange={(checked) => onChange({ enterNavigatesVerticallyAfterEdit: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="editType">Edit Type</Label>
            <Select
              value={options.editType || 'cell'}
              onValueChange={(value) => onChange({ editType: value as any })}
            >
              <SelectTrigger id="editType" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cell">Cell</SelectItem>
                <SelectItem value="fullRow">Full Row</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Undo / Redo</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="undoRedoCellEditing">Enable Undo/Redo</Label>
            <Switch
              id="undoRedoCellEditing"
              checked={options.undoRedoCellEditing ?? false}
              onCheckedChange={(checked) => onChange({ undoRedoCellEditing: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="undoRedoCellEditingLimit">Undo/Redo Limit</Label>
            <Input
              id="undoRedoCellEditingLimit"
              type="number"
              min="0"
              value={options.undoRedoCellEditingLimit ?? 10}
              onChange={(e) => onChange({ undoRedoCellEditingLimit: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Cell Navigation</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="suppressNavigateOnTab">Suppress Tab Navigation</Label>
            <Switch
              id="suppressNavigateOnTab"
              checked={options.suppressNavigateOnTab ?? false}
              onCheckedChange={(checked) => onChange({ suppressNavigateOnTab: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="tabToNextCell">Tab to Next Cell</Label>
            <Switch
              id="tabToNextCell"
              checked={options.tabToNextCell !== undefined ? true : false}
              onCheckedChange={(checked) => onChange({ tabToNextCell: checked ? (() => true) : undefined })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="navigateToNextCell">Navigate to Next Cell</Label>
            <Switch
              id="navigateToNextCell"
              checked={options.navigateToNextCell !== undefined ? true : false}
              onCheckedChange={(checked) => onChange({ navigateToNextCell: checked ? (() => null) : undefined })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Value Parsing</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableCellTextSelection">Enable Cell Text Selection</Label>
            <Switch
              id="enableCellTextSelection"
              checked={options.enableCellTextSelection ?? false}
              onCheckedChange={(checked) => onChange({ enableCellTextSelection: checked })}
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
            <Label htmlFor="suppressClickEdit">Suppress Click Edit</Label>
            <Switch
              id="suppressClickEdit"
              checked={options.suppressClickEdit ?? false}
              onCheckedChange={(checked) => onChange({ suppressClickEdit: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}