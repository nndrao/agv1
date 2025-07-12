import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import { BarChart3, Settings, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChartPanelParams {
  chartId: string;
  title: string;
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
}

export const ChartPanel: React.FC<IDockviewPanelProps> = ({ params }) => {
  const { chartId, title, chartType = 'bar' } = params as ChartPanelParams;

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Chart Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Select defaultValue={chartType}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="scatter">Scatter Plot</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Configure
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4 mr-1" />
              Fullscreen
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full h-full border rounded-lg flex items-center justify-center bg-muted/10">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">Chart Visualization</p>
            <p className="text-sm text-muted-foreground mt-2">Chart ID: {chartId}</p>
            <p className="text-sm text-muted-foreground">Type: {chartType}</p>
            <p className="text-sm text-muted-foreground mt-4 max-w-md">
              This is a placeholder for the chart component. In a real implementation, 
              this would render interactive charts using a library like Chart.js, D3, or Recharts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};