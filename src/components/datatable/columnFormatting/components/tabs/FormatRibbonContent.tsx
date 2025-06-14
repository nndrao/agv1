import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InputNumber } from '@/components/ui/input-number';
import { Switch } from '@/components/ui/switch';
import { 
  Hash,
  DollarSign,
  Percent,
  Calendar,
  Type,
  Sparkles,
  X,
  HelpCircle,
  Smile,
  FileText,
  Palette
} from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { createExcelFormatter, createCellStyleFunction } from '@/components/datatable/utils/formatters';
import type { FormatTabProps } from '../../types';
import '../../ribbon-styles.css';

type FormatMode = 'standard' | 'custom';

interface StandardFormat {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultFormat: string;
  controls: 'number' | 'currency' | 'percentage' | 'date' | 'text';
}

interface CustomFormat {
  label: string;
  format: string;
  example: string;
  category: 'conditional' | 'visual' | 'rating' | 'indicator';
}

// Standard formatter options
const standardFormats: StandardFormat[] = [
  { key: 'number', label: 'Number', icon: Hash, defaultFormat: '#,##0.00', controls: 'number' },
  { key: 'currency', label: 'Currency', icon: DollarSign, defaultFormat: '$#,##0.00', controls: 'currency' },
  { key: 'percentage', label: 'Percentage', icon: Percent, defaultFormat: '0.00%', controls: 'percentage' },
  { key: 'date', label: 'Date', icon: Calendar, defaultFormat: 'MM/DD/YYYY', controls: 'date' },
  { key: 'text', label: 'Text', icon: Type, defaultFormat: '@', controls: 'text' },
];

// Custom formatter templates
const customFormats: CustomFormat[] = [
  // Conditional Formatting
  { 
    label: 'Traffic Lights', 
    format: '[Red][<50]0;[Yellow][<80]0;[Green]0', 
    example: '🔴 45 → 🟡 75 → 🟢 95',
    category: 'conditional'
  },
  { 
    label: 'Pass/Fail', 
    format: '[Green][>=60]"✓ PASS";[Red]"✗ FAIL"', 
    example: '✓ PASS (75) or ✗ FAIL (45)',
    category: 'conditional'
  },
  { 
    label: 'Temperature', 
    format: '[Blue][<32]0°F ❄️;[Red][>80]0°F 🔥;0°F', 
    example: '30°F ❄️, 85°F 🔥',
    category: 'conditional'
  },
  
  // Visual Indicators
  { 
    label: 'Progress Bar', 
    format: '[<25]▰▱▱▱;[<50]▰▰▱▱;[<75]▰▰▰▱;▰▰▰▰', 
    example: '▰▰▱▱ (50%)',
    category: 'visual'
  },
  { 
    label: 'Data Bars', 
    format: '[<20]█_____;[<40]██____;[<60]███___;[<80]████__;█████', 
    example: '███___ (60%)',
    category: 'visual'
  },
  { 
    label: 'Trend Arrows', 
    format: '[Red][<0]↓ 0.0%;[Green][>0]↑ 0.0%;→ 0.0%', 
    example: '↓ -5.2%, ↑ 3.1%',
    category: 'visual'
  },
  
  // Rating Systems
  { 
    label: 'Star Rating', 
    format: '[<1]☆☆☆☆☆;[<2]★☆☆☆☆;[<3]★★☆☆☆;[<4]★★★☆☆;[<5]★★★★☆;★★★★★', 
    example: '★★★☆☆ (3.5)',
    category: 'rating'
  },
  { 
    label: 'Score Grade', 
    format: '[Red][<60]0 "F";[Orange][<70]0 "D";[Yellow][<80]0 "C";[Blue][<90]0 "B";[Green]0 "A"', 
    example: '95 A, 75 C, 55 F',
    category: 'rating'
  },
  
  // Status Indicators
  { 
    label: 'Emoji Status', 
    format: '[<0]😟 0;[=0]😐 0;😊 0', 
    example: '😟 -5, 😐 0, 😊 10',
    category: 'indicator'
  },
  { 
    label: 'Check/Cross', 
    format: '[=1]✓;[=0]✗;0', 
    example: '✓ Yes, ✗ No',
    category: 'indicator'
  },
  { 
    label: 'Currency +/-', 
    format: '[Red]($0.00);[Green]$0.00;"Break Even"', 
    example: '($100), $100',
    category: 'indicator'
  },
];

