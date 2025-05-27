import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { HelpCircle, Copy, Check } from 'lucide-react';

// Pre-defined formatters organized by category
const PREDEFINED_FORMATTERS = {
  number: {
    label: 'Number',
    options: [
      { value: '0', label: 'Integer (1234)', preview: '1234' },
      { value: '0.0', label: '1 Decimal (1234.5)', preview: '1234.5' },
      { value: '0.00', label: '2 Decimals (1234.50)', preview: '1234.50' },
      { value: '#,##0', label: 'Thousands (1,234)', preview: '1,234' },
      { value: '#,##0.00', label: 'Thousands + 2 Decimals (1,234.50)', preview: '1,234.50' },
      { value: '0.000', label: '3 Decimals (1234.500)', preview: '1234.500' },
      { value: '#,##0.0000', label: 'Thousands + 4 Decimals', preview: '1,234.5678' },
    ]
  },
  currency: {
    label: 'Currency',
    options: [
      { value: '$#,##0', label: 'USD Integer ($1,234)', preview: '$1,234' },
      { value: '$#,##0.00', label: 'USD 2 Decimals ($1,234.50)', preview: '$1,234.50' },
      { value: '€#,##0.00', label: 'EUR 2 Decimals (€1,234.50)', preview: '€1,234.50' },
      { value: '£#,##0.00', label: 'GBP 2 Decimals (£1,234.50)', preview: '£1,234.50' },
      { value: '¥#,##0', label: 'JPY Integer (¥1,234)', preview: '¥1,234' },
      { value: '#,##0.00 "USD"', label: 'USD Suffix (1,234.50 USD)', preview: '1,234.50 USD' },
      { value: '"$" #,##0.00;[Red]"-$" #,##0.00', label: 'Accounting (negative in red)', preview: '$1,234.50' },
    ]
  },
  percentage: {
    label: 'Percentage',
    options: [
      { value: '0%', label: 'Integer (12%)', preview: '12%' },
      { value: '0.0%', label: '1 Decimal (12.3%)', preview: '12.3%' },
      { value: '0.00%', label: '2 Decimals (12.34%)', preview: '12.34%' },
      { value: '#,##0.0%', label: 'Thousands + 1 Decimal', preview: '1,234.5%' },
    ]
  },
  date: {
    label: 'Date',
    options: [
      { value: 'MM/DD/YYYY', label: 'US Date (12/31/2024)', preview: '12/31/2024' },
      { value: 'DD/MM/YYYY', label: 'UK Date (31/12/2024)', preview: '31/12/2024' },
      { value: 'YYYY-MM-DD', label: 'ISO Date (2024-12-31)', preview: '2024-12-31' },
      { value: 'MMM DD, YYYY', label: 'Medium Date (Dec 31, 2024)', preview: 'Dec 31, 2024' },
      { value: 'MMMM DD, YYYY', label: 'Long Date (December 31, 2024)', preview: 'December 31, 2024' },
    ]
  },
  time: {
    label: 'Time',
    options: [
      { value: 'HH:mm', label: '24-hour (14:30)', preview: '14:30' },
      { value: 'HH:mm:ss', label: '24-hour with seconds (14:30:45)', preview: '14:30:45' },
      { value: 'hh:mm AM/PM', label: '12-hour (02:30 PM)', preview: '02:30 PM' },
      { value: 'hh:mm:ss AM/PM', label: '12-hour with seconds', preview: '02:30:45 PM' },
    ]
  },
  scientific: {
    label: 'Scientific & Special',
    options: [
      { value: '0.00E+00', label: 'Scientific (1.23E+03)', preview: '1.23E+03' },
      { value: '0.0E+0', label: 'Scientific Short (1.2E+3)', preview: '1.2E+3' },
      { value: '[>999999]#,,"M";[>999]#,"K";#', label: 'Abbreviated (1.2M, 450K)', preview: '1.2M' },
      { value: '+0;-0;0', label: 'Show +/- signs', preview: '+123' },
      { value: '(0)', label: 'Parentheses for negative', preview: '(123)' },
    ]
  }
};

