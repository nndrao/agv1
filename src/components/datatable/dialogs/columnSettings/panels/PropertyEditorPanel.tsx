import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Palette, Hash, Filter, Edit3, Cog, AlertTriangle } from 'lucide-react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { GeneralTab } from '../tabs/GeneralTab';
import { StylingTab } from '../tabs/StylingTab';
import { FormatTab } from '../tabs/FormatTab';
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
      {/* Modern Selected Columns Header */}
      <div className="px-5 py-3 border-b border-border/40 shrink-0 bg-gradient-to-r from-muted/15 to-muted/5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground tracking-tight">
              {selectedCount === 0 ? 'Select columns to edit' :
               selectedCount === 1 ? selectedColumnNames :
               `${selectedCount} columns selected`}
            </span>
            {selectedCount > 1 && (
              <Badge variant="secondary" className="text-xs px-2 py-1 font-medium rounded-md bg-secondary/80 border border-secondary/40">
                Bulk Edit
              </Badge>
            )}
          </div>
          {hasMoreColumns && (
            <Badge variant="outline" className="text-xs px-2 py-1 font-medium rounded-md border-border/60">
              +{selectedColumns.size - 3} more
            </Badge>
          )}
        </div>
      </div>

      {/* Modern Mixed Values Warning */}
      {selectedCount > 1 && (
        <div className="mx-5 mt-3 mb-2">
          <Alert className="py-2.5 px-3.5 border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-amber-50/40 dark:border-amber-800/60 dark:from-amber-950/30 dark:to-amber-950/10 rounded-lg backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-300 ml-2 font-medium">
              Mixed values shown as "~Mixed~". Changes apply to all selected columns.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Modern Professional Property Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-5 mt-3 mb-4 grid w-full grid-cols-6 shrink-0 h-10 bg-gradient-to-r from-muted/40 to-muted/20 border border-border/30 rounded-lg backdrop-blur-sm">
          {tabConfig.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="text-xs gap-2 h-8 px-3 font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-background data-[state=active]:to-background/90 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/40 rounded-md transition-all duration-200"
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
            <FormatTab />
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