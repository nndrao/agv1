import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlignmentIconPickerProps {
  label: string;
  type: 'horizontal' | 'vertical';
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isMixed?: boolean;
}

export const AlignmentIconPicker: React.FC<AlignmentIconPickerProps> = ({
  label,
  type,
  value,
  onChange,
  disabled = false,
  isMixed = false
}) => {
  const getHorizontalOptions = () => [
    { value: 'default', icon: Minus, label: 'Default', tooltip: 'Default alignment' },
    { value: 'left', icon: AlignLeft, label: 'Left', tooltip: 'Align left' },
    { value: 'center', icon: AlignCenter, label: 'Center', tooltip: 'Align center' },
    { value: 'right', icon: AlignRight, label: 'Right', tooltip: 'Align right' }
  ];

  const getVerticalOptions = () => [
    { value: 'default', icon: Minus, label: 'Default', tooltip: 'Default alignment' },
    { value: 'top', icon: AlignVerticalJustifyStart, label: 'Top', tooltip: 'Align top' },
    { value: 'middle', icon: AlignVerticalJustifyCenter, label: 'Middle', tooltip: 'Align middle' },
    { value: 'bottom', icon: AlignVerticalJustifyEnd, label: 'Bottom', tooltip: 'Align bottom' }
  ];

  const options = type === 'horizontal' ? getHorizontalOptions() : getVerticalOptions();

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-foreground">
        {label}
        {isMixed && (
          <span className="ml-1 text-xs text-orange-600 dark:text-orange-400">
            (Mixed)
          </span>
        )}
      </Label>
      
      <div className="flex gap-0.5 p-0.5 bg-muted/20 rounded-lg border border-border/30">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          
          return (
            <Button
              key={option.value}
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 rounded-md transition-all duration-200",
                "hover:bg-accent/80 hover:text-accent-foreground",
                isSelected && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
                disabled && "opacity-50 cursor-not-allowed",
                isMixed && !isSelected && "opacity-60"
              )}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              title={option.tooltip}
            >
              <Icon 
                className={cn(
                  "h-4 w-4 transition-colors",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground",
                  disabled && "text-muted-foreground/50"
                )} 
              />
            </Button>
          );
        })}
      </div>
      
      {isMixed && (
        <p className="text-xs text-muted-foreground">
          Multiple values selected. Choose an option to apply to all.
        </p>
      )}
    </div>
  );
};
