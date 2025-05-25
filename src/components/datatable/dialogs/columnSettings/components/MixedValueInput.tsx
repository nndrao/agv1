import React from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MixedValueInputProps {
  id: string;
  mixedValue: {
    value: unknown;
    isMixed: boolean;
    values?: unknown[];
  };
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
}

export const MixedValueInput: React.FC<MixedValueInputProps> = ({
  id,
  mixedValue,
  onChange,
  disabled,
  type = 'text',
  placeholder,
  className
}) => {
  const displayValue = mixedValue.isMixed ? '' : String(mixedValue.value || '');
  const inputPlaceholder = mixedValue.isMixed ? '~Mixed~' : (placeholder || 'Enter value');

  const input = (
    <Input
      id={id}
      type={type}
      value={displayValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder={inputPlaceholder}
      disabled={disabled}
      className={`${mixedValue.isMixed ? 'bg-orange-50 dark:bg-orange-900/20 placeholder:text-orange-600 dark:placeholder:text-orange-400' : ''} ${className || ''}`}
    />
  );

  if (mixedValue.isMixed && mixedValue.values && mixedValue.values.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {input}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-sm">
              <div className="font-medium mb-1">Current values:</div>
              <div className="space-y-1">
                {mixedValue.values.slice(0, 5).map((val, idx) => (
                  <div key={idx} className="text-xs">
                    • {val === null ? 'null' : val === undefined ? 'undefined' : JSON.stringify(val)}
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

  return input;
};