import React, { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { 
  FileText,
  Palette,
  Hash,
  Filter,
  Edit3
} from 'lucide-react';
import { RibbonPreview } from './RibbonPreview';
import type { RibbonTabsProps } from '../types';
import '../ribbon-styles.css';

const tabs = [
  { value: 'general', icon: FileText, label: 'General' },
  { value: 'styling', icon: Palette, label: 'Styling' },
  { value: 'format', icon: Hash, label: 'Format' },
  { value: 'filter', icon: Filter, label: 'Filter' },
  { value: 'editor', icon: Edit3, label: 'Editor' },
] as const;

export const RibbonTabs: React.FC<RibbonTabsProps> = ({
  activeTab,
  setActiveTab,
  selectedColumns
}) => {
  return (
    <div className="relative bg-gradient-to-r from-background via-muted/5 to-background">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-border/10" />
      <div className="flex items-center justify-between h-10 px-2">
        <div className="flex items-center">
          {tabs.map((tab, index, array) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            const isLast = index === array.length - 1;
            
            return (
              <Fragment key={tab.value}>
                <button
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "ribbon-tab-button relative flex items-center gap-2 px-4 h-8 rounded-md text-xs font-medium transition-all duration-200",
                    isActive ? [
                      "active",
                      "before:absolute before:inset-x-0 before:-bottom-[1px] before:h-[2px]",
                      "before:bg-gradient-to-r before:from-transparent before:via-primary before:to-transparent"
                    ] : ""
                  )}
                >
                  <Icon className={cn(
                    "h-3.5 w-3.5 transition-all duration-200",
                    isActive && "text-primary"
                  )} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-md -z-10" />
                  )}
                </button>
                {!isLast && (
                  <div className="h-5 w-px bg-border/50 mx-1" />
                )}
              </Fragment>
            );
          })}
        </div>
        
        {/* Preview Section - Clean and integrated */}
        <RibbonPreview 
          activeTab={activeTab}
          selectedColumns={selectedColumns}
        />
      </div>
    </div>
  );
}; 