import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Editor } from '@monaco-editor/react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ValueFormatterEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFormatter?: (params: { value: unknown }) => string;
  onSave: (formatter: (params: { value: unknown }) => string) => void;
  title: string;
  columnType?: 'text' | 'number' | 'date' | 'boolean';
}

interface FormatterTemplate {
  id: string;
  name: string;
  description: string;
  type: string[];
  generator: (config: Record<string, unknown>) => string;
  config: Array<{
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    default: unknown;
    options?: Array<{ value: string; label: string }>;
  }>;
}

const FORMATTER_TEMPLATES: FormatterTemplate[] = [
  {
    id: 'number',
    name: 'Number Format',
    description: 'Format numbers with decimal places and thousands separator',
    type: ['number'],
    config: [
      { key: 'decimals', label: 'Decimal Places', type: 'number', default: 2 },
      { key: 'thousands', label: 'Thousands Separator', type: 'string', default: ',' },
      { key: 'decimal', label: 'Decimal Separator', type: 'string', default: '.' }
    ],
    generator: (config) => `
(params) => {
  if (params.value == null) return '';
  const num = Number(params.value);
  if (isNaN(num)) return params.value;
  return num.toFixed(${config.decimals}).replace(/\\B(?=(\\d{3})+(?!\\d))/g, '${config.thousands}');
}`
  },
  {
    id: 'currency',
    name: 'Currency Format',
    description: 'Format numbers as currency with symbol and position',
    type: ['number'],
    config: [
      { key: 'symbol', label: 'Currency Symbol', type: 'string', default: '$' },
      { key: 'position', label: 'Symbol Position', type: 'select', default: 'before', options: [
        { value: 'before', label: 'Before ($100)' },
        { value: 'after', label: 'After (100$)' }
      ]},
      { key: 'decimals', label: 'Decimal Places', type: 'number', default: 2 }
    ],
    generator: (config) => `
(params) => {
  if (params.value == null) return '';
  const num = Number(params.value);
  if (isNaN(num)) return params.value;
  const formatted = num.toFixed(${config.decimals}).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
  return '${config.position}' === 'before' ? '${config.symbol}' + formatted : formatted + '${config.symbol}';
}`
  },
  {
    id: 'percentage',
    name: 'Percentage Format',
    description: 'Format numbers as percentages',
    type: ['number'],
    config: [
      { key: 'decimals', label: 'Decimal Places', type: 'number', default: 1 },
      { key: 'multiply', label: 'Multiply by 100', type: 'boolean', default: true }
    ],
    generator: (config) => `
(params) => {
  if (params.value == null) return '';
  const num = Number(params.value);
  if (isNaN(num)) return params.value;
  const value = ${config.multiply} ? num * 100 : num;
  return value.toFixed(${config.decimals}) + '%';
}`
  },
  {
    id: 'date',
    name: 'Date Format',
    description: 'Format dates with various patterns',
    type: ['date'],
    config: [
      { key: 'format', label: 'Date Format', type: 'select', default: 'MM/dd/yyyy', options: [
        { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy' },
        { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy' },
        { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd' },
        { value: 'MMM dd, yyyy', label: 'MMM dd, yyyy' },
        { value: 'dd MMM yyyy', label: 'dd MMM yyyy' },
        { value: 'MMMM dd, yyyy', label: 'MMMM dd, yyyy' }
      ]}
    ],
    generator: (config) => `
(params) => {
  if (params.value == null) return '';
  const date = new Date(params.value);
  if (isNaN(date.getTime())) return params.value;
  // Simple date formatting - in real app, use date-fns or similar
  const format = '${config.format}';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return format
    .replace('yyyy', year)
    .replace('MM', month)
    .replace('dd', day);
}`
  },
  {
    id: 'boolean',
    name: 'Boolean Format',
    description: 'Format boolean values with custom text',
    type: ['boolean'],
    config: [
      { key: 'trueText', label: 'True Text', type: 'string', default: 'Yes' },
      { key: 'falseText', label: 'False Text', type: 'string', default: 'No' }
    ],
    generator: (config) => `
(params) => {
  if (params.value == null) return '';
  return params.value ? '${config.trueText}' : '${config.falseText}';
}`
  },
  {
    id: 'text',
    name: 'Text Transform',
    description: 'Transform text case and add prefix/suffix',
    type: ['text'],
    config: [
      { key: 'transform', label: 'Text Transform', type: 'select', default: 'none', options: [
        { value: 'none', label: 'None' },
        { value: 'uppercase', label: 'UPPERCASE' },
        { value: 'lowercase', label: 'lowercase' },
        { value: 'capitalize', label: 'Title Case' }
      ]},
      { key: 'prefix', label: 'Prefix', type: 'string', default: '' },
      { key: 'suffix', label: 'Suffix', type: 'string', default: '' }
    ],
    generator: (config) => `
(params) => {
  if (params.value == null) return '';
  let text = String(params.value);
  const transform = '${config.transform}';
  if (transform === 'uppercase') text = text.toUpperCase();
  else if (transform === 'lowercase') text = text.toLowerCase();
  else if (transform === 'capitalize') text = text.replace(/\\w\\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return '${config.prefix}' + text + '${config.suffix}';
}`
  }
];

const SAMPLE_DATA = {
  text: ['Sample Text', 'Hello World', 'Column Value'],
  number: [123.456, 1000, 0.85],
  date: ['2024-01-15', '2024-12-25', '2024-06-30'],
  boolean: [true, false, true]
};

export const ValueFormatterEditor: React.FC<ValueFormatterEditorProps> = ({
  open,
  onOpenChange,
  onSave,
  title,
  columnType = 'text'
}) => {
  const [activeTab, setActiveTab] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateConfig, setTemplateConfig] = useState<Record<string, unknown>>({});
  const [customCode, setCustomCode] = useState('');

  // Filter templates by column type
  const availableTemplates = useMemo(() => {
    return FORMATTER_TEMPLATES.filter(template => 
      template.type.includes(columnType) || template.type.includes('text')
    );
  }, [columnType]);

  const selectedTemplateObj = useMemo(() => {
    return availableTemplates.find(t => t.id === selectedTemplate);
  }, [availableTemplates, selectedTemplate]);

  // Initialize config when template changes
  useEffect(() => {
    if (selectedTemplateObj) {
      const defaultConfig: Record<string, unknown> = {};
      selectedTemplateObj.config.forEach(field => {
        defaultConfig[field.key] = field.default;
      });
      setTemplateConfig(defaultConfig);
    }
  }, [selectedTemplateObj]);

  // Generate formatter function
  const generateFormatter = () => {
    let code = '';
    if (activeTab === 'template' && selectedTemplateObj) {
      code = selectedTemplateObj.generator(templateConfig);
    } else {
      code = customCode;
    }

    try {
      // Create function from code string
      const func = new Function('return ' + code.trim())();
      return func;
    } catch (e) {
      console.error('Invalid formatter code:', e);
      return (params: { value: unknown }) => String(params.value || '');
    }
  };

  const currentFormatter = generateFormatter();

  // Generate preview data
  const previewData = useMemo(() => {
    const sampleValues = SAMPLE_DATA[columnType] || SAMPLE_DATA.text;
    return sampleValues.map(value => ({
      original: value,
      formatted: currentFormatter({ value })
    }));
  }, [currentFormatter, columnType]);

  const handleSave = () => {
    onSave(currentFormatter);
    onOpenChange(false);
  };

  const updateTemplateConfig = (key: string, value: unknown) => {
    setTemplateConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[700px] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-full overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="template">Template Builder</TabsTrigger>
                <TabsTrigger value="custom">Custom Code</TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="flex-1 overflow-auto m-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Select Template</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Choose a pre-built formatter template for {columnType} columns
                      </p>
                    </div>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground">{template.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplateObj && (
                    <div className="space-y-4">
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium">Configuration</Label>
                        <p className="text-xs text-muted-foreground mb-4">
                          Customize the template settings
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {selectedTemplateObj.config.map(field => (
                          <div key={field.key} className="space-y-2">
                            <Label className="text-sm">{field.label}</Label>
                            {field.type === 'string' && (
                              <Input
                                value={String(templateConfig[field.key] || '')}
                                onChange={(e) => updateTemplateConfig(field.key, e.target.value)}
                                placeholder={String(field.default)}
                              />
                            )}
                            {field.type === 'number' && (
                              <Input
                                type="number"
                                value={Number(templateConfig[field.key] || field.default)}
                                onChange={(e) => updateTemplateConfig(field.key, Number(e.target.value))}
                                min={0}
                                max={10}
                              />
                            )}
                            {field.type === 'boolean' && (
                              <Select
                                value={String(templateConfig[field.key] || field.default)}
                                onValueChange={(value) => updateTemplateConfig(field.key, value === 'true')}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {field.type === 'select' && field.options && (
                              <Select
                                value={String(templateConfig[field.key] || field.default)}
                                onValueChange={(value) => updateTemplateConfig(field.key, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="flex-1 m-4">
                <div className="space-y-4 h-full flex flex-col">
                  <div>
                    <Label className="text-sm font-medium">Custom Formatter Function</Label>
                    <p className="text-xs text-muted-foreground">
                      Write a custom JavaScript function. Receives params object with 'value' property.
                    </p>
                  </div>
                  <Editor
                    height="100%"
                    language="javascript"
                    theme="vs-dark"
                    value={customCode}
                    onChange={(value) => setCustomCode(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="w-[320px] border-l bg-muted/30 p-4 flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Live Preview</h3>
              <Badge variant="secondary" className="text-xs">
                {columnType} column
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground flex justify-between">
                <span>Original</span>
                <span>Formatted</span>
              </div>
              {previewData.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-2 bg-background rounded border">
                  <span className="font-mono text-muted-foreground truncate flex-1">
                    {JSON.stringify(item.original)}
                  </span>
                  <span className="ml-2 px-2 py-1 bg-primary/10 rounded font-mono truncate flex-1 text-right">
                    {item.formatted}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-2">Generated Code</h3>
              <div className="text-xs bg-muted p-3 rounded overflow-auto max-h-[200px] font-mono">
                <pre>
                  {activeTab === 'template' && selectedTemplateObj
                    ? selectedTemplateObj.generator(templateConfig)
                    : customCode || '// No code generated'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Formatter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};