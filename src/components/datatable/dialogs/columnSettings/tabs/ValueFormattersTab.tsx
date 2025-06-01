import React from 'react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const ValueFormattersTab: React.FC = () => {
  const { selectedColumns } = useColumnCustomizationStore();
  
  return (
    <div className="p-4 space-y-4">
      {/* Two-column layout for better space utilization */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Number Formatters</CardTitle>
              <CardDescription className="text-sm">
                Format numbers with decimals, currency, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Number formatting options will be implemented here.
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
              <CardTitle className="text-base">Date Formatters</CardTitle>
              <CardDescription className="text-sm">
                Format dates and times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Date formatting options will be implemented here.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Text Formatters</CardTitle>
              <CardDescription className="text-sm">
                Format text with case transformations and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Text formatting options will be implemented here.
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Custom Formatters</CardTitle>
              <CardDescription className="text-sm">
                Create custom formatter functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Custom formatter functions will be implemented here.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};