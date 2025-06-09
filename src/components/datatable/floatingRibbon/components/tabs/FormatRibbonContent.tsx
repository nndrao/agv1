import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Hash,
  DollarSign,
  Percent,
  Calendar,
  Type,
  Check,
  Sparkles,
  X,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Code2
} from 'lucide-react';
import { useColumnCustomizationStore } from '../../../dialogs/columnSettings/store/columnCustomization.store';
import { createExcelFormatter, createCellStyleFunction } from '../../../utils/formatters';
import { parseColorValue } from '../../../utils/styleUtils';
import type { FormatTabProps } from '../../types';
import '../../ribbon-styles.css';

interface FormatTemplate {
  key: string;
  label: string;
  format: string;
  example: string;
}

// Base formats - only one can be selected at a time
const baseFormatTemplates: Record<string, FormatTemplate[]> = {
  numbers: [
    { key: 'number', label: 'Number', format: '#,##0.00', example: '1,234.56' },
    { key: 'integer', label: 'Integer', format: '#,##0', example: '1,235' },
    { key: 'decimal4', label: '4 Dec', format: '#,##0.0000', example: '1.5600' },
    { key: 'short', label: 'Short', format: '[>999999]#.#,,\"M\";[>999]#.#,\"K\";#,##0', example: '1.2K' },
    { key: 'fraction32', label: '32nds', format: '# ?/32', example: '99-16' },
    { key: 'fraction64', label: '64ths', format: '# ?/64', example: '99-32' },
    { key: 'fraction256', label: '256ths', format: '# ?/256', example: '99-128' },
  ],
  currency: [
    { key: 'standard', label: 'Standard', format: '#,##0.00', example: '1,234.56' },
    { key: 'accounting', label: 'Accounting', format: '#,##0.00;(#,##0.00)', example: '(1,234)' },
    { key: 'compact', label: 'Compact', format: '#,##0', example: '1,235' },
  ],
  percent: [
    { key: 'percent', label: 'Percent', format: '0.00%', example: '12.34%' },
    { key: 'percent-nodec', label: 'No Dec', format: '0%', example: '12%' },
    { key: 'bps', label: 'Basis Pts', format: '0 \"bps\"', example: '1234 bps' },
  ],
  datetime: [
    { key: 'short-date', label: 'Short', format: 'MM/DD/YYYY', example: '12/31/2023' },
    { key: 'long-date', label: 'Long', format: 'MMMM D, YYYY', example: 'Dec 31, 2023' },
    { key: 'iso-date', label: 'ISO', format: 'YYYY-MM-DD', example: '2023-12-31' },
    { key: 'time', label: 'Time', format: 'h:mm AM/PM', example: '3:45 PM' },
    { key: 'time-24', label: '24hr', format: 'HH:mm:ss', example: '15:45:30' },
    { key: 'datetime', label: 'Full', format: 'MM/DD/YY h:mm AM/PM', example: '12/31/23 3:45 PM' },
  ],
  text: [
    { key: 'upper', label: 'UPPER', format: '[Upper]@', example: 'HELLO WORLD' },
    { key: 'lower', label: 'lower', format: '[Lower]@', example: 'hello world' },
    { key: 'title', label: 'Title', format: '[Title]@', example: 'Hello World' },
    { key: 'sentence', label: 'Sentence', format: '[Sentence]@', example: 'Hello world' },
    { key: 'camel', label: 'camelCase', format: '[CamelCase]@', example: 'helloWorld' },
    { key: 'pascal', label: 'PascalCase', format: '[PascalCase]@', example: 'HelloWorld' },
    { key: 'snake', label: 'snake_case', format: '[SnakeCase]@', example: 'hello_world' },
    { key: 'kebab', label: 'kebab-case', format: '[KebabCase]@', example: 'hello-world' },
    { key: 'trim', label: 'Trim', format: '[Trim]@', example: 'No spaces' },
    { key: 'truncate', label: 'Truncate...', format: '[Truncate:10]@', example: 'Hello Wor...' },
  ],
  custom: [] // Custom formats will be populated dynamically
};

