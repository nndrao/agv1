import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface NumericInputProps {
  id: string;
  property: string;
  mixedValue: {
    value: number | undefined;
    isMixed: boolean;
    values?: number[];
  };
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  mixedValue,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
  disabled
}) => {
  const value = mixedValue.isMixed ? '' : (mixedValue.value || '');
  
  const handleIncrement = () => {
    const current = mixedValue.isMixed ? min : (Number(mixedValue.value) || min);
    onChange(Math.min(current + step, max));
  };
  
  const handleDecrement = () => {
    const current = mixedValue.isMixed ? max : (Number(mixedValue.value) || max);
    onChange(Math.max(current - step, min));
  };

  return (
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
      
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={mixedValue.isMixed ? '~Mixed~' : '0'}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`text-center ${mixedValue.isMixed ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
      />
      
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
};