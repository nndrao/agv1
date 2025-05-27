import React, { useState, useMemo, useCallback } from 'react';
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
      { value: 'DDD, MMM DD', label: 'Short with Day (Mon, Dec 31)', preview: 'Mon, Dec 31' },
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
    label: 'Scientific',
    options: [
      { value: '0.00E+00', label: 'Scientific (1.23E+03)', preview: '1.23E+03' },
      { value: '0.000E+00', label: '3 Decimals (1.234E+03)', preview: '1.234E+03' },
      { value: '#.##E+0', label: 'Compact (1.23E+3)', preview: '1.23E+3' },
    ]
  },
  special: {
    label: 'Special',
    options: [
      { value: '[>=1000000]#,##0,,"M";[>=1000]#,##0,"K";#,##0', label: 'Abbreviated (1.2M, 450K)', preview: '1.2M' },
      { value: '"("0")"', label: 'Parentheses ((1234))', preview: '(1234)' },
      { value: '0;[Red]-0', label: 'Negative in Red', preview: '1234' },
      { value: '"+"0;"-"0;0', label: 'Show +/- Signs (+1234)', preview: '+1234' },
      { value: '0.0,', label: 'Thousands (divide by 1000)', preview: '1.2' },
      { value: '0.0,,', label: 'Millions (divide by million)', preview: '0.0' },
    ]
  }
};

// Format guide examples
const FORMAT_EXAMPLES = {
  basic: [
    { format: '0', description: 'Integer with no decimal places', example: '1234' },
    { format: '0.00', description: 'Number with 2 decimal places', example: '1234.50' },
    { format: '#,##0', description: 'Number with thousands separator', example: '1,234' },
    { format: '0%', description: 'Percentage', example: '12%' },
    { format: '$0.00', description: 'Currency', example: '$12.34' },
  ],
  conditional: [
    { format: '[>1000]"High";[<100]"Low";"Medium"', description: 'Conditional text based on value', example: 'High' },
    { format: '[Red][<0]0;[Blue][>0]0;0', description: 'Color negative red, positive blue', example: '-123' },
    { format: '[>=1000000]0.0,,"M";[>=1000]0.0,"K";0', description: 'Format large numbers as K/M', example: '1.2M' },
  ],
  prefixSuffix: [
    { format: '"$"0.00', description: 'Prefix with dollar sign', example: '$123.45' },
    { format: '0" USD"', description: 'Suffix with currency code', example: '123 USD' },
    { format: '"("0")"', description: 'Wrap in parentheses', example: '(123)' },
    { format: '"+"0;"-"0;0', description: 'Show +/- signs', example: '+123' },
  ],
  advanced: [
    { format: '0.0E+00', description: 'Scientific notation', example: '1.2E+02' },
    { format: '# ?/?', description: 'Fraction', example: '1 1/4' },
    { format: '@', description: 'Text placeholder', example: 'Hello' },
    { format: '00000', description: 'Pad with zeros', example: '00123' },
  ]
};

export const FormatTab: React.FC = () => {
  const {
    selectedColumns,
    pendingChanges,
    columnDefinitions,
    updateBulkProperty,
    showOnlyCommon,
    compareMode
  } = useColumnCustomizationStore();

  const [selectedFormat, setSelectedFormat] = useState<string>('default');
  const [customFormat, setCustomFormat] = useState<string>('');
  const [showGuide, setShowGuide] = useState(false);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  // Get current format value
  const currentFormat = useMemo(() => {
    if (selectedColumns.size === 0) return null;

    const formats = new Set<string>();
    selectedColumns.forEach(colId => {
      const changes = pendingChanges.get(colId);
      const colDef = columnDefinitions.get(colId);
      const format = changes?.valueFormat || colDef?.valueFormat || '';
      formats.add(format);
    });

    return formats.size === 1 ? Array.from(formats)[0] : '';
  }, [selectedColumns, pendingChanges, columnDefinitions]);

  // Check if selected format matches any predefined
  const matchedFormat = useMemo(() => {
    if (!currentFormat) return 'default';
    
    for (const category of Object.values(PREDEFINED_FORMATTERS)) {
      for (const option of category.options) {
        if (option.value === currentFormat) {
          return option.value;
        }
      }
    }
    
    return 'custom';
  }, [currentFormat]);

  // Update selection when current format changes
  React.useEffect(() => {
    if (matchedFormat === 'custom' && currentFormat) {
      setCustomFormat(currentFormat);
      setSelectedFormat('custom');
    } else {
      setSelectedFormat(matchedFormat);
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
  const createFormatterFunction = (format: string): ((params: any) => string) => {
    return (params: any) => {
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
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Number Format</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(true)}
            className="h-8 px-2"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Format Guide
          </Button>
        </div>

        <Select
          value={selectedFormat}
          onValueChange={handleFormatChange}
          disabled={isDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            {Object.entries(PREDEFINED_FORMATTERS).map(([key, category]) => (
              <SelectGroup key={key}>
                <SelectLabel>{category.label}</SelectLabel>
                {category.options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{option.preview}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
            <SelectItem value="custom">Custom Format...</SelectItem>
          </SelectContent>
        </Select>

        {selectedFormat === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="custom-format">Custom Format String</Label>
            <Input
              id="custom-format"
              value={customFormat}
              onChange={(e) => handleCustomFormatChange(e.target.value)}
              placeholder='e.g., #,##0.00 or "USD" 0.00'
              disabled={isDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Enter an Excel-style format string. Click the guide for examples.
            </p>
          </div>
        )}

        {currentFormat && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm font-medium mb-1">Current Format</p>
            <code className="text-xs bg-background px-2 py-1 rounded">{currentFormat}</code>
          </div>
        )}
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
                            <code className="text-sm bg-muted px-2 py-1 rounded">{example.format}</code>
                            <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{example.example}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.format)}
                            >
                              {copiedExample === example.format ? (
                                <Check className="h-3 w-3" />
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
                            <code className="text-sm bg-muted px-2 py-1 rounded">{example.format}</code>
                            <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{example.example}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.format)}
                            >
                              {copiedExample === example.format ? (
                                <Check className="h-3 w-3" />
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
                    <CardDescription>Add text before or after values</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {FORMAT_EXAMPLES.prefixSuffix.map((example, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <div className="flex-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{example.format}</code>
                            <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{example.example}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.format)}
                            >
                              {copiedExample === example.format ? (
                                <Check className="h-3 w-3" />
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
                    <CardDescription>Special formatting techniques</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {FORMAT_EXAMPLES.advanced.map((example, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <div className="flex-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{example.format}</code>
                            <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{example.example}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.format)}
                            >
                              {copiedExample === example.format ? (
                                <Check className="h-3 w-3" />
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
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>Sections:</strong> Formats can have up to 4 sections separated by semicolons:</p>
                    <code className="block bg-muted p-2 rounded text-xs">positive;negative;zero;text</code>
                    
                    <p className="mt-3"><strong>Special Characters:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><code>0</code> - Digit placeholder (shows 0 if no digit)</li>
                      <li><code>#</code> - Digit placeholder (nothing if no digit)</li>
                      <li><code>.</code> - Decimal point</li>
                      <li><code>,</code> - Thousands separator</li>
                      <li><code>%</code> - Percentage (multiplies by 100)</li>
                      <li><code>E+</code> - Scientific notation</li>
                      <li><code>"text"</code> - Literal text</li>
                      <li><code>[condition]</code> - Conditional formatting</li>
                      <li><code>[color]</code> - Text color (Red, Blue, Green, etc.)</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};