// Excel-style custom format templates
const customFormatTemplates = [
  { 
    label: 'Traffic Light', 
    format: '[Red][<50]0;[Yellow][<80]0;[Green]0', 
    example: '🔴 45 → 🟡 75 → 🟢 95' 
  },
  { 
    label: 'Emoji Status', 
    format: '[<0]😟 0;[=0]😐 0;😊 0', 
    example: '😟 -5, 😐 0, 😊 10' 
  },
  { 
    label: 'Progress Bar', 
    format: '[<25]▰▱▱▱;[<50]▰▰▱▱;[<75]▰▰▰▱;▰▰▰▰', 
    example: '▰▱▱▱ → ▰▰▰▰' 
  },
  { 
    label: 'Temperature', 
    format: '[Blue][<32]0°F ❄️;[Red][>80]0°F 🔥;0°F', 
    example: '30°F ❄️, 85°F 🔥' 
  },
  { 
    label: 'Score Grade', 
    format: '[Red][<60]0 "F";[Orange][<70]0 "D";[Yellow][<80]0 "C";[Blue][<90]0 "B";[Green]0 "A"', 
    example: '95 A, 75 C, 55 F' 
  },
  { 
    label: 'Currency Status', 
    format: '[Red]($0.00);[Green]$0.00;"Break Even"', 
    example: '($100), $100, Break Even' 
  },
  { 
    label: 'Star Rating', 
    format: '[<1]☆☆☆☆☆;[<2]★☆☆☆☆;[<3]★★☆☆☆;[<4]★★★☆☆;[<5]★★★★☆;★★★★★', 
    example: '★★★☆☆ (3.5)' 
  },
  { 
    label: 'Trend Arrows', 
    format: '[Red][<0]↓ 0.0%;[Green][>0]↑ 0.0%;→ 0.0%', 
    example: '↓ -5.2%, ↑ 3.1%, → 0.0%' 
  },
  { 
    label: 'Check/Cross', 
    format: '[=1]✓;[=0]✗;0', 
    example: '✓ Yes, ✗ No' 
  },
  { 
    label: 'Data Bars', 
    format: '[<20]█_____;[<40]██____;[<60]███___;[<80]████__;█████', 
    example: '███___ (60%)' 
  }
];

// Currency symbols available for selection
const currencySymbols = [
  { value: '$', label: '$ (USD)', example: '$1,234.56' },
  { value: '€', label: '€ (EUR)', example: '€1,234.56' },
  { value: '£', label: '£ (GBP)', example: '£1,234.56' },
  { value: '¥', label: '¥ (JPY)', example: '¥1,235' },
  { value: '₹', label: '₹ (INR)', example: '₹1,234.56' },
  { value: 'C$', label: 'C$ (CAD)', example: 'C$1,234.56' },
  { value: 'A$', label: 'A$ (AUD)', example: 'A$1,234.56' },
  { value: 'CHF', label: 'CHF', example: 'CHF 1,234.56' },
  { value: 'kr', label: 'kr (SEK)', example: '1,234.56 kr' },
  { value: 'R$', label: 'R$ (BRL)', example: 'R$1,234.56' },
];

