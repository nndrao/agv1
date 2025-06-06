import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { ValueFormatterEditor } from '../editors/ValueFormatterEditor';
import { createExcelFormatter, getExcelStyleClass } from '@/components/datatable/utils/formatters';
import { 
  Hash, 
  DollarSign, 
  Percent, 
  Calendar, 
  Type, 
  Lightbulb, 
  ArrowUp, 
  Palette, 
  Info, 
  HelpCircle,
  Sparkles,
  Eye,
  X
} from 'lucide-react';

interface FormatTabProps {
  uiMode?: 'simple' | 'advanced';
}

// Rich predefined formatters with categories
const RICH_FORMATTERS = {
  'Basic Numbers': [
    { 
      name: 'Number with Thousands', 
      format: '#,##0.00', 
      description: 'Format: 1,234.56',
      example: '1,234.56'
    },
    { 
      name: 'Integer with Thousands', 
      format: '#,##0', 
      description: 'Format: 1,235',
      example: '1,235'
    },
    { 
      name: 'Number (4 decimals)', 
      format: '#,##0.0000', 
      description: 'Format: 1,234.5600',
      example: '1,234.5600'
    },
    { 
      name: 'Number in Thousands', 
      format: '#,##0,', 
      description: 'Format: 1,235 (displays 1234567 as 1,235)',
      example: '1,235K'
    },
    { 
      name: 'Number in Millions', 
      format: '#,##0,,', 
      description: 'Format: 1 (displays 1234567 as 1)',
      example: '1M'
    }
  ],
  'Currency Formats': [
    { 
      name: 'US Dollar', 
      format: '$#,##0.00', 
      description: 'Format: $1,234.56',
      example: '$1,234.56'
    },
    { 
      name: 'Accounting (Parentheses)', 
      format: '$#,##0.00;($#,##0.00)', 
      description: 'Negative in parentheses: ($1,234.56)',
      example: '$1,234.56 / ($1,234.56)'
    },
    { 
      name: 'Euro', 
      format: '€#,##0.00', 
      description: 'Format: €1,234.56',
      example: '€1,234.56'
    },
    { 
      name: 'British Pound', 
      format: '£#,##0.00', 
      description: 'Format: £1,234.56',
      example: '£1,234.56'
    }
  ],
  'Percentage Formats': [
    { 
      name: 'Percentage (2 decimals)', 
      format: '0.00%', 
      description: 'Format: 12.34%',
      example: '12.34%'
    },
    { 
      name: 'Percentage (no decimals)', 
      format: '0%', 
      description: 'Format: 12%',
      example: '12%'
    },
    { 
      name: 'Percentage (1 decimal)', 
      format: '0.0%', 
      description: 'Format: 12.3%',
      example: '12.3%'
    }
  ],
  'Positive/Negative Colors': [
    { 
      name: 'Green Positive, Red Negative', 
      format: '[>0][Green]#,##0.00;[Red]#,##0.00', 
      description: 'Green for positive, red for negative (no minus sign)',
      example: '1,234.56 / 1,234.56'
    },
    { 
      name: 'Green/Red with Currency', 
      format: '[>0][Green]$#,##0.00;[Red]$#,##0.00', 
      description: 'Currency with green/red colors',
      example: '$1,234.56 / $1,234.56'
    },
    { 
      name: 'Blue Positive, Red Negative', 
      format: '[>0][Blue]#,##0.00;[Red]#,##0.00', 
      description: 'Blue for positive, red for negative',
      example: '1,234.56 / 1,234.56'
    },
    { 
      name: 'Green/Red Percentage', 
      format: '[>0][Green]0.00%;[Red]0.00%', 
      description: 'Percentage with green/red colors',
      example: '12.34% / 12.34%'
    }
  ],
  'Conditional with Emojis': [
    { 
      name: 'Traffic Light (90/70)', 
      format: '[>=90]"🟢 "#0;[>=70]"🟡 "#0;"🔴 "#0', 
      description: 'Green ≥90, Yellow ≥70, Red <70',
      example: '🟢 95 / 🟡 75 / 🔴 60'
    },
    { 
      name: 'Performance Icons', 
      format: '[>=90]"⭐ "#0;[>=70]"👍 "#0;"👎 "#0', 
      description: 'Star ≥90, Thumbs up ≥70, Thumbs down <70',
      example: '⭐ 95 / 👍 75 / 👎 60'
    },
    { 
      name: 'Arrow Trends', 
      format: '[>0]"↗️ "#,##0.00;[<0]"↘️ "#,##0.00;"➡️ "#,##0.00', 
      description: 'Up arrow for positive, down for negative, right for zero',
      example: '↗️ 1,234.56 / ↘️ 1,234.56 / ➡️ 0.00'
    },
    { 
      name: 'Status Indicators', 
      format: '[>100]"✅ "#0"%";[>50]"⚠️ "#0"%";"❌ "#0"%"', 
      description: 'Check >100%, Warning >50%, X ≤50%',
      example: '✅ 120% / ⚠️ 75% / ❌ 30%'
    },
    { 
      name: 'Temperature', 
      format: '[>=25]"🔥 "#0"°C";[>=15]"☀️ "#0"°C";[>=5]"🌤️ "#0"°C";"❄️ "#0"°C"', 
      description: 'Fire ≥25°C, Sun ≥15°C, Cloud ≥5°C, Snow <5°C',
      example: '🔥 30°C / ☀️ 20°C / 🌤️ 10°C / ❄️ 0°C'
    }
  ],
  'Special Symbols': [
    { 
      name: 'Plus/Minus Signs', 
      format: '[>0]"+ "#,##0.00;[<0]"- "#,##0.00;"± "#,##0.00', 
      description: 'Explicit + for positive, - for negative, ± for zero',
      example: '+ 1,234.56 / - 1,234.56 / ± 0.00'
    },
    { 
      name: 'Delta (Δ) Changes', 
      format: '[>0]"Δ +"#,##0.00;[<0]"Δ "#,##0.00;"Δ "#,##0.00', 
      description: 'Delta symbol with change indicators',
      example: 'Δ +1,234.56 / Δ -1,234.56 / Δ 0.00'
    },
    { 
      name: 'Bullet Points', 
      format: '"● "#,##0.00', 
      description: 'Bullet point prefix',
      example: '● 1,234.56'
    },
    { 
      name: 'Checkmark/Cross', 
      format: '[>0]"✓ "#,##0.00;"✗ "#,##0.00', 
      description: 'Checkmark for positive, cross for negative/zero',
      example: '✓ 1,234.56 / ✗ 1,234.56'
    }
  ],
  'Scientific & Technical': [
    { 
      name: 'Scientific Notation', 
      format: '0.00E+00', 
      description: 'Format: 1.23E+03',
      example: '1.23E+03'
    },
    { 
      name: 'Engineering Format', 
      format: '##0.0E+0', 
      description: 'Format: 123.4E+1',
      example: '123.4E+1'
    },
    { 
      name: 'Bytes (KB/MB/GB)', 
      format: '[>=1000000000]#,##0,,,,"TB";[>=1000000]#,##0,,,"GB";[>=1000]#,##0,,"MB";#,##0,"KB"', 
      description: 'Automatic byte unit scaling',
      example: '1,234 KB / 1 GB / 2 TB'
    }
  ],
  'Date & Time': [
    { 
      name: 'Short Date', 
      format: 'MM/DD/YYYY', 
      description: 'Format: 01/15/2023',
      example: '01/15/2023'
    },
    { 
      name: 'Long Date', 
      format: 'MMMM D, YYYY', 
      description: 'Format: January 15, 2023',
      example: 'January 15, 2023'
    },
    { 
      name: 'Date with Day', 
      format: 'dddd, MMMM D, YYYY', 
      description: 'Format: Sunday, January 15, 2023',
      example: 'Sunday, January 15, 2023'
    },
    { 
      name: 'Time (12-hour)', 
      format: 'h:mm AM/PM', 
      description: 'Format: 2:30 PM',
      example: '2:30 PM'
    },
    { 
      name: 'Time (24-hour)', 
      format: 'HH:mm', 
      description: 'Format: 14:30',
      example: '14:30'
    }
  ],
  'Text & Custom': [
    { 
      name: 'ID Prefix', 
      format: '"ID: "#', 
      description: 'Add "ID: " prefix',
      example: 'ID: 12345'
    },
    { 
      name: 'Reference Number', 
      format: '"REF-"0000', 
      description: 'Format: REF-0123',
      example: 'REF-0123'
    },
    { 
      name: 'Version Number', 
      format: '"v"0.00', 
      description: 'Format: v1.23',
      example: 'v1.23'
    },
    { 
      name: 'Quoted Text', 
      format: '"""@"""', 
      description: 'Wrap text in quotes',
      example: '"Sample Text"'
    }
  ],
  'Extended Styling': [
    { 
      name: 'Green Background with Border', 
      format: '[>0][Green][BG:lightgreen][Bold][Border:2px-solid-green]#,##0.00;[Red][BG:lightred]#,##0.00', 
      description: 'Green text, light green background, bold, with green border for positive numbers',
      example: 'Styled positive/negative numbers'
    },
    { 
      name: 'High-Value Highlight', 
      format: '[>1000][#ffffff][BG:#16a34a][Bold][Size:16][Center]#,##0;[>100][#0066cc][BG:#f0f9ff][Size:14]#,##0;#,##0', 
      description: 'White text on green background for values >1000, blue text on light blue for >100',
      example: 'Dynamic styling based on value thresholds'
    },
    { 
      name: 'Status with Padding', 
      format: '[="Excellent"][#16a34a][BG:Yellow][Border:2px-solid-green][Center][Bold][P:8px-12px]@;[="Good"][#0066cc][BG:lightblue][P:6px]@;[BG:#f0f0f0][P:4px][Italic]@', 
      description: 'Different styling for "Excellent", "Good", and other text values with padding',
      example: 'Padded and styled status indicators'
    },
    { 
      name: 'Currency with Enhanced Styling', 
      format: '[>1000][#ffffff][BG:#16a34a][Bold][Size:16]$#,##0.00;[>0][Green][BG:lightgreen]$#,##0.00;[Red][BG:lightred][Italic]$#,##0.00', 
      description: 'White text on green for >$1000, green text on light green for positive, red italic on light red for negative',
      example: 'Multi-tier currency formatting'
    },
    { 
      name: 'Performance Score Card', 
      format: '[>=90][#ffffff][BG:#16a34a][Bold][Size:18][Center][P:8px][Border:3px-solid-darkgreen]@"% ⭐";[>=70][#663300][BG:#fbbf24][Bold][Center][P:6px][Border:2px-solid-orange]@"% 👍";[#ffffff][BG:#dc2626][Bold][Center][P:6px][Border:2px-solid-red]@"% 👎"', 
      description: 'Performance score with star for ≥90%, thumbs up for ≥70%, thumbs down for <70%',
      example: 'Complete score card with emojis, colors, borders, and padding'
    },
    { 
      name: 'Priority Tags', 
      format: '[="High"][#ffffff][BG:#dc2626][Bold][Size:14][Center][P:4px-8px][Border:1px-solid-red]"🔴 HIGH";[="Medium"][#663300][BG:#fbbf24][Bold][Center][P:4px-8px][Border:1px-solid-orange]"🟡 MEDIUM";[#0066cc][BG:#dbeafe][Center][P:4px-8px][Border:1px-solid-blue]"🔵 LOW"', 
      description: 'Color-coded priority tags with emojis, borders, and padding',
      example: 'Priority level indicators with complete styling'
    },
    { 
      name: 'Temperature Display', 
      format: '[>=25][#ff0000][BG:#ffeeee][Bold][Size:16]@"°C 🔥";[>=15][#ff8800][BG:#fff8ee]@"°C ☀️";[>=5][#0088cc][BG:#eef8ff]@"°C 🌤️";[#0066ff][BG:#eeeeff][Italic]@"°C ❄️"', 
      description: 'Temperature with appropriate colors and weather emojis',
      example: 'Weather-themed temperature display'
    },
    { 
      name: 'Progress Bar Style', 
      format: '[>=100][#ffffff][BG:#16a34a][Bold][Size:14][Center][P:6px-12px][Border:2px-solid-green]@"% COMPLETE";[>=50][#663300][BG:#fbbf24][Bold][Center][P:6px-12px][Border:2px-solid-orange]@"% IN PROGRESS";[#666666][BG:#f3f4f6][Center][P:6px-12px][Border:1px-solid-gray]@"% PENDING"', 
      description: 'Progress bar styling with complete status indicators',
      example: 'Full progress bar with status text and styling'
    }
  ]
};

