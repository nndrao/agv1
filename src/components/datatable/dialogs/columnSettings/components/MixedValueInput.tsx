import React from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MixedValueInputProps {
  id: string;
  property: string;
  mixedValue: {
    value: unknown;
    isMixed: boolean;
    values?: unknown[];
  };
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}

export const MixedValueInput: React.FC<MixedValueInputProps> = ({
  id,
  mixedValue,
  onChange,
  disabled,
  type = 'text'
}) => {
  const displayValue = mixedValue.isMixed ? '' : String(mixedValue.value || '');
  const placeholder = mixedValue.isMixed ? '~Mixed~' : 'Enter value';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Input
            id={id}
            type={type}
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={mixedValue.isMixed ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
          />
        </TooltipTrigger>
        {mixedValue.isMixed && mixedValue.values && (
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium mb-1">Current values:</div>
              {mixedValue.values.map((val, idx) => (
                <div key={idx}>{JSON.stringify(val)}</div>
              ))}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};