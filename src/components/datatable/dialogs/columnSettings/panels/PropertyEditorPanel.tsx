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
      {/* Clean Header */}
      <div className="px-5 py-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {selectedCount === 0 ? 'Select columns to edit' :
               selectedCount === 1 ? selectedColumnNames :
               `${selectedCount} columns selected`}
            </span>
            {selectedCount > 1 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Bulk Edit
              </Badge>
            )}
          </div>
          {hasMoreColumns && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              +{selectedColumns.size - 3} more
            </Badge>
          )}
        </div>
      </div>

      {/* Compact Mixed Values Alert */}
      {selectedCount > 1 && (
        <div className="mx-5 mt-3 mb-2">
          <Alert className="py-2 px-3 border-amber-200/50 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs ml-2">
              Mixed values shown as "~Mixed~". Changes apply to all selected columns.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Clean Property Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-5 mt-3 mb-3 grid w-full grid-cols-6 shrink-0 h-9 bg-muted/30">
          {tabConfig.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="modern-tab text-xs gap-1.5 h-full px-3 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{label}</span>
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