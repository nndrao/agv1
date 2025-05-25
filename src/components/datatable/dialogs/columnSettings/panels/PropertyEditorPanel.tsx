import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { DialogState } from '../types';
import { GeneralTab } from '../tabs/GeneralTab';
import { StylingTab } from '../tabs/StylingTab';
import { ValueFormattersTab } from '../tabs/ValueFormattersTab';
import { FiltersTab } from '../tabs/FiltersTab';
import { EditorsTab } from '../tabs/EditorsTab';
import { AdvancedTab } from '../tabs/AdvancedTab';

interface PropertyEditorPanelProps {
  state: DialogState;
  updateBulkProperty: (property: string, value: unknown) => void;
  setState: React.Dispatch<React.SetStateAction<DialogState>>;
}

export const PropertyEditorPanel: React.FC<PropertyEditorPanelProps> = ({ 
  state, 
  updateBulkProperty,
  setState
}) => {
  const selectedCount = state.selectedColumns.size;
  const selectedColumnNames = Array.from(state.selectedColumns).slice(0, 3).join(', ');
  const hasMoreColumns = state.selectedColumns.size > 3;

  return (
    <div className="h-full flex flex-col">
      {/* Selected Columns Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <h3 className="font-medium text-sm text-muted-foreground">
          {selectedCount === 0 ? 'No columns selected' : 
           selectedCount === 1 ? `Selected: ${selectedColumnNames}` : 
           `Selected: ${selectedColumnNames}${hasMoreColumns ? ` +${state.selectedColumns.size - 3} more` : ''}`}
        </h3>
      </div>

      {/* Mixed Values Warning */}
      {selectedCount > 1 && (
        <Alert className="mx-6 mt-4 mb-2" variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Mixed values are shown with a "~Mixed~" placeholder. Editing will apply to all selected columns based on your bulk apply mode.
          </AlertDescription>
        </Alert>
      )}

      {/* Property Tabs */}
      <Tabs 
        value={state.activeTab} 
        onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))} 
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-6 mt-4 mb-4 grid w-fit grid-cols-6 shrink-0">
          <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
          <TabsTrigger value="styling" className="text-xs">Styling</TabsTrigger>
          <TabsTrigger value="formatters" className="text-xs">Formatters</TabsTrigger>
          <TabsTrigger value="filters" className="text-xs">Filters</TabsTrigger>
          <TabsTrigger value="editors" className="text-xs">Editors</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="general" className="h-full mt-0">
            <GeneralTab 
              state={state} 
              updateBulkProperty={updateBulkProperty}
            />
          </TabsContent>
          <TabsContent value="styling" className="h-full mt-0">
            <StylingTab 
              state={state} 
              updateBulkProperty={updateBulkProperty}
            />
          </TabsContent>
          <TabsContent value="formatters" className="h-full mt-0">
            <ValueFormattersTab 
              state={state} 
              updateBulkProperty={updateBulkProperty}
            />
          </TabsContent>
          <TabsContent value="filters" className="h-full mt-0">
            <FiltersTab 
              state={state} 
              updateBulkProperty={updateBulkProperty}
            />
          </TabsContent>
          <TabsContent value="editors" className="h-full mt-0">
            <EditorsTab 
              state={state} 
              updateBulkProperty={updateBulkProperty}
            />
          </TabsContent>
          <TabsContent value="advanced" className="h-full mt-0">
            <AdvancedTab 
              state={state} 
              updateBulkProperty={updateBulkProperty}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};