import { ValueFormatterParams } from 'ag-grid-community';

/**
 * Enhanced Excel Format String Parser
 * 
 * Supports Excel format strings with extensions for modern styling:
 * 
 * BASIC EXCEL SYNTAX:
 * - [>0][Green]#,##0.00;[Red]#,##0.00        // Conditional colors
 * - [="A"]"Excellent";@                       // Text conditions
 * - $#,##0.00                                 // Currency
 * - #,##0.00%                                 // Percentage
 * 
 * EXTENDED STYLING SYNTAX:
 * - [BG:Yellow] or [Background:Yellow]        // Background color
 * - [Border:2px-solid-blue] or [B:1px-red]   // Borders
 * - [Size:14] or [FontSize:16]               // Font size
 * - [Align:center] or [TextAlign:right]      // Text alignment
 * - [Padding:4px-8px] or [P:6px]             // Padding
 * - [Weight:bold] or [FontWeight:600]        // Font weight
 * - [Bold], [Italic], [Underline]            // Font styles
 * - [Center], [Left], [Right]                // Alignment shortcuts
 */

// Configuration
const DEBUG_FORMATTING = false; // Set to true only for development
const ENABLE_CACHING = true;

// Types
interface ParsedCondition {
  type: 'numeric' | 'text_equals' | 'text_empty' | 'text_not_empty';
  operator?: string;
  value?: any;
}

interface ParsedSection {
  conditions: ParsedCondition[];
  colors: string[];
  styles: string[];
  formatPattern: string;
  isDefault: boolean;
  originalSection: string;
}

interface ParsedFormat {
  sections: ParsedSection[];
  originalFormat: string;
  hasConditions: boolean;
}

interface FormattingResult {
  value: string;
  textColor?: string;
  backgroundColor?: string;
  additionalStyles?: Record<string, any>;
}

// Utilities
function debug(message: string, ...args: any[]) {
  if (DEBUG_FORMATTING) {
    console.log(`[ExcelFormatter] ${message}`, ...args);
  }
}

// Commented out until needed
// function debugIf(condition: boolean, message: string, ...args: any[]) {
//   if (DEBUG_FORMATTING && condition) {
//     console.log(`[ExcelFormatter] ${message}`, ...args);
//   }
// }

// Color and style utilities
const NAMED_COLORS: Record<string, string> = {
  'red': '#FF6347',
  'green': '#00AA99',
  'blue': '#0000FF',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'gray': '#808080',
  'grey': '#808080',
  'black': '#000000',
  'white': '#FFFFFF',
  'magenta': '#FF00FF',
  'cyan': '#00FFFF',
  'brown': '#A52A2A'
};

// Dark mode optimized colors
const DARK_MODE_COLORS: Record<string, string> = {
  'red': '#FF6B6B',    // Brighter red for dark mode
  'green': '#14B8A6',  // Bright teal for dark mode
  'blue': '#339AF0',   // Brighter blue for dark mode
  'yellow': '#FFD43B', // Adjusted yellow for dark mode
  'orange': '#FF8787',
  'purple': '#B197FC',
  'pink': '#FFA8CC',
  'gray': '#ADB5BD',
  'grey': '#ADB5BD',
  'black': '#FFFFFF',  // Inverted for dark mode
  'white': '#000000',  // Inverted for dark mode
  'magenta': '#FF6FDF',
  'cyan': '#3BC9DB',
  'brown': '#D9480F'
};

// Light mode optimized colors (darker for better contrast)
const LIGHT_MODE_COLORS: Record<string, string> = {
  'red': '#DC2626',    // Darker red for light mode
  'green': '#0F766E',  // Dark teal for light mode
  'blue': '#2563EB',   // Darker blue for light mode
  'yellow': '#D97706', // Darker yellow for light mode
  'orange': '#EA580C',
  'purple': '#7C3AED',
  'pink': '#DB2777',
  'gray': '#6B7280',
  'grey': '#6B7280',
  'black': '#000000',
  'white': '#FFFFFF',
  'magenta': '#C026D3',
  'cyan': '#0891B2',
  'brown': '#92400E'
};