// Date format options
const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/31/2023' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '31/12/2023' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2023-12-31' },
  { value: 'MMM D, YYYY', label: 'MMM D, YYYY', example: 'Dec 31, 2023' },
  { value: 'MMMM D, YYYY', label: 'MMMM D, YYYY', example: 'December 31, 2023' },
  { value: 'D MMM YYYY', label: 'D MMM YYYY', example: '31 Dec 2023' },
  { value: 'MM/DD/YY', label: 'MM/DD/YY', example: '12/31/23' },
  { value: 'h:mm AM/PM', label: 'h:mm AM/PM', example: '3:45 PM' },
  { value: 'HH:mm:ss', label: 'HH:mm:ss', example: '15:45:30' },
  { value: 'MM/DD/YY h:mm AM/PM', label: 'DateTime', example: '12/31/23 3:45 PM' },
];

// Currency symbols
const currencySymbols = [
  { value: '$', label: '$ (USD)' },
  { value: '€', label: '€ (EUR)' },
  { value: '£', label: '£ (GBP)' },
  { value: '¥', label: '¥ (JPY)' },
  { value: '₹', label: '₹ (INR)' },
  { value: 'C$', label: 'C$ (CAD)' },
  { value: 'A$', label: 'A$ (AUD)' },
  { value: 'Fr.', label: 'Fr. (CHF)' },  // Changed from CHF to Fr. to avoid rendering issue
  { value: 'kr', label: 'kr (SEK)' },
  { value: 'R$', label: 'R$ (BRL)' },
];

// Common emoji for quick insertion
const commonEmoji = [
  { emoji: '✓', name: 'Check' },
  { emoji: '✗', name: 'Cross' },
  { emoji: '★', name: 'Star' },
  { emoji: '☆', name: 'Empty Star' },
  { emoji: '●', name: 'Circle' },
  { emoji: '○', name: 'Empty Circle' },
  { emoji: '▲', name: 'Up Triangle' },
  { emoji: '▼', name: 'Down Triangle' },
  { emoji: '→', name: 'Right Arrow' },
  { emoji: '↑', name: 'Up Arrow' },
  { emoji: '↓', name: 'Down Arrow' },
  { emoji: '⚠', name: 'Warning' },
  { emoji: '🔴', name: 'Red Circle' },
  { emoji: '🟡', name: 'Yellow Circle' },
  { emoji: '🟢', name: 'Green Circle' },
  { emoji: '📈', name: 'Chart Up' },
  { emoji: '📉', name: 'Chart Down' },
  { emoji: '💰', name: 'Money' },
  { emoji: '🔥', name: 'Fire' },
  { emoji: '❄️', name: 'Snowflake' },
];

