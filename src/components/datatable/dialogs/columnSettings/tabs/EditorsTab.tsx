import React from 'react';
import { PropertyGroup } from '../components/PropertyGroup';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export const EditorsTab: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Cell Editor">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Editor Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select editor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agTextCellEditor">Text Editor</SelectItem>
                <SelectItem value="agLargeTextCellEditor">Large Text Editor</SelectItem>
                <SelectItem value="agSelectCellEditor">Select Editor</SelectItem>
                <SelectItem value="agRichSelectCellEditor">Rich Select Editor</SelectItem>
                <SelectItem value="agDateCellEditor">Date Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="single-click-edit" />
            <Label htmlFor="single-click-edit" className="text-sm font-normal cursor-pointer">
              Single Click Edit
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="suppress-keyboard" />
            <Label htmlFor="suppress-keyboard" className="text-sm font-normal cursor-pointer">
              Suppress Keyboard Event
            </Label>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Validation">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="required" />
            <Label htmlFor="required" className="text-sm font-normal cursor-pointer">
              Required Field
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validation-pattern">Validation Pattern</Label>
            <input 
              id="validation-pattern"
              type="text" 
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., ^[A-Za-z]+$"
            />
          </div>
        </div>
      </PropertyGroup>
    </div>
  );
};