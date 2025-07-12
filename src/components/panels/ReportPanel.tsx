import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import { FileText, Download, Share2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportPanelParams {
  reportId: string;
  title: string;
  description?: string;
}

export const ReportPanel: React.FC<IDockviewPanelProps> = ({ params }) => {
  const { reportId, title, description } = params as ReportPanelParams;

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Report Header */}
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
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Report View</p>
          <p className="text-sm mt-2">Report ID: {reportId}</p>
          <p className="text-sm mt-4 max-w-md">
            This is a placeholder for the report component. In a real implementation, 
            this would display report data, charts, tables, and other visualizations.
          </p>
        </div>
      </div>
    </div>
  );
};