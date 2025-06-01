import React from 'react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AdvancedTab: React.FC = () => {
  const { selectedColumns } = useColumnCustomizationStore();
  
  return (
    <div className="p-4 space-y-4">
      {/* Two-column layout for better space utilization */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Performance</CardTitle>
              <CardDescription className="text-sm">
                Optimize column rendering and data processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Performance optimization options will be implemented here.
                {selectedColumns.size > 0 && (
                  <div className="mt-2">
                    Selected columns: {selectedColumns.size}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Aggregation</CardTitle>
              <CardDescription className="text-sm">
                Sum, average, and other aggregate functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Column aggregation functions will be implemented here.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Grouping & Pivoting</CardTitle>
              <CardDescription className="text-sm">
                Configure row grouping and pivot behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Row grouping and pivot options will be implemented here.
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Custom Properties</CardTitle>
              <CardDescription className="text-sm">
                Add custom properties to columns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Custom column properties will be implemented here.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};