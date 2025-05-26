import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import '../column-customization-dialog.css';

interface ThreeStateCheckboxProps {
  label: string;
  property: string;
  mixedValue: {
    value: unknown;
    isMixed: boolean;
    values?: unknown[];
  };
  onChange: (value: boolean) => void;
  disabled?: boolean;
  description?: string;
}

export const ThreeStateCheckbox: React.FC<ThreeStateCheckboxProps> = ({
  label,
  property,
  mixedValue,
  onChange,
  disabled,
  description
}) => {
  const isChecked = mixedValue.isMixed ? 'indeterminate' : mixedValue.value;

  const checkbox = (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={property}
        checked={isChecked === true ? true : false}
        onCheckedChange={(checked) => onChange(!!checked)}
        disabled={disabled}
        className="checkbox-enhanced h-4 w-4 rounded"
      />
      <Label
        htmlFor={property}
        className="text-sm font-normal cursor-pointer select-none"
      >
        {label}
        {description && (
          <span className="block text-xs text-muted-foreground mt-0.5">
            {description}
          </span>
        )}
      </Label>
    </div>
  );

  if (mixedValue.isMixed && mixedValue.values) {
    const counts = mixedValue.values.reduce<{ trueCount: number; falseCount: number; nullCount: number }>(
      (acc, v) => {
        if (v === true) acc.trueCount++;
        else if (v === false) acc.falseCount++;
        else if (v === null || v === undefined) acc.nullCount++;
        return acc;
      },
      { trueCount: 0, falseCount: 0, nullCount: 0 }
    );

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {checkbox}
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="text-sm">
              <div className="font-medium mb-1">Current values:</div>
              <div className="space-y-1 text-xs">
                {counts.trueCount > 0 && <div>• {counts.trueCount} enabled</div>}
                {counts.falseCount > 0 && <div>• {counts.falseCount} disabled</div>}
                {counts.nullCount > 0 && <div>• {counts.nullCount} undefined</div>}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return checkbox;
};