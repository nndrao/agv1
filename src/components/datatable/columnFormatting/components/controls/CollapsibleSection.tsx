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
import { useColumnFormattingStore } from '../../store/columnFormatting.store';

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
  const { collapsedSections, toggleSectionCollapse } = useColumnFormattingStore();
  const isCollapsed = collapsedSections.has(id);
  const isExpanded = defaultExpanded ? !isCollapsed : isCollapsed;

  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 cursor-pointer select-none',
          'hover:bg-muted/50 transition-colors duration-200',
          'rounded-t-lg',
          isExpanded && 'border-b'
        )}
        onClick={() => toggleSectionCollapse(id)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleSectionCollapse(id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground leading-none">
                {title}
              </h3>
              {badge}
              {helpText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">{helpText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {description && !isExpanded && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {actionButton && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {actionButton}
          </div>
        )}
      </div>
      
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4">
          {description && isExpanded && (
            <p className="text-xs text-muted-foreground mb-4 pb-3 border-b">
              {description}
            </p>
          )}
          <div className="space-y-3">
            {children}
          </div>
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