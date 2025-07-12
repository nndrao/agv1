import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PanelType = 'dataTable' | 'report' | 'dashboard' | 'chart';

interface PanelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'rename';
  panelType?: PanelType;
  initialId?: string;
  initialTitle?: string;
  initialDescription?: string;
  onSubmit: (id: string, title: string, type: PanelType, additionalParams?: any) => void;
}

const panelTypeLabels: Record<PanelType, string> = {
  dataTable: 'Table',
  report: 'Report',
  dashboard: 'Dashboard',
  chart: 'Chart',
};

const panelTypeDescriptions: Record<PanelType, string> = {
  dataTable: 'Create a new data table with customizable columns and data sources.',
  report: 'Create a report view for displaying formatted data and analytics.',
  dashboard: 'Create a dashboard with widgets and visualizations.',
  chart: 'Create a chart to visualize your data.',
};

export const PanelDialog: React.FC<PanelDialogProps> = ({
  open,
  onOpenChange,
  mode,
  panelType: initialPanelType = 'dataTable',
  initialId = '',
  initialTitle = '',
  initialDescription = '',
  onSubmit,
}) => {
  const [panelId, setPanelId] = useState(initialId);
  const [panelTitle, setPanelTitle] = useState(initialTitle);
  const [panelType, setPanelType] = useState<PanelType>(initialPanelType);
  const [description, setDescription] = useState(initialDescription);
  const [chartType, setChartType] = useState<string>('bar');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'create') {
        // Generate default values for create mode
        const timestamp = Date.now();
        const typePrefix = panelType === 'dataTable' ? 'table' : panelType;
        const defaultId = `${typePrefix}-${timestamp}`;
        const defaultTitle = `${panelTypeLabels[panelType]} ${new Date().toLocaleTimeString()}`;
        setPanelId(defaultId);
        setPanelTitle(defaultTitle);
        setDescription('');
      } else {
        // Use provided values for rename mode
        setPanelId(initialId);
        setPanelTitle(initialTitle);
        setPanelType(initialPanelType);
        setDescription(initialDescription);
      }
    }
  }, [open, mode, initialId, initialTitle, initialPanelType, initialDescription, panelType]);

  const handleSubmit = () => {
    if (mode === 'create' && (!panelId.trim() || !panelTitle.trim())) {
      return;
    }
    if (mode === 'rename' && !panelTitle.trim()) {
      return;
    }

    const additionalParams: any = {};
    if (description.trim()) {
      additionalParams.description = description.trim();
    }
    if (panelType === 'chart') {
      additionalParams.chartType = chartType;
    }

    onSubmit(panelId.trim(), panelTitle.trim(), panelType, additionalParams);
    
    // Close dialog and reset
    onOpenChange(false);
    setPanelId('');
    setPanelTitle('');
    setDescription('');
    setChartType('bar');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setPanelId('');
    setPanelTitle('');
    setDescription('');
    setChartType('bar');
  };

  const isCreateMode = mode === 'create';
  const dialogTitle = isCreateMode ? `Create New ${panelTypeLabels[panelType]}` : 'Rename Panel';
  const dialogDescription = isCreateMode 
    ? panelTypeDescriptions[panelType]
    : 'Enter a new title for the panel.';
  const submitButtonText = isCreateMode ? `Create ${panelTypeLabels[panelType]}` : 'Rename';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isCreateMode && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="panel-type" className="text-right">
                  Type
                </Label>
                <Select value={panelType} onValueChange={(value) => setPanelType(value as PanelType)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dataTable">Table</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="chart">Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="panel-id" className="text-right">
                  ID
                </Label>
                <Input
                  id="panel-id"
                  value={panelId}
                  onChange={(e) => setPanelId(e.target.value)}
                  className="col-span-3"
                  placeholder={`${panelType}-123456`}
                />
              </div>
            </>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="panel-title" className="text-right">
              Title
            </Label>
            <Input
              id="panel-title"
              value={panelTitle}
              onChange={(e) => setPanelTitle(e.target.value)}
              className="col-span-3"
              placeholder={`My ${panelTypeLabels[panelType]}`}
              autoFocus={!isCreateMode}
            />
          </div>
          {isCreateMode && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="panel-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="panel-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Optional description..."
                rows={2}
              />
            </div>
          )}
          {isCreateMode && panelType === 'chart' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chart-type" className="text-right">
                Chart Type
              </Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="col-span-3">
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
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isCreateMode
                ? !panelId.trim() || !panelTitle.trim()
                : !panelTitle.trim()
            }
          >
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};