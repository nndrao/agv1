import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CustomSectionProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable section component for consistent headers across all tabs
 * Replaces repeated <Label className="ribbon-section-header">...</Label> patterns
 */
export const CustomSection: React.FC<CustomSectionProps> = ({
  icon: Icon,
  label,
  children,
  className
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      <Label className="ribbon-section-header flex items-center gap-2">
        {Icon && <Icon className="ribbon-icon-xs" />}
        {label}
      </Label>
      {children}
    </div>
  );
};