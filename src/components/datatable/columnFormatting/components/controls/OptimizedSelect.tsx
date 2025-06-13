import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OptimizedSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Memoized Select component to prevent unnecessary re-renders
export const OptimizedSelect = React.memo<OptimizedSelectProps>(({
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  children
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className} disabled={disabled}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if these props change
  return (
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.className === nextProps.className &&
    prevProps.onValueChange === nextProps.onValueChange
  );
});

OptimizedSelect.displayName = 'OptimizedSelect';

// Memoized SelectItem to prevent re-renders
export const OptimizedSelectItem = React.memo<{
  value: string;
  children: React.ReactNode;
  className?: string;
}>(({ value, children, className }) => {
  return (
    <SelectItem value={value} className={className}>
      {children}
    </SelectItem>
  );
});

OptimizedSelectItem.displayName = 'OptimizedSelectItem';