// Format string examples for the guide
const FORMAT_EXAMPLES = {
  basic: [
    { pattern: '0', desc: 'Display as integer', example: '1234' },
    { pattern: '0.00', desc: 'Two decimal places', example: '1234.50' },
    { pattern: '#,##0', desc: 'Thousands separator', example: '1,234' },
    { pattern: '#,##0.00', desc: 'Thousands with decimals', example: '1,234.50' },
    { pattern: '0%', desc: 'Percentage', example: '75%' },
    { pattern: '0.0%', desc: 'Percentage with decimal', example: '75.5%' },
  ],
  conditional: [
    { pattern: '[Red]0', desc: 'Color formatting', example: '1234 (in red)' },
    { pattern: '[>100]"High";[<50]"Low";"Medium"', desc: 'Conditional text', example: 'High' },
    { pattern: '[Green]0;[Red]-0', desc: 'Color positive/negative', example: '123 / -123' },
  ],
  prefixSuffix: [
    { pattern: '"$"0', desc: 'Currency prefix', example: '$100' },
    { pattern: '0" USD"', desc: 'Currency suffix', example: '100 USD' },
    { pattern: '"("0")"', desc: 'Wrap in parentheses', example: '(100)' },
    { pattern: '0" units"', desc: 'Unit suffix', example: '50 units' },
  ],
  advanced: [
    { pattern: '0.00E+00', desc: 'Scientific notation', example: '1.23E+03' },
    { pattern: '# ?/?', desc: 'Fractions', example: '1 1/2' },
    { pattern: '00000', desc: 'Leading zeros', example: '00123' },
    { pattern: '@', desc: 'Text placeholder', example: 'Hello' },
  ]
};