export const FormatRibbonContent: React.FC<FormatTabProps> = ({ 
  selectedColumns,
  formatCategory,
  setFormatCategory,
  currentFormat,
  setCurrentFormat,
  setShowConditionalDialog
}) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnFormattingStore();
  const [formatMode, setFormatMode] = useState<FormatMode>('standard');
  const [selectedStandardFormat, setSelectedStandardFormat] = useState<string>('number');
  const [selectedCustomFormat, setSelectedCustomFormat] = useState<string>('');
  
  // Standard format controls
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [multiplyBy100, setMultiplyBy100] = useState(true);
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  
  // Format modifiers
  const [useThousandsSeparator, setUseThousandsSeparator] = useState(true);
  const [useColorForSign, setUseColorForSign] = useState(false);
  
  // Preview
  const [testValue, setTestValue] = useState('1234.56');
  const [previewResult, setPreviewResult] = useState('');

  // Helper to get mixed values for multi-column editing
  const getMixedValueLocal = (property: string) => {
    const values = new Set();
    const allValues: unknown[] = [];

    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);

      // Check pending changes first, then fall back to column definition
      let value;
      if (pendingChange && property in pendingChange) {
        value = pendingChange[property as keyof typeof pendingChange];
      } else if (colDef) {
        value = colDef[property as keyof typeof colDef];
      }

      values.add(value);
      allValues.push(value);
    });

    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true, values: allValues };
  };

  // Build format string based on current settings
  const buildFormatString = useCallback(() => {
    if (formatMode === 'custom') {
      return currentFormat;
    }

    const format = standardFormats.find(f => f.key === selectedStandardFormat);
    if (!format) return '';

    let formatString = format.defaultFormat;

    switch (format.controls) {
      case 'number':
        // Build base format with or without thousands separator
        const numberSeparator = useThousandsSeparator ? ',' : '';
        if (decimalPlaces === 0) {
          formatString = useThousandsSeparator ? '#,##0' : '0';
        } else {
          formatString = useThousandsSeparator ? `#,##0.${'0'.repeat(decimalPlaces)}` : `0.${'0'.repeat(decimalPlaces)}`;
        }
        
        // Add prefix/suffix
        if (prefix) formatString = `"${prefix}"${formatString}`;
        if (suffix) formatString = `${formatString}"${suffix}"`;
        
        // Add color for positive/negative if enabled
        if (useColorForSign) {
          formatString = `[Green]${formatString};[Red]-${formatString}`;
        }
        break;

      case 'currency':
        // Build base format with or without thousands separator
        const currencyBaseFormat = decimalPlaces === 0 
          ? (useThousandsSeparator ? '#,##0' : '0')
          : (useThousandsSeparator ? `#,##0.${'0'.repeat(decimalPlaces)}` : `0.${'0'.repeat(decimalPlaces)}`);
        
        // Apply currency symbol with space
        if (currencySymbol === 'kr') {
          formatString = `${currencyBaseFormat} "${currencySymbol}"`;
        } else {
          // Add space between currency symbol and number for all currencies
          // Wrap currency symbol in quotes to prevent it from being interpreted as format code
          formatString = `"${currencySymbol}" ${currencyBaseFormat}`;
        }
        
        // Add color for positive/negative if enabled
        if (useColorForSign) {
          // For currency, handle negative with parentheses and colors
          const negativeFormat = currencySymbol === 'kr' 
            ? `-${currencyBaseFormat} "${currencySymbol}"`
            : `"${currencySymbol}" -${currencyBaseFormat}`;
          formatString = `[Green]${formatString};[Red]${negativeFormat}`;
        }
        
        // Debug CHF/Fr. issue
        if (currencySymbol === 'Fr.' || currencySymbol === 'CHF') {
          console.log('[DEBUG Swiss Franc] Currency symbol:', currencySymbol);
          console.log('[DEBUG Swiss Franc] Format string:', formatString);
          console.log('[DEBUG Swiss Franc] Characters:', formatString.split('').map((c, i) => `[${i}:${c}:${c.charCodeAt(0)}]`).join(''));
        }
        break;

      case 'percentage':
        // Build base format with or without thousands separator
        const percentBaseFormat = decimalPlaces === 0 
          ? (useThousandsSeparator ? '#,##0%' : '0%')
          : (useThousandsSeparator ? `#,##0.${'0'.repeat(decimalPlaces)}%` : `0.${'0'.repeat(decimalPlaces)}%`);
        
        formatString = percentBaseFormat;
        
        // Add color for positive/negative if enabled
        if (useColorForSign) {
          formatString = `[Green]${formatString};[Red]-${formatString}`;
        }
        // Note: multiplyBy100 is handled by the formatter, not the format string
        break;

      case 'date':
        formatString = dateFormat;
        break;

      case 'text':
        // Text format is just '@'
        break;
    }

    return formatString;
  }, [formatMode, selectedStandardFormat, decimalPlaces, prefix, suffix, currencySymbol, dateFormat, currentFormat, useThousandsSeparator, useColorForSign]);

  // Apply format to selected columns
  const applyFormat = useCallback(() => {
    const formatString = buildFormatString();
    if (!formatString) return;

    console.log('[FormatRibbonContent] Applying format:', {
      formatMode,
      selectedStandardFormat,
      formatString,
      currencySymbol,
      decimalPlaces,
      formatStringChars: formatString.split('').map(c => `${c}(${c.charCodeAt(0)})`).join('')
    });

    // Create the formatter function
    let formatter;
    if (formatMode === 'standard' && selectedStandardFormat === 'percentage' && !multiplyBy100) {
      // For percentage format with multiplyBy100 disabled, wrap the formatter
      const baseFormatter = createExcelFormatter(formatString);
      formatter = (params: any) => {
        // Multiply by 100 before formatting since the value is already in decimal form
        const adjustedParams = { ...params, value: params.value * 100 };
        return baseFormatter(adjustedParams);
      };
    } else {
      formatter = createExcelFormatter(formatString);
    }
    updateBulkProperty('valueFormatter', formatter);

    // Check if we need to create/update cellStyle for conditional formatting
    const hasConditionalStyling = formatString.match(/\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right|#[0-9A-Fa-f]{3,6}|Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|Magenta|Cyan)/i);
    
    if (hasConditionalStyling) {
      const existingCellStyle = getMixedValueLocal('cellStyle');
      if (!existingCellStyle.isMixed) {
        let baseStyle: React.CSSProperties | undefined;
        
        // Check for pending cellStyle changes
        const pendingCellStyle = selectedColumns.size > 0 ? 
          (() => {
            const firstColId = Array.from(selectedColumns)[0];
            const pending = pendingChanges.get(firstColId);
            return pending?.cellStyle;
          })() : undefined;
        
        if (pendingCellStyle) {
          if (typeof pendingCellStyle === 'object') {
            baseStyle = pendingCellStyle;
          } else if (typeof pendingCellStyle === 'function') {
            const metadata = (pendingCellStyle as any).__baseStyle;
            if (metadata) {
              baseStyle = metadata;
            }
          }
        } else if (existingCellStyle.value) {
          if (typeof existingCellStyle.value === 'object') {
            baseStyle = existingCellStyle.value;
          } else if (typeof existingCellStyle.value === 'function') {
            const metadata = (existingCellStyle.value as any).__baseStyle;
            if (metadata) {
              baseStyle = metadata;
            }
          }
        }
        
        const cellStyleFn = createCellStyleFunction(formatString, baseStyle);
        updateBulkProperty('cellStyle', cellStyleFn);
      }
    }
  }, [buildFormatString, updateBulkProperty, selectedColumns, columnDefinitions, pendingChanges]);

  // Update preview when format changes
  useEffect(() => {
    const formatString = buildFormatString();
    setCurrentFormat(formatString);
    
    if (formatString) {
      try {
        const formatter = createExcelFormatter(formatString);
        const result = formatter({ value: testValue });
        setPreviewResult(result || '');
      } catch (error) {
        setPreviewResult('Error in format');
      }
    } else {
      setPreviewResult('');
    }
  }, [buildFormatString, testValue, setCurrentFormat]);

  // Apply format immediately when settings change
  useEffect(() => {
    if (selectedColumns.size > 0) {
      applyFormat();
    }
  }, [selectedStandardFormat, decimalPlaces, prefix, suffix, currencySymbol, multiplyBy100, dateFormat, formatMode, currentFormat, useThousandsSeparator, useColorForSign]);

  // Clear format
  const clearFormat = useCallback(() => {
    setCurrentFormat('');
    updateBulkProperty('valueFormatter', undefined);
    
    // Check if we need to preserve base styles but remove conditional formatting
    const existingCellStyle = getMixedValueLocal('cellStyle');
    
    if (existingCellStyle.value && typeof existingCellStyle.value === 'function') {
      const formatString = (existingCellStyle.value as any).__formatString;
      const baseStyle = (existingCellStyle.value as any).__baseStyle;
      
      if (formatString && baseStyle && Object.keys(baseStyle).length > 0) {
        // Preserve base styles but remove conditional formatting
        updateBulkProperty('cellStyle', baseStyle);
      } else if (formatString && (!baseStyle || Object.keys(baseStyle).length === 0)) {
        // Only had conditional formatting, clear cellStyle entirely
        updateBulkProperty('cellStyle', undefined);
      }
    }
  }, [updateBulkProperty, selectedColumns, columnDefinitions, pendingChanges]);

  // Insert emoji at cursor position
  const insertEmoji = (emoji: string) => {
    if (formatMode === 'custom') {
      const input = document.querySelector('.custom-format-input') as HTMLInputElement;
      if (input) {
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newValue = currentFormat.slice(0, start) + emoji + currentFormat.slice(end);
        setCurrentFormat(newValue);
        // Set cursor position after emoji
        setTimeout(() => {
          input.selectionStart = input.selectionEnd = start + emoji.length;
          input.focus();
        }, 0);
      }
    }
  };

  const selectedFormat = standardFormats.find(f => f.key === selectedStandardFormat);

  return (
    <div className="flex flex-col gap-3">
      {/* Format Mode Toggle */}
      <div className="flex items-center justify-between">
        <ToggleGroup 
          type="single" 
          value={formatMode}
          onValueChange={(value) => value && setFormatMode(value as FormatMode)}
          className="flex"
        >
          <ToggleGroupItem value="standard" className="ribbon-toggle-group-item">
            <Palette className="ribbon-icon-xs mr-1" />
            Standard
          </ToggleGroupItem>
          <ToggleGroupItem value="custom" className="ribbon-toggle-group-item">
            <Sparkles className="ribbon-icon-xs mr-1" />
            Custom
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs text-orange-600 dark:text-orange-400"
            onClick={clearFormat}
            title="Clear format"
          >
            <X className="ribbon-icon-xs mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <Separator />

      {/* Standard Format Controls */}
      {formatMode === 'standard' && (
        <div className="space-y-3">
          {/* Format Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium w-20">Format:</span>
            <Select
              value={selectedStandardFormat}
              onValueChange={setSelectedStandardFormat}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {standardFormats.map(format => {
                  const Icon = format.icon;
                  return (
                    <SelectItem key={format.key} value={format.key} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3 h-3" />
                        {format.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Context-specific controls */}
          {selectedFormat?.controls === 'number' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Decimals:</span>
                <InputNumber
                  value={decimalPlaces}
                  onChange={(value) => setDecimalPlaces(value || 0)}
                  min={0}
                  max={10}
                  className="h-8 w-20 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Prefix:</span>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g., $"
                  className="h-8 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Suffix:</span>
                <Input
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="e.g., USD"
                  className="h-8 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Modifiers:</span>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="number-thousands-sep"
                      checked={useThousandsSeparator}
                      onCheckedChange={setUseThousandsSeparator}
                    />
                    <label
                      htmlFor="number-thousands-sep"
                      className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Thousands separator
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="number-color-sign"
                      checked={useColorForSign}
                      onCheckedChange={setUseColorForSign}
                    />
                    <label
                      htmlFor="number-color-sign"
                      className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      +/- colors
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedFormat?.controls === 'currency' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Symbol:</span>
                <Select
                  value={currencySymbol}
                  onValueChange={setCurrencySymbol}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencySymbols.map(symbol => (
                      <SelectItem key={symbol.value} value={symbol.value} className="text-xs">
                        {symbol.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Decimals:</span>
                <InputNumber
                  value={decimalPlaces}
                  onChange={(value) => setDecimalPlaces(value || 0)}
                  min={0}
                  max={10}
                  className="h-8 w-20 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Modifiers:</span>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="currency-thousands-sep"
                      checked={useThousandsSeparator}
                      onCheckedChange={setUseThousandsSeparator}
                    />
                    <label
                      htmlFor="currency-thousands-sep"
                      className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Thousands separator
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="currency-color-sign"
                      checked={useColorForSign}
                      onCheckedChange={setUseColorForSign}
                    />
                    <label
                      htmlFor="currency-color-sign"
                      className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      +/- colors
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedFormat?.controls === 'percentage' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Decimals:</span>
                <InputNumber
                  value={decimalPlaces}
                  onChange={(value) => setDecimalPlaces(value || 0)}
                  min={0}
                  max={10}
                  className="h-8 w-20 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Multiply:</span>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="percentage-multiply"
                    checked={multiplyBy100}
                    onCheckedChange={setMultiplyBy100}
                  />
                  <label
                    htmlFor="percentage-multiply"
                    className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Multiply by 100
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-20">Modifiers:</span>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="percentage-thousands-sep"
                      checked={useThousandsSeparator}
                      onCheckedChange={setUseThousandsSeparator}
                    />
                    <label
                      htmlFor="percentage-thousands-sep"
                      className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Thousands separator
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="percentage-color-sign"
                      checked={useColorForSign}
                      onCheckedChange={setUseColorForSign}
                    />
                    <label
                      htmlFor="percentage-color-sign"
                      className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      +/- colors
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedFormat?.controls === 'date' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium w-20">Format:</span>
              <Select
                value={dateFormat}
                onValueChange={setDateFormat}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map(format => (
                    <SelectItem key={format.value} value={format.value} className="text-xs">
                      <div className="flex justify-between items-center w-full">
                        <span>{format.label}</span>
                        <span className="text-muted-foreground ml-2">{format.example}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Custom Format Controls */}
      {formatMode === 'custom' && (
        <div className="space-y-3">
          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium w-20">Template:</span>
            <Select
              value={selectedCustomFormat}
              onValueChange={(value) => {
                setSelectedCustomFormat(value);
                const format = customFormats.find(f => f.label === value);
                if (format) {
                  setCurrentFormat(format.format);
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                <div className="text-xs font-medium px-2 py-1 text-muted-foreground">Conditional</div>
                {customFormats.filter(f => f.category === 'conditional').map(format => (
                  <SelectItem key={format.label} value={format.label} className="text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span>{format.label}</span>
                      <span className="text-[10px] text-muted-foreground">{format.example}</span>
                    </div>
                  </SelectItem>
                ))}
                <Separator className="my-1" />
                <div className="text-xs font-medium px-2 py-1 text-muted-foreground">Visual</div>
                {customFormats.filter(f => f.category === 'visual').map(format => (
                  <SelectItem key={format.label} value={format.label} className="text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span>{format.label}</span>
                      <span className="text-[10px] text-muted-foreground">{format.example}</span>
                    </div>
                  </SelectItem>
                ))}
                <Separator className="my-1" />
                <div className="text-xs font-medium px-2 py-1 text-muted-foreground">Rating</div>
                {customFormats.filter(f => f.category === 'rating').map(format => (
                  <SelectItem key={format.label} value={format.label} className="text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span>{format.label}</span>
                      <span className="text-[10px] text-muted-foreground">{format.example}</span>
                    </div>
                  </SelectItem>
                ))}
                <Separator className="my-1" />
                <div className="text-xs font-medium px-2 py-1 text-muted-foreground">Indicators</div>
                {customFormats.filter(f => f.category === 'indicator').map(format => (
                  <SelectItem key={format.label} value={format.label} className="text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span>{format.label}</span>
                      <span className="text-[10px] text-muted-foreground">{format.example}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format Editor */}
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium w-20 mt-2">Format:</span>
            <div className="flex-1 space-y-2">
              <div className="relative">
                <Input
                  value={currentFormat}
                  onChange={(e) => setCurrentFormat(e.target.value)}
                  placeholder="Enter custom format..."
                  className="h-8 text-xs font-mono pr-20 custom-format-input"
                />
                <div className="absolute right-1 top-1 flex gap-1">
                  {/* Emoji Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="Insert emoji"
                      >
                        <Smile className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" side="bottom" align="end">
                      <div className="grid grid-cols-5 gap-1">
                        {commonEmoji.map(({ emoji, name }) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-base"
                            onClick={() => insertEmoji(emoji)}
                            title={name}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Format Help */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="Format guide"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" side="bottom" align="end">
                      <div className="p-3 border-b">
                        <h3 className="font-semibold text-sm">Excel Format Guide</h3>
                      </div>
                      <ScrollArea className="h-[400px]">
                        <div className="p-3 space-y-3 text-xs">
                          <div>
                            <h4 className="font-medium mb-1">Basic Syntax</h4>
                            <div className="bg-muted p-2 rounded font-mono">
                              [condition]format;[condition]format;default
                            </div>
                            <p className="text-muted-foreground mt-1">
                              Up to 4 sections: positive; negative; zero; text
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-1">Conditions</h4>
                            <div className="space-y-0.5">
                              <div><code className="bg-muted px-1">[&gt;100]</code> Greater than 100</div>
                              <div><code className="bg-muted px-1">[&lt;0]</code> Less than 0</div>
                              <div><code className="bg-muted px-1">[=50]</code> Equal to 50</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-1">Colors</h4>
                            <div className="grid grid-cols-2 gap-1">
                              <div><code className="bg-muted px-1">[Red]</code> Red text</div>
                              <div><code className="bg-muted px-1">[Green]</code> Green text</div>
                              <div><code className="bg-muted px-1">[Blue]</code> Blue text</div>
                              <div><code className="bg-muted px-1">[Yellow]</code> Yellow text</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-1">Number Formats</h4>
                            <div className="space-y-0.5">
                              <div><code className="bg-muted px-1">0</code> Display digit or 0</div>
                              <div><code className="bg-muted px-1">#</code> Display digit if present</div>
                              <div><code className="bg-muted px-1">,</code> Thousand separator</div>
                              <div><code className="bg-muted px-1">.</code> Decimal point</div>
                              <div><code className="bg-muted px-1">%</code> Multiply by 100 and add %</div>
                              <div><code className="bg-muted px-1">"text"</code> Display literal text</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-1">Examples</h4>
                            <div className="space-y-1">
                              <div className="bg-muted p-2 rounded">
                                <div className="font-mono">[Red][&lt;0]▼ #,##0;[Green][&gt;0]▲ #,##0</div>
                                <div className="text-muted-foreground">Red down arrow for negative</div>
                              </div>
                              <div className="bg-muted p-2 rounded">
                                <div className="font-mono">[&lt;60]"❌ FAIL";[&gt;=60]"✅ PASS"</div>
                                <div className="text-muted-foreground">Pass/fail with emoji</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Preview Section */}
      <div className="space-y-2">
        <div className="text-xs font-medium">Preview</div>
        <div className="flex items-center gap-2">
          <Input
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            placeholder="Enter test value..."
            className="h-8 text-xs flex-1"
          />
          <div className="text-xs text-muted-foreground">→</div>
          <div className="h-8 px-3 flex items-center bg-muted rounded-md min-w-[100px] text-xs font-mono">
            {previewResult || <span className="text-muted-foreground">No format</span>}
          </div>
        </div>
        
        {/* Quick test values */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Quick:</span>
          {selectedFormat?.controls === 'number' && (
            <>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('1234567.89')}>1234567.89</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('-5000')}>-5000</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('0')}>0</Button>
            </>
          )}
          {selectedFormat?.controls === 'currency' && (
            <>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('1234.56')}>1234.56</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('-999.99')}>-999.99</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('0')}>0</Button>
            </>
          )}
          {selectedFormat?.controls === 'percentage' && (
            <>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('0.1234')}>0.1234</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('0.05')}>0.05</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('1')}>1</Button>
            </>
          )}
          {selectedFormat?.controls === 'date' && (
            <>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('2023-12-31')}>2023-12-31</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue(new Date().toISOString())}>Today</Button>
            </>
          )}
          {selectedFormat?.controls === 'text' && (
            <>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('hello world')}>hello world</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('Product Name')}>Product Name</Button>
            </>
          )}
          {formatMode === 'custom' && (
            <>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('45')}>45</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('75')}>75</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('95')}>95</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('0')}>0</Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTestValue('-10')}>-10</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};