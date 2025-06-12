import React from 'react';
import { cn } from '@/lib/utils';
import { 
  FileText,
  Palette,
  Hash,
  Filter,
  Edit3
} from 'lucide-react';
import type { RibbonTabsProps } from '../../types';
import '../../ribbon-styles.css';

const tabs = [
  { value: 'general', icon: FileText, label: 'General' },
  { value: 'styling', icon: Palette, label: 'Styling' },
  { value: 'format', icon: Hash, label: 'Format' },
  { value: 'filter', icon: Filter, label: 'Filter' },
  { value: 'editor', icon: Edit3, label: 'Editor' },
] as const;

export const RibbonTabs: React.FC<RibbonTabsProps> = ({
  activeTab,
  setActiveTab
}) => {
  return (
    <div className="flex items-center h-full px-3">
      <div className="flex items-center gap-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "ribbon-tab ribbon-focusable flex items-center gap-1.5",
                isActive ? "active" : ""
              )}
              data-state={isActive ? "active" : "inactive"}
            >
              <Icon className="h-3 w-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}; 