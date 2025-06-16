import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MixedValue } from '../../hooks/useMixedValue';
import { cn } from '@/lib/utils';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface CustomSelectProps<T = string> {
  value: T | MixedValue<T>;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  showIcons?: boolean;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

/**
 * Reusable select component that handles mixed values and icons
 * Replaces repeated select patterns across all tabs
 */
export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  showIcons = true,
  className,
  triggerClassName,
  disabled = false
}: CustomSelectProps<T>) {
  // Handle both direct values and MixedValue objects
  const isMixedValue = (val: any): val is MixedValue<T> => {
    return val && typeof val === 'object' && 'isMixed' in val;
  };

  const currentValue = isMixedValue(value) 
    ? (value.isMixed ? '' : value.value?.toString() || '')
    : value?.toString() || '';

  const displayPlaceholder = isMixedValue(value) && value.isMixed 
    ? 'Mixed' 
    : placeholder;

  return (
    <Select 
      value={currentValue} 
      onValueChange={(val) => onChange(val as T)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("ribbon-select-trigger", triggerClassName, className)}>
        <SelectValue placeholder={displayPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {showIcons && option.icon && (
                <option.icon className="ribbon-icon-xs" />
              )}
              <span>{option.label}</span>
              {option.description && (
                <span className="text-xs text-muted-foreground ml-2">
                  {option.description}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}