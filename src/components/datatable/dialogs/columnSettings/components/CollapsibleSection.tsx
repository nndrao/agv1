import React from 'react';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useColumnCustomizationStore } from '../store/column-customization.store';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  description,
  helpText,
  children,
  className,
  defaultExpanded = true,
  badge,
  actionButton,
}) => {
  const { collapsedSections, toggleSectionCollapse } = useColumnCustomizationStore();
  const isCollapsed = collapsedSections.has(id);
  const isExpanded = defaultExpanded ? !isCollapsed : isCollapsed;

  return (
    <div
      className={cn(
        'bg-white/95 dark:bg-gray-800/95 rounded-lg border border-gray-200/80 dark:border-gray-700/80',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'backdrop-blur-sm',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 cursor-pointer select-none',
          'hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors',
          isExpanded && 'border-b border-gray-200/50 dark:border-gray-700/50'
        )}
        onClick={() => toggleSectionCollapse(id)}
      >
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              toggleSectionCollapse(id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )}
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              {badge}
              {helpText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">{helpText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {description && !isExpanded && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {actionButton && (
          <div onClick={(e) => e.stopPropagation()}>
            {actionButton}
          </div>
        )}
      </div>
      
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4 space-y-3">
          {description && isExpanded && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700/50">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

// Animated collapse transition component
export const AnimatedCollapse: React.FC<{
  isOpen: boolean;
  children: React.ReactNode;
}> = ({ isOpen, children }) => {
  return (
    <div
      className={cn(
        'grid transition-all duration-200 ease-in-out',
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
};