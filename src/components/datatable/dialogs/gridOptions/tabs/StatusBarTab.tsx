import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface StatusBarTabProps {
  options: AgGridReact['props'];
  onChange: (updates: Partial<AgGridReact['props']>) => void;
}

export function StatusBarTab({ options, onChange }: StatusBarTabProps) {
  const statusPanels = options.statusBar?.statusPanels || [];
  
  const toggleStatusPanel = (panelId: string, enabled: boolean) => {
    const currentPanels = [...statusPanels];
    const panelIndex = currentPanels.findIndex(p => p.statusPanel === panelId);
    
    if (enabled && panelIndex === -1) {
      // Add panel
      currentPanels.push({
        statusPanel: panelId,
        align: 'left' as const,
        key: panelId
      });
    } else if (!enabled && panelIndex !== -1) {
      // Remove panel
      currentPanels.splice(panelIndex, 1);
    }
    
    onChange({
      statusBar: {
        statusPanels: currentPanels
      }
    });
  };
  
  const updatePanelAlignment = (panelId: string, align: 'left' | 'center' | 'right') => {
    const currentPanels = [...statusPanels];
    const panel = currentPanels.find(p => p.statusPanel === panelId);
    if (panel) {
      panel.align = align;
      onChange({
        statusBar: {
          statusPanels: currentPanels
        }
      });
    }
  };
  
  const isPanelEnabled = (panelId: string) => {
    return statusPanels.some(p => p.statusPanel === panelId);
  };
  
  const getPanelAlignment = (panelId: string) => {
    const panel = statusPanels.find(p => p.statusPanel === panelId);
    return panel?.align || 'left';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Status Bar Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableStatusBar">Enable Status Bar</Label>
            <Switch
              id="enableStatusBar"
              checked={options.statusBar !== undefined}
              onCheckedChange={(checked) => onChange({ 
                statusBar: checked ? {
                  statusPanels: [
                    {
                      statusPanel: 'agTotalAndFilteredRowCountComponent',
                      align: 'left' as const
                    },
                    {
                      statusPanel: 'agTotalRowCountComponent',
                      align: 'center' as const
                    },
                    {
                      statusPanel: 'agFilteredRowCountComponent',
                      align: 'center' as const
                    },
                    {
                      statusPanel: 'agSelectedRowCountComponent',
                      align: 'center' as const
                    },
                    {
                      statusPanel: 'agAggregationComponent',
                      align: 'right' as const
                    }
                  ]
                } : undefined
              })}
            />
          </div>
        </div>
      </div>

      {options.statusBar && (
        <>
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Status Panels</h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="totalAndFilteredCount"
                      checked={isPanelEnabled('agTotalAndFilteredRowCountComponent')}
                      onCheckedChange={(checked) => 
                        toggleStatusPanel('agTotalAndFilteredRowCountComponent', !!checked)
                      }
                    />
                    <Label htmlFor="totalAndFilteredCount">Total & Filtered Row Count</Label>
                  </div>
                  {isPanelEnabled('agTotalAndFilteredRowCountComponent') && (
                    <Select
                      value={getPanelAlignment('agTotalAndFilteredRowCountComponent')}
                      onValueChange={(value) => 
                        updatePanelAlignment('agTotalAndFilteredRowCountComponent', value as any)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="totalCount"
                      checked={isPanelEnabled('agTotalRowCountComponent')}
                      onCheckedChange={(checked) => 
                        toggleStatusPanel('agTotalRowCountComponent', !!checked)
                      }
                    />
                    <Label htmlFor="totalCount">Total Row Count</Label>
                  </div>
                  {isPanelEnabled('agTotalRowCountComponent') && (
                    <Select
                      value={getPanelAlignment('agTotalRowCountComponent')}
                      onValueChange={(value) => 
                        updatePanelAlignment('agTotalRowCountComponent', value as any)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filteredCount"
                      checked={isPanelEnabled('agFilteredRowCountComponent')}
                      onCheckedChange={(checked) => 
                        toggleStatusPanel('agFilteredRowCountComponent', !!checked)
                      }
                    />
                    <Label htmlFor="filteredCount">Filtered Row Count</Label>
                  </div>
                  {isPanelEnabled('agFilteredRowCountComponent') && (
                    <Select
                      value={getPanelAlignment('agFilteredRowCountComponent')}
                      onValueChange={(value) => 
                        updatePanelAlignment('agFilteredRowCountComponent', value as any)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectedCount"
                      checked={isPanelEnabled('agSelectedRowCountComponent')}
                      onCheckedChange={(checked) => 
                        toggleStatusPanel('agSelectedRowCountComponent', !!checked)
                      }
                    />
                    <Label htmlFor="selectedCount">Selected Row Count</Label>
                  </div>
                  {isPanelEnabled('agSelectedRowCountComponent') && (
                    <Select
                      value={getPanelAlignment('agSelectedRowCountComponent')}
                      onValueChange={(value) => 
                        updatePanelAlignment('agSelectedRowCountComponent', value as any)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aggregation"
                      checked={isPanelEnabled('agAggregationComponent')}
                      onCheckedChange={(checked) => 
                        toggleStatusPanel('agAggregationComponent', !!checked)
                      }
                    />
                    <Label htmlFor="aggregation">Aggregation Component</Label>
                  </div>
                  {isPanelEnabled('agAggregationComponent') && (
                    <Select
                      value={getPanelAlignment('agAggregationComponent')}
                      onValueChange={(value) => 
                        updatePanelAlignment('agAggregationComponent', value as any)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Custom Status Bar Components</h3>
            <div className="text-sm text-muted-foreground">
              Custom status bar components can be configured in your code by adding them to the statusPanels array.
            </div>
          </div>
        </>
      )}
    </div>
  );
}