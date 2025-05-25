import React from 'react';
import { PropertyGroup } from '../components/PropertyGroup';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export const AdvancedTab: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Row Grouping">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="enable-row-group" />
            <Label htmlFor="enable-row-group" className="text-sm font-normal cursor-pointer">
              Enable Row Group
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="enable-pivot" />
            <Label htmlFor="enable-pivot" className="text-sm font-normal cursor-pointer">
              Enable Pivot
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="enable-value" />
            <Label htmlFor="enable-value" className="text-sm font-normal cursor-pointer">
              Enable Value
            </Label>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Performance">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="suppress-menu" />
            <Label htmlFor="suppress-menu" className="text-sm font-normal cursor-pointer">
              Suppress Menu
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="lock-position" />
            <Label htmlFor="lock-position" className="text-sm font-normal cursor-pointer">
              Lock Position
            </Label>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Custom Properties">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="col-id">Column ID</Label>
            <Input 
              id="col-id"
              placeholder="Custom column ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="header-tooltip">Header Tooltip</Label>
            <Input 
              id="header-tooltip"
              placeholder="Tooltip text"
            />
          </div>
        </div>
      </PropertyGroup>
    </div>
  );
};