import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { GeneralTab } from '../tabs/GeneralTab';
import { StylingTab } from '../tabs/StylingTab';
import { ValueFormattersTab } from '../tabs/ValueFormattersTab';
import { FiltersTab } from '../tabs/FiltersTab';
import { EditorsTab } from '../tabs/EditorsTab';
import { AdvancedTab } from '../tabs/AdvancedTab';

export const PropertyEditorPanel: React.FC = () => {
  const { selectedColumns, activeTab, setActiveTab } = useColumnCustomizationStore();
  
  const selectedCount = selectedColumns.size;

  return (
    <div className="h-full flex flex-col">
      {/* Selected Columns Header */}
      <div className="px-6 py-4 border-b">
        <h3 className="font-medium text-sm text-muted-foreground">
          {selectedCount === 0 ? 'No columns selected' : 
           selectedCount === 1 ? '1 column selected' : 
           `${selectedCount} columns selected`}
        </h3>
      </div>

      {/* No Selection Warning */}
      {selectedCount === 0 && (
        <Alert className="mx-6 mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select one or more columns from the left panel to edit their properties.
          </AlertDescription>
        </Alert>
      )}

      {/* Mixed Values Warning */}
      {selectedCount > 1 && (
        <Alert className="mx-6 mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Mixed values are shown with a "~Mixed~" placeholder. Editing will apply to all selected columns.
          </AlertDescription>
        </Alert>
      )}

      {/* Property Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-6 mt-4 flex-shrink-0">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="styling">Styling</TabsTrigger>
          <TabsTrigger value="formatters">Formatters</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="editors">Editors</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="general" className="h-full mt-0 overflow-y-auto">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="styling" className="h-full mt-0 overflow-y-auto">
            <StylingTab />
          </TabsContent>
          <TabsContent value="formatters" className="h-full mt-0 overflow-y-auto">
            <ValueFormattersTab />
          </TabsContent>
          <TabsContent value="filters" className="h-full mt-0 overflow-y-auto">
            <FiltersTab />
          </TabsContent>
          <TabsContent value="editors" className="h-full mt-0 overflow-y-auto">
            <EditorsTab />
          </TabsContent>
          <TabsContent value="advanced" className="h-full mt-0 overflow-y-auto">
            <AdvancedTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};