const STYLE_DIRECTIVE_PATTERNS = [
  /^(BG|Background):/i,
  /^(Border|B):/i,
  /^(Size|FontSize):/i,
  /^(Align|TextAlign):/i,
  /^(Padding|P):/i,
  /^(Weight|FontWeight):/i,
  /^(Bold|Italic|Underline|Center|Left|Right)$/i
];

function isColor(content: string): boolean {
  // Hex colors: #RGB or #RRGGBB
  if (content.match(/^#[0-9A-Fa-f]{3}$/) || content.match(/^#[0-9A-Fa-f]{6}$/)) {
    return true;
  }
  
  // Named colors (case insensitive)
  return Object.prototype.hasOwnProperty.call(NAMED_COLORS, content.toLowerCase());
}

function isStyleDirective(content: string): boolean {
  return STYLE_DIRECTIVE_PATTERNS.some(pattern => pattern.test(content));
}

function isCondition(content: string): boolean {
  // Numeric conditions: >5, <=10, =0, <>5
  if (content.match(/^([<>=!]+|<>)[\d.-]+$/)) return true;
  
  // Text conditions: ="text", @="text", ="", <>"", etc.
  if (content.match(/^@?[=<>!]+".+?"$/)) return true;
  if (content.match(/^@?[=<>!]+""$/)) return true;
  
  return false;
}

function parseColorValue(color: string, isDarkMode: boolean = false): string {
  // Handle hex colors
  if (color.match(/^#[0-9A-Fa-f]{3,6}$/)) {
    return color;
  }
  
  // Handle named colors with mode-specific optimization
  const colorKey = color.toLowerCase();
  
  if (isDarkMode) {
    // Use dark mode optimized colors
    const darkModeColor = DARK_MODE_COLORS[colorKey];
    if (darkModeColor) {
      return darkModeColor;
    }
  } else {
    // Use light mode optimized colors
    const lightModeColor = LIGHT_MODE_COLORS[colorKey];
    if (lightModeColor) {
      return lightModeColor;
    }
  }
  
  // Fall back to default colors if not found in mode-specific maps
  const defaultColor = NAMED_COLORS[colorKey];
  if (defaultColor) {
    return defaultColor;
  }
  
  return color; // Return as-is if not recognized
}

// Condition parsing and evaluation
function parseCondition(content: string): ParsedCondition | null {
  // Text equality: [="text"] or [@="text"]
  const textEqualMatch = content.match(/^@?="(.+)"$/);
  if (textEqualMatch) {
    return { type: 'text_equals', value: textEqualMatch[1] };
  }
  
  // Empty text: [=""] or [@=""]
  if (content === '=""' || content === '@=""') {
    return { type: 'text_empty' };
  }
  
  // Non-empty text: [<>""] or [@<>""]
  if (content === '<>""' || content === '@<>""') {
    return { type: 'text_not_empty' };
  }
  
  // Numeric conditions: [>5], [<=10], [=0], etc.
  const numericMatch = content.match(/^([<>=!]+|<>)([\d.-]+)$/);
  if (numericMatch) {
    const operator = numericMatch[1];
    const value = parseFloat(numericMatch[2]);
    
    if (!isNaN(value)) {
      return { 
        type: 'numeric', 
        operator: operator === '!=' ? '<>' : operator, // Normalize != to <>
        value 
      };
    }
  }
  
  return null;
}

function evaluateCondition(condition: ParsedCondition, value: unknown): boolean {
  switch (condition.type) {
    case 'text_equals':
      return String(value || '') === condition.value;
      
    case 'text_empty':
      return String(value || '') === '';
      
    case 'text_not_empty':
      return String(value || '') !== '';
      
    case 'numeric': {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(numValue)) return false;
      
      switch (condition.operator) {
        case '>': return numValue > condition.value!;
        case '<': return numValue < condition.value!;
        case '>=': return numValue >= condition.value!;
        case '<=': return numValue <= condition.value!;
        case '=': return numValue === condition.value!;
        case '<>': return numValue !== condition.value!;
        default: return false;
      }
    }
    
    default:
      return false;
  }
}

// Pattern processing
function formatNumber(value: unknown, format: string, useAbsoluteValue: boolean = false): string {
  if (!format || format === '@') {
    return String(value || '');
  }
  
  let numValue = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(numValue)) {
    return format === '@' ? String(value || '') : '';
  }
  
  // Use absolute value if requested (for negative numbers with color formatting)
  if (useAbsoluteValue) {
    numValue = Math.abs(numValue);
  }
  
  // Handle specific format patterns
  if (format === '0') return Math.round(numValue).toString();
  if (format === '0.0') return numValue.toFixed(1);
  if (format === '0.00') return numValue.toFixed(2);
  
  // Handle percentage
  if (format.includes('%')) {
    const decimalMatch = format.match(/\.([0#]+)/);
    const decimals = decimalMatch ? decimalMatch[1].length : 0;
    return (numValue * 100).toFixed(decimals) + '%';
  }
  
  // Handle currency
  if (format.includes('$')) {
    const hasComma = format.includes(',');
    const decimalMatch = format.match(/\.([0#]+)/);
    const decimals = decimalMatch ? decimalMatch[1].length : 2;
    
    if (hasComma) {
      return '$ ' + numValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    } else {
      return '$ ' + numValue.toFixed(decimals);
    }
  }
  
  // Handle thousands separator
  if (format.includes('#,##0')) {
    const decimalMatch = format.match(/\.([0#]+)/);
    const decimals = decimalMatch ? decimalMatch[1].length : 0;
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  
  // Handle format with literal text (e.g., "0°F", "0 units")
  // Check if format contains non-numeric characters after the number format
  const formatMatch = format.match(/^([0#,]+(?:\.[0#]+)?)(.*)/);
  if (formatMatch && formatMatch[2]) {
    const numberFormat = formatMatch[1];
    const suffix = formatMatch[2];
    
    // Format the number part
    let formattedNumber = numValue.toString();
    if (numberFormat === '0') {
      formattedNumber = Math.round(numValue).toString();
    } else if (numberFormat.includes('.')) {
      const decimalMatch = numberFormat.match(/\.([0#]+)/);
      const decimals = decimalMatch ? decimalMatch[1].length : 0;
      formattedNumber = numValue.toFixed(decimals);
    }
    
    return formattedNumber + suffix;
  }
  
  return numValue.toString();
}

function parseQuotedPattern(pattern: string, value: unknown, useAbsoluteValue: boolean = false): string {
  const parts: string[] = [];
  let i = 0;
  
  // Debug currency formats
  if (pattern.includes('€') || pattern.includes('$')) {
    debug('parseQuotedPattern input:', { pattern, value });
  }
  
  while (i < pattern.length) {
    if (pattern[i] === '"') {
      // Find matching closing quote
      const start = i + 1;
      let end = start;
      
      while (end < pattern.length && pattern[end] !== '"') {
        end++;
      }
      
      if (end < pattern.length) {
        // Extract quoted text (literal)
        const quoted = pattern.substring(start, end);
        parts.push(quoted);
        if (pattern.includes('€') || pattern.includes('$')) {
          debug('Found quoted text:', quoted);
        }
        i = end + 1;
      } else {
        // Unclosed quote - treat as literal
        parts.push(pattern.substring(start));
        break;
      }
    } else {
      // Find next quote or end of string
      const start = i;
      let end = pattern.indexOf('"', i);
      if (end === -1) end = pattern.length;
      
      // Extract format code section
      const formatCode = pattern.substring(start, end);
      
      // Check if this starts with a space (spacing between currency and number)
      if (formatCode.length > 0 && formatCode[0] === ' ') {
        // Add the space first
        parts.push(' ');
        // Then format the rest if there's anything
        const remainingCode = formatCode.substring(1).trim();
        if (remainingCode) {
          parts.push(formatNumber(value, remainingCode, useAbsoluteValue));
        }
      } else if (formatCode.trim()) {
        // Normal format code
        parts.push(formatNumber(value, formatCode.trim(), useAbsoluteValue));
      }
      
      i = end;
    }
  }
  
  const result = parts.join('');
  if (pattern.includes('€') || pattern.includes('$')) {
    debug('parseQuotedPattern result:', result);
  }
  
  return result;
}

function processPattern(pattern: string, value: unknown, useAbsoluteValue: boolean = false): string {
  if (!pattern || pattern === '@') {
    return String(value || '');
  }
  
  // Handle quoted text and format codes
  if (pattern.includes('"')) {
    return parseQuotedPattern(pattern, value, useAbsoluteValue);
  }
  
  // Handle patterns with mixed literal and numeric content (e.g., "😟 0", "↓ 0.0%")
  // Check if pattern has both numeric format codes and non-numeric characters
  if (pattern.match(/[0#%]/) && pattern.match(/[^\d\s.,#%$€£¥₹-]/)) {
    // Split pattern to find numeric format and surrounding text
    interface PatternPart {
      type: 'literal' | 'numeric';
      value: string;
    }
    const parts: PatternPart[] = [];
    let currentPart = '';
    let inNumericFormat = false;
    
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      const isNumericChar = /[0#.,%-]/.test(char);
      
      if (isNumericChar && !inNumericFormat) {
        // Starting numeric format
        if (currentPart) {
          parts.push({ type: 'literal', value: currentPart });
          currentPart = '';
        }
        inNumericFormat = true;
      } else if (!isNumericChar && inNumericFormat && char !== ' ') {
        // Ending numeric format
        if (currentPart) {
          parts.push({ type: 'numeric', value: currentPart });
          currentPart = '';
        }
        inNumericFormat = false;
      }
      
      currentPart += char;
    }
    
    // Add remaining part
    if (currentPart) {
      parts.push({ type: inNumericFormat ? 'numeric' : 'literal', value: currentPart });
    }
    
    // Process parts and combine
    return parts.map((part) => {
      if (part.type === 'numeric') {
        return formatNumber(value, part.value.trim(), useAbsoluteValue);
      }
      return part.value;
    }).join('');
  }
  
  // Handle pure number formats
  return formatNumber(value, pattern, useAbsoluteValue);
}

// Section parsing
function parseFormatSection(section: string): ParsedSection {
  const result: ParsedSection = {
    conditions: [],
    colors: [],
    styles: [],
    formatPattern: '',
    isDefault: false,
    originalSection: section
  };
  
  // Extract all bracketed elements
  const brackets = section.match(/\[[^\]]+\]/g) || [];
  let remainingSection = section;
  
  for (const bracket of brackets) {
    const content = bracket.slice(1, -1);
    remainingSection = remainingSection.replace(bracket, '');
    
    // Classify bracket content
    if (isCondition(content)) {
      const condition = parseCondition(content);
      if (condition) {
        result.conditions.push(condition);
      }
    } else if (isColor(content)) {
      result.colors.push(content);
    } else if (isStyleDirective(content)) {
      result.styles.push(content);
    } else {
      debug('Unknown bracket content:', content);
    }
  }
  
  result.formatPattern = remainingSection.trim();
  result.isDefault = result.conditions.length === 0;
  
  return result;
}

// Style directive parsing (simplified version)
function parseStyleDirectives(section: string, isDarkMode: boolean = false): Record<string, any> {
  const styles: Record<string, any> = {};
  const brackets = section.match(/\[[^\]]+\]/g) || [];
  
  for (const bracket of brackets) {
    const content = bracket.slice(1, -1);
    
    if (!isStyleDirective(content)) continue;
    
    // Parse different style types
    if (content.match(/^(BG|Background):/i)) {
      const color = content.split(':')[1];
      styles.backgroundColor = parseColorValue(color, isDarkMode);
    } else if (content.match(/^(Border|B):/i)) {
      styles.border = content.split(':')[1].replace(/-/g, ' ');
    } else if (content.match(/^(Size|FontSize):/i)) {
      styles.fontSize = content.split(':')[1] + 'px';
    } else if (content.match(/^(Align|TextAlign):/i)) {
      styles.textAlign = content.split(':')[1];
    } else if (content.match(/^(Padding|P):/i)) {
      styles.padding = content.split(':')[1].replace(/-/g, ' ');
    } else if (content.match(/^(Weight|FontWeight):/i)) {
      styles.fontWeight = content.split(':')[1];
    } else if (content.toLowerCase() === 'bold') {
      styles.fontWeight = 'bold';
    } else if (content.toLowerCase() === 'italic') {
      styles.fontStyle = 'italic';
    } else if (content.toLowerCase() === 'underline') {
      styles.textDecoration = 'underline';
    } else if (content.toLowerCase() === 'center') {
      styles.textAlign = 'center';
    } else if (content.toLowerCase() === 'left') {
      styles.textAlign = 'left';
    } else if (content.toLowerCase() === 'right') {
      styles.textAlign = 'right';
    }
  }
  
  return styles;
}

// Format cache for performance
class FormatCache {
  private static cache = new Map<string, ParsedFormat>();
  private static maxSize = 100; // Prevent memory leaks
  
  static get(formatString: string): ParsedFormat {
    if (!ENABLE_CACHING) {
      return this.parseFormat(formatString);
    }
    
    if (!this.cache.has(formatString)) {
      // Clear cache if it gets too large
      if (this.cache.size >= this.maxSize) {
        this.cache.clear();
        debug('Format cache cleared due to size limit');
      }
      
      this.cache.set(formatString, this.parseFormat(formatString));
    }
    
    return this.cache.get(formatString)!;
  }
  
  private static parseFormat(formatString: string): ParsedFormat {
    const sections = formatString.split(';').map(s => parseFormatSection(s.trim()));
    const hasConditions = sections.some(s => s.conditions.length > 0);
    
    return {
      sections,
      originalFormat: formatString,
      hasConditions
    };
  }
  
  static clear() {
    this.cache.clear();
  }
}

// Main formatter functions
function formatWithParsedFormat(value: unknown, format: ParsedFormat): FormattingResult {
  // Handle null/undefined values
  if (value == null || value === '') {
    return { value: '' };
  }
  
  // Find first matching conditional section
  for (const section of format.sections) {
    if (!section.isDefault && section.conditions.every(condition => evaluateCondition(condition, value))) {
      debug('Matched conditional section:', section.originalSection);
      return applySection(section, value);
    }
  }
  
  // Use default section (last one or first one without conditions)
  const defaultSection = format.sections.slice().reverse().find(s => s.isDefault) || format.sections[0];
  debug('Using default section:', defaultSection?.originalSection);
  return applySection(defaultSection, value);
}

function applySection(section: ParsedSection, value: unknown): FormattingResult {
  // Check if this is a negative value with a red color condition
  // If so, we should format using absolute value to remove minus sign
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isNegativeWithColor = !isNaN(numValue) && numValue < 0 && 
    section.colors.some(color => color.toLowerCase() === 'red');
  
  const result: FormattingResult = {
    value: processPattern(section.formatPattern, value, isNegativeWithColor)
  };
  
  // Apply text color (first color found)
  if (section.colors.length > 0) {
    result.textColor = parseColorValue(section.colors[0]);
  }
  
  // Additional styles are handled by the cell style function
  if (section.styles.length > 0) {
    result.additionalStyles = parseStyleDirectives(section.originalSection);
  }
  
  return result;
}

// Public API
export function createExcelFormatter(formatString: string) {
  // Validate input
  if (typeof formatString !== 'string') {
    console.error('[ExcelFormatter] Format string must be a string:', formatString);
    return () => 'ERROR';
  }
  
  debug('Creating formatter for:', formatString);
  
  // Parse format once and cache
  const parsedFormat = FormatCache.get(formatString);
  
  const formatter = (params: ValueFormatterParams): string => {
    // Critical safety checks
    if (!params || typeof params !== 'object') {
      console.error('[ExcelFormatter] Invalid params:', params);
      return '';
    }
    
    if (typeof params.value === 'function') {
      console.error('[ExcelFormatter] Cell value is a function');
      return '0';
    }
    
    // Detect if value is the format string (critical bug)
    if (params.value === formatString) {
      console.error('[ExcelFormatter] CRITICAL: Value equals format string!', {
        formatString,
        column: params.column?.getColId()
      });
      return 'ERROR';
    }
    
    debug('Formatting value:', params.value, 'with format:', formatString);
    
    try {
      // Handle special format types first
      if (formatString.includes('%') && !formatString.includes(';')) {
        return handlePercentageFormat(params.value, formatString);
      }
      
      if (isCurrencyFormat(formatString) && !formatString.includes(';')) {
        return handleCurrencyFormat(params.value, formatString);
      }
      
      if (isDateFormat(formatString)) {
        return handleDateFormat(params.value, formatString);
      }
      
      // Use parsed format for complex formatting
      const result = formatWithParsedFormat(params.value, parsedFormat);
      return result.value;
      
    } catch (error) {
      console.error('[ExcelFormatter] Formatting error:', error, {
        formatString,
        value: params.value
      });
      return String(params.value || '');
    }
  };
  
  // Add metadata for serialization
  Object.defineProperty(formatter, '__formatString', { 
    value: formatString, 
    writable: false,
    enumerable: false,
    configurable: true
  });
  
  Object.defineProperty(formatter, '__formatterType', { 
    value: 'excel', 
    writable: false,
    enumerable: false,
    configurable: true
  });
  
  // Prevent toString issues
  formatter.toString = () => '[ExcelFormatter Function]';
  
  return formatter;
}

// Helper functions for simple formats
function handlePercentageFormat(value: unknown, formatString: string): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  
  const decimals = (formatString.match(/0/g) || []).length - 1;
  return (num * 100).toFixed(Math.max(0, decimals)) + '%';
}

function isCurrencyFormat(formatString: string): boolean {
  const currencySymbols = ['$', '€', '£', '¥', '₹', '₽', '₩'];
  return currencySymbols.some(symbol => formatString.includes(symbol));
}

function handleCurrencyFormat(value: unknown, formatString: string): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  
  const currencySymbols = ['$', '€', '£', '¥', '₹', '₽', '₩'];
  const symbol = currencySymbols.find(s => formatString.includes(s)) || '$';
  
  const decimalMatch = formatString.match(/\.([0#]+)/);
  const decimals = decimalMatch ? decimalMatch[1].length : 2;
  const hasThousands = formatString.includes(',');
  const isAccounting = formatString.includes('(') && formatString.includes(')');
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  const formattedValue = hasThousands 
    ? absNum.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : absNum.toFixed(decimals);
  
  if (isAccounting && isNegative) {
    return `(${symbol} ${formattedValue})`;
  } else if (isNegative) {
    return `-${symbol} ${formattedValue}`;
  } else {
    return `${symbol} ${formattedValue}`;
  }
}

function isDateFormat(formatString: string): boolean {
  return /[YMDHms]/.test(formatString);
}

function handleDateFormat(value: unknown, formatString: string): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return String(value);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const pad3 = (n: number) => n.toString().padStart(3, '0');
  
  // Handle timezone offset
  const timezoneOffset = date.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const offsetMinutes = Math.abs(timezoneOffset) % 60;
  const offsetSign = timezoneOffset <= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${pad(offsetHours)}:${pad(offsetMinutes)}`;
  
  return formatString
    .replace(/YYYY/g, date.getFullYear().toString())
    .replace(/YY/g, date.getFullYear().toString().slice(-2))
    .replace(/MMMM/g, date.toLocaleString('en-US', { month: 'long' }))
    .replace(/MMM/g, date.toLocaleString('en-US', { month: 'short' }))
    .replace(/MM/g, pad(date.getMonth() + 1))
    .replace(/M/g, (date.getMonth() + 1).toString())
    .replace(/DD/g, pad(date.getDate()))
    .replace(/D/g, date.getDate().toString())
    .replace(/HH/g, pad(date.getHours()))
    .replace(/H/g, date.getHours().toString())
    .replace(/hh/g, pad(date.getHours() % 12 || 12))
    .replace(/h/g, (date.getHours() % 12 || 12).toString())
    .replace(/mm/g, pad(date.getMinutes()))
    .replace(/m/g, date.getMinutes().toString())
    .replace(/ss/g, pad(date.getSeconds()))
    .replace(/s/g, date.getSeconds().toString())
    .replace(/sss/g, pad3(date.getMilliseconds()))
    .replace(/AM\/PM/g, date.getHours() < 12 ? 'AM' : 'PM')
    .replace(/am\/pm/g, date.getHours() < 12 ? 'am' : 'pm')
    .replace(/Z/g, date.toISOString().slice(-1) === 'Z' ? 'Z' : offsetString)
    .replace(/T/g, 'T'); // Literal T separator for ISO format
}

// Cell style function
export function createCellStyleFunction(formatString: string, baseStyle?: React.CSSProperties) {
  debug('Creating cell style function for:', formatString);
  
  const parsedFormat = FormatCache.get(formatString);
  
  const styleFunction = (params: { value: unknown }) => {
    const value = params.value;
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    debug('Applying cell styles for value:', value);
    
    // Handle null/undefined values
    if (value == null) {
      return baseStyle && Object.keys(baseStyle).length > 0 ? { ...baseStyle } : undefined;
    }
    
    // Find matching section
    for (const section of parsedFormat.sections) {
      if (!section.isDefault && section.conditions.every(condition => evaluateCondition(condition, value))) {
        debug('Matched style section:', section.originalSection);
        
        // Parse styles from this section
        const sectionStyles = parseStyleDirectives(section.originalSection, isDarkMode);
        
        // Add text color if specified
        if (section.colors.length > 0) {
          sectionStyles.color = parseColorValue(section.colors[0], isDarkMode);
        }
        
        // Merge with base styles
        const mergedStyles = baseStyle ? { ...baseStyle, ...sectionStyles } : sectionStyles;
        return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
      }
    }
    
    // Use default section or base styles
    const defaultSection = parsedFormat.sections.slice().reverse().find(s => s.isDefault);
    if (defaultSection) {
      const defaultStyles = parseStyleDirectives(defaultSection.originalSection, isDarkMode);
      
      if (defaultSection.colors.length > 0) {
        defaultStyles.color = parseColorValue(defaultSection.colors[0], isDarkMode);
      }
      
      const mergedStyles = baseStyle ? { ...baseStyle, ...defaultStyles } : defaultStyles;
      return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
    }
    
    // Return base styles only
    return baseStyle && Object.keys(baseStyle).length > 0 ? { ...baseStyle } : undefined;
  };
  
  // CRITICAL: Attach metadata to the function for serialization
  if (formatString) {
    Object.defineProperty(styleFunction, '__formatString', { 
      value: formatString, 
      writable: false,
      enumerable: false,
      configurable: true
    });
  }
  
  if (baseStyle) {
    Object.defineProperty(styleFunction, '__baseStyle', { 
      value: baseStyle, 
      writable: false,
      enumerable: false,
      configurable: true
    });
  }
  
  return styleFunction;
}

// Utility functions
export function getExcelStyleClass(formatString: string): string {
  const classes: string[] = [];
  
  if (formatString.includes('%')) {
    classes.push('ag-numeric-cell', 'ag-percentage-cell');
  } else if (isCurrencyFormat(formatString)) {
    classes.push('ag-numeric-cell', 'ag-currency-cell');
  } else if (formatString.match(/[#0]/) && !isDateFormat(formatString)) {
    classes.push('ag-numeric-cell');
  } else if (isDateFormat(formatString)) {
    classes.push('ag-date-cell');
  }
  
  return classes.join(' ');
}

export function getExcelExportFormat(formatString: string): string | undefined {
  const formatMap: Record<string, string> = {
    '0': '0',
    '0.0': '0.0',
    '0.00': '0.00',
    '#,##0': '#,##0',
    '#,##0.00': '#,##0.00',
    '0%': '0%',
    '0.0%': '0.0%',
    '0.00%': '0.00%',
    '$#,##0': '$#,##0',
    '$#,##0.00': '$#,##0.00',
    '€#,##0.00': '€#,##0.00',
    '£#,##0.00': '£#,##0.00',
    '0.00E+00': '0.00E+00',
    'MM/DD/YYYY': 'mm/dd/yyyy',
    'DD/MM/YYYY': 'dd/mm/yyyy',
    'YYYY-MM-DD': 'yyyy-mm-dd',
  };
  
  return formatMap[formatString] || formatString;
}

// Column definition helper
export function createColumnDef(field: string, formatString: string, additionalOptions: any = {}) {
  return {
    field,
    valueFormatter: createExcelFormatter(formatString),
    cellStyle: createCellStyleFunction(formatString),
    cellClass: getExcelStyleClass(formatString),
    ...additionalOptions
  };
}

// Export cache management
export const FormatCacheManager = {
  clear: () => FormatCache.clear(),
  size: () => FormatCache['cache'].size,
  enableCaching: (enabled: boolean) => {
    // This would require making ENABLE_CACHING mutable
    console.log(`Caching ${enabled ? 'enabled' : 'disabled'}`);
  }
};

// Backward compatibility
export const parseExcelFormat = createExcelFormatter;