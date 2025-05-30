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
        { id: 'advanced', label: 'Advanced', icon: Cog },
      ];

  return (
    <div className="h-full flex flex-col">
      {/* Header with improved column display */}
      <div className="px-5 py-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold truncate max-w-xs" title={selectedCount > 0 ? Array.from(selectedColumns).join(', ') : undefined}>
              {renderSelectedColumns()}
            </span>
            {selectedCount > 1 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0 flex items-center gap-1" aria-label="Bulk Edit">
                <Edit3 className="h-3 w-3" /> Bulk Edit
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Compact Mixed Values Alert, dismissible */}
      {selectedCount > 1 && (
        <div className="mx-5 mt-3 mb-2">
          <Alert className="py-2 px-3 border-amber-200/50 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20" role="alert" aria-live="polite">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs ml-2">
              Mixed values shown as <span className="font-mono bg-muted/40 px-1 rounded">~Mixed~</span>. Changes apply to all selected columns.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Property Tabs with improved accessibility and tooltips */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-5 mt-3 mb-3 grid w-full grid-cols-6 shrink-0 h-9 bg-muted/30 overflow-x-auto scrollbar-thin">
          {tabConfig.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="modern-tab text-xs gap-1.5 h-full px-3 font-medium data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
              title={label}
              aria-label={label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-auto px-5 pb-4">
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
              <TabsContent value="advanced" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <AdvancedTab />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
};