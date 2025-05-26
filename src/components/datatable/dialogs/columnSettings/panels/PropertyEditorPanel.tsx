import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Palette, Hash, Filter, Edit3, Cog, AlertTriangle } from 'lucide-react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { GeneralTab } from '../tabs/GeneralTab';
import { StylingTab } from '../tabs/StylingTab';
import { ValueFormattersTab } from '../tabs/ValueFormattersTab';
import { FiltersTab } from '../tabs/FiltersTab';
import { EditorsTab } from '../tabs/EditorsTab';
import { AdvancedTab } from '../tabs/AdvancedTab';

export const PropertyEditorPanel: React.FC = () => {
  const {
    selectedColumns,
    activeTab,
    setActiveTab
  } = useColumnCustomizationStore();

  const selectedCount = selectedColumns.size;
  const selectedColumnNames = Array.from(selectedColumns).slice(0, 3).join(', ');
  const hasMoreColumns = selectedColumns.size > 3;

  const tabConfig = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'styling', label: 'Styling', icon: Palette },
    { id: 'formatters', label: 'Format', icon: Hash },
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'editors', label: 'Editors', icon: Edit3 },
    { id: 'advanced', label: 'Advanced', icon: Cog },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Compact Selected Columns Header */}
      <div className="px-4 py-2.5 border-b border-border/50 shrink-0 bg-muted/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {selectedCount === 0 ? 'Select columns to edit' : 
               selectedCount === 1 ? selectedColumnNames : 
               `${selectedCount} columns selected`}
            </span>
            {selectedCount > 1 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                Bulk Edit
              </Badge>
            )}
          </div>
          {hasMoreColumns && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              +{selectedColumns.size - 3} more
            </Badge>
          )}
        </div>
      </div>

      {/* Compact Mixed Values Warning */}
      {selectedCount > 1 && (
        <div className="mx-4 mt-2 mb-2">
          <Alert className="py-2 px-3 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-300 ml-2">
              Mixed values shown as "~Mixed~". Changes apply to all selected columns.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Modern Property Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-2 mb-3 grid w-full grid-cols-6 shrink-0 h-9 bg-muted/30">
          {tabConfig.map(({ id, label, icon: Icon }) => (
            <TabsTrigger 
              key={id}
              value={id} 
              className="text-xs gap-1.5 h-7 px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="general" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="styling" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <StylingTab />
          </TabsContent>
          <TabsContent value="formatters" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <ValueFormattersTab />
          </TabsContent>
          <TabsContent value="filters" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <FiltersTab />
          </TabsContent>
          <TabsContent value="editors" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <EditorsTab />
          </TabsContent>
          <TabsContent value="advanced" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <AdvancedTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};