import React from 'react';
import { PropertyGroup } from '../components/PropertyGroup';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ValueFormattersTab: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Value Formatters">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Value Formatter Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select formatter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="percent">Percentage</SelectItem>
                <SelectItem value="custom">Custom Function</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Aggregation">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Aggregation Function</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select aggregation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="avg">Average</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="count">Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PropertyGroup>
    </div>
  );
};