export const FormatRibbonContent: React.FC<FormatTabProps> = ({ 
  selectedColumns,
  formatCategory,
  setFormatCategory,
  currentFormat,
  setCurrentFormat,
  showConditionalDialog,
  setShowConditionalDialog
}) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnCustomizationStore();
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [selectedBaseFormat, setSelectedBaseFormat] = useState<string>('');
  const [noSeparator, setNoSeparator] = useState(false);
  const [colorized, setColorized] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('$');
  const [previewValue, setPreviewValue] = useState<string>('1234567.89');
  const [selectedCustomFormat, setSelectedCustomFormat] = useState<string>('');
  
  // Get theme-aware colors for positive/negative values
  const getThemeColors = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    return {
      positive: parseColorValue('green', isDarkMode),
      negative: parseColorValue('red', isDarkMode)
    };
  };

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

  const applyFormatWithModifiers = useCallback((baseFormat: string, baseKey: string) => {
    let finalFormat = baseFormat;
    
    // Apply currency symbol for currency formats
    if (formatCategory === 'currency') {
      // Handle different currency symbol positions
      if (selectedCurrency === 'kr') {
        // Swedish krona goes after the number
        finalFormat = finalFormat + ' kr';
      } else if (selectedCurrency === 'CHF') {
        // Swiss franc with space
        finalFormat = 'CHF ' + finalFormat;
      } else {
        // Most currencies go before the number
        finalFormat = selectedCurrency + finalFormat;
      }
      
      // Handle accounting format with parentheses
      if (baseKey === 'accounting' && !selectedCurrency.includes('kr')) {
        const parts = finalFormat.split(';');
        if (parts.length > 1) {
          parts[1] = parts[1].replace('(', `(${selectedCurrency}`);
          finalFormat = parts.join(';');
        }
      }
    }
    
    // Apply no separator modifier
    if (noSeparator && !baseKey.startsWith('fraction')) {
      // Remove thousand separators from the format
      finalFormat = finalFormat.replace(/#,##/g, '#');
    }
    
    // Apply colorized modifier (only for numeric formats)
    if (colorized && (formatCategory === 'numbers' || formatCategory === 'currency' || formatCategory === 'percent')) {
      // Wrap format with color conditions
      const positiveFormat = finalFormat.replace(/\[Green\]/g, '').replace(/\[Red\]/g, '');
      finalFormat = `[>0][Green]${positiveFormat};[<0][Red]${positiveFormat};${positiveFormat}`;
    }
    
    setCurrentFormat(finalFormat);
    
    // Create the formatter function from the format string
    const formatter = createExcelFormatter(finalFormat);
    updateBulkProperty('valueFormatter', formatter);
    
    // CRITICAL: Check if we need to create/update cellStyle to support conditional formatting
    // This follows the pattern from the documentation
    const existingCellStyle = getMixedValueLocal('cellStyle');
    
    // Check if the format string has conditional styling (colors, styling directives)
    const hasConditionalStyling = finalFormat.match(/\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right|#[0-9A-Fa-f]{3,6}|Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|Magenta|Cyan)/i);
    
    if (hasConditionalStyling && !existingCellStyle.isMixed) {
      // Extract base styles from existing cellStyle
      let baseStyle: React.CSSProperties | undefined;
      
      if (existingCellStyle.value) {
        if (typeof existingCellStyle.value === 'object') {
          // Direct style object from styling tab
          baseStyle = existingCellStyle.value;
        } else if (typeof existingCellStyle.value === 'function') {
          // Function style - check for base style metadata
          const metadata = (existingCellStyle.value as any).__baseStyle;
          if (metadata) {
            baseStyle = metadata;
          }
        }
      }
      
      // Create cellStyle function that merges base and conditional styles
      const cellStyleFn = createCellStyleFunction(finalFormat, baseStyle);
      updateBulkProperty('cellStyle', cellStyleFn);
    }
  }, [noSeparator, colorized, formatCategory, selectedCurrency, updateBulkProperty, selectedColumns, columnDefinitions, pendingChanges]);

  const handleBaseFormatSelect = useCallback((template: FormatTemplate) => {
    setSelectedBaseFormat(template.key);
    applyFormatWithModifiers(template.format, template.key);
  }, [applyFormatWithModifiers]);

  const handleModifierChange = useCallback((modifier: 'noSeparator' | 'colorized', value: boolean) => {
    if (modifier === 'noSeparator') {
      setNoSeparator(value);
    } else if (modifier === 'colorized') {
      setColorized(value);
    }
    
    // Reapply current format with new modifiers
    if (selectedBaseFormat) {
      const currentTemplates = baseFormatTemplates[formatCategory as keyof typeof baseFormatTemplates] || [];
      const currentTemplate = currentTemplates.find(t => t.key === selectedBaseFormat);
      if (currentTemplate) {
        // Use temporary modifier values for immediate update
        const tempNoSep = modifier === 'noSeparator' ? value : noSeparator;
        const tempColor = modifier === 'colorized' ? value : colorized;
        
        let finalFormat = currentTemplate.format;
        
        // Apply currency symbol for currency formats
        if (formatCategory === 'currency') {
          if (selectedCurrency === 'kr') {
            finalFormat = finalFormat + ' kr';
          } else if (selectedCurrency === 'CHF') {
            finalFormat = 'CHF ' + finalFormat;
          } else {
            finalFormat = selectedCurrency + finalFormat;
          }
          
          if (currentTemplate.key === 'accounting' && !selectedCurrency.includes('kr')) {
            const parts = finalFormat.split(';');
            if (parts.length > 1) {
              parts[1] = parts[1].replace('(', `(${selectedCurrency}`);
              finalFormat = parts.join(';');
            }
          }
        }
        
        if (tempNoSep && !selectedBaseFormat.startsWith('fraction')) {
          finalFormat = finalFormat.replace(/#,##/g, '#');
        }
        
        if (tempColor && (formatCategory === 'numbers' || formatCategory === 'currency' || formatCategory === 'percent')) {
          const positiveFormat = finalFormat.replace(/\[Green\]/g, '').replace(/\[Red\]/g, '');
          finalFormat = `[>0][Green]${positiveFormat};[<0][Red]${positiveFormat};${positiveFormat}`;
        }
        
        setCurrentFormat(finalFormat);
        // Create the formatter function from the format string
        const formatter = createExcelFormatter(finalFormat);
        updateBulkProperty('valueFormatter', formatter);
      }
    }
  }, [selectedBaseFormat, formatCategory, noSeparator, colorized, selectedCurrency, updateBulkProperty]);

  const handleQuickScaleFormat = useCallback((scale: 'K' | 'M' | 'B') => {
    setSelectedBaseFormat(scale.toLowerCase());
    
    // For K, M, B formats, we need to use a function formatter that divides the value
    const formatterString = `function(params) {
      const value = params.value;
      if (value == null || isNaN(value)) return '';
      
      let divisor = 1;
      let suffix = '';
      
      switch('${scale}') {
        case 'K': divisor = 1000; suffix = 'K'; break;
        case 'M': divisor = 1000000; suffix = 'M'; break;
        case 'B': divisor = 1000000000; suffix = 'B'; break;
      }
      
      const scaledValue = value / divisor;
      const formatted = scaledValue.toLocaleString(undefined, {
        minimumFractionDigits: ${decimalPlaces},
        maximumFractionDigits: ${decimalPlaces}
      });
      
      return formatted + suffix;
    }`;
    
    setCurrentFormat(formatterString);
    updateBulkProperty('valueFormatter', formatterString);
  }, [decimalPlaces, updateBulkProperty]);

  const handleDecimalChange = useCallback((increment: boolean) => {
    // Don't allow decimal changes for K, M, B formats or fraction/special formats
    const isScaledFormat = currentFormat && (
      currentFormat.includes("case 'K':") || 
      currentFormat.includes("case 'M':") || 
      currentFormat.includes("case 'B':")
    );
    
    const isFractionFormat = selectedBaseFormat && (
      selectedBaseFormat.startsWith('fraction')
    );
    
    // Exit early if format shouldn't support decimal changes
    if (isScaledFormat || isFractionFormat) {
      return;
    }
    
    const newPlaces = increment ? Math.min(decimalPlaces + 1, 6) : Math.max(decimalPlaces - 1, 0);
    setDecimalPlaces(newPlaces);
    
    // Update the current format with new decimal places
    if (selectedBaseFormat && !selectedBaseFormat.startsWith('fraction')) {
      const currentTemplates = baseFormatTemplates[formatCategory as keyof typeof baseFormatTemplates] || [];
      const currentTemplate = currentTemplates.find(t => t.key === selectedBaseFormat);
      if (currentTemplate) {
        let newFormat = currentTemplate.format;
        
        // Update decimal places in the format
        if (newFormat.includes('.')) {
          // Replace existing decimal pattern
          newFormat = newFormat.replace(/\.0+/g, newPlaces > 0 ? '.' + '0'.repeat(newPlaces) : '');
        } else if (newPlaces > 0 && !newFormat.includes('%') && !newFormat.includes('bps')) {
          // Add decimal places if not present
          newFormat = newFormat.replace(/(#|0)(?=\s|$|"|'|;|\)|,)/g, `$1.${'0'.repeat(newPlaces)}`);
        }
        
        applyFormatWithModifiers(newFormat, selectedBaseFormat);
      }
    }
  }, [currentFormat, selectedBaseFormat, decimalPlaces, formatCategory, applyFormatWithModifiers]);

  const currentTemplates = baseFormatTemplates[formatCategory as keyof typeof baseFormatTemplates] || [];

  // Check if current format supports decimal changes
  const isScaledFormat = currentFormat && (
    currentFormat.includes("case 'K':") || 
    currentFormat.includes("case 'M':") || 
    currentFormat.includes("case 'B':")
  );
  
  const isFractionFormat = selectedBaseFormat && selectedBaseFormat.startsWith('fraction');
  
  const supportsDecimalChange = !isScaledFormat && !isFractionFormat;
  const supportsModifiers = formatCategory === 'numbers' || formatCategory === 'currency' || formatCategory === 'percent';

  const getPreviewValue = () => {
    // Parse the preview value as a number for numeric formats
    const numValue = parseFloat(previewValue);
    const isValidNumber = !isNaN(numValue);
    
    // Scale formats - show actual division
    if (selectedBaseFormat === 'k' && isValidNumber) {
      const scaled = numValue / 1000;
      const formatted = scaled.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      });
      return formatted + 'K';
    }
    if (selectedBaseFormat === 'm' && isValidNumber) {
      const scaled = numValue / 1000000;
      const formatted = scaled.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      });
      return formatted + 'M';
    }
    if (selectedBaseFormat === 'b' && isValidNumber) {
      const scaled = numValue / 1000000000;
      const formatted = scaled.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      });
      return formatted + 'B';
    }
    
    // Fraction formats
    if (selectedBaseFormat?.startsWith('fraction') && isValidNumber) {
      const whole = Math.floor(numValue);
      const decimal = numValue - whole;
      
      if (selectedBaseFormat === 'fraction32') {
        const fraction = Math.round(decimal * 32);
        return `${whole}-${fraction.toString().padStart(2, '0')}`;
      }
      if (selectedBaseFormat === 'fraction64') {
        const fraction = Math.round(decimal * 64);
        return `${whole}-${fraction.toString().padStart(2, '0')}`;
      }
      if (selectedBaseFormat === 'fraction256') {
        const fraction = Math.round(decimal * 256);
        return `${whole}-${fraction.toString().padStart(3, '0')}`;
      }
    }
    
    // Text formats - use the actual preview value as text
    if (formatCategory === 'text') {
      const textValue = previewValue || 'sample text';
      switch (selectedBaseFormat) {
        case 'upper': return textValue.toUpperCase();
        case 'lower': return textValue.toLowerCase();
        case 'title': return textValue.replace(/\w\S*/g, txt => 
          txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
        case 'sentence': return textValue.charAt(0).toUpperCase() + textValue.slice(1).toLowerCase();
        case 'camel': return textValue.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
          index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');
        case 'pascal': return textValue.replace(/(?:^\w|[A-Z]|\b\w)/g, word => 
          word.toUpperCase()).replace(/\s+/g, '');
        case 'snake': return textValue.toLowerCase().replace(/\s+/g, '_');
        case 'kebab': return textValue.toLowerCase().replace(/\s+/g, '-');
        case 'trim': return textValue.trim();
        case 'truncate': return textValue.length > 10 ? textValue.substring(0, 10) + '...' : textValue;
        default: return textValue;
      }
    }
    
    // Currency formats
    if (formatCategory === 'currency' && isValidNumber) {
      const baseValue = noSeparator ? 
        numValue.toFixed(2) : 
        numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (selectedCurrency === 'kr') return baseValue + ' kr';
      if (selectedCurrency === 'CHF') return 'CHF ' + baseValue;
      return selectedCurrency + baseValue;
    }
    
    // Percent formats
    if (formatCategory === 'percent' && isValidNumber) {
      if (selectedBaseFormat === 'percent') {
        return (numValue * 100).toFixed(2) + '%';
      }
      if (selectedBaseFormat === 'percent-nodec') {
        return Math.round(numValue * 100) + '%';
      }
      if (selectedBaseFormat === 'bps') {
        return Math.round(numValue * 10000) + ' bps';
      }
    }
    
    // Date/time formats - try to parse as date
    if (formatCategory === 'datetime') {
      const dateValue = new Date(previewValue);
      const isValidDate = !isNaN(dateValue.getTime());
      
      if (isValidDate) {
        switch (selectedBaseFormat) {
          case 'short-date': return `${dateValue.getMonth() + 1}/${dateValue.getDate()}/${dateValue.getFullYear()}`;
          case 'long-date': return dateValue.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          case 'iso-date': return dateValue.toISOString().split('T')[0];
          case 'time': return dateValue.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          case 'time-24': return dateValue.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          case 'datetime': return `${dateValue.getMonth() + 1}/${dateValue.getDate()}/${dateValue.getFullYear().toString().substring(2)} ${dateValue.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
          default: return dateValue.toLocaleDateString();
        }
      }
      return 'Invalid Date';
    }
    
    // Default number format
    if (isValidNumber && formatCategory === 'numbers') {
      const formatted = noSeparator ? 
        numValue.toFixed(2) : 
        numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return formatted;
    }
    
    return previewValue;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Compact single row layout */}
      <div className="flex items-start gap-2">
        {/* Category Selector - Horizontal */}
        <div className="flex items-center gap-1">
          <ToggleGroup 
            type="single" 
            value={formatCategory}
            onValueChange={(value) => value && setFormatCategory(value)}
            className="flex"
          >
            <ToggleGroupItem value="numbers" className="ribbon-toggle-group-item h-7 px-2.5 text-xs">
              <Hash className="ribbon-icon-xs" />
            </ToggleGroupItem>
            <ToggleGroupItem value="currency" className="ribbon-toggle-group-item h-7 px-2.5 text-xs">
              <DollarSign className="ribbon-icon-xs" />
            </ToggleGroupItem>
            <ToggleGroupItem value="percent" className="ribbon-toggle-group-item h-7 px-2.5 text-xs">
              <Percent className="ribbon-icon-xs" />
            </ToggleGroupItem>
            <ToggleGroupItem value="datetime" className="ribbon-toggle-group-item h-7 px-2.5 text-xs">
              <Calendar className="ribbon-icon-xs" />
            </ToggleGroupItem>
            <ToggleGroupItem value="text" className="ribbon-toggle-group-item h-7 px-2.5 text-xs">
              <Type className="ribbon-icon-xs" />
            </ToggleGroupItem>
            <ToggleGroupItem value="custom" className="ribbon-toggle-group-item h-7 px-2.5 text-xs">
              <Code2 className="ribbon-icon-xs" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <Separator orientation="vertical" className="h-7" />
        
        {/* Template Grid or Custom Format Selector */}
        <div className="flex-1 min-w-0">
          {formatCategory === 'custom' ? (
            // Custom format dropdown and editor
            <div className="flex items-center gap-2">
              <Select
                value={selectedCustomFormat}
                onValueChange={(value) => {
                  setSelectedCustomFormat(value);
                  const format = customFormatTemplates.find(f => f.label === value)?.format || value;
                  setCurrentFormat(format);
                  // Create the formatter function from the format string
                  const formatter = createExcelFormatter(format);
                  updateBulkProperty('valueFormatter', formatter);
                  
                  // Check if we need to create/update cellStyle for conditional formatting
                  const hasConditionalStyling = format.match(/\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right|#[0-9A-Fa-f]{3,6}|Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|Magenta|Cyan)/i);
                  
                  if (hasConditionalStyling) {
                    const existingCellStyle = getMixedValueLocal('cellStyle');
                    if (!existingCellStyle.isMixed) {
                      let baseStyle: React.CSSProperties | undefined;
                      
                      if (existingCellStyle.value) {
                        if (typeof existingCellStyle.value === 'object') {
                          baseStyle = existingCellStyle.value;
                        } else if (typeof existingCellStyle.value === 'function') {
                          const metadata = (existingCellStyle.value as any).__baseStyle;
                          if (metadata) {
                            baseStyle = metadata;
                          }
                        }
                      }
                      
                      const cellStyleFn = createCellStyleFunction(format, baseStyle);
                      updateBulkProperty('cellStyle', cellStyleFn);
                    }
                  }
                }}
              >
                <SelectTrigger className="min-h-[28px] h-auto text-xs flex-1 py-1">
                  <SelectValue placeholder="Select a custom format...">
                    {selectedCustomFormat && (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-medium text-xs">{selectedCustomFormat}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[300px]">
                          {customFormatTemplates.find(f => f.label === selectedCustomFormat)?.format}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {customFormatTemplates.map((format) => (
                    <SelectItem key={format.label} value={format.label} className="text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{format.label}</span>
                        <span className="text-[10px] text-muted-foreground">{format.example}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 self-start"
                    title="Format help"
                  >
                    <HelpCircle className="ribbon-icon" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" side="bottom" align="end">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-lg">Excel Format Guide</h3>
                    <p className="text-sm text-muted-foreground">Learn how to create powerful custom formats</p>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="p-4 space-y-4">
                      {/* Basic Syntax */}
                      <div>
                        <h4 className="font-medium mb-2">Basic Syntax</h4>
                        <div className="bg-muted/50 p-3 rounded-md font-mono text-xs">
                          [condition]format;[condition]format;default_format
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Up to 4 sections: positive; negative; zero; text
                        </p>
                      </div>

                      {/* Conditions */}
                      <div>
                        <h4 className="font-medium mb-2">Conditions</h4>
                        <div className="space-y-1 text-sm">
                          <div><code className="bg-muted px-1">[{'>'}100]</code> Greater than 100</div>
                          <div><code className="bg-muted px-1">[{'<'}0]</code> Less than 0</div>
                          <div><code className="bg-muted px-1">[=50]</code> Equal to 50</div>
                          <div><code className="bg-muted px-1">[{'<'}=75]</code> Less than or equal to 75</div>
                          <div><code className="bg-muted px-1">[{'>'}=90]</code> Greater than or equal to 90</div>
                        </div>
                      </div>

                      {/* Colors */}
                      <div>
                        <h4 className="font-medium mb-2">Colors</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><code className="bg-muted px-1">[Red]</code> <span className="text-red-500">Red text</span></div>
                          <div><code className="bg-muted px-1">[Green]</code> <span className="text-green-500">Green text</span></div>
                          <div><code className="bg-muted px-1">[Blue]</code> <span className="text-blue-500">Blue text</span></div>
                          <div><code className="bg-muted px-1">[Yellow]</code> <span className="text-yellow-500">Yellow text</span></div>
                          <div><code className="bg-muted px-1">[Orange]</code> <span className="text-orange-500">Orange text</span></div>
                          <div><code className="bg-muted px-1">[Purple]</code> <span className="text-purple-500">Purple text</span></div>
                        </div>
                      </div>

                      {/* Number Formats */}
                      <div>
                        <h4 className="font-medium mb-2">Number Formats</h4>
                        <div className="space-y-1 text-sm">
                          <div><code className="bg-muted px-1">0</code> Display digit or 0</div>
                          <div><code className="bg-muted px-1">#</code> Display digit if present</div>
                          <div><code className="bg-muted px-1">,</code> Thousand separator</div>
                          <div><code className="bg-muted px-1">.</code> Decimal point</div>
                          <div><code className="bg-muted px-1">%</code> Multiply by 100 and add %</div>
                          <div><code className="bg-muted px-1">"text"</code> Display literal text</div>
                        </div>
                      </div>

                      {/* Complex Examples */}
                      <div>
                        <h4 className="font-medium mb-2">Complex Examples</h4>
                        <div className="space-y-2">
                          <div className="bg-muted/50 p-2 rounded text-xs">
                            <div className="font-mono">[Red][{'<'}0]▼ #,##0.00;[Green][{'>'}0]▲ #,##0.00;[Blue]— 0.00</div>
                            <div className="text-muted-foreground mt-1">Shows red down arrow for negative, green up arrow for positive</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded text-xs">
                            <div className="font-mono">[{'<'}1000000]#,##0,K;[{'<'}1000000000]#,##0,,M;#,##0,,,B</div>
                            <div className="text-muted-foreground mt-1">Auto-scales to K, M, or B based on value</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded text-xs">
                            <div className="font-mono">[Red][{'<'}60]0 "❌ FAIL";[Yellow][{'<'}80]0 "⚠️ PASS";[Green]0 "✅ EXCELLENT"</div>
                            <div className="text-muted-foreground mt-1">Grade with emoji and color based on score</div>
                          </div>
                        </div>
                      </div>

                      {/* Unicode & Emoji */}
                      <div>
                        <h4 className="font-medium mb-2">Using Unicode & Emoji</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          You can include any Unicode character or emoji directly in the format string:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>📈 📉 📊 Charts</div>
                          <div>✓ ✗ ⚠️ Status</div>
                          <div>★ ☆ ⭐ Ratings</div>
                          <div>🔴 🟡 🟢 Lights</div>
                          <div>▰ ▱ █ Bars</div>
                          <div>↑ ↓ → Arrows</div>
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Tips</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Use semicolons to separate format sections</li>
                          <li>• Combine conditions with colors for visual impact</li>
                          <li>• Test formats with different values in the preview</li>
                          <li>• Copy and modify existing templates to learn</li>
                          <li>• Mix number formats with text and symbols</li>
                        </ul>
                      </div>
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            // Regular format templates
            <div className="flex flex-wrap gap-1">
              {currentTemplates.map((template) => (
                <Toggle
                  key={template.key}
                  pressed={selectedBaseFormat === template.key}
                  onPressedChange={(pressed) => {
                    if (pressed) {
                      handleBaseFormatSelect(template);
                    } else {
                      setSelectedBaseFormat('');
                      setCurrentFormat('');
                      updateBulkProperty('valueFormatter', undefined);
                    }
                  }}
                  className={`ribbon-toggle h-7 text-xs ${
                    // Adjust padding based on label length for text formats
                    formatCategory === 'text' && template.label.length > 8 ? 'px-1.5' : 'px-2'
                  }`}
                  title={template.example}
                >
                  <span className={formatCategory === 'text' ? 'text-[11px]' : ''}>
                    {template.label}
                  </span>
                </Toggle>
              ))}
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-7" />
        
        {/* Quick Actions Group */}
        <div className="flex items-center gap-1">
          {/* Scale Buttons - only for numeric formats */}
          {(formatCategory === 'numbers' || formatCategory === 'currency') && (
            <div className="flex shadow-sm">
              <Toggle
                pressed={selectedBaseFormat === 'k'}
                onPressedChange={(pressed) => {
                  if (pressed) {
                    handleQuickScaleFormat('K');
                  } else {
                    setSelectedBaseFormat('');
                    setCurrentFormat('');
                    updateBulkProperty('valueFormatter', undefined);
                  }
                }}
                className="ribbon-toggle h-7 w-6 p-0 text-xs font-medium rounded-r-none border-border/80 hover:border-border"
                title="Thousands"
              >
                K
              </Toggle>
              <Toggle
                pressed={selectedBaseFormat === 'm'}
                onPressedChange={(pressed) => {
                  if (pressed) {
                    handleQuickScaleFormat('M');
                  } else {
                    setSelectedBaseFormat('');
                    setCurrentFormat('');
                    updateBulkProperty('valueFormatter', undefined);
                  }
                }}
                className="ribbon-toggle h-7 w-6 p-0 text-xs font-medium rounded-none border-l-0 border-border/80 hover:border-border"
                title="Millions"
              >
                M
              </Toggle>
              <Toggle
                pressed={selectedBaseFormat === 'b'}
                onPressedChange={(pressed) => {
                  if (pressed) {
                    handleQuickScaleFormat('B');
                  } else {
                    setSelectedBaseFormat('');
                    setCurrentFormat('');
                    updateBulkProperty('valueFormatter', undefined);
                  }
                }}
                className="ribbon-toggle h-7 w-6 p-0 text-xs font-medium rounded-l-none border-l-0 border-border/80 hover:border-border"
                title="Billions"
              >
                B
              </Toggle>
            </div>
          )}
          
          {/* Decimal Controls - only for numeric formats */}
          {supportsModifiers && (
            <div className="flex items-center shadow-sm">
              <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded-r-none border-border/80 hover:border-border"
              onClick={() => handleDecimalChange(false)}
              disabled={!supportsDecimalChange || decimalPlaces === 0}
              title="Decrease decimals"
            >
              <div className="flex flex-col items-center justify-center -space-y-1">
                <span className="text-[9px] font-mono font-bold leading-none">.0</span>
                <ArrowLeft className="ribbon-icon-xs" />
              </div>
            </Button>
            <div className="h-7 w-6 border-y border-border/80 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">{supportsDecimalChange ? decimalPlaces : '-'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded-l-none border-l-0 border-border/80 hover:border-border"
              onClick={() => handleDecimalChange(true)}
              disabled={!supportsDecimalChange || decimalPlaces === 6}
              title="Increase decimals"
            >
              <div className="flex flex-col items-center justify-center -space-y-1">
                <span className="text-[9px] font-mono font-bold leading-none">.00</span>
                <ArrowRight className="ribbon-icon-xs" />
              </div>
            </Button>
            </div>
          )}
          
          {/* Modifiers - only for numeric formats */}
          {supportsModifiers && (
            <>
              <Separator orientation="vertical" className="h-7" />
              <Toggle
                size="sm"
                pressed={noSeparator}
                onPressedChange={(pressed) => handleModifierChange('noSeparator', pressed)}
                className="ribbon-toggle h-7 text-xs px-2"
                title="Remove thousand separators"
              >
                No Sep
              </Toggle>
              <Toggle
                size="sm"
                pressed={colorized}
                onPressedChange={(pressed) => handleModifierChange('colorized', pressed)}
                className="ribbon-toggle h-7 text-xs px-2"
                title="Color positive/negative values"
              >
                +/- Color
              </Toggle>
            </>
          )}
          
          {/* Currency Symbol */}
          {formatCategory === 'currency' && (
            <Select
              value={selectedCurrency}
              onValueChange={(value) => {
                setSelectedCurrency(value);
                if (selectedBaseFormat) {
                  const currentTemplates = baseFormatTemplates[formatCategory as keyof typeof baseFormatTemplates] || [];
                  const currentTemplate = currentTemplates.find(t => t.key === selectedBaseFormat);
                  if (currentTemplate) {
                    applyFormatWithModifiers(currentTemplate.format, currentTemplate.key);
                  }
                }
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencySymbols.map(currency => (
                  <SelectItem key={currency.value} value={currency.value} className="text-xs">
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Actions */}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => setShowConditionalDialog(true)}
            title="Conditional formatting"
          >
            <Sparkles className="ribbon-icon-xs" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
                          className="h-7 px-2 text-xs text-orange-600 dark:text-orange-400"
            onClick={() => {
              setCurrentFormat('');
              setSelectedBaseFormat('');
              setNoSeparator(false);
              setColorized(false);
              updateBulkProperty('valueFormatter', undefined);
              
              // When clearing formatter, check if we need to preserve base styles
              // but remove conditional formatting from cellStyle
              const existingCellStyle = getMixedValueLocal('cellStyle');
              
              if (existingCellStyle.value && typeof existingCellStyle.value === 'function') {
                // Check if this cellStyle was created for conditional formatting
                const formatString = (existingCellStyle.value as any).__formatString;
                const baseStyle = (existingCellStyle.value as any).__baseStyle;
                
                if (formatString && baseStyle && Object.keys(baseStyle).length > 0) {
                  // Preserve base styles but remove conditional formatting
                  updateBulkProperty('cellStyle', baseStyle);
                } else if (formatString && (!baseStyle || Object.keys(baseStyle).length === 0)) {
                  // Only had conditional formatting, clear cellStyle entirely
                  updateBulkProperty('cellStyle', undefined);
                }
                // If no formatString metadata, leave cellStyle as is (it's a regular style)
              }
            }}
            title="Clear format"
          >
            <X className="ribbon-icon-xs" />
          </Button>
        </div>
      </div>
      
      {/* Custom format row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          <Input 
            placeholder="Custom format" 
            className="h-7 text-xs font-mono"
            value={currentFormat}
            onChange={(e) => setCurrentFormat(e.target.value)}
          />
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0" 
            title="Apply"
            onClick={() => {
              if (currentFormat) {
                // Create the formatter function from the format string
                const formatter = createExcelFormatter(currentFormat);
                updateBulkProperty('valueFormatter', formatter);
                
                // Check if we need to create/update cellStyle for conditional formatting
                const hasConditionalStyling = currentFormat.match(/\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right|#[0-9A-Fa-f]{3,6}|Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|Magenta|Cyan)/i);
                
                if (hasConditionalStyling) {
                  const existingCellStyle = getMixedValueLocal('cellStyle');
                  if (!existingCellStyle.isMixed) {
                    let baseStyle: React.CSSProperties | undefined;
                    
                    if (existingCellStyle.value) {
                      if (typeof existingCellStyle.value === 'object') {
                        baseStyle = existingCellStyle.value;
                      } else if (typeof existingCellStyle.value === 'function') {
                        const metadata = (existingCellStyle.value as any).__baseStyle;
                        if (metadata) {
                          baseStyle = metadata;
                        }
                      }
                    }
                    
                    const cellStyleFn = createCellStyleFunction(currentFormat, baseStyle);
                    updateBulkProperty('cellStyle', cellStyleFn);
                  }
                }
              } else {
                updateBulkProperty('valueFormatter', undefined);
              }
            }}
          >
            <Check className="ribbon-icon-xs" />
          </Button>
        </div>
      </div>
      
      {/* Compact preview section - all in one line */}
      <div className="ribbon-preview-box flex items-center gap-2">
        <span className="ribbon-preview-label">TEST</span>
        <Input 
          placeholder={formatCategory === 'text' ? 'Text' : formatCategory === 'datetime' ? '2023-12-31' : '1234.56'}
          className="ribbon-input w-20"
          value={previewValue}
          onChange={(e) => setPreviewValue(e.target.value)}
        />
        <Separator orientation="vertical" className="ribbon-separator h-4" />
        <span className="ribbon-preview-label">RESULT</span>
        <div 
          className="ribbon-preview-content font-mono min-w-[80px]"
          style={(() => {
            if (colorized && !isNaN(parseFloat(previewValue))) {
              const colors = getThemeColors();
              const numValue = parseFloat(previewValue);
              if (numValue > 0) {
                return { color: colors.positive };
              } else if (numValue < 0) {
                return { color: colors.negative };
              }
            }
            return undefined;
          })()}
        >
          {getPreviewValue()}
        </div>
        <Separator orientation="vertical" className="ribbon-separator h-4" />
        <span className="ribbon-preview-label">QUICK</span>
        {formatCategory === 'numbers' && (
          <>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue('1234567.89')}
            >
              1234567
            </button>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue('-5000')}
            >
              -5000
            </button>
          </>
        )}
        {formatCategory === 'currency' && (
          <>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue('1234.56')}
            >
              1234.56
            </button>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue('-999.99')}
            >
              -999
            </button>
          </>
        )}
        {formatCategory === 'percent' && (
          <>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue('0.1234')}
            >
              12.34%
            </button>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue('0.05')}
            >
              5%
            </button>
          </>
        )}
        {formatCategory === 'datetime' && (
          <>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue('2023-12-31')}
            >
              2023-12-31
            </button>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue(new Date().toISOString())}
            >
              Now
            </button>
          </>
        )}
        {formatCategory === 'text' && (
          <>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue('hello world')}
            >
              hello
            </button>
            <button 
              className="text-[10px] text-primary hover:underline px-0.5"
              onClick={() => setPreviewValue('Product Name Example')}
            >
              Product
            </button>
          </>
        )}
      </div>
      
    </div>
  );
};