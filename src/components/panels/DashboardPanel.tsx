import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import { LayoutDashboard, Settings, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardPanelParams {
  dashboardId: string;
  title: string;
  description?: string;
}

export const DashboardPanel: React.FC<IDockviewPanelProps> = ({ params }) => {
  const { dashboardId, title, description } = params as DashboardPanelParams;

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Dashboard Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Widget
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 p-6">
        <div className="h-full border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <LayoutDashboard className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">Dashboard View</p>
            <p className="text-sm text-muted-foreground mt-2">Dashboard ID: {dashboardId}</p>
            <p className="text-sm text-muted-foreground mt-4 max-w-md">
              This is a placeholder for the dashboard component. In a real implementation, 
              this would display widgets, charts, KPIs, and other dashboard elements.
            </p>
            <Button variant="outline" className="mt-6">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Widget
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};