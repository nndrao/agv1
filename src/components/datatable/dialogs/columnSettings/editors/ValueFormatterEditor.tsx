import React, { useState, useEffect, useMemo } from 'react';
import { FormatterFunction } from '@/components/datatable/types';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Palette,
  ArrowUp,
  ArrowDown,
  Settings,
  Copy,
  Check
} from 'lucide-react';

interface ValueFormatterEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFormatter?: (params: { value: unknown }) => string;
  onSave: (formatter: (params: { value: unknown }) => string, cellStyle?: (params: { value: unknown }) => React.CSSProperties) => void;
  title: string;
  columnType?: 'text' | 'number' | 'date' | 'boolean';
}

interface FormattingRule {
  id: string;
  condition: {
    type: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'greaterEqual' | 'lessEqual' | 'between' | 'isEmpty' | 'isNotEmpty';
    value: string;
    value2?: string; // for 'between' condition
  };
  display: {
    type: 'text' | 'original' | 'custom';
    text: string;
  };
  styling: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline' | 'line-through';
    textAlign?: 'left' | 'center' | 'right';
    border?: {
      width: number;
      style: 'solid' | 'dashed' | 'dotted' | 'double';
      color: string;
      sides: {
        top: boolean;
        right: boolean;
        bottom: boolean;
        left: boolean;
      };
    };
    padding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  enabled: boolean;
}

