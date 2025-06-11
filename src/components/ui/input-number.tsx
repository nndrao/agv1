import * as React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputNumberProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ className, value, onChange, min, max, step = 1, disabled, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string>(
      value !== undefined ? String(value) : ''
    );

    React.useEffect(() => {
      setInternalValue(value !== undefined ? String(value) : '');
    }, [value]);

    const updateValue = (newValue: number | undefined) => {
      if (newValue !== undefined) {
        if (min !== undefined && newValue < min) newValue = min;
        if (max !== undefined && newValue > max) newValue = max;
      }
      
      setInternalValue(newValue !== undefined ? String(newValue) : '');
      onChange?.(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInternalValue(val);
      
      if (val === '') {
        onChange?.(undefined);
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          onChange?.(num);
        }
      }
    };

    const handleBlur = () => {
      if (internalValue !== '') {
        const num = parseFloat(internalValue);
        if (!isNaN(num)) {
          updateValue(num);
        } else {
          setInternalValue(value !== undefined ? String(value) : '');
        }
      }
    };

    const increment = () => {
      const currentValue = value ?? 0;
      updateValue(currentValue + step);
    };

    const decrement = () => {
      const currentValue = value ?? 0;
      updateValue(currentValue - step);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        increment();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        decrement();
      }
    };

    return (
      <div className="relative flex">
        <input
          type="text"
          inputMode="decimal"
          ref={ref}
          value={internalValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            "pr-8", // Make room for spinner buttons
            className
          )}
          {...props}
        />
        <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-input">
          <button
            type="button"
            onClick={increment}
            disabled={disabled || (max !== undefined && value !== undefined && value >= max)}
            className={cn(
              "flex h-1/2 w-7 items-center justify-center rounded-tr-md text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
            tabIndex={-1}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={decrement}
            disabled={disabled || (min !== undefined && value !== undefined && value <= min)}
            className={cn(
              "flex h-1/2 w-7 items-center justify-center rounded-br-md border-t border-input text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
            tabIndex={-1}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }
);

InputNumber.displayName = 'InputNumber';

export { InputNumber };