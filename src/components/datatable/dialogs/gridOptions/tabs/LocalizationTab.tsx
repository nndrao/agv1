import React from 'react';
import { Languages, Globe, Accessibility, Navigation } from 'lucide-react';
import { OptionItem } from '../components/OptionItem';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocalizationTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const LocalizationTab: React.FC<LocalizationTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          Localization allows you to customize all text displayed in the grid for different languages and regions.
        </AlertDescription>
      </Alert>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Languages className="option-group-icon" />
            Language & Text
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            <p>Localization options are typically configured programmatically:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">localeText</code> - Object containing localized text</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">localeTextFunc</code> - Function for dynamic localization</li>
            </ul>
          </div>

          <Card className="p-4 bg-muted/30">
            <h4 className="font-medium text-sm mb-2">Example Localization</h4>
            <pre className="text-xs bg-background/50 p-3 rounded overflow-x-auto">
{`const localeText = {
  // Pagination
  page: 'Página',
  more: 'Más',
  to: 'a',
  of: 'de',
  next: 'Siguiente',
  last: 'Último',
  first: 'Primero',
  previous: 'Anterior',
  
  // Column menu
  pinColumn: 'Fijar columna',
  unpinColumn: 'Desfijar columna',
  autoSizeThis: 'Autoajustar esta',
  autoSizeAll: 'Autoajustar todas',
  
  // Filter
  contains: 'Contiene',
  equals: 'Igual a',
  notEqual: 'No igual a',
  startsWith: 'Empieza con',
  endsWith: 'Termina con'
};`}
            </pre>
          </Card>
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Accessibility className="option-group-icon" />
            Accessibility
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Ensure DOM Order"
            description="Ensure DOM order matches visual order for screen readers"
            value={options.ensureDomOrder}
            type="boolean"
            onChange={(value) => onChange('ensureDomOrder', value)}
            optionKey="ensureDomOrder"
          />
          
          <OptionItem
            label="Suppress Column Virtualisation"
            description="Disable column virtualization to help screen readers"
            value={options.suppressColumnVirtualisation}
            type="boolean"
            onChange={(value) => onChange('suppressColumnVirtualisation', value)}
            optionKey="suppressColumnVirtualisation"
          />
          
          <OptionItem
            label="Suppress Row Virtualisation"
            description="Disable row virtualization to help screen readers"
            value={options.suppressRowVirtualisation}
            type="boolean"
            onChange={(value) => onChange('suppressRowVirtualisation', value)}
            optionKey="suppressRowVirtualisation"
          />
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Navigation className="option-group-icon" />
            Custom Navigation
          </h3>
        </div>
        <div className="option-group-content">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Custom navigation functions can be configured programmatically:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">navigateToNextCell</code> - Custom navigation function</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">tabToNextCell</code> - Custom tab navigation function</li>
            </ul>
            <div className="mt-4 p-3 bg-muted/50 rounded">
              <p className="text-xs">These functions allow you to customize how keyboard navigation works in the grid, useful for complex layouts or specific accessibility requirements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};