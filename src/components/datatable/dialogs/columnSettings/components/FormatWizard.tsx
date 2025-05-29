import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Wand2,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Palette,
  Hash,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  Type,
  Braces,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Code,
  Settings2,
  ArrowUpDown,
  Filter,
  Layers,
  Star,
} from 'lucide-react';
import { createExcelFormatter } from '@/components/datatable/utils/formatters';
import { ValueFormatterParams } from 'ag-grid-community';

interface FormatWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFormat?: string;
  onApply: (format: string) => void;
}

interface FormatSection {
  type: 'number' | 'currency' | 'percentage' | 'date' | 'time' | 'text' | 'custom';
  prefix?: string;
  suffix?: string;
  decimals?: number;
  thousands?: boolean;
  color?: string;
  condition?: {
    operator: '>' | '<' | '>=' | '<=' | '=' | '<>';
    value: number;
  };
  customPattern?: string;
}


interface ConditionBuilderProps {
  onApply: (format: string) => void;
  initialValue?: string;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ onApply }) => {
  const [operator, setOperator] = useState('>');
  const [value, setValue] = useState('0');
  const [color, setColor] = useState('Green');
  const [useHex, setUseHex] = useState(false);
  const [hexColor, setHexColor] = useState('#00AA00');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [numberFormat, setNumberFormat] = useState('#,##0.00');

  const buildCondition = () => {
    let condition = '';
    if (operator && value) {
      condition = `[${operator}${value}]`;
    }
    const colorPart = useHex ? `[${hexColor}]` : color ? `[${color}]` : '';
    const prefixPart = prefix ? `"${prefix}"` : '';
    const suffixPart = suffix ? `"${suffix}"` : '';
    return condition + colorPart + prefixPart + numberFormat + suffixPart;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Operator</Label>
          <Select value={operator} onValueChange={setOperator}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=">">Greater than</SelectItem>
              <SelectItem value="<">Less than</SelectItem>
              <SelectItem value=">=">Greater or equal</SelectItem>
              <SelectItem value="<=">Less or equal</SelectItem>
              <SelectItem value="=">Equal to</SelectItem>
              <SelectItem value="<>">Not equal to</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Value</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Color</Label>
          <Switch
            checked={useHex}
            onCheckedChange={setUseHex}
            className="h-4 w-8"
          />
        </div>
        {useHex ? (
          <div className="flex gap-2">
            <Input
              type="color"
              value={hexColor}
              onChange={(e) => setHexColor(e.target.value)}
              className="w-16 h-8"
            />
            <Input
              value={hexColor}
              onChange={(e) => setHexColor(e.target.value)}
              className="h-8 flex-1"
            />
          </div>
        ) : (
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_COLORS.map(({ name, value }) => (
                <SelectItem key={value} value={value}>
                  <span style={{ color: value.toLowerCase() }}>{name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Prefix</Label>
          <Input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder='e.g., ▲ or $'
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Suffix</Label>
          <Input
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            placeholder="e.g., % or units"
            className="h-8"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Number Format</Label>
        <Input
          value={numberFormat}
          onChange={(e) => setNumberFormat(e.target.value)}
          className="h-8 font-mono"
        />
      </div>

      <div className="border-t pt-3">
        <div className="text-xs text-muted-foreground mb-1">Preview:</div>
        <code className="text-xs bg-muted px-2 py-1 rounded block">
          {buildCondition()}
        </code>
      </div>

      <Button
        size="sm"
        className="w-full"
        onClick={() => onApply(buildCondition())}
      >
        <Check className="h-3 w-3 mr-1" />
        Apply Condition
      </Button>
    </div>
  );
};

const PRESET_COLORS = [
  { name: 'Black', value: 'Black' },
  { name: 'Red', value: 'Red' },
  { name: 'Green', value: 'Green' },
  { name: 'Blue', value: 'Blue' },
  { name: 'Yellow', value: 'Yellow' },
  { name: 'Cyan', value: 'Cyan' },
  { name: 'Magenta', value: 'Magenta' },
  { name: 'White', value: 'White' },
];

const CURRENCY_SYMBOLS = [
  { symbol: '$', name: 'USD' },
  { symbol: '€', name: 'EUR' },
  { symbol: '£', name: 'GBP' },
  { symbol: '¥', name: 'JPY' },
  { symbol: '₹', name: 'INR' },
  { symbol: '₽', name: 'RUB' },
  { symbol: '₩', name: 'KRW' },
  { symbol: 'R$', name: 'BRL' },
];

const DATE_PATTERNS = [
  { pattern: 'MM/DD/YYYY', label: 'US Date' },
  { pattern: 'DD/MM/YYYY', label: 'UK Date' },
  { pattern: 'YYYY-MM-DD', label: 'ISO Date' },
  { pattern: 'MMM DD, YYYY', label: 'Medium Date' },
  { pattern: 'MMMM DD, YYYY', label: 'Long Date' },
  { pattern: 'DD-MMM-YY', label: 'Short Date' },
];

const TIME_PATTERNS = [
  { pattern: 'HH:mm', label: '24-hour' },
  { pattern: 'HH:mm:ss', label: '24-hour with seconds' },
  { pattern: 'hh:mm AM/PM', label: '12-hour' },
  { pattern: 'hh:mm:ss AM/PM', label: '12-hour with seconds' },
  { pattern: '[h]:mm', label: 'Elapsed hours' },
  { pattern: '[m]:ss', label: 'Elapsed minutes' },
];

export const FormatWizard: React.FC<FormatWizardProps> = ({
  open,
  onOpenChange,
  initialFormat = '',
  onApply,
}) => {
  const customFormatInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'simple' | 'conditional' | 'visual' | 'custom'>('simple');
  const [previewValue, setPreviewValue] = useState<number>(1234.56);
  const [showPreview, setShowPreview] = useState(true);

  // Simple format state
  const [formatType, setFormatType] = useState<FormatSection['type']>('number');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [decimals, setDecimals] = useState(2);
  const [useThousands, setUseThousands] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [datePattern, setDatePattern] = useState('MM/DD/YYYY');
  const [timePattern, setTimePattern] = useState('HH:mm');
  const [textColor, setTextColor] = useState('none');
  const [hexColor, setHexColor] = useState('#000000');
  const [useHexColor, setUseHexColor] = useState(false);

  // Conditional format state - removed as it's not being used

  // Custom format state
  const [customFormat, setCustomFormat] = useState(initialFormat);
  const [formatParts, setFormatParts] = useState<string[]>(['', '', '', '']);
  const [showConditionBuilder, setShowConditionBuilder] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  // Parse initial format if provided
  useMemo(() => {
    if (initialFormat && open) {
      // Try to parse the format string
      const parts = initialFormat.split(';');
      if (parts.length > 1) {
        setActiveTab('conditional');
        setFormatParts(parts);
      } else {
        setCustomFormat(initialFormat);
      }
    }
  }, [initialFormat, open]);

  // Build format string for simple mode
  const buildSimpleFormat = useCallback(() => {
    let format = '';
    const colorPrefix = (textColor !== 'none' ? textColor : '') || (useHexColor ? `[${hexColor}]` : '');

    switch (formatType) {
      case 'number':
        if (prefix) format += `"${prefix}"`;
        format += useThousands ? '#,##' : '';
        format += '0';
        if (decimals > 0) format += '.' + '0'.repeat(decimals);
        if (suffix) format += `"${suffix}"`;
        break;

      case 'currency':
        format += currencySymbol;
        format += useThousands ? '#,##' : '';
        format += '0';
        if (decimals > 0) format += '.' + '0'.repeat(decimals);
        break;

      case 'percentage':
        format += '0';
        if (decimals > 0) format += '.' + '0'.repeat(decimals);
        format += '%';
        break;

      case 'date':
        format = datePattern;
        break;

      case 'time':
        format = timePattern;
        break;

      case 'text':
        format = '@';
        break;
    }

    return colorPrefix + format;
  }, [formatType, prefix, suffix, decimals, useThousands, currencySymbol, datePattern, timePattern, textColor, useHexColor, hexColor]);

  // Build format string for conditional mode
  const buildConditionalFormat = useCallback(() => {
    const parts = formatParts.filter(part => part.trim() !== '');
    return parts.join(';');
  }, [formatParts]);

  // Visual indicator state
  const [indicatorType, setIndicatorType] = useState<'traffic-light' | 'arrows' | 'icons' | 'bars' | 'emoji' | 'custom'>('traffic-light');
  const [thresholdHigh, setThresholdHigh] = useState('80');
  const [thresholdLow, setThresholdLow] = useState('50');
  const [showValue, setShowValue] = useState(false);
  const [indicatorPosition, setIndicatorPosition] = useState<'before' | 'after' | 'replace'>('replace');

  // Build visual indicator format
  const buildVisualFormat = useCallback(() => {
    const high = thresholdHigh || '80';
    const low = thresholdLow || '50';
    
    let format = '';
    switch (indicatorType) {
      case 'traffic-light':
        format = `[>=${high}][Green]"●";[>=${low}][#FFA500]"●";[Red]"●"`;
        break;
      case 'arrows':
        format = `[>0][Green]"↑";[<0][Red]"↓";"→"`;
        break;
      case 'icons':
        format = `[>=${high}][Green]"✓";[>=${low}][#FFA500]"!";[Red]"✗"`;
        break;
      case 'bars':
        format = `[>=${high}][Green]"███";[>=${low}][#FFA500]"██";[Red]"█"`;
        break;
      case 'emoji':
        format = `[>=${high}]"🟢";[>=${low}]"🟡";"🔴"`;
        break;
    }

    // Add value display if requested
    if (showValue && indicatorType !== 'custom') {
      const parts = format.split(';');
      format = parts.map(part => {
        const match = part.match(/"([^"]+)"/);
        if (match) {
          if (indicatorPosition === 'before') {
            return part.replace(match[0], `${match[0]}" "#,##0.00`);
          } else if (indicatorPosition === 'after') {
            return part.replace(match[0], `#,##0.00" "${match[0]}`);
          }
        }
        return part;
      }).join(';');
    }

    return format;
  }, [indicatorType, thresholdHigh, thresholdLow, showValue, indicatorPosition]);

  // Get final format string
  const getFinalFormat = useCallback(() => {
    switch (activeTab) {
      case 'simple':
        return buildSimpleFormat();
      case 'conditional':
        return buildConditionalFormat();
      case 'visual':
        return buildVisualFormat();
      case 'custom':
        return customFormat;
      default:
        return '';
    }
  }, [activeTab, buildSimpleFormat, buildConditionalFormat, buildVisualFormat, customFormat]);

  // Preview formatter
  const previewFormatter = useMemo(() => {
    const format = getFinalFormat();
    if (!format) return null;
    try {
      return createExcelFormatter(format);
    } catch {
      return null;
    }
  }, [getFinalFormat]);

  const handleApply = () => {
    const format = getFinalFormat();
    if (format) {
      onApply(format);
      onOpenChange(false);
    }
  };

  const addFormatPart = () => {
    if (formatParts.length < 4) {
      setFormatParts([...formatParts, '']);
    }
  };

  const removeFormatPart = (index: number) => {
    if (formatParts.length > 1) {
      setFormatParts(formatParts.filter((_, i) => i !== index));
    }
  };

  const updateFormatPart = (index: number, value: string) => {
    const newParts = [...formatParts];
    newParts[index] = value;
    setFormatParts(newParts);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Format Wizard
          </DialogTitle>
          <DialogDescription>
            Build complex Excel-style format strings with an intuitive interface
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="simple">
                <Settings2 className="h-4 w-4 mr-2" />
                Simple
              </TabsTrigger>
              <TabsTrigger value="conditional">
                <Filter className="h-4 w-4 mr-2" />
                Conditional
              </TabsTrigger>
              <TabsTrigger value="visual">
                <Palette className="h-4 w-4 mr-2" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="custom">
                <Code className="h-4 w-4 mr-2" />
                Custom
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 grid grid-cols-[1fr,300px] gap-4 h-[450px]">
              <ScrollArea className="h-full">
                {/* Simple Format Tab */}
                <TabsContent value="simple" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Format Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={formatType} onValueChange={(v) => setFormatType(v as FormatSection['type'])}>
                        <div className="grid grid-cols-2 gap-3">
                          <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="number" />
                            <Hash className="h-4 w-4" />
                            <span>Number</span>
                          </Label>
                          <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="currency" />
                            <DollarSign className="h-4 w-4" />
                            <span>Currency</span>
                          </Label>
                          <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="percentage" />
                            <Percent className="h-4 w-4" />
                            <span>Percentage</span>
                          </Label>
                          <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="date" />
                            <Calendar className="h-4 w-4" />
                            <span>Date</span>
                          </Label>
                          <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="time" />
                            <Clock className="h-4 w-4" />
                            <span>Time</span>
                          </Label>
                          <Label className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="text" />
                            <Type className="h-4 w-4" />
                            <span>Text</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Number/Currency Options */}
                  {(formatType === 'number' || formatType === 'currency' || formatType === 'percentage') && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Number Options</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {formatType === 'currency' && (
                          <div className="space-y-2">
                            <Label>Currency Symbol</Label>
                            <Select value={currencySymbol} onValueChange={setCurrencySymbol}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CURRENCY_SYMBOLS.map(({ symbol, name }) => (
                                  <SelectItem key={symbol} value={symbol}>
                                    <span className="flex items-center gap-2">
                                      <span className="font-mono">{symbol}</span>
                                      <span className="text-muted-foreground">{name}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Decimal Places: {decimals}</Label>
                          <Slider
                            value={[decimals]}
                            onValueChange={([v]) => setDecimals(v)}
                            min={0}
                            max={8}
                            step={1}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="thousands"
                            checked={useThousands}
                            onCheckedChange={(checked) => setUseThousands(!!checked)}
                          />
                          <Label htmlFor="thousands">Use thousands separator</Label>
                        </div>

                        {formatType === 'number' && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <Label>Prefix</Label>
                              <Input
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value)}
                                placeholder="e.g., $ or USD "
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Suffix</Label>
                              <Input
                                value={suffix}
                                onChange={(e) => setSuffix(e.target.value)}
                                placeholder="e.g., USD or units"
                              />
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Date Options */}
                  {formatType === 'date' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Date Format</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup value={datePattern} onValueChange={setDatePattern}>
                          <div className="space-y-2">
                            {DATE_PATTERNS.map(({ pattern, label }) => (
                              <Label key={pattern} className="flex items-center space-x-2 cursor-pointer">
                                <RadioGroupItem value={pattern} />
                                <span className="flex-1">{label}</span>
                                <span className="text-sm text-muted-foreground font-mono">{pattern}</span>
                              </Label>
                            ))}
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  )}

                  {/* Time Options */}
                  {formatType === 'time' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Time Format</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup value={timePattern} onValueChange={setTimePattern}>
                          <div className="space-y-2">
                            {TIME_PATTERNS.map(({ pattern, label }) => (
                              <Label key={pattern} className="flex items-center space-x-2 cursor-pointer">
                                <RadioGroupItem value={pattern} />
                                <span className="flex-1">{label}</span>
                                <span className="text-sm text-muted-foreground font-mono">{pattern}</span>
                              </Label>
                            ))}
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  )}

                  {/* Color Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Color</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={useHexColor}
                          onCheckedChange={setUseHexColor}
                        />
                        <Label>Use custom hex color</Label>
                      </div>

                      {useHexColor ? (
                        <div className="space-y-2">
                          <Label>Hex Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={hexColor}
                              onChange={(e) => setHexColor(e.target.value)}
                              className="w-20 h-9"
                            />
                            <Input
                              value={hexColor}
                              onChange={(e) => setHexColor(e.target.value)}
                              placeholder="#000000"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Text Color</Label>
                          <Select value={textColor} onValueChange={setTextColor}>
                            <SelectTrigger>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {PRESET_COLORS.map(({ name, value }) => (
                                <SelectItem key={value} value={`[${value}]`}>
                                  <span style={{ color: value.toLowerCase() }}>{name}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Conditional Format Tab */}
                <TabsContent value="conditional" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Format Sections</CardTitle>
                      <CardDescription>
                        Define up to 4 sections: positive, negative, zero, and text
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {formatParts.map((part, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-20">
                              {index === 0 && 'Positive'}
                              {index === 1 && 'Negative'}
                              {index === 2 && 'Zero'}
                              {index === 3 && 'Text'}
                            </Badge>
                            {formatParts.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFormatPart(index)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <Input
                            value={part}
                            onChange={(e) => updateFormatPart(index, e.target.value)}
                            placeholder={`Format for ${
                              index === 0 ? 'positive numbers' :
                              index === 1 ? 'negative numbers' :
                              index === 2 ? 'zero' :
                              'text'
                            }`}
                            className="font-mono text-sm"
                          />
                        </div>
                      ))}
                      
                      {formatParts.length < 4 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addFormatPart}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Section
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Templates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[Green]#,##0.00', '[Red]#,##0.00', '0.00', '@'])}
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        Green positive, Red negative
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>100][Blue]#,##0', '[<0][Red]-#,##0', '#,##0', ''])}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Conditional colors with thresholds
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['"$"#,##0.00', '[Red]"-$"#,##0.00', '"-"', ''])}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Accounting format
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>=80][Green]"✓ "#,##0', '[>=50][#FFA500]"! "#,##0', '[Red]"✗ "#,##0', ''])}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Status indicators (✓ ! ✗)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>0][Green]"▲ "0.0"%"', '[<0][Red]"▼ "0.0"%"', '"→ "0.0"%"', ''])}
                      >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Trend arrows with percentage
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>=1000000]#,##0.0,,"M"', '[>=1000]#,##0.0,"K"', '#,##0', ''])}
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        Abbreviated numbers (K, M)
                      </Button>
                      <Separator className="my-2" />
                      <div className="text-xs text-muted-foreground mb-1">Emoji Formats</div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>100]"🟢"', '[>90]"🟡"', '"🔴"', ''])}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Emoji only (🟢 🟡 🔴)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>100]#,##0" 🟢"', '[>90]#,##0" 🟡"', '#,##0" 🔴"', ''])}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Value + emoji (100 🟢)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>100]"🟢 "#,##0', '[>90]"🟡 "#,##0', '"🔴 "#,##0', ''])}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Emoji + value (🟢 100)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>100]#,##0" (🟢)"', '[>90]#,##0" (🟡)"', '#,##0" (🔴)"', ''])}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        With parentheses (100 (🟢))
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>100]0"% 🟢"', '[>90]0"% 🟡"', '0"% 🔴"', ''])}
                      >
                        <Percent className="h-4 w-4 mr-2" />
                        Percentage + emoji (95% 🟡)
                      </Button>
                      <Separator className="my-2" />
                      <div className="text-xs text-muted-foreground mb-1">Unicode Symbols</div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>0][Green]"●"', '[<0][Red]"●"', '"●"', ''])}
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        Colored circles (● ● ●)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>0][Green]"▲"', '[<0][Red]"▼"', '"▬"', ''])}
                      >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Triangle arrows (▲ ▼ ▬)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>=4]"★★★★★"', '[>=3]"★★★★☆"', '[>=2]"★★★☆☆"', '[>=1]"★★☆☆☆";"★☆☆☆☆"'])}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        5-Star rating (★★★★☆)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>0][Green]"✓"', '[<0][Red]"✗"', '"○"', ''])}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Check/Cross marks (✓ ✗ ○)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>=80]"█████"', '[>=60]"████░"', '[>=40]"███░░"', '[>=20]"██░░░";"█░░░░"'])}
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        Progress bars (████░)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFormatParts(['[>0][#4169E1]"◆"', '[<0][#DC143C]"◇"', '"◈"', ''])}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Colored diamonds (◆ ◇ ◈)
                      </Button>
                      <div className="mt-3 p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded border border-blue-200/50 dark:border-blue-800/50">
                        <p className="text-xs text-muted-foreground">
                          <strong>💡 Color Tips:</strong> Use [Red], [Green], [Blue], or hex codes like [#FF0000]<br/>
                          <strong>📏 Size Tips:</strong> Symbol size inherits from the column's font size (set in Styling tab)
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Conditional Builder</CardTitle>
                      <CardDescription>
                        Build conditions visually
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!showConditionBuilder ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowConditionBuilder(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Open Condition Builder
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Build for section:</Label>
                            <Select
                              value={currentPartIndex.toString()}
                              onValueChange={(v) => setCurrentPartIndex(parseInt(v))}
                            >
                              <SelectTrigger className="h-7 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {formatParts.map((_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i === 0 ? 'Positive' : i === 1 ? 'Negative' : i === 2 ? 'Zero' : 'Text'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <ConditionBuilder
                            initialValue={formatParts[currentPartIndex]}
                            onApply={(condition) => {
                              updateFormatPart(currentPartIndex, condition);
                              setShowConditionBuilder(false);
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setShowConditionBuilder(false)}
                          >
                            Close Builder
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Visual Indicators Tab */}
                <TabsContent value="visual" className="mt-0 space-y-4">
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                    <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Visual Indicators
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Replace numeric values with visual indicators like traffic lights, arrows, or icons. 
                      Perfect for dashboards and status reports where visual cues are more important than exact values.
                    </p>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Visual Indicator Type</CardTitle>
                      <CardDescription>
                        Replace numbers with visual indicators based on value thresholds
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={indicatorType} onValueChange={(v) => setIndicatorType(v as typeof indicatorType)}>
                        <div className="space-y-3">
                          <Label className="flex items-start space-x-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                            <RadioGroupItem value="traffic-light" className="mt-1" />
                            <div className="flex-1">
                              <div className="font-medium">Traffic Lights</div>
                              <div className="text-xs text-muted-foreground">Green ●, Amber ●, Red ●</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Example: Score ≥ 80 = <span className="text-green-500">●</span>, ≥ 50 = <span className="text-amber-500">●</span>, {'<'} 50 = <span className="text-red-500">●</span>
                              </div>
                            </div>
                          </Label>
                          <Label className="flex items-start space-x-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                            <RadioGroupItem value="arrows" className="mt-1" />
                            <div className="flex-1">
                              <div className="font-medium">Trend Arrows</div>
                              <div className="text-xs text-muted-foreground">Up ↑, Down ↓, Flat →</div>
                              <div className="text-xs text-muted-foreground mt-1">Example: Positive = ↑, Negative = ↓, Zero = →</div>
                            </div>
                          </Label>
                          <Label className="flex items-start space-x-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                            <RadioGroupItem value="icons" className="mt-1" />
                            <div className="flex-1">
                              <div className="font-medium">Status Icons</div>
                              <div className="text-xs text-muted-foreground">Check ✓, Warning !, Cross ✗</div>
                              <div className="text-xs text-muted-foreground mt-1">Example: Pass = ✓, Warning = !, Fail = ✗</div>
                            </div>
                          </Label>
                          <Label className="flex items-start space-x-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                            <RadioGroupItem value="bars" className="mt-1" />
                            <div className="flex-1">
                              <div className="font-medium">Progress Bars</div>
                              <div className="text-xs text-muted-foreground">Full ███, Medium ██, Low █</div>
                              <div className="text-xs text-muted-foreground mt-1">Example: High = ███, Medium = ██, Low = █</div>
                            </div>
                          </Label>
                          <Label className="flex items-start space-x-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                            <RadioGroupItem value="emoji" className="mt-1" />
                            <div className="flex-1">
                              <div className="font-medium">Emoji Circles</div>
                              <div className="text-xs text-muted-foreground">Green 🟢, Yellow 🟡, Red 🔴</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Example: Score ≥ 80 = 🟢, ≥ 50 = 🟡, {'<'} 50 = 🔴
                              </div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {indicatorType !== 'arrows' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Thresholds</CardTitle>
                        <CardDescription>
                          Set the value thresholds for each indicator level
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">High Threshold (≥)</Label>
                            <Input
                              type="number"
                              value={thresholdHigh}
                              onChange={(e) => setThresholdHigh(e.target.value)}
                              className="h-8"
                              placeholder="80"
                            />
                            <p className="text-xs text-muted-foreground">Values ≥ this show green/high</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Low Threshold (≥)</Label>
                            <Input
                              type="number"
                              value={thresholdLow}
                              onChange={(e) => setThresholdLow(e.target.value)}
                              className="h-8"
                              placeholder="50"
                            />
                            <p className="text-xs text-muted-foreground">Values ≥ this show amber/medium</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground border-t pt-2">
                          Values below the low threshold show red/low indicator
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Display Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-value"
                          checked={showValue}
                          onCheckedChange={(checked) => setShowValue(!!checked)}
                        />
                        <Label htmlFor="show-value" className="text-sm font-normal">
                          Also show the numeric value
                        </Label>
                      </div>
                      
                      {showValue && (
                        <div className="space-y-2 pl-6">
                          <Label className="text-xs">Value Position</Label>
                          <RadioGroup value={indicatorPosition} onValueChange={(v) => setIndicatorPosition(v as typeof indicatorPosition)}>
                            <div className="space-y-2">
                              <Label className="flex items-center space-x-2 cursor-pointer">
                                <RadioGroupItem value="before" />
                                <span className="text-sm">Before indicator (e.g., "85 ●")</span>
                              </Label>
                              <Label className="flex items-center space-x-2 cursor-pointer">
                                <RadioGroupItem value="after" />
                                <span className="text-sm">After indicator (e.g., "● 85")</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Common Examples</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setIndicatorType('traffic-light');
                          setThresholdHigh('80');
                          setThresholdLow('50');
                          setShowValue(false);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>Score Traffic Light (80/50)</span>
                          <span className="font-mono">
                            <span className="text-green-500">●</span>{' '}
                            <span className="text-amber-500">●</span>{' '}
                            <span className="text-red-500">●</span>
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setIndicatorType('icons');
                          setThresholdHigh('90');
                          setThresholdLow('70');
                          setShowValue(false);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>Pass/Warning/Fail (90/70)</span>
                          <span className="font-mono">✓ ! ✗</span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setIndicatorType('arrows');
                          setShowValue(true);
                          setIndicatorPosition('before');
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>Change with Value</span>
                          <span className="font-mono">+5.2% ↑</span>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Custom Format Tab */}
                <TabsContent value="custom" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custom Format String</CardTitle>
                      <CardDescription>
                        Enter your Excel format string directly
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        ref={customFormatInputRef}
                        value={customFormat}
                        onChange={(e) => setCustomFormat(e.target.value)}
                        placeholder='e.g., [Green]"▲"#,##0.00;[Red]"▼"#,##0.00'
                        className="font-mono"
                      />
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Quick Insert</Label>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: 'Thousands', value: '#,##0' },
                            { label: 'Decimals', value: '0.00' },
                            { label: 'Percentage', value: '0%' },
                            { label: 'Currency', value: '$#,##0.00' },
                            { label: 'Red', value: '[Red]' },
                            { label: 'Green', value: '[Green]' },
                            { label: 'Blue', value: '[Blue]' },
                            { label: 'Condition', value: '[>0]' },
                            { label: 'Semicolon', value: ';' },
                            { label: 'Quote', value: '""' },
                            { label: 'Up Arrow', value: '"▲"' },
                            { label: 'Down Arrow', value: '"▼"' },
                            { label: 'Check', value: '"✓"' },
                            { label: 'Cross', value: '"✗"' },
                            { label: '🟢', value: '"🟢"' },
                            { label: '🟡', value: '"🟡"' },
                            { label: '🔴', value: '"🔴"' },
                          ].map(({ label, value }) => (
                            <Button
                              key={label}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                // Simple append to the end
                                setCustomFormat(customFormat + value);
                              }}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Advanced Patterns</Label>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start h-7 text-xs"
                            onClick={() => setCustomFormat('[>=1000000]#,##0.0,,"M";[>=1000]#,##0.0,"K";#,##0')}
                          >
                            <Layers className="h-3 w-3 mr-2" />
                            Abbreviated (1.2M, 500K)
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start h-7 text-xs"
                            onClick={() => setCustomFormat('[>0][Green]"▲ "+0.0%;[<0][Red]"▼ "0.0%;"→ "0.0%')}
                          >
                            <ArrowUpDown className="h-3 w-3 mr-2" />
                            Change indicators
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start h-7 text-xs"
                            onClick={() => setCustomFormat('[>=90][Green]"●";[>=70][#FFA500]"●";[Red]"●"')}
                          >
                            <Palette className="h-3 w-3 mr-2" />
                            Traffic lights
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start h-7 text-xs"
                            onClick={() => setCustomFormat('[h]:mm:ss')}
                          >
                            <Clock className="h-3 w-3 mr-2" />
                            Elapsed time
                          </Button>
                          <Separator className="my-1" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start h-7 text-xs"
                            onClick={() => setCustomFormat('[>100]"🟢";[>90]"🟡";"🔴"')}
                          >
                            <Sparkles className="h-3 w-3 mr-2" />
                            Emoji status (🟢 🟡 🔴)
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start h-7 text-xs"
                            onClick={() => setCustomFormat('[>100]#,##0" 🟢";[>90]#,##0" 🟡";#,##0" 🔴"')}
                          >
                            <Sparkles className="h-3 w-3 mr-2" />
                            Value + emoji (100 🟢)
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start h-7 text-xs"
                            onClick={() => setCustomFormat('[>100]"🟢 "#,##0;[>90]"🟡 "#,##0;"🔴 "#,##0')}
                          >
                            <Sparkles className="h-3 w-3 mr-2" />
                            Emoji + value (🟢 100)
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Syntax Reference</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1">
                      <p><code className="bg-muted px-1">0</code> - Required digit</p>
                      <p><code className="bg-muted px-1">#</code> - Optional digit</p>
                      <p><code className="bg-muted px-1">,</code> - Thousands separator</p>
                      <p><code className="bg-muted px-1">.</code> - Decimal point</p>
                      <p><code className="bg-muted px-1">%</code> - Percentage</p>
                      <p><code className="bg-muted px-1">"text"</code> - Literal text</p>
                      <p><code className="bg-muted px-1">[Color]</code> - Text color</p>
                      <p><code className="bg-muted px-1">[condition]</code> - Conditional format</p>
                      <p><code className="bg-muted px-1">;</code> - Section separator</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>

              {/* Preview Panel */}
              <div className="border-l pl-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Preview</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-7 w-7 p-0"
                  >
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {showPreview && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Test Value</Label>
                      <Input
                        type="number"
                        value={previewValue}
                        onChange={(e) => setPreviewValue(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="h-8"
                      />
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs">Format String</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                          {getFinalFormat() || 'No format defined'}
                        </code>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs">Preview Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {activeTab === 'visual' ? (
                          <>
                            <div className="text-xs text-muted-foreground mb-2">
                              Test different values to see indicators:
                            </div>
                            {indicatorType !== 'arrows' ? (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs">High (≥{thresholdHigh || '80'})</span>
                                  <span className="font-mono text-lg">
                                    {previewFormatter ? previewFormatter({ value: parseFloat(thresholdHigh || '80') + 10 } as ValueFormatterParams) : ''}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs">Medium (≥{thresholdLow || '50'})</span>
                                  <span className="font-mono text-lg">
                                    {previewFormatter ? previewFormatter({ value: parseFloat(thresholdLow || '50') + 10 } as ValueFormatterParams) : ''}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs">Low ({'<'}{thresholdLow || '50'})</span>
                                  <span className="font-mono text-lg">
                                    {previewFormatter ? previewFormatter({ value: parseFloat(thresholdLow || '50') - 10 } as ValueFormatterParams) : ''}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs">Positive</span>
                                  <span className="font-mono text-lg">
                                    {previewFormatter ? previewFormatter({ value: 10 } as ValueFormatterParams) : ''}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs">Negative</span>
                                  <span className="font-mono text-lg">
                                    {previewFormatter ? previewFormatter({ value: -10 } as ValueFormatterParams) : ''}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs">Zero</span>
                                  <span className="font-mono text-lg">
                                    {previewFormatter ? previewFormatter({ value: 0 } as ValueFormatterParams) : ''}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs">Your value ({previewValue})</span>
                                <span className="font-mono text-lg">
                                  {previewFormatter ? previewFormatter({ value: previewValue } as ValueFormatterParams) : previewValue}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">Positive</p>
                              <p className="font-mono text-sm">
                                {previewFormatter
                                  ? previewFormatter({ value: Math.abs(previewValue) } as ValueFormatterParams)
                                  : Math.abs(previewValue)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Negative</p>
                              <p className="font-mono text-sm">
                                {previewFormatter
                                  ? previewFormatter({ value: -Math.abs(previewValue) } as ValueFormatterParams)
                                  : -Math.abs(previewValue)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Zero</p>
                              <p className="font-mono text-sm">
                                {previewFormatter
                                  ? previewFormatter({ value: 0 } as ValueFormatterParams)
                                  : '0'}
                              </p>
                            </div>
                            {activeTab === 'conditional' && formatParts.length > 3 && formatParts[3] && (
                              <div>
                                <p className="text-xs text-muted-foreground">Text</p>
                                <p className="font-mono text-sm">
                                  {previewFormatter
                                    ? previewFormatter({ value: 'Sample' } as ValueFormatterParams)
                                    : 'Sample'}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!getFinalFormat()}>
            <Check className="h-4 w-4 mr-2" />
            Apply Format
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

FormatWizard.displayName = 'FormatWizard';