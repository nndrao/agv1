import React from 'react';
import { Calendar, Code } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface EventsCallbacksTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const EVENT_CATEGORIES = [
  {
    title: 'Grid Lifecycle',
    icon: Calendar,
    events: [
      { name: 'onGridReady', description: 'Grid has finished initializing' },
      { name: 'onFirstDataRendered', description: 'First time data is rendered' },
      { name: 'onGridSizeChanged', description: 'Grid size changes' },
    ]
  },
  {
    title: 'Interaction Events',
    icon: Calendar,
    events: [
      { name: 'onCellClicked', description: 'User clicks on a cell' },
      { name: 'onRowClicked', description: 'User clicks on a row' },
      { name: 'onSelectionChanged', description: 'Row selection changes' },
    ]
  },
  {
    title: 'Data Events',
    icon: Calendar,
    events: [
      { name: 'onRowDataUpdated', description: 'Row data is updated' },
      { name: 'onFilterChanged', description: 'Filter conditions change' },
      { name: 'onSortChanged', description: 'Sort order changes' },
    ]
  },
  {
    title: 'Layout Events',
    icon: Calendar,
    events: [
      { name: 'onColumnResized', description: 'Column width changes' },
      { name: 'onRowGroupOpened', description: 'Row group expands/collapses' },
      { name: 'onPaginationChanged', description: 'Page changes' },
    ]
  },
  {
    title: 'Drag Events',
    icon: Calendar,
    events: [
      { name: 'onDragStarted', description: 'Drag operation starts' },
      { name: 'onDragStopped', description: 'Drag operation ends' },
    ]
  }
];

export const EventsCallbacksTab: React.FC<EventsCallbacksTabProps> = ({ options, onChange }) => {
  const hasConfiguredEvents = EVENT_CATEGORIES.some(category =>
    category.events.some(event => options[event.name])
  );

  return (
    <div className="space-y-6">
      <Alert>
        <Code className="h-4 w-4" />
        <AlertDescription>
          Event callbacks are typically configured programmatically in your component code.
          This panel shows which events are currently configured.
        </AlertDescription>
      </Alert>

      {EVENT_CATEGORIES.map((category) => (
        <div key={category.title} className="option-group">
          <div className="option-group-header">
            <h3 className="option-group-title">
              <category.icon className="option-group-icon" />
              {category.title}
            </h3>
          </div>
          <div className="option-group-content space-y-3">
            {category.events.map((event) => (
              <div key={event.name} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <div className="font-medium text-sm">{event.name}</div>
                  <div className="text-xs text-muted-foreground">{event.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  {options[event.name] ? (
                    <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                      Configured
                    </span>
                  ) : (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                      Not configured
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Card className="p-4 bg-muted/30">
        <h4 className="font-medium text-sm mb-2">Example Usage</h4>
        <pre className="text-xs bg-background/50 p-3 rounded overflow-x-auto">
{`const gridOptions = {
  onRowClicked: (event) => {
    console.log('Row clicked:', event.data);
  },
  onSelectionChanged: (event) => {
    const selectedRows = event.api.getSelectedRows();
    console.log('Selected rows:', selectedRows);
  },
  onFilterChanged: (event) => {
    console.log('Filter changed');
  }
};`}
        </pre>
      </Card>

      {!hasConfiguredEvents && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No event callbacks are currently configured</p>
          <p className="text-xs mt-1">Add event handlers in your component code</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open('https://www.ag-grid.com/react-data-grid/grid-events/', '_blank')}
        >
          <ExternalLink className="w-3 h-3" />
          View Documentation
        </Button>
      </div>
    </div>
  );
};