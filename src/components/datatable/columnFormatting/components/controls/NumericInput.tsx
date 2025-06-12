import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NumericInputProps {
  id: string;
  mixedValue: {
    value: unknown;
    isMixed: boolean;
    values?: unknown[];
  };
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  mixedValue,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
  disabled,
  className
}) => {
  // Safe number conversion with validation
  const getCurrentValue = () => {
    if (mixedValue.isMixed) return min;
    const val = mixedValue.value;
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const parsed = Number(val);
      return !isNaN(parsed) ? parsed : min;
    }
    return min;
  };

  const currentValue = getCurrentValue();
  const value = mixedValue.isMixed ? '' : String(currentValue);
  
  const handleIncrement = () => {
    onChange(Math.min(currentValue + step, max));
  };
  
  const handleDecrement = () => {
    onChange(Math.max(currentValue - step, min));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(min);
    } else {
      const num = Number(val);
      if (!isNaN(num)) {
        onChange(Math.min(Math.max(num, min), max));
      }
    }
  };

  const inputElement = (
    <Input
      id={id}
      type="number"
      value={value}
      onChange={handleInputChange}
      placeholder={mixedValue.isMixed ? '~Mixed~' : '0'}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`text-center ${mixedValue.isMixed ? 'bg-orange-50 dark:bg-orange-900/20 placeholder:text-orange-600 dark:placeholder:text-orange-400' : ''} ${className || ''}`}
    />
  );

  const content = (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleDecrement}
        disabled={disabled}
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      {inputElement}
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleIncrement}
        disabled={disabled}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );

  if (mixedValue.isMixed && mixedValue.values && mixedValue.values.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-sm">
              <div className="font-medium mb-1">Current values:</div>
              <div className="space-y-1">
                {mixedValue.values.slice(0, 5).map((val, idx) => (
                  <div key={idx} className="text-xs">
                    • {val === null ? 'null' : val === undefined ? 'undefined' : String(val)}
                  </div>
                ))}
                {mixedValue.values.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    ...and {mixedValue.values.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};