const DEFAULT_RULE: Omit<FormattingRule, 'id'> = {
  condition: {
    type: 'equals',
    value: ''
  },
  display: {
    type: 'custom',
    text: ''
  },
  styling: {
    // All styling properties start as undefined - only apply what user explicitly sets
    backgroundColor: undefined,
    textColor: undefined,
    fontSize: undefined,
    fontWeight: undefined,
    fontStyle: undefined,
    textDecoration: undefined,
    textAlign: undefined,
    border: {
      width: 0,
      style: 'solid',
      color: '#000000',
      sides: {
        top: false,
        right: false,
        bottom: false,
        left: false
      }
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  },
  enabled: true
};

const CONDITION_OPTIONS = [
  { value: 'equals', label: 'Equals', needsValue: true, needsValue2: false },
  { value: 'contains', label: 'Contains', needsValue: true, needsValue2: false },
  { value: 'startsWith', label: 'Starts with', needsValue: true, needsValue2: false },
  { value: 'endsWith', label: 'Ends with', needsValue: true, needsValue2: false },
  { value: 'greaterThan', label: 'Greater than', needsValue: true, needsValue2: false },
  { value: 'lessThan', label: 'Less than', needsValue: true, needsValue2: false },
  { value: 'greaterEqual', label: 'Greater than or equal', needsValue: true, needsValue2: false },
  { value: 'lessEqual', label: 'Less than or equal', needsValue: true, needsValue2: false },
  { value: 'between', label: 'Between', needsValue: true, needsValue2: true },
  { value: 'isEmpty', label: 'Is empty', needsValue: false, needsValue2: false },
  { value: 'isNotEmpty', label: 'Is not empty', needsValue: false, needsValue2: false }
];

const SAMPLE_DATA = {
  text: ['Sample Text', 'Hello World', 'Test', '', 'Option1'],
  number: [1, 25, 100, 0, -5, 150],
  date: ['2024-01-15', '2024-12-25', '2024-06-30'],
  boolean: [true, false, true]
};

export const ValueFormatterEditor: React.FC<ValueFormatterEditorProps> = ({
  open,
  onOpenChange,
  initialFormatter,
  onSave,
  title,
  columnType = 'text'
}) => {
  const [rules, setRules] = useState<FormattingRule[]>([]);
  const [defaultFallback, setDefaultFallback] = useState({
    display: { type: 'original' as const, text: '' },
    styling: {
      // Default fallback styling also starts undefined - no styles unless explicitly set
      backgroundColor: undefined,
      textColor: undefined,
      fontSize: undefined,
      fontWeight: undefined,
      fontStyle: undefined,
      textDecoration: undefined,
      textAlign: undefined,
      border: {
        width: 0,
        style: 'solid' as const,
        color: '#000000',
        sides: {
          top: false,
          right: false,
          bottom: false,
          left: false
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    }
  });
  const [copiedFormatter, setCopiedFormatter] = useState(false);
  const [copiedCellStyle, setCopiedCellStyle] = useState(false);
  const [copiedExcel, setCopiedExcel] = useState(false);

  // Initialize rules from existing formatter
  useEffect(() => {
    if (initialFormatter && typeof initialFormatter === 'function') {
      // Check if the formatter has visual editor metadata
      const visualRules = (initialFormatter as FormatterFunction).__visualRules;
      const visualDefaultFallback = (initialFormatter as FormatterFunction).__visualDefaultFallback;
      
      console.log('[ValueFormatterEditor] Initializing from existing formatter:', {
        hasVisualRules: !!visualRules,
        hasDefaultFallback: !!visualDefaultFallback,
        rulesCount: visualRules?.length || 0
      });
      
      if (visualRules && Array.isArray(visualRules)) {
        // Restore the original rules
        setRules(visualRules);
        console.log('[ValueFormatterEditor] Restored', visualRules.length, 'rules from metadata');
      } else {
        // No visual rules available - start with empty rules
        setRules([]);
        console.log('[ValueFormatterEditor] No visual rules found - starting with empty rules');
      }
      
      if (visualDefaultFallback) {
        // Restore the default fallback
        setDefaultFallback(visualDefaultFallback);
        console.log('[ValueFormatterEditor] Restored default fallback from metadata');
      }
    } else {
      setRules([]);
    }
  }, [initialFormatter]);

  const addRule = () => {
    const newRule: FormattingRule = {
      id: Date.now().toString(),
      ...DEFAULT_RULE
    };
    setRules(prev => [...prev, newRule]);
  };

  const updateRule = (id: string, updates: Partial<FormattingRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
  };

  const moveRule = (id: string, direction: 'up' | 'down') => {
    setRules(prev => {
      const index = prev.findIndex(rule => rule.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newRules = [...prev];
      [newRules[index], newRules[newIndex]] = [newRules[newIndex], newRules[index]];
      return newRules;
    });
  };

  // Check if a value matches a condition
  const matchesCondition = (value: unknown, condition: FormattingRule['condition']): boolean => {
    const strValue = String(value || '');
    const numValue = Number(value);
    
    switch (condition.type) {
      case 'equals':
        return strValue === condition.value;
      case 'contains':
        return strValue.toLowerCase().includes(condition.value.toLowerCase());
      case 'startsWith':
        return strValue.toLowerCase().startsWith(condition.value.toLowerCase());
      case 'endsWith':
        return strValue.toLowerCase().endsWith(condition.value.toLowerCase());
      case 'greaterThan':
        return !isNaN(numValue) && numValue > Number(condition.value);
      case 'lessThan':
        return !isNaN(numValue) && numValue < Number(condition.value);
      case 'greaterEqual':
        return !isNaN(numValue) && numValue >= Number(condition.value);
      case 'lessEqual':
        return !isNaN(numValue) && numValue <= Number(condition.value);
      case 'between':
        return !isNaN(numValue) && numValue >= Number(condition.value) && numValue <= Number(condition.value2 || condition.value);
      case 'isEmpty':
        return strValue === '';
      case 'isNotEmpty':
        return strValue !== '';
      default:
        return false;
    }
  };

  // Generate display text based on rule
  const getDisplayText = (value: unknown, display: FormattingRule['display']): string => {
    switch (display.type) {
      case 'original':
        return String(value || '');
      case 'text':
      case 'custom':
        return display.text;
      default:
        return String(value || '');
    }
  };

  // Convert styling object to CSS properties - only include explicitly set properties
  const styleToCss = (styling: FormattingRule['styling']): React.CSSProperties => {
    const css: React.CSSProperties = {};

    // Only include properties that are explicitly defined (not undefined)
    if (styling.backgroundColor !== undefined) {
      css.backgroundColor = styling.backgroundColor;
    }
    if (styling.textColor !== undefined) {
      css.color = styling.textColor;
    }
    if (styling.fontSize !== undefined) {
      css.fontSize = `${styling.fontSize}px`;
    }
    if (styling.fontWeight !== undefined) {
      css.fontWeight = styling.fontWeight;
    }
    if (styling.fontStyle !== undefined) {
      css.fontStyle = styling.fontStyle;
    }
    if (styling.textDecoration !== undefined) {
      css.textDecoration = styling.textDecoration;
    }
    if (styling.textAlign !== undefined) {
      css.textAlign = styling.textAlign;
    }

    // Handle padding - only if any side has a value > 0
    if (styling.padding && (styling.padding.top > 0 || styling.padding.right > 0 || styling.padding.bottom > 0 || styling.padding.left > 0)) {
      css.padding = `${styling.padding.top}px ${styling.padding.right}px ${styling.padding.bottom}px ${styling.padding.left}px`;
    }

    // Handle borders - only if width > 0 and at least one side is enabled
    if (styling.border && styling.border.width > 0 && (styling.border.sides.top || styling.border.sides.right || styling.border.sides.bottom || styling.border.sides.left)) {
      const borderStyle = `${styling.border.width}px ${styling.border.style} ${styling.border.color}`;
      if (styling.border.sides.top) css.borderTop = borderStyle;
      if (styling.border.sides.right) css.borderRight = borderStyle;
      if (styling.border.sides.bottom) css.borderBottom = borderStyle;
      if (styling.border.sides.left) css.borderLeft = borderStyle;
    }

    console.log('[ValueFormatterEditor] styleToCss generated:', css);
    return css;
  };

  // Generate the formatter function
  const generateFormatter = (): (params: { value: unknown }) => string => {
    return (params: { value: unknown }) => {
      const value = params.value;
      
      // Check each rule in order
      for (const rule of rules) {
        if (rule.enabled && matchesCondition(value, rule.condition)) {
          return getDisplayText(value, rule.display);
        }
      }
      
      // Fallback to default
      return getDisplayText(value, defaultFallback.display);
    };
  };

  // Generate the cell style function
  const generateCellStyle = (): (params: { value: unknown }) => React.CSSProperties | undefined => {
    return (params: { value: unknown }) => {
      const value = params.value;
      
      // Check each rule in order
      for (const rule of rules) {
        if (rule.enabled && matchesCondition(value, rule.condition)) {
          const ruleStyles = styleToCss(rule.styling);
          // Only return styles if there are actually some set
          return Object.keys(ruleStyles).length > 0 ? ruleStyles : undefined;
        }
      }
      
      // Fallback to default styling - only if there are actually some styles set
      const fallbackStyles = styleToCss(defaultFallback.styling);
      return Object.keys(fallbackStyles).length > 0 ? fallbackStyles : undefined;
    };
  };

     // Generate Excel-style format string with extended styling syntax
   const generateExcelFormatString = (): string => {
     if (rules.length === 0) {
       return '@'; // Default: show original value
     }

     const sections: string[] = [];
     
     // Process each rule to create format sections
     rules.forEach((rule, _index) => {
       if (!rule.enabled) return;
       
       let section = '';
       
       // Add condition
       switch (rule.condition.type) {
         case 'equals':
           // For exact matches, we'll use positive/negative/zero format
           if (!isNaN(Number(rule.condition.value))) {
             const num = Number(rule.condition.value);
             if (num > 0) section += '[>0]';
             else if (num < 0) section += '[<0]';
             else section += '[=0]';
           } else {
             section += `[="${rule.condition.value}"]`;
           }
           break;
         case 'greaterThan':
           section += `[>${rule.condition.value}]`;
           break;
         case 'lessThan':
           section += `[<${rule.condition.value}]`;
           break;
         case 'greaterEqual':
           section += `[>=${rule.condition.value}]`;
           break;
         case 'lessEqual':
           section += `[<=${rule.condition.value}]`;
           break;
         case 'between':
           section += `[>=${rule.condition.value}][<=${rule.condition.value2 || rule.condition.value}]`;
           break;
         case 'isEmpty':
           section += '[@=""]';
           break;
         case 'isNotEmpty':
           section += '[<>""]';
           break;
         case 'contains':
           section += `[="*${rule.condition.value}*"]`;
           break;
         case 'startsWith':
           section += `[="${rule.condition.value}*"]`;
           break;
         case 'endsWith':
           section += `[="*${rule.condition.value}"]`;
           break;
         default:
           // For text conditions, we'll create a text-based format
           section += `[="${rule.condition.value}"]`;
       }
       
       // Add extended styling directives - only for explicitly set properties
       
       // Text color - only if explicitly set
       if (rule.styling.textColor !== undefined) {
         const colorName = getColorName(rule.styling.textColor);
         if (colorName) {
           section += `[${colorName}]`;
         } else {
           section += `[${rule.styling.textColor}]`;
         }
       }
       
       // Background color - only if explicitly set
       if (rule.styling.backgroundColor !== undefined) {
         section += `[BG:${rule.styling.backgroundColor}]`;
       }
       
       // Font size - only if explicitly set
       if (rule.styling.fontSize !== undefined) {
         section += `[Size:${rule.styling.fontSize}]`;
       }
       
       // Font weight - only if explicitly set
       if (rule.styling.fontWeight !== undefined) {
         if (rule.styling.fontWeight === 'bold' || rule.styling.fontWeight === '700') {
           section += '[Bold]';
         } else {
           section += `[Weight:${rule.styling.fontWeight}]`;
         }
       }
       
       // Font style - only if explicitly set
       if (rule.styling.fontStyle !== undefined && rule.styling.fontStyle === 'italic') {
         section += '[Italic]';
       }
       
       // Text decoration - only if explicitly set
       if (rule.styling.textDecoration !== undefined) {
         if (rule.styling.textDecoration === 'underline') {
           section += '[Underline]';
         } else if (rule.styling.textDecoration === 'line-through') {
           section += '[Strikethrough]';
         }
       }
       
       // Text alignment - only if explicitly set
       if (rule.styling.textAlign !== undefined) {
         if (rule.styling.textAlign === 'center') {
           section += '[Center]';
         } else if (rule.styling.textAlign === 'right') {
           section += '[Right]';
         } else if (rule.styling.textAlign === 'left') {
           section += '[Left]';
         }
       }
       
       // Border - only if explicitly set (width > 0 and at least one side enabled)
       if (rule.styling.border && rule.styling.border.width > 0 && (rule.styling.border.sides.top || rule.styling.border.sides.right || rule.styling.border.sides.bottom || rule.styling.border.sides.left)) {
         const { width, style, color, sides } = rule.styling.border;
         
         // Check if all sides are enabled (full border)
         const allSides = sides.top && sides.right && sides.bottom && sides.left;
         
         if (allSides) {
           section += `[Border:${width}px-${style}-${color}]`;
         } else {
           // For individual sides, we'll use a simplified notation
           const activeSides = [];
           if (sides.top) activeSides.push('top');
           if (sides.right) activeSides.push('right');  
           if (sides.bottom) activeSides.push('bottom');
           if (sides.left) activeSides.push('left');
           section += `[Border:${width}px-${style}-${color}-${activeSides.join('+')}]`;
         }
       }
       
       // Padding - only if explicitly set (any side > 0)
       if (rule.styling.padding && (rule.styling.padding.top > 0 || rule.styling.padding.right > 0 || rule.styling.padding.bottom > 0 || rule.styling.padding.left > 0)) {
         const { top, right, bottom, left } = rule.styling.padding;
         
         if (top === right && right === bottom && bottom === left) {
           // All sides same
           section += `[P:${top}px]`;
         } else if (top === bottom && left === right) {
           // Vertical/horizontal same
           section += `[P:${top}px-${left}px]`;
         } else {
           // All different
           section += `[P:${top}px-${right}px-${bottom}px-${left}px]`;
         }
       }
       
       // Add display format
       if (rule.display.type === 'custom') {
         section += `"${rule.display.text}"`;
       } else {
         // Determine number format based on column type and value
         if (columnType === 'number') {
           section += '#,##0.00';
         } else {
           section += '@'; // Text format
         }
       }
       
       sections.push(section);
     });
     
     // Add default fallback
     if (defaultFallback.display.type === 'text') {
       sections.push(`"${defaultFallback.display.text}"`);
     } else {
       sections.push('@'); // Show original value
     }
     
     return sections.join(';') || '@';
   };

   // Helper function to get color names for Excel format
   const getColorName = (hexColor: string): string | null => {
     const colorMap: Record<string, string> = {
       '#ff0000': 'Red',
       '#00ff00': 'Green', 
       '#0000ff': 'Blue',
       '#ffff00': 'Yellow',
       '#ff00ff': 'Magenta',
       '#00ffff': 'Cyan',
       '#000000': 'Black',
       '#ffffff': 'White',
       '#16a34a': 'Green',
       '#dc2626': 'Red',
       '#2563eb': 'Blue',
       '#ca8a04': 'Yellow'
     };
     return colorMap[hexColor.toLowerCase()] || null;
   };

   // Generate readable formatter code for display
   const generateFormatterCode = (): string => {
     if (rules.length === 0) {
       return `(params) => {
   // No rules defined - return original value
   return String(params.value || '');
 }`;
     }

     const conditions = rules.map((rule, index) => {
       if (!rule.enabled) return `  // Rule ${index + 1} (disabled)`;
       
       let conditionCheck = '';
       const value = rule.condition.value;
       const value2 = rule.condition.value2;
       
       switch (rule.condition.type) {
         case 'equals':
           conditionCheck = `String(value) === '${value}'`;
           break;
         case 'contains':
           conditionCheck = `String(value).toLowerCase().includes('${value.toLowerCase()}')`;
           break;
         case 'startsWith':
           conditionCheck = `String(value).toLowerCase().startsWith('${value.toLowerCase()}')`;
           break;
         case 'endsWith':
           conditionCheck = `String(value).toLowerCase().endsWith('${value.toLowerCase()}')`;
           break;
         case 'greaterThan':
           conditionCheck = `Number(value) > ${value}`;
           break;
         case 'lessThan':
           conditionCheck = `Number(value) < ${value}`;
           break;
         case 'greaterEqual':
           conditionCheck = `Number(value) >= ${value}`;
           break;
         case 'lessEqual':
           conditionCheck = `Number(value) <= ${value}`;
           break;
         case 'between':
           conditionCheck = `Number(value) >= ${value} && Number(value) <= ${value2 || value}`;
           break;
         case 'isEmpty':
           conditionCheck = `String(value) === ''`;
           break;
         case 'isNotEmpty':
           conditionCheck = `String(value) !== ''`;
           break;
       }
       
       const returnValue = rule.display.type === 'custom' 
         ? `'${rule.display.text}'` 
         : 'String(value)';
       
       return `  if (${conditionCheck}) {
     return ${returnValue}; // Rule ${index + 1}
   }`;
     }).filter(Boolean).join('\n');

     const fallbackReturn = defaultFallback.display.type === 'text' 
       ? `'${defaultFallback.display.text}'`
       : 'String(value || \'\')';

     return `(params) => {
   const value = params.value;
   
 ${conditions}
   
   // Default fallback
   return ${fallbackReturn};
 }`;
   };

   // Generate readable cell style code for display
   const generateCellStyleCode = (): string => {
     if (rules.length === 0) {
       return `(params) => {
   // No styling rules defined
   return ${JSON.stringify(styleToCss(defaultFallback.styling), null, 2)};
 }`;
     }

     const conditions = rules.map((rule, index) => {
       if (!rule.enabled) return `  // Rule ${index + 1} (disabled)`;
       
       let conditionCheck = '';
       const value = rule.condition.value;
       const value2 = rule.condition.value2;
       
       switch (rule.condition.type) {
         case 'equals':
           conditionCheck = `String(value) === '${value}'`;
           break;
         case 'contains':
           conditionCheck = `String(value).toLowerCase().includes('${value.toLowerCase()}')`;
           break;
         case 'greaterThan':
           conditionCheck = `Number(value) > ${value}`;
           break;
         case 'lessThan':
           conditionCheck = `Number(value) < ${value}`;
           break;
         case 'between':
           conditionCheck = `Number(value) >= ${value} && Number(value) <= ${value2 || value}`;
           break;
         case 'isEmpty':
           conditionCheck = `String(value) === ''`;
           break;
         case 'isNotEmpty':
           conditionCheck = `String(value) !== ''`;
           break;
         default:
           conditionCheck = `String(value) === '${value}'`;
       }
       
       const styles = styleToCss(rule.styling);
       const styleString = JSON.stringify(styles, null, 4).replace(/\n/g, '\n     ');
       
       return `  if (${conditionCheck}) {
     return ${styleString}; // Rule ${index + 1}
   }`;
     }).filter(Boolean).join('\n');

     const fallbackStyles = styleToCss(defaultFallback.styling);
     const fallbackStyleString = JSON.stringify(fallbackStyles, null, 2);

     return `(params) => {
   const value = params.value;
   
 ${conditions}
   
   // Default fallback
   return ${fallbackStyleString};
 }`;
   };

   // Preview data with applied formatting
   const previewData = useMemo(() => {
     const sampleValues = SAMPLE_DATA[columnType] || SAMPLE_DATA.text;
     const formatter = generateFormatter();
     const styleFunc = generateCellStyle();
     
     return sampleValues.map(value => ({
       original: value,
       formatted: formatter({ value }),
       style: styleFunc({ value })
     }));
   }, [rules, defaultFallback, generateFormatter, generateCellStyle]);

     const handleSave = () => {
     const formatter = generateFormatter();
     const cellStyle = generateCellStyle();
     const excelFormatString = generateExcelFormatString();
     
     // Attach Excel format string metadata to the formatter
     Object.defineProperty(formatter, '__formatString', { 
       value: excelFormatString, 
       writable: false,
       enumerable: false,
       configurable: true
     });
     
     // Attach formatter type metadata
     Object.defineProperty(formatter, '__formatterType', { 
       value: 'visual', 
       writable: false,
       enumerable: false,
       configurable: true
     });
     
     // Attach visual editor metadata for full round-trip editing
     Object.defineProperty(formatter, '__visualRules', { 
       value: rules, 
       writable: false,
       enumerable: false,
       configurable: true
     });
     
     Object.defineProperty(formatter, '__visualDefaultFallback', { 
       value: defaultFallback, 
       writable: false,
       enumerable: false,
       configurable: true
     });
     
     console.log('[ValueFormatterEditor] Generated formatter with metadata:', {
       formatString: excelFormatString,
       rulesCount: rules.length,
       hasDefaultFallback: !!defaultFallback
     });
     
     onSave(formatter, cellStyle);
     onOpenChange(false);
   };

   // Copy to clipboard functions
   const copyFormatterCode = async () => {
     try {
       await navigator.clipboard.writeText(generateFormatterCode());
       setCopiedFormatter(true);
       setTimeout(() => setCopiedFormatter(false), 2000);
     } catch (err) {
       console.error('Failed to copy formatter code:', err);
     }
   };

   const copyCellStyleCode = async () => {
     try {
       await navigator.clipboard.writeText(generateCellStyleCode());
       setCopiedCellStyle(true);
       setTimeout(() => setCopiedCellStyle(false), 2000);
     } catch (err) {
       console.error('Failed to copy cell style code:', err);
     }
   };

   const copyExcelFormat = async () => {
     try {
       await navigator.clipboard.writeText(generateExcelFormatString());
       setCopiedExcel(true);
       setTimeout(() => setCopiedExcel(false), 2000);
     } catch (err) {
       console.error('Failed to copy Excel format:', err);
     }
   };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[800px] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {title} - Conditional Formatter Builder
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-full overflow-hidden">
          {/* Rules Panel */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Formatting Rules</h3>
                  <p className="text-sm text-muted-foreground">Rules are applied in order. First matching rule wins.</p>
                </div>
                <Button onClick={addRule} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {rules.map((rule, index) => (
                  <RuleEditor
                    key={rule.id}
                    rule={rule}
                    index={index}
                    totalRules={rules.length}
                    onUpdate={(updates) => updateRule(rule.id, updates)}
                    onDelete={() => deleteRule(rule.id)}
                    onMove={(direction) => moveRule(rule.id, direction)}
                    columnType={columnType}
                  />
                ))}

                {/* Default Fallback */}
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Default (Fallback)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Applied when no rules match
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Display</Label>
                        <Select
                          value={defaultFallback.display.type}
                          onValueChange={(value: 'original' | 'text') => 
                            setDefaultFallback(prev => ({
                              ...prev,
                              display: { ...prev.display, type: value }
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="original">Show Original Value</SelectItem>
                            <SelectItem value="text">Custom Text</SelectItem>
                          </SelectContent>
                        </Select>
                        {defaultFallback.display.type === 'text' && (
                          <Input
                            placeholder="Default text"
                            value={defaultFallback.display.text}
                            onChange={(e) => 
                              setDefaultFallback(prev => ({
                                ...prev,
                                display: { ...prev.display, text: e.target.value }
                              }))
                            }
                            className="h-8"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>

          {/* Preview Panel */}
          <div className="w-[350px] border-l bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </h3>
              <p className="text-sm text-muted-foreground">
                See how your rules will look with sample data
              </p>
            </div>
            
                         <ScrollArea className="flex-1 p-4">
               <div className="space-y-4">
                 {/* Live Preview Section */}
                 <div className="space-y-3">
                   {previewData.map((item, index) => (
                     <div key={index} className="space-y-1">
                       <div className="text-xs text-muted-foreground">
                         Input: <code className="bg-background px-1 py-0.5 rounded">{JSON.stringify(item.original)}</code>
                       </div>
                       <div 
                         className="p-3 rounded border text-sm font-medium min-h-[40px] flex items-center"
                         style={item.style}
                       >
                         {item.formatted}
                       </div>
                     </div>
                   ))}
                 </div>

                 <Separator />

                 {/* Generated Code Section */}
                 <div className="space-y-2">
                   <div className="flex items-center gap-2">
                     <Settings className="h-4 w-4" />
                     <h4 className="font-semibold text-sm">Generated Code</h4>
                   </div>
                   
                                        <Tabs defaultValue="excel" className="w-full">
                     <TabsList className="grid w-full grid-cols-3">
                       <TabsTrigger value="excel" className="text-xs">Excel Format</TabsTrigger>
                       <TabsTrigger value="formatter" className="text-xs">JavaScript</TabsTrigger>
                       <TabsTrigger value="cellStyle" className="text-xs">Cell Style</TabsTrigger>
                     </TabsList>
                     
                     <TabsContent value="excel" className="mt-2">
                       <div className="bg-muted/50 rounded border">
                         <div className="flex items-center justify-between p-2 border-b">
                           <span className="text-xs font-medium">Excel Format String</span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={copyExcelFormat}
                             className="h-6 px-2 gap-1"
                           >
                             {copiedExcel ? (
                               <>
                                 <Check className="h-3 w-3 text-green-600" />
                                 <span className="text-xs text-green-600">Copied!</span>
                               </>
                             ) : (
                               <>
                                 <Copy className="h-3 w-3" />
                                 <span className="text-xs">Copy</span>
                               </>
                             )}
                           </Button>
                         </div>
                         <div className="p-3">
                           <div className="bg-background p-2 rounded border mb-2">
                             <code className="text-sm font-mono text-foreground break-all">
                               {generateExcelFormatString()}
                             </code>
                           </div>
                           <div className="text-xs text-muted-foreground">
                             This Excel-style format string can be used with ag-grid's valueFormatter or in Excel/Google Sheets.
                           </div>
                         </div>
                       </div>
                     </TabsContent>
                     
                     <TabsContent value="formatter" className="mt-2">
                       <div className="bg-muted/50 rounded border">
                         <div className="flex items-center justify-between p-2 border-b">
                           <span className="text-xs font-medium">Value Formatter Function</span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={copyFormatterCode}
                             className="h-6 px-2 gap-1"
                           >
                             {copiedFormatter ? (
                               <>
                                 <Check className="h-3 w-3 text-green-600" />
                                 <span className="text-xs text-green-600">Copied!</span>
                               </>
                             ) : (
                               <>
                                 <Copy className="h-3 w-3" />
                                 <span className="text-xs">Copy</span>
                               </>
                             )}
                           </Button>
                         </div>
                         <div className="p-3">
                           <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-auto max-h-[200px]">
                             {generateFormatterCode()}
                           </pre>
                         </div>
                       </div>
                     </TabsContent>
                     
                     <TabsContent value="cellStyle" className="mt-2">
                       <div className="bg-muted/50 rounded border">
                         <div className="flex items-center justify-between p-2 border-b">
                           <span className="text-xs font-medium">Cell Style Function</span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={copyCellStyleCode}
                             className="h-6 px-2 gap-1"
                           >
                             {copiedCellStyle ? (
                               <>
                                 <Check className="h-3 w-3 text-green-600" />
                                 <span className="text-xs text-green-600">Copied!</span>
                               </>
                             ) : (
                               <>
                                 <Copy className="h-3 w-3" />
                                 <span className="text-xs">Copy</span>
                               </>
                             )}
                           </Button>
                         </div>
                         <div className="p-3">
                           <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-auto max-h-[200px]">
                             {generateCellStyleCode()}
                           </pre>
                         </div>
                       </div>
                     </TabsContent>
                   </Tabs>

                   {/* Rules Summary */}
                   <div className="mt-3 p-2 bg-background rounded border">
                     <div className="text-xs font-medium mb-1">Rules Summary:</div>
                     {rules.length === 0 ? (
                       <div className="text-xs text-muted-foreground italic">No rules defined</div>
                     ) : (
                       <div className="space-y-1">
                         {rules.map((rule, index) => (
                           <div key={rule.id} className="text-xs">
                             <span className={`font-medium ${rule.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                               Rule {index + 1}:
                             </span>
                             <span className="text-muted-foreground ml-1">
                               {rule.condition.type} "{rule.condition.value}"
                               {rule.condition.value2 && ` and "${rule.condition.value2}"`}
                               → "{rule.display.text || 'original'}"
                               {!rule.enabled && ' (disabled)'}
                             </span>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Formatting Rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Individual Rule Editor Component
interface RuleEditorProps {
  rule: FormattingRule;
  index: number;
  totalRules: number;
  onUpdate: (updates: Partial<FormattingRule>) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  columnType: string;
}

const RuleEditor: React.FC<RuleEditorProps> = ({
  rule,
  index,
  totalRules,
  onUpdate,
  onDelete,
  onMove,
  columnType: _columnType
}) => {
  const conditionOption = CONDITION_OPTIONS.find(opt => opt.value === rule.condition.type);

  return (
    <Card className={rule.enabled ? '' : 'opacity-50'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            Rule {index + 1}
            <Switch
              checked={rule.enabled}
              onCheckedChange={(enabled) => onUpdate({ enabled })}
            />
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove('up')}
              disabled={index === 0}
              className="h-7 w-7 p-0"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove('down')}
              disabled={index === totalRules - 1}
              className="h-7 w-7 p-0"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="condition" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="condition" className="text-xs">Condition</TabsTrigger>
            <TabsTrigger value="display" className="text-xs">Display</TabsTrigger>
            <TabsTrigger value="styling" className="text-xs">Styling</TabsTrigger>
          </TabsList>
          
          <TabsContent value="condition" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label className="text-xs">When value</Label>
              <Select
                value={rule.condition.type}
                onValueChange={(value: FormattingRule['condition']['type']) =>
                  onUpdate({
                    condition: { ...rule.condition, type: value }
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {conditionOption?.needsValue && (
              <div className="space-y-2">
                <Label className="text-xs">Value</Label>
                <Input
                  placeholder="Enter value"
                  value={rule.condition.value}
                  onChange={(e) =>
                    onUpdate({
                      condition: { ...rule.condition, value: e.target.value }
                    })
                  }
                  className="h-8"
                />
              </div>
            )}
            
            {conditionOption?.needsValue2 && (
              <div className="space-y-2">
                <Label className="text-xs">And</Label>
                <Input
                  placeholder="Enter second value"
                  value={rule.condition.value2 || ''}
                  onChange={(e) =>
                    onUpdate({
                      condition: { ...rule.condition, value2: e.target.value }
                    })
                  }
                  className="h-8"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="display" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label className="text-xs">Display as</Label>
              <Select
                value={rule.display.type}
                onValueChange={(value: FormattingRule['display']['type']) =>
                  onUpdate({
                    display: { ...rule.display, type: value }
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original Value</SelectItem>
                  <SelectItem value="custom">Custom Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {rule.display.type === 'custom' && (
              <div className="space-y-2">
                <Label className="text-xs">Custom Text</Label>
                <Input
                  placeholder="e.g., Option 1"
                  value={rule.display.text}
                  onChange={(e) =>
                    onUpdate({
                      display: { ...rule.display, text: e.target.value }
                    })
                  }
                  className="h-8"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="styling" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={rule.styling.backgroundColor}
                    onChange={(e) =>
                      onUpdate({
                        styling: { ...rule.styling, backgroundColor: e.target.value }
                      })
                    }
                    className="h-8 w-16 p-1"
                  />
                  <Input
                    value={rule.styling.backgroundColor}
                    onChange={(e) =>
                      onUpdate({
                        styling: { ...rule.styling, backgroundColor: e.target.value }
                      })
                    }
                    className="h-8 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={rule.styling.textColor}
                    onChange={(e) =>
                      onUpdate({
                        styling: { ...rule.styling, textColor: e.target.value }
                      })
                    }
                    className="h-8 w-16 p-1"
                  />
                  <Input
                    value={rule.styling.textColor}
                    onChange={(e) =>
                      onUpdate({
                        styling: { ...rule.styling, textColor: e.target.value }
                      })
                    }
                    className="h-8 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Font Weight</Label>
                <Select
                  value={rule.styling.fontWeight}
                  onValueChange={(value: FormattingRule['styling']['fontWeight']) =>
                    onUpdate({
                      styling: { ...rule.styling, fontWeight: value }
                    })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="600">600</SelectItem>
                    <SelectItem value="700">700</SelectItem>
                    <SelectItem value="800">800</SelectItem>
                    <SelectItem value="900">900</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Font Size</Label>
                <Input
                  type="number"
                  value={rule.styling.fontSize || 14}
                  onChange={(e) =>
                    onUpdate({
                      styling: { ...rule.styling, fontSize: Number(e.target.value) }
                    })
                  }
                  className="h-8"
                  min={8}
                  max={72}
                />
              </div>
            </div>
            
            {/* Border Settings */}
            <div className="space-y-2">
              <Label className="text-xs">Border</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Input
                    type="number"
                    value={rule.styling.border?.width || 0}
                    onChange={(e) =>
                      onUpdate({
                        styling: {
                          ...rule.styling,
                          border: {
                            ...rule.styling.border!,
                            width: Number(e.target.value)
                          }
                        }
                      })
                    }
                    className="h-7"
                    min={0}
                    max={10}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Style</Label>
                  <Select
                    value={rule.styling.border?.style || 'solid'}
                    onValueChange={(value: 'solid' | 'dashed' | 'dotted' | 'double') =>
                      onUpdate({
                        styling: {
                          ...rule.styling,
                          border: {
                            ...rule.styling.border!,
                            style: value
                          }
                        }
                      })
                    }
                  >
                    <SelectTrigger className="h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <Input
                    type="color"
                    value={rule.styling.border?.color || '#000000'}
                    onChange={(e) =>
                      onUpdate({
                        styling: {
                          ...rule.styling,
                          border: {
                            ...rule.styling.border!,
                            color: e.target.value
                          }
                        }
                      })
                    }
                    className="h-7 p-1"
                  />
                </div>
              </div>
              
              {/* Border Sides */}
              {(rule.styling.border?.width || 0) > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <Label className="text-muted-foreground">Sides:</Label>
                  {[
                    { key: 'top', label: 'Top' },
                    { key: 'right', label: 'Right' },
                    { key: 'bottom', label: 'Bottom' },
                    { key: 'left', label: 'Left' }
                  ].map(side => (
                    <label key={side.key} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.styling.border?.sides[side.key as keyof typeof rule.styling.border.sides] || false}
                        onChange={(e) =>
                          onUpdate({
                            styling: {
                              ...rule.styling,
                              border: {
                                ...rule.styling.border!,
                                sides: {
                                  ...rule.styling.border!.sides,
                                  [side.key]: e.target.checked
                                }
                              }
                            }
                          })
                        }
                        className="w-3 h-3"
                      />
                      {side.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};