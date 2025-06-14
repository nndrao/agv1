import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MixedValue } from '../../hooks/useMixedValue';

interface CustomSwitchProps {
  id: string;
  label: string;
  value: boolean | MixedValue<boolean>;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

/**
 * Reusable switch component that handles mixed values
 * Replaces repeated switch + label patterns across all tabs
 */
export const CustomSwitch: React.FC<CustomSwitchProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className,
  labelClassName
}) => {
  // Handle both direct boolean values and MixedValue objects
  const isMixedValue = (val: any): val is MixedValue<boolean> => {
    return val && typeof val === 'object' && 'isMixed' in val;
  };

  const checked = isMixedValue(value) 
    ? !value.isMixed && value.value === true
    : value === true;

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Switch 
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <Label 
        htmlFor={id} 
        className={`cursor-pointer ${labelClassName || ''}`}
      >
        {label}
      </Label>
    </div>
  );
};