export const FormatTab: React.FC<FormatTabProps> = ({ uiMode: _uiMode = 'simple' }) => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty: _updateBulkProperty,
    updateBulkProperties,
    quickFormatPinned,
  } = useColumnCustomizationStore();

  const [showFormatterEditor, setShowFormatterEditor] = useState(false);
  const [selectedRichFormatter, setSelectedRichFormatter] = useState<string>('');

  // Get column data type to recommend formats
  const selectedColumnTypes = useMemo(() => {
    const types = new Set<string>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      if (colDef) {
        types.add(colDef.cellDataType || colDef.type || 'text');
      }
    });
    return Array.from(types);
  }, [selectedColumns, columnDefinitions]);

  // Determine if we have a single data type
  const singleDataType = selectedColumnTypes.length === 1 ? selectedColumnTypes[0] : null;

  // Get current formatter for selected columns
  const currentFormatters = useMemo(() => {
    const formatters = new Map<string, any>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);
      
      // Check pending changes first, then fall back to column definition
      let formatter;
      if (pendingChange && 'valueFormatter' in pendingChange) {
        formatter = pendingChange.valueFormatter;
      } else if (colDef) {
        formatter = colDef.valueFormatter;
      }
      
      if (formatter) {
        formatters.set(colId, formatter);
      }
    });
    return formatters;
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Check if all selected columns have the same formatter
  const hasConsistentFormatter = useMemo(() => {
    if (currentFormatters.size === 0) return true;
    if (currentFormatters.size !== selectedColumns.size) return false;
    
    const formatters = Array.from(currentFormatters.values());
    const firstFormatter = formatters[0];
    
    // Check if all formatters are the same
    return formatters.every(formatter => {
      if (typeof formatter === 'function' && typeof firstFormatter === 'function') {
        // Compare format strings if available
        const formatString = (formatter as any).__formatString;
        const firstFormatString = (firstFormatter as any).__formatString;
        
        if (formatString && firstFormatString) {
          return formatString === firstFormatString;
        }
        
        // Can't reliably compare functions otherwise
        return false;
      }
      
      return formatter === firstFormatter;
    });
  }, [currentFormatters, selectedColumns]);

  // Get current format string if consistent
  const currentFormatString = useMemo(() => {
    if (!hasConsistentFormatter || currentFormatters.size === 0) return '';
    
    const formatter = Array.from(currentFormatters.values())[0];
    if (typeof formatter === 'function') {
      return (formatter as any).__formatString || '';
    }
    
    return '';
  }, [hasConsistentFormatter, currentFormatters]);

  // Apply a format to selected columns
  const applyFormat = useCallback(async (formatString: string) => {
    if (selectedColumns.size === 0) return;
    
    console.log('[FormatTab] Applying format:', formatString);
    
    try {
      // Create formatter function
      const formatter = createExcelFormatter(formatString);
      
      // Verify metadata was attached by createExcelFormatter
      console.log('[FormatTab] Created formatter with metadata:', {
        formatString,
        hasFormatString: !!(formatter as any).__formatString,
        hasFormatterType: !!(formatter as any).__formatterType,
        formatStringValue: (formatter as any).__formatString,
        formatterTypeValue: (formatter as any).__formatterType
      });
      
      // For Rich Formatters (pre-built format strings), mark as excel type
      // so they can be edited as format strings but not as visual rules
      // Note: createExcelFormatter already sets this to 'excel', but we can override if needed
      if ((formatter as any).__formatterType !== 'excel') {
        Object.defineProperty(formatter, '__formatterType', { 
          value: 'excel', 
          writable: false,
          enumerable: false,
          configurable: true
        });
        console.log('[FormatTab] Override formatter type to excel');
      }
      
      // Get CSS classes for this format
      const cssClass = getExcelStyleClass(formatString);
      
      // Check if this format has conditional formatting or styling that needs cellStyle function
      const hasStyledContent = formatString.includes('[') && (
        // Basic conditional colors
        formatString.toLowerCase().includes('[green]') || 
        formatString.toLowerCase().includes('[red]') || 
        formatString.toLowerCase().includes('[blue]') || 
        formatString.toLowerCase().includes('[yellow]') || 
        formatString.toLowerCase().includes('[orange]') || 
        formatString.toLowerCase().includes('[purple]') || 
        formatString.toLowerCase().includes('[gray]') || 
        formatString.toLowerCase().includes('[grey]') || 
        // Conditions
        formatString.includes('[>') || 
        formatString.includes('[<') || 
        formatString.includes('[=') || 
        formatString.includes('[#') || // Hex colors
        formatString.includes('[@=') || // Text equality 
        formatString.includes('[<>') ||
        // Extended styling directives
        formatString.includes('Weight:') ||
        formatString.includes('FontWeight:') ||
        formatString.includes('Background:') ||
        formatString.includes('BG:') ||
        formatString.includes('Border:') ||
        formatString.includes('B:') ||
        formatString.includes('Size:') ||
        formatString.includes('FontSize:') ||
        formatString.includes('Align:') ||
        formatString.includes('TextAlign:') ||
        formatString.includes('Padding:') ||
        formatString.includes('P:') ||
        // Keyword styles
        formatString.includes('[Bold]') ||
        formatString.includes('[Italic]') ||
        formatString.includes('[Underline]') ||
        formatString.includes('[Strikethrough]') ||
        formatString.includes('[Center]') ||
        formatString.includes('[Left]') ||
        formatString.includes('[Right]')
      );
      
      const properties: any = {
        valueFormatter: formatter,
        cellClass: cssClass,
        // Enable export with formatter
        useValueFormatterForExport: true
      };
      
      // If format has conditional colors, styling directives, or any conditional formatting
      // We'll handle cellStyle creation in StylingTab to avoid conflicts
      // The valueFormatter's __formatString metadata will be used by StylingTab
      if (hasStyledContent) {
        console.log('[FormatTab] Format contains conditional styling. StylingTab will handle cellStyle creation.');
        
        // Check if we need to update existing cellStyle to work with new format
        const firstColumnId = Array.from(selectedColumns)[0];
        const colDef = columnDefinitions.get(firstColumnId);
        const pendingChange = pendingChanges.get(firstColumnId);
        const existingCellStyle = pendingChange?.cellStyle || colDef?.cellStyle;
        
        // If there's an existing cellStyle with base styles, we need to recreate it
        // to work with the new format string
        if (existingCellStyle) {
          let baseStyle = {};
          
          if (typeof existingCellStyle === 'object') {
            baseStyle = existingCellStyle;
          } else if (typeof existingCellStyle === 'function' && (existingCellStyle as any).__baseStyle) {
            baseStyle = (existingCellStyle as any).__baseStyle;
          }
          
          if (Object.keys(baseStyle).length > 0) {
            // Import the cellStyle function creator
            const { createCellStyleFunction } = await import('@/components/datatable/utils/formatters');
            
            // Create a merged cellStyle function
            const cellStyleFn = (params: { value: unknown }) => {
              // Always start with base styles
              const baseStyles = { ...baseStyle };
              
              // Get conditional styles using createCellStyleFunction with empty base
              const conditionalStyleFn = createCellStyleFunction(formatString, {});
              const conditionalStyles = conditionalStyleFn(params) || {};
              
              // Always merge base and conditional styles, with conditional taking precedence
              const mergedStyles = { ...baseStyles, ...conditionalStyles };
              
              // Return merged styles if we have any, otherwise undefined
              return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
            };
            
            // Attach metadata for future serialization
            Object.defineProperty(cellStyleFn, '__formatString', { 
              value: formatString, 
              writable: false,
              enumerable: false,
              configurable: true
            });
            Object.defineProperty(cellStyleFn, '__baseStyle', { 
              value: baseStyle, 
              writable: false,
              enumerable: false,
              configurable: true
            });
            
            properties.cellStyle = cellStyleFn;
            console.log('[FormatTab] Updated cellStyle to work with new format string while preserving base styles');
          }
        }
      }
      
      // Apply all properties at once
      updateBulkProperties(properties);
    } catch (error) {
      console.error('Error applying format:', error);
    }
  }, [selectedColumns, updateBulkProperties, columnDefinitions, pendingChanges]);

  // Clear format from selected columns
  const clearFormat = useCallback(() => {
    if (selectedColumns.size === 0) return;
    
    // Check if we have base styles to preserve
    const firstColumnId = Array.from(selectedColumns)[0];
    const colDef = columnDefinitions.get(firstColumnId);
    const pendingChange = pendingChanges.get(firstColumnId);
    const existingCellStyle = pendingChange?.cellStyle || colDef?.cellStyle;
    
    let baseStyle = {};
    if (existingCellStyle) {
      if (typeof existingCellStyle === 'object') {
        baseStyle = existingCellStyle;
      } else if (typeof existingCellStyle === 'function' && (existingCellStyle as any).__baseStyle) {
        baseStyle = (existingCellStyle as any).__baseStyle;
      }
    }
    
    // If we have base styles, preserve them; otherwise clear cellStyle
    const properties: any = {
      valueFormatter: undefined,
      cellClass: undefined
    };
    
    if (Object.keys(baseStyle).length > 0) {
      // Preserve base styles
      properties.cellStyle = baseStyle;
    } else {
      // No base styles to preserve, clear cellStyle
      properties.cellStyle = undefined;
    }
    
    updateBulkProperties(properties);
  }, [selectedColumns, updateBulkProperties, columnDefinitions, pendingChanges]);

  // Format presets
  const formatPresets = useMemo(() => [
    // Number formats
    { 
      id: 'number', 
      name: 'Number', 
      icon: Hash, 
      format: '#,##0.00', 
      description: 'Format with thousands separator and 2 decimal places',
      dataTypes: ['number', 'numericColumn']
    },
    { 
      id: 'integer', 
      name: 'Integer', 
      icon: Hash, 
      format: '#,##0', 
      description: 'Whole numbers with thousands separator',
      dataTypes: ['number', 'numericColumn']
    },
    
    // Currency formats
    { 
      id: 'currency', 
      name: 'Currency', 
      icon: DollarSign, 
      format: '$#,##0.00', 
      description: 'US dollars with 2 decimal places',
      dataTypes: ['number', 'numericColumn', 'currency']
    },
    { 
      id: 'accounting', 
      name: 'Accounting', 
      icon: DollarSign, 
      format: '$#,##0.00;($#,##0.00)', 
      description: 'Negative values in parentheses',
      dataTypes: ['number', 'numericColumn', 'currency']
    },
    
    // Percentage formats
    { 
      id: 'percentage', 
      name: 'Percentage', 
      icon: Percent, 
      format: '0.00%', 
      description: 'Percentage with 2 decimal places',
      dataTypes: ['number', 'numericColumn']
    },
    { 
      id: 'percentage-simple', 
      name: 'Percentage (0 dp)', 
      icon: Percent, 
      format: '0%', 
      description: 'Percentage with no decimal places',
      dataTypes: ['number', 'numericColumn']
    },
    
    // Date formats
    { 
      id: 'date-short', 
      name: 'Short Date', 
      icon: Calendar, 
      format: 'MM/DD/YYYY', 
      description: 'MM/DD/YYYY format',
      dataTypes: ['date', 'dateColumn']
    },
    { 
      id: 'date-long', 
      name: 'Long Date', 
      icon: Calendar, 
      format: 'MMMM D, YYYY', 
      description: 'Month Day, Year format',
      dataTypes: ['date', 'dateColumn']
    },
    
    // Text formats
    { 
      id: 'text-prefix', 
      name: 'Text Prefix', 
      icon: Type, 
      format: '"ID: "#', 
      description: 'Add "ID: " prefix to values',
      dataTypes: ['text', 'textColumn', 'string']
    },
    
    // Conditional formats
    { 
      id: 'conditional-color', 
      name: 'Conditional Color', 
      icon: Palette, 
      format: '[&gt;0][Green]#,##0.00;[&lt;0][Red]#,##0.00;0.00', 
      description: 'Green for positive, red for negative',
      dataTypes: ['number', 'numericColumn']
    },
    { 
      id: 'traffic-light', 
      name: 'Traffic Light', 
      icon: Sparkles, 
      format: '[&gt;=90]"🟢 "#0;[&gt;=70]"🟡 "#0;"🔴 "#0', 
      description: 'Colored indicators based on value',
      dataTypes: ['number', 'numericColumn']
    },
    { 
      id: 'arrows', 
      name: 'Arrows', 
      icon: ArrowUp, 
      format: '[&gt;0]"↑ "#,##0.00;[&lt;0]"↓ "#,##0.00;"-"', 
      description: 'Up/down arrows for positive/negative',
      dataTypes: ['number', 'numericColumn']
    }
  ], []);

  // Filter presets based on selected column types
  const recommendedPresets = useMemo(() => {
    if (selectedColumnTypes.length === 0) return [];
    
    return formatPresets.filter(preset => {
      // If no specific data types, show for all
      if (!preset.dataTypes) return true;
      
      // Check if any selected column type matches any preset data type
      return selectedColumnTypes.some(type => 
        preset.dataTypes.some(presetType => 
          type.includes(presetType) || presetType.includes(type)
        )
      );
    });
  }, [selectedColumnTypes, formatPresets]);

  // Get pinned formats
  const pinnedFormats = useMemo(() => {
    return formatPresets.filter(preset => quickFormatPinned.includes(preset.id));
  }, [formatPresets, quickFormatPinned]);

  // Handle opening the formatter editor
  const openFormatterEditor = useCallback(() => {
    setShowFormatterEditor(true);
  }, []);

  // Handle saving from formatter editor
  const handleSaveFormatter = useCallback(async (formatter: (params: { value: unknown }) => string, cellStyle?: (params: { value: unknown }) => React.CSSProperties) => {
    if (selectedColumns.size === 0) return;
    
    const properties: any = {
      valueFormatter: formatter,
      // Enable export with formatter
      useValueFormatterForExport: true
    };
    
    // Check if formatter has format string metadata (Excel format)
    const formatString = (formatter as any).__formatString;
    if (formatString) {
      // Apply CSS class based on format
      const cssClass = getExcelStyleClass(formatString);
      if (cssClass) {
        properties.cellClass = cssClass;
      }
      
      // If we have a format string with styling AND a cellStyle function from ValueFormatterEditor
      // We need to merge them with any existing base styles
      if (cellStyle || formatString.match(/\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right|#[0-9A-Fa-f]{3,6}|Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|Magenta|Cyan)/i)) {
        // Get existing base styles
        const firstColumnId = Array.from(selectedColumns)[0];
        const colDef = columnDefinitions.get(firstColumnId);
        const pendingChange = pendingChanges.get(firstColumnId);
        const existingCellStyle = pendingChange?.cellStyle || colDef?.cellStyle;
        
        let baseStyle = {};
        if (existingCellStyle) {
          if (typeof existingCellStyle === 'object') {
            baseStyle = existingCellStyle;
          } else if (typeof existingCellStyle === 'function' && (existingCellStyle as any).__baseStyle) {
            baseStyle = (existingCellStyle as any).__baseStyle;
          }
        }
        
        // Import the cellStyle function creator
        const { createCellStyleFunction } = await import('@/components/datatable/utils/formatters');
        
        // Create a merged cellStyle function
        const mergedCellStyleFn = (params: { value: unknown }) => {
          // Start with base styles from styling tab
          const baseStyles = Object.keys(baseStyle).length > 0 ? { ...baseStyle } : {};
          
          // Get conditional styles from format string if any
          let conditionalStyles = {};
          if (formatString.match(/\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right|#[0-9A-Fa-f]{3,6}|Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|Magenta|Cyan)/i)) {
            const conditionalStyleFn = createCellStyleFunction(formatString, {});
            conditionalStyles = conditionalStyleFn(params) || {};
          }
          
          // Get styles from ValueFormatterEditor if any
          let editorStyles = {};
          if (cellStyle) {
            editorStyles = cellStyle(params) || {};
          }
          
          // Merge all styles: base -> conditional -> editor (later ones take precedence)
          const mergedStyles = { ...baseStyles, ...conditionalStyles, ...editorStyles };
          
          // Return merged styles if we have any
          return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
        };
        
        // Attach metadata
        Object.defineProperty(mergedCellStyleFn, '__formatString', { 
          value: formatString, 
          writable: false,
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(mergedCellStyleFn, '__baseStyle', { 
          value: baseStyle, 
          writable: false,
          enumerable: false,
          configurable: true
        });
        
        properties.cellStyle = mergedCellStyleFn;
      }
    } else if (cellStyle) {
      // No format string but we have cellStyle from ValueFormatterEditor
      // Need to preserve existing base styles
      const firstColumnId = Array.from(selectedColumns)[0];
      const colDef = columnDefinitions.get(firstColumnId);
      const pendingChange = pendingChanges.get(firstColumnId);
      const existingCellStyle = pendingChange?.cellStyle || colDef?.cellStyle;
      
      let baseStyle = {};
      if (existingCellStyle) {
        if (typeof existingCellStyle === 'object') {
          baseStyle = existingCellStyle;
        } else if (typeof existingCellStyle === 'function' && (existingCellStyle as any).__baseStyle) {
          baseStyle = (existingCellStyle as any).__baseStyle;
        }
      }
      
      // Create merged function
      const mergedCellStyleFn = (params: { value: unknown }) => {
        const baseStyles = Object.keys(baseStyle).length > 0 ? { ...baseStyle } : {};
        const editorStyles = cellStyle(params) || {};
        const mergedStyles = { ...baseStyles, ...editorStyles };
        return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
      };
      
      properties.cellStyle = mergedCellStyleFn;
    }
    
    // Apply all properties
    updateBulkProperties(properties);
    setShowFormatterEditor(false);
  }, [selectedColumns, updateBulkProperties, columnDefinitions, pendingChanges]);

  const isDisabled = selectedColumns.size === 0;

  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-4 space-y-6">
        {/* Header with description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-none">Format Values</h3>
          <p className="text-sm text-muted-foreground">
            Apply formatting to display values in a specific way without changing the underlying data.
          </p>
        </div>

        {/* Rich Formatter Dropdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Rich Formatters Library
            </CardTitle>
            <CardDescription className="text-sm">
              Comprehensive collection of predefined formatters including conditional colors, emojis, and symbols
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDisabled ? (
              <Alert className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Select one or more columns to apply rich formatting
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <Select value={selectedRichFormatter} onValueChange={setSelectedRichFormatter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose from rich formatter library..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {Object.entries(RICH_FORMATTERS).map(([category, formatters]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category}
                        </div>
                        {formatters.map((formatter, index) => (
                          <SelectItem 
                            key={`${category}-${index}`} 
                            value={formatter.format}
                            className="flex flex-col items-start py-3"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{formatter.name}</span>
                              <Badge variant="outline" className="text-xs font-mono ml-2">
                                {formatter.example}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                              {formatter.description}
                            </span>
                          </SelectItem>
                        ))}
                        {category !== Object.keys(RICH_FORMATTERS)[Object.keys(RICH_FORMATTERS).length - 1] && (
                          <SelectSeparator />
                        )}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedRichFormatter && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        applyFormat(selectedRichFormatter);
                        setSelectedRichFormatter('');
                      }}
                      className="flex-1 gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Apply Rich Format
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRichFormatter('')}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                )}
                
                {selectedRichFormatter && (
                  <div className="p-3 bg-muted/30 rounded-md border">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Format String</span>
                    </div>
                    <code className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                      {selectedRichFormatter}
                    </code>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Format Buttons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Formats
            </CardTitle>
            <CardDescription className="text-sm">
              Apply common formats with one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDisabled ? (
              <Alert className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Select one or more columns to apply formatting
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {singleDataType && recommendedPresets.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Recommended for {singleDataType}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {recommendedPresets.slice(0, 6).map(preset => (
                        <Button
                          key={preset.id}
                          variant="outline"
                          size="sm"
                          onClick={() => applyFormat(preset.format)}
                          disabled={isDisabled}
                          className="h-9 justify-start gap-2 text-sm"
                          title={preset.description}
                        >
                          <preset.icon className="h-4 w-4 text-primary" />
                          <span className="truncate">{preset.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pinnedFormats.map(format => (
                    <Button
                      key={format.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyFormat(format.format)}
                      disabled={isDisabled}
                      className={`h-9 justify-start gap-2 text-sm ${
                        currentFormatString === format.format ? 'border-primary bg-primary/10' : ''
                      }`}
                      title={format.description}
                    >
                      <format.icon className="h-4 w-4 text-primary" />
                      <span className="truncate">{format.name}</span>
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFormat}
                    disabled={isDisabled || currentFormatters.size === 0}
                    className="h-9 justify-start gap-2 text-sm"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span>Clear Format</span>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Custom Format Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Custom Format
            </CardTitle>
            <CardDescription className="text-sm">
              Create advanced formatting with Excel-like syntax
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDisabled ? (
              <Alert className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Select one or more columns to apply custom formatting
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {!hasConsistentFormatter && currentFormatters.size > 0 && (
                  <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                      Selected columns have different formats. Applying a new format will override all of them.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Current Format</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {currentFormatString || 'None'}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={openFormatterEditor}
                    disabled={isDisabled}
                    className="w-full justify-center gap-2 h-9"
                  >
                    <Palette className="h-4 w-4" />
                    <span>Open Format Editor</span>
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Format Guide</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 gap-1"
                      onClick={() => window.open('https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68', '_blank')}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span className="text-xs">Help</span>
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1.5">
                    <p><strong>Basic:</strong> <code className="bg-muted px-1 py-0.5 rounded">#,##0.00</code> - Number with thousands separator and 2 decimals</p>
                    <p><strong>Currency:</strong> <code className="bg-muted px-1 py-0.5 rounded">$#,##0.00</code> - Currency with symbol</p>
                    <p><strong>Percentage:</strong> <code className="bg-muted px-1 py-0.5 rounded">0.00%</code> - Percentage with 2 decimals</p>
                    <p><strong>Conditional:</strong> <code className="bg-muted px-1 py-0.5 rounded">[&gt;0][Green]#,##0;[Red]#,##0</code> - Color based on value</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Format Preview */}
        {!isDisabled && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Format Preview
              </CardTitle>
              <CardDescription className="text-sm">
                See how your format will look with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Original</Label>
                    <div className="p-2 bg-muted/30 rounded-md border text-sm">
                      {singleDataType === 'number' ? '1234.56' : 
                       singleDataType === 'date' ? '2023-01-15' : 
                       'Sample Text'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Formatted</Label>
                    <div className="p-2 bg-primary/5 rounded-md border border-primary/20 text-sm font-medium">
                      {currentFormatString ? (
                        singleDataType === 'number' ? '$1,234.56' : 
                        singleDataType === 'date' ? 'Jan 15, 2023' : 
                        'Sample Text'
                      ) : (
                        <span className="text-muted-foreground italic">No format applied</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Value Formatter Editor Dialog */}
        <ValueFormatterEditor
          open={showFormatterEditor}
          onOpenChange={setShowFormatterEditor}
          initialFormatter={currentFormatters.size > 0 && hasConsistentFormatter ? 
            Array.from(currentFormatters.values())[0] : undefined}
          onSave={handleSaveFormatter}
          title="Custom Value Formatter"
          columnType={singleDataType as 'text' | 'number' | 'date' | 'boolean'}
        />
      </div>
    </ScrollArea>
  );
};

export default FormatTab;