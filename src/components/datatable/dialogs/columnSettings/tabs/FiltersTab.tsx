import React from 'react';
import { PropertyGroup } from '../components/PropertyGroup';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export const FiltersTab: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Filter Settings">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Filter Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agTextColumnFilter">Text Filter</SelectItem>
                <SelectItem value="agNumberColumnFilter">Number Filter</SelectItem>
                <SelectItem value="agDateColumnFilter">Date Filter</SelectItem>
                <SelectItem value="agSetColumnFilter">Set Filter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="floating-filter" />
            <Label htmlFor="floating-filter" className="text-sm font-normal cursor-pointer">
              Enable Floating Filter
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="sortable-filter" />
            <Label htmlFor="sortable-filter" className="text-sm font-normal cursor-pointer">
              Sortable Filter
            </Label>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Filter Options">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="filter-reset" />
            <Label htmlFor="filter-reset" className="text-sm font-normal cursor-pointer">
              Include Reset Button
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="filter-apply" />
            <Label htmlFor="filter-apply" className="text-sm font-normal cursor-pointer">
              Include Apply Button
            </Label>
          </div>
        </div>
      </PropertyGroup>
    </div>
  );
};