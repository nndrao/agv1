import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Palette, Hash, Filter, Edit3, AlertTriangle } from 'lucide-react';
import { useColumnCustomizationStore } from '../store/columnCustomization.store';
import { GeneralTab } from '../tabs/GeneralTab';
import { StylingTab } from '../tabs/StylingTab';
import { FormatTab } from '../tabs/FormatTab';
import { FiltersTab } from '../tabs/FiltersTab';
import { EditorsTab } from '../tabs/EditorsTab';

interface PropertyEditorPanelProps {
  uiMode?: 'simple' | 'advanced';
}

export const PropertyEditorPanel: React.FC<PropertyEditorPanelProps> = ({ uiMode = 'simple' }) => {
  const {
    selectedColumns,
    activeTab,
    setActiveTab
  } = useColumnCustomizationStore();

  const selectedCount = selectedColumns.size;
  const selectedColumnNamesArr = Array.from(selectedColumns).slice(0, 3);
  const selectedColumnNames = selectedColumnNamesArr.join(', ');

  // Helper for tooltip
  const renderSelectedColumns = () => {
    if (selectedCount === 0) return 'Select columns to edit';
    if (selectedCount === 1) return selectedColumnNames;
    if (selectedCount <= 3) return selectedColumnNames;
    return `${selectedColumnNames} +${selectedColumns.size - 3} more`;
  };

  const tabConfig = uiMode === 'simple' 
    ? [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'styling', label: 'Styling', icon: Palette },
        { id: 'formatters', label: 'Format', icon: Hash },
      ]
    : [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'styling', label: 'Styling', icon: Palette },
        { id: 'formatters', label: 'Format', icon: Hash },
        { id: 'filters', label: 'Filters', icon: Filter },
        { id: 'editors', label: 'Editors', icon: Edit3 },
      ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with improved spacing and layout following shadcn/ui patterns */}
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
              <Edit3 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground leading-none" title={selectedCount > 0 ? Array.from(selectedColumns).join(', ') : undefined}>
                {renderSelectedColumns()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCount === 0 ? 'Select columns to configure properties' : 
                 selectedCount === 1 ? 'Configure column properties' : 
                 'Bulk edit column properties'}
              </p>
            </div>
          </div>
          {selectedCount > 1 && (
            <Badge variant="secondary" className="text-xs font-medium px-2 py-1 flex items-center gap-1.5">
              <Edit3 className="h-3 w-3" /> 
              Bulk Edit
            </Badge>
          )}
        </div>
      </div>

      {/* Mixed Values Alert with improved styling */}
      {selectedCount > 1 && (
        <div className="px-6 pt-4">
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              Mixed values shown as <span className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-xs">~Mixed~</span>. Changes apply to all selected columns.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Property Tabs with improved styling following shadcn/ui patterns */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-6 pt-4 pb-2">
          <TabsList className={`grid w-full ${uiMode === 'simple' ? 'grid-cols-3' : 'grid-cols-5'} h-10 bg-muted p-1`}>
            {tabConfig.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="text-xs gap-1.5 h-8 px-3 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="general" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <GeneralTab uiMode={uiMode} />
          </TabsContent>
          <TabsContent value="styling" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <StylingTab uiMode={uiMode} />
          </TabsContent>
          <TabsContent value="formatters" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <FormatTab uiMode={uiMode} />
          </TabsContent>
          {uiMode === 'advanced' && (
            <>
              <TabsContent value="filters" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <FiltersTab />
              </TabsContent>
              <TabsContent value="editors" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <EditorsTab />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
};