export const FormatTab: React.FC = () => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty
  } = useColumnCustomizationStore();

  const [selectedFormat, setSelectedFormat] = useState<string>('default');
  const [customFormat, setCustomFormat] = useState<string>('');
  const [showGuide, setShowGuide] = useState(false);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  // Get current format from selected columns
  const currentFormat = useMemo(() => {
    if (selectedColumns.size === 0) return null;
    
    const formats = new Set<string>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const changes = pendingChanges.get(colId);
      const format = changes?.valueFormat || colDef?.valueFormat || 'default';
      formats.add(format);
    });

    return formats.size === 1 ? Array.from(formats)[0] : null;
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Find matching predefined format
  const matchedFormat = useMemo(() => {
    if (!currentFormat || currentFormat === 'default') return null;
    
    for (const [, category] of Object.entries(PREDEFINED_FORMATTERS)) {
      const match = category.options.find(opt => opt.value === currentFormat);
      if (match) return match;
    }
    return null;
  }, [currentFormat]);

  // Sync selected format with current format
  React.useEffect(() => {
    if (currentFormat) {
      if (matchedFormat) {
        setSelectedFormat(currentFormat);
      } else if (currentFormat !== 'default') {
        setSelectedFormat('custom');
        setCustomFormat(currentFormat);
      } else {
        setSelectedFormat('default');
      }
    }
  }, [matchedFormat, currentFormat]);

  const handleFormatChange = (value: string) => {
    setSelectedFormat(value);
    
    if (value === 'default') {
      updateBulkProperty('valueFormat', undefined);
      updateBulkProperty('valueFormatter', undefined);
    } else if (value === 'custom') {
      // Don't update yet, wait for custom input
    } else {
      updateBulkProperty('valueFormat', value);
      // Create a value formatter function based on the format string
      updateBulkProperty('valueFormatter', createFormatterFunction(value));
    }
  };

  const handleCustomFormatChange = (value: string) => {
    setCustomFormat(value);
    if (value) {
      updateBulkProperty('valueFormat', value);
      updateBulkProperty('valueFormatter', createFormatterFunction(value));
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedExample(text);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  // Create a formatter function from format string
  const createFormatterFunction = (format: string): ((params: { value: number | null | undefined }) => string) => {
    return (params: { value: number | null | undefined }) => {
      if (params.value == null) return '';
      
      // This is a simplified formatter - in production, you'd use a library like numeral.js
      // or implement full Excel format string parsing
      const value = params.value;
      
      // Handle some basic patterns
      if (format.includes('%')) {
        return (value * 100).toFixed(format.split('.').length > 1 ? format.split('.')[1].indexOf('%') : 0) + '%';
      }
      
      if (format.startsWith('$') || format.startsWith('€') || format.startsWith('£')) {
        const symbol = format[0];
        const decimals = (format.match(/0/g) || []).length - (format.match(/[#0]+(?=\.)/g) || [''])[0].length;
        return symbol + value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      }
      
      if (format.includes(',')) {
        const decimals = format.includes('.') ? format.split('.')[1].replace(/[^0]/g, '').length : 0;
        return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      }
      
      // Default: just return formatted number
      return value.toString();
    };
  };

  const isDisabled = selectedColumns.size === 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Value Formatting</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(true)}
                className="h-7 text-xs gap-1"
              >
                <HelpCircle className="h-3 w-3" />
                Format Guide
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Apply number, currency, date, or custom formats to cell values
            </p>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Select Format</Label>
            <Select
              value={selectedFormat}
              onValueChange={handleFormatChange}
              disabled={isDisabled}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                <SelectItem value="default">Default (No formatting)</SelectItem>
                
                {Object.entries(PREDEFINED_FORMATTERS).map(([category, { label, options }]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="font-semibold text-xs px-2">{label}</SelectLabel>
                    {options.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-sm">
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <span className="ml-4 text-muted-foreground text-xs font-mono">
                            {option.preview}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                
                <SelectItem value="custom">Custom Format...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom format input */}
          {selectedFormat === 'custom' && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
              <Label htmlFor="custom-format" className="text-sm">Custom Format String</Label>
              <Input
                id="custom-format"
                value={customFormat}
                onChange={(e) => handleCustomFormatChange(e.target.value)}
                placeholder="Enter format string (e.g., #,##0.00)"
                disabled={isDisabled}
                className="h-9 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use Excel-style format strings. Click "Format Guide" for examples.
              </p>
            </div>
          )}

          {/* Current format display */}
          {currentFormat && currentFormat !== 'default' && (
            <div className="p-4 bg-muted/20 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Current Format</p>
                  <p className="text-sm font-mono">{currentFormat}</p>
                </div>
                {matchedFormat && (
                  <Badge variant="secondary" className="text-xs">{matchedFormat.label}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Quick Tips */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
            <h4 className="text-xs font-medium mb-2">Quick Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Use # for optional digits, 0 for required digits</li>
              <li>• Add commas for thousands separators (#,##0)</li>
              <li>• Use % for percentages (values will be multiplied by 100)</li>
              <li>• Wrap text in quotes for prefixes/suffixes ("$"0.00)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Format Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Excel Format String Guide</DialogTitle>
            <DialogDescription>
              Learn how to create custom format strings for your data
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="mt-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Formats</TabsTrigger>
              <TabsTrigger value="conditional">Conditional</TabsTrigger>
              <TabsTrigger value="prefixSuffix">Prefix/Suffix</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="basic" className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Basic Number Formats</CardTitle>
                    <CardDescription>Common patterns for formatting numbers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {FORMAT_EXAMPLES.basic.map((example, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <div className="flex-1">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{example.pattern}</code>
                            <p className="text-xs text-muted-foreground mt-1">{example.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{example.example}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.pattern)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedExample === example.pattern ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="conditional" className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Conditional Formatting</CardTitle>
                    <CardDescription>Format based on value conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {FORMAT_EXAMPLES.conditional.map((example, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <div className="flex-1">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{example.pattern}</code>
                            <p className="text-xs text-muted-foreground mt-1">{example.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{example.example}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.pattern)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedExample === example.pattern ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prefixSuffix" className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Prefix & Suffix</CardTitle>
                    <CardDescription>Add text before or after numbers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {FORMAT_EXAMPLES.prefixSuffix.map((example, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <div className="flex-1">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{example.pattern}</code>
                            <p className="text-xs text-muted-foreground mt-1">{example.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{example.example}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.pattern)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedExample === example.pattern ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Advanced Formats</CardTitle>
                    <CardDescription>Scientific notation, fractions, and more</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {FORMAT_EXAMPLES.advanced.map((example, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <div className="flex-1">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{example.pattern}</code>
                            <p className="text-xs text-muted-foreground mt-1">{example.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{example.example}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.pattern)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedExample === example.pattern ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Format String Syntax</CardTitle>
                    <CardDescription>Complete reference</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <p><strong>0</strong> - Display digit or 0</p>
                    <p><strong>#</strong> - Display digit or nothing</p>
                    <p><strong>,</strong> - Thousands separator</p>
                    <p><strong>.</strong> - Decimal point</p>
                    <p><strong>%</strong> - Percentage (multiply by 100)</p>
                    <p><strong>E+, E-</strong> - Scientific notation</p>
                    <p><strong>"text"</strong> - Display literal text</p>
                    <p><strong>@</strong> - Text placeholder</p>
                    <p><strong>[condition]</strong> - Conditional formatting</p>
                    <p><strong>;</strong> - Section separator (positive;negative;zero;text)</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};