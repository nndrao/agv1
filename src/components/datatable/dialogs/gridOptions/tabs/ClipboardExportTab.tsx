import React from 'react';
import { Clipboard, FileDown, FileSpreadsheet, Code } from 'lucide-react';
import { OptionItem } from '../components/OptionItem';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ClipboardExportTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const ClipboardExportTab: React.FC<ClipboardExportTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Clipboard Section */}
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Clipboard className="option-group-icon" />
            Clipboard Operations
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Enable Cell Text Selection"
            description="Allow users to select and copy cell text"
            value={options.enableCellTextSelection}
            type="boolean"
            onChange={(value) => onChange('enableCellTextSelection', value)}
            optionKey="enableCellTextSelection"
          />
          
          <OptionItem
            label="Suppress Copy Rows to Clipboard"
            description="Prevent rows from being copied to clipboard"
            value={options.suppressCopyRowsToClipboard}
            type="boolean"
            onChange={(value) => onChange('suppressCopyRowsToClipboard', value)}
            optionKey="suppressCopyRowsToClipboard"
          />
          
          <OptionItem
            label="Suppress Copy Single Cell Ranges"
            description="Prevent copying when only a single cell is selected"
            value={options.suppressCopySingleCellRanges}
            type="boolean"
            onChange={(value) => onChange('suppressCopySingleCellRanges', value)}
            optionKey="suppressCopySingleCellRanges"
          />
          
          <OptionItem
            label="Clipboard Delimiter"
            description="The delimiter to use when copying to clipboard"
            value={options.clipboardDelimiter}
            type="text"
            onChange={(value) => onChange('clipboardDelimiter', value)}
            optionKey="clipboardDelimiter"
            placeholder="Tab (\t)"
          />
        </div>
      </div>

      <Separator />

      {/* CSV Export Section */}
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <FileDown className="option-group-icon" />
            CSV Export
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Suppress CSV Export"
            description="Disable CSV export functionality"
            value={options.suppressCsvExport}
            type="boolean"
            onChange={(value) => onChange('suppressCsvExport', value)}
            optionKey="suppressCsvExport"
          />
          
          <OptionItem
            label="CSV Export Filename"
            description="Default filename for CSV exports"
            value={options.exporterCsvFilename}
            type="text"
            onChange={(value) => onChange('exporterCsvFilename', value)}
            optionKey="exporterCsvFilename"
            placeholder="export.csv"
            disabled={options.suppressCsvExport}
          />
        </div>
      </div>

      <Separator />

      {/* Excel Export Section */}
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <FileSpreadsheet className="option-group-icon" />
            Excel Export
            <Badge variant="secondary" className="ml-2 text-xs">Enterprise</Badge>
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Suppress Excel Export"
            description="Disable Excel export functionality"
            value={options.suppressExcelExport}
            type="boolean"
            onChange={(value) => onChange('suppressExcelExport', value)}
            optionKey="suppressExcelExport"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Excel Export Filename"
            description="Default filename for Excel exports"
            value={options.exporterExcelFilename}
            type="text"
            onChange={(value) => onChange('exporterExcelFilename', value)}
            optionKey="exporterExcelFilename"
            placeholder="export.xlsx"
            disabled={options.suppressExcelExport}
            showEnterpriseBadge
          />
        </div>
      </div>

      <Separator />

      {/* Advanced Clipboard Functions */}
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Code className="option-group-icon" />
            Advanced Clipboard Functions
            <Badge variant="secondary" className="ml-2 text-xs">Enterprise</Badge>
          </h3>
        </div>
        <div className="option-group-content">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">The following functions can be configured programmatically:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">processClipboardCopy</code>
                <span className="text-xs"> - Process clipboard data before copy</span>
              </li>
              <li>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">processClipboardPaste</code>
                <span className="text-xs"> - Process clipboard data before paste</span>
              </li>
            </ul>
          </div>

          <Card className="p-4 bg-muted/30 mt-4">
            <h4 className="font-medium text-sm mb-2">Example Usage</h4>
            <pre className="text-xs bg-background/50 p-3 rounded overflow-x-auto">
{`const gridOptions = {
  processClipboardCopy: (params) => {
    // Custom processing before copy
    const data = params.data;
    return data.toUpperCase();
  },
  processClipboardPaste: (params) => {
    // Custom processing before paste
    const data = params.data;
    return data.trim();
  }
};`}
            </pre>
          </Card>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">Clipboard Tips</h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Use Ctrl/Cmd+C to copy selected cells</li>
          <li>• Use Ctrl/Cmd+V to paste into editable cells</li>
          <li>• Excel export maintains formatting and formulas</li>
          <li>• CSV export is faster but loses formatting</li>
          <li>• Custom processors can transform data during copy/paste</li>
        </ul>
      </div>
    </div>
  );
};