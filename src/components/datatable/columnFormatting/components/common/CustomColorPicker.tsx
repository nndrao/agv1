import React from 'react';
import { Input } from '@/components/ui/input';
import { MixedValue } from '../../hooks/useMixedValue';

interface CustomColorPickerProps {
  icon?: React.ComponentType<{ className?: string }>;
  value: string | MixedValue<string>;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable color picker component that combines color input with text input
 * Replaces repeated color picker patterns in StylingCustomContent
 */
export const CustomColorPicker: React.FC<CustomColorPickerProps> = ({
  icon: Icon,
  value,
  onChange,
  placeholder = "Default",
  label,
  disabled = false,
  className
}) => {
  // Handle both direct string values and MixedValue objects
  const isMixedValue = (val: any): val is MixedValue<string> => {
    return val && typeof val === 'object' && 'isMixed' in val;
  };

  const currentValue = isMixedValue(value)
    ? (value.isMixed ? '' : value.value || '')
    : value || '';

  const displayValue = currentValue || '#000000';
  const inputPlaceholder = isMixedValue(value) && value.isMixed 
    ? 'Mixed' 
    : placeholder;

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // For the text input, allow empty values to reset
    if (e.target.type === 'text' && newValue === '') {
      onChange('');
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className={`flex items-center gap-0.5 ${className || ''}`}>
      {Icon && <Icon className="ribbon-icon-xs text-muted-foreground" />}
      {label && <span className="text-xs font-medium mr-2">{label}</span>}
      <input
        type="color"
        value={displayValue}
        onChange={handleColorChange}
        disabled={disabled}
        className="ribbon-color cursor-pointer"
      />
      <Input
        value={currentValue}
        onChange={handleColorChange}
        disabled={disabled}
        className="ribbon-input flex-1 font-mono uppercase text-[10px] h-6"
        placeholder={inputPlaceholder}
      />
    </div>
  );
};