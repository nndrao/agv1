import React from 'react';
import { SearchCheck, Search, Code, Info } from 'lucide-react';
import { OptionItem } from '../components/OptionItem';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface FindTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const FindTab: React.FC<FindTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      <Alert>
        <SearchCheck className="h-4 w-4" />
        <AlertDescription>
          The Find feature allows users to search and navigate through grid data with keyboard shortcuts.
          This is an Enterprise feature new in AG Grid v33.2.0.
        </AlertDescription>
      </Alert>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Search className="option-group-icon" />
            Find Configuration
            <Badge variant="secondary" className="ml-2 text-xs">Enterprise</Badge>
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Enable Find"
            description="Enable the find functionality with Ctrl/Cmd+F"
            value={options.find}
            type="boolean"
            onChange={(value) => onChange('find', value)}
            optionKey="find"
            showEnterpriseBadge
          />
          
          <div className="mt-4 p-3 bg-muted/50 rounded space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              Keyboard Shortcuts
            </h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Open Find Dialog:</span>
                <kbd className="px-2 py-0.5 bg-background rounded border text-xs">Ctrl/Cmd + F</kbd>
              </div>
              <div className="flex justify-between">
                <span>Find Next:</span>
                <kbd className="px-2 py-0.5 bg-background rounded border text-xs">F3</kbd>
              </div>
              <div className="flex justify-between">
                <span>Find Previous:</span>
                <kbd className="px-2 py-0.5 bg-background rounded border text-xs">Shift + F3</kbd>
              </div>
              <div className="flex justify-between">
                <span>Close Dialog:</span>
                <kbd className="px-2 py-0.5 bg-background rounded border text-xs">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Code className="option-group-icon" />
            Advanced Find Options
          </h3>
        </div>
        <div className="option-group-content">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">The following options can be configured programmatically:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">findCellValueMatcher</code>
                <span className="text-xs"> - Custom function to match cell values during find operations</span>
              </li>
              <li>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">findNextParams</code>
                <span className="text-xs"> - Parameters for the find next function</span>
              </li>
              <li>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">findPreviousParams</code>
                <span className="text-xs"> - Parameters for the find previous function</span>
              </li>
            </ul>
          </div>

          <Card className="p-4 bg-muted/30 mt-4">
            <h4 className="font-medium text-sm mb-2">Example Usage</h4>
            <pre className="text-xs bg-background/50 p-3 rounded overflow-x-auto">
{`const gridOptions = {
  find: true,
  findCellValueMatcher: (params) => {
    // Custom matching logic
    const searchText = params.searchText.toLowerCase();
    const cellValue = params.value?.toString().toLowerCase();
    return cellValue?.includes(searchText);
  },
  findNextParams: {
    searchText: 'initial search',
    caseSensitive: false,
    wholeWord: false
  }
};`}
            </pre>
          </Card>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">Features</h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Search across all visible columns</li>
          <li>• Navigate between matches with keyboard shortcuts</li>
          <li>• Case-sensitive and whole-word search options</li>
          <li>• Highlights all matches in the viewport</li>
          <li>• Custom cell value matching logic</li>
        </ul>
      </div>
    </div>
  );
};