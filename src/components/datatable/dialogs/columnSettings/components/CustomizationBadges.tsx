import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, Palette, Hash, Filter, Edit3, Settings, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface CustomizationType {
  type: 'style' | 'formatter' | 'filter' | 'editor' | 'general';
  label: string;
  icon: React.ElementType;
  count?: number;
}

interface CustomizationBadgesProps {
  customizations: CustomizationType[];
  onRemove: (type: string) => void;
  className?: string;
  maxVisible?: number;
}

export const CustomizationBadges: React.FC<CustomizationBadgesProps> = ({
  customizations,
  onRemove,
  className,
  maxVisible = 2
}) => {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  if (customizations.length === 0) return null;

  const visibleCustomizations = customizations.slice(0, maxVisible);
  const hiddenCustomizations = customizations.slice(maxVisible);
  const hasMore = hiddenCustomizations.length > 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'style': return Palette;
      case 'formatter': return Hash;
      case 'filter': return Filter;
      case 'editor': return Edit3;
      case 'general': return Settings;
      default: return Settings;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'style': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'formatter': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'filter': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'editor': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'general': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return '';
    }
  };

  const renderBadge = (customization: CustomizationType, index: number) => {
    const Icon = customization.icon || getIcon(customization.type);
    const isHovered = hoveredBadge === `${customization.type}-${index}`;

    return (
      <TooltipProvider key={`${customization.type}-${index}`}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div
              className="relative group"
              onMouseEnter={() => setHoveredBadge(`${customization.type}-${index}`)}
              onMouseLeave={() => setHoveredBadge(null)}
            >
              <Badge
                variant="secondary"
                className={cn(
                  "h-5 px-1 gap-0.5 transition-all cursor-pointer",
                  getBadgeColor(customization.type),
                  isHovered && "pr-5"
                )}
              >
                <Icon className="h-3 w-3" />
                {customization.count && customization.count > 1 && (
                  <span className="text-[10px] font-bold">{customization.count}</span>
                )}
              </Badge>
              {isHovered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(customization.type);
                  }}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  aria-label={`Remove ${customization.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{customization.label}</p>
            {customization.count && customization.count > 1 && (
              <p className="text-muted-foreground">{customization.count} customizations</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visibleCustomizations.map((customization, index) => 
        renderBadge(customization, index)
      )}
      
      {hasMore && (
        <Popover>
          <PopoverTrigger asChild>
            <Badge
              variant="secondary"
              className="h-5 px-1 gap-0.5 cursor-pointer hover:bg-muted"
            >
              <MoreHorizontal className="h-3 w-3" />
              <span className="text-[10px] font-bold">+{hiddenCustomizations.length}</span>
            </Badge>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-auto p-2">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium mb-1">All customizations:</p>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {customizations.map((customization, index) => 
                  renderBadge(customization, index)
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};