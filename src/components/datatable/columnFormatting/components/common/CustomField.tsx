import React from 'react';
import { cn } from '@/lib/utils';

interface CustomFieldProps {
  label: string;
  labelWidth?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  direction?: 'horizontal' | 'vertical';
}

/**
 * Reusable field component for consistent form layouts
 * Replaces repeated field layout patterns across all tabs
 */
export const CustomField: React.FC<CustomFieldProps> = ({
  label,
  labelWidth = 'w-20',
  children,
  required = false,
  className,
  direction = 'horizontal'
}) => {
  if (direction === 'vertical') {
    return (
      <div className={cn("space-y-2", className)}>
        <span className="text-xs font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("text-xs font-medium", labelWidth)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {children}
    </div>
  );
};