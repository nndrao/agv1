// Excel Format String Parser for ag-Grid Integration
// Supports conditional formatting, colors, styling, and complex Excel format strings

export interface FormatCondition {
  operator: '>' | '<' | '>=' | '<=' | '=' | '<>';
  value: number;
  format: string;
}

export interface ParsedFormat {
  conditions: FormatCondition[];
  positiveFormat?: string;
  negativeFormat?: string;
  zeroFormat?: string;
  textFormat?: string;
  defaultFormat?: string;
}

export interface StyleInfo {
  color?: string;
  backgroundColor?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
}

export interface FormatterResult {
  value: string;
  style?: StyleInfo;
}

export class ExcelFormatParser {
  private static readonly COLOR_MAP: { [key: string]: string } = {
    'RED': '#FF0000',
    'BLUE': '#0000FF',
    'GREEN': '#008000',
    'YELLOW': '#FFFF00',
    'MAGENTA': '#FF00FF',
    'CYAN': '#00FFFF',
    'WHITE': '#FFFFFF',
    'BLACK': '#000000',
    'BROWN': '#A52A2A',
    'ORANGE': '#FFA500',
    'PINK': '#FFC0CB',
    'GRAY': '#808080',
    'GREY': '#808080'
  };

  private static readonly EMOJI_MAP: { [key: string]: string } = {
    'TRAFFIC_RED': '🔴',
    'TRAFFIC_YELLOW': '🟡',
    'TRAFFIC_GREEN': '🟢',
    'UP_ARROW': '⬆️',
    'DOWN_ARROW': '⬇️',
    'NEUTRAL': '➡️',
    'CHECK': '✅',
    'CROSS': '❌',
    'WARNING': '⚠️',
    'STAR': '⭐',
    'FIRE': '🔥',
    'THUMBS_UP': '👍',
    'THUMBS_DOWN': '👎'
  };

  public parse(formatString: string): ParsedFormat {
    // Remove spaces for easier parsing
    const cleaned = formatString.trim();
    
    // Check for conditional formats first
    const conditions = this.extractConditions(cleaned);
    if (conditions.length > 0) {
      return { conditions, defaultFormat: this.extractDefaultFormat(cleaned) };
    }

    // Parse standard positive;negative;zero;text format
    const parts = this.splitFormatParts(cleaned);
    return {
      conditions: [],
      positiveFormat: parts[0],
      negativeFormat: parts[1],
      zeroFormat: parts[2],
      textFormat: parts[3]
    };
  }

  private extractConditions(formatString: string): FormatCondition[] {
    const conditions: FormatCondition[] = [];
    const conditionRegex = /\[([><]=?)([0-9.]+)\]([^;[]+)/g;
    let match;

    while ((match = conditionRegex.exec(formatString)) !== null) {
      const operator = match[1] as FormatCondition['operator'];
      const value = parseFloat(match[2]);
      const format = match[3].trim();
      
      conditions.push({ operator, value, format });
    }

    return conditions;
  }

  private extractDefaultFormat(formatString: string): string {
    // Extract format after all conditions
    const withoutConditions = formatString.replace(/\[[><]=?[0-9.]+\][^;[]+/g, '');
    return withoutConditions.replace(/^;+|;+$/g, '').trim();
  }

  private splitFormatParts(formatString: string): string[] {
    // Split by semicolon but respect quoted strings and brackets
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let inBrackets = false;

    for (let i = 0; i < formatString.length; i++) {
      const char = formatString[i];
      
      if (char === '"' && !inBrackets) {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === '[' && !inQuotes) {
        inBrackets = true;
        current += char;
      } else if (char === ']' && !inQuotes) {
        inBrackets = false;
        current += char;
      } else if (char === ';' && !inQuotes && !inBrackets) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      parts.push(current.trim());
    }

    return parts;
  }

  public format(value: any, formatString: string): FormatterResult {
    const parsed = this.parse(formatString);
    
    // Handle conditions first
    if (parsed.conditions.length > 0) {
      return this.formatWithConditions(value, parsed);
    }

    // Handle standard formatting
    return this.formatStandard(value, parsed);
  }

  private formatWithConditions(value: any, parsed: ParsedFormat): FormatterResult {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    
    if (isNaN(numValue)) {
      return this.applyFormat(value, parsed.defaultFormat || '');
    }

    // Check conditions in order
    for (const condition of parsed.conditions) {
      if (this.evaluateCondition(numValue, condition)) {
        return this.applyFormat(numValue, condition.format);
      }
    }

    // Use default format if no conditions match
    return this.applyFormat(numValue, parsed.defaultFormat || numValue.toString());
  }

  private formatStandard(value: any, parsed: ParsedFormat): FormatterResult {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    
    if (isNaN(numValue)) {
      // Text format
      return this.applyFormat(value, parsed.textFormat || value.toString());
    }

    if (numValue > 0 && parsed.positiveFormat) {
      return this.applyFormat(numValue, parsed.positiveFormat);
    } else if (numValue < 0 && parsed.negativeFormat) {
      return this.applyFormat(numValue, parsed.negativeFormat);
    } else if (numValue === 0 && parsed.zeroFormat) {
      return this.applyFormat(numValue, parsed.zeroFormat);
    }

    return { value: numValue.toString() };
  }

  private evaluateCondition(value: number, condition: FormatCondition): boolean {
    switch (condition.operator) {
      case '>': return value > condition.value;
      case '<': return value < condition.value;
      case '>=': return value >= condition.value;
      case '<=': return value <= condition.value;
      case '=': return value === condition.value;
      case '<>': return value !== condition.value;
      default: return false;
    }
  }

  private applyFormat(value: any, format: string): FormatterResult {
    const style: StyleInfo = {};
    let formattedValue = value.toString();

    // Extract and apply color
    const colorMatch = format.match(/\[([A-Z]+)\]/);
    if (colorMatch) {
      const colorName = colorMatch[1];
      if (ExcelFormatParser.COLOR_MAP[colorName]) {
        style.color = ExcelFormatParser.COLOR_MAP[colorName];
      }
      format = format.replace(/\[[A-Z]+\]/, '');
    }

    // Extract and apply background color
    const bgColorMatch = format.match(/\{([A-Z]+)\}/);
    if (bgColorMatch) {
      const bgColorName = bgColorMatch[1];
      if (ExcelFormatParser.COLOR_MAP[bgColorName]) {
        style.backgroundColor = ExcelFormatParser.COLOR_MAP[bgColorName];
      }
      format = format.replace(/\{[A-Z]+\}/, '');
    }

    // Apply text formatting
    if (format.includes('**')) {
      style.fontWeight = 'bold';
      format = format.replace(/\*\*/g, '');
    }
    if (format.includes('//')) {
      style.fontStyle = 'italic';
      format = format.replace(/\/\//g, '');
    }
    if (format.includes('__')) {
      style.textDecoration = 'underline';
      format = format.replace(/__/g, '');
    }
    if (format.includes('~~')) {
      style.textDecoration = 'line-through';
      format = format.replace(/~~/g, '');
    }

    // Replace emojis
    for (const [key, emoji] of Object.entries(ExcelFormatParser.EMOJI_MAP)) {
      format = format.replace(new RegExp(`\\$${key}\\$`, 'g'), emoji);
    }

    // Handle quoted text
    const quotedTextMatch = format.match(/"([^"]*)"/);
    if (quotedTextMatch) {
      formattedValue = quotedTextMatch[1];
    } else {
      // Apply number formatting if it contains @
      if (format.includes('@')) {
        formattedValue = format.replace('@', value.toString());
      } else if (format.includes('#') || format.includes('0')) {
        formattedValue = this.applyNumberFormat(value, format);
      } else if (format.trim()) {
        formattedValue = format;
      }
    }

    return {
      value: formattedValue,
      style: Object.keys(style).length > 0 ? style : undefined
    };
  }

  private applyNumberFormat(value: any, format: string): string {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return value.toString();

    // Basic number formatting - can be extended
    if (format.includes('%')) {
      return (numValue * 100).toFixed(1) + '%';
    }
    
    if (format.includes('0.00')) {
      return numValue.toFixed(2);
    }
    
    if (format.includes('0.0')) {
      return numValue.toFixed(1);
    }
    
    if (format.includes('#,##0')) {
      return numValue.toLocaleString();
    }

    return numValue.toString();
  }

  // ag-Grid integration methods
  public createValueFormatter(formatString: string) {
    return (params: any) => {
      const result = this.format(params.value, formatString);
      return result.value;
    };
  }

  public createCellStyle(formatString: string) {
    return (params: any) => {
      const result = this.format(params.value, formatString);
      return result.style || {};
    };
  }

  public createColumnDef(field: string, formatString: string, additionalOptions: any = {}) {
    return {
      field,
      valueFormatter: this.createValueFormatter(formatString),
      cellStyle: this.createCellStyle(formatString),
      ...additionalOptions
    };
  }
}

// Usage Examples and Helper Functions
export class ExcelFormatHelper {
  private parser = new ExcelFormatParser();

  // Traffic light formatting
  public createTrafficLightFormat(greenThreshold: number, yellowThreshold: number): string {
    return `[>=${greenThreshold}]"$TRAFFIC_GREEN$"[GREEN];[>=${yellowThreshold}]"$TRAFFIC_YELLOW$"[YELLOW];"$TRAFFIC_RED$"[RED]`;
  }

  // Performance rating with emojis
  public createPerformanceFormat(): string {
    return `[>=90]"**Excellent**"[GREEN]$STAR$;[>=75]"**Good**"[BLUE]$THUMBS_UP$;[>=60]"Average"[YELLOW]$NEUTRAL$;"**Poor**"[RED]$THUMBS_DOWN$`;
  }

  // Currency formatting with conditions
  public createCurrencyFormat(currency: string = '$'): string {
    return `[>0]**${currency}#,##0.00**[GREEN];[<0]**${currency}-#,##0.00**[RED];**${currency}0.00**[GRAY]`;
  }

  // Percentage with styling
  public createPercentageFormat(): string {
    return `[>0]**+0.0%**[GREEN];[<0]**0.0%**[RED];**0.0%**[GRAY]`;
  }

  // Status indicators
  public createStatusFormat(): string {
    return `[=1]"**Active**"[GREEN]$CHECK$;[=0]"**Inactive**"[RED]$CROSS$;"__Unknown__"[YELLOW]$WARNING$`;
  }

  // Apply format to ag-Grid column definition
  public applyToColumn(columnDef: any, formatString: string): any {
    return {
      ...columnDef,
      valueFormatter: this.parser.createValueFormatter(formatString),
      cellStyle: this.parser.createCellStyle(formatString)
    };
  }
}

// Example usage with ag-Grid
export function createFormattedGridColumns() {
  const formatter = new ExcelFormatHelper();
  const parser = new ExcelFormatParser();
  
  return [
    // Traffic light status
    formatter.applyToColumn(
      { field: 'score', headerName: 'Score' },
      formatter.createTrafficLightFormat(80, 60)
    ),
    
    // Performance with custom styling
    parser.createColumnDef(
      'performance',
      '[>=95]"🔥**Exceptional**🔥"{GREEN};[>=85]"⭐**Excellent**⭐"[BLUE];[>=75]"👍**Good**👍"[GREEN];[>=65]"➡️Average"[YELLOW];"👎**Needs Improvement**👎"[RED]',
      { headerName: 'Performance Rating' }
    ),
    
    // Revenue with currency formatting
    parser.createColumnDef(
      'revenue',
      '[>1000000]**"$"#,##0"M"**[GREEN];[>0]**"$"#,##0**[BLUE];"$0"[GRAY]',
      { headerName: 'Revenue' }
    ),
    
    // Growth percentage
    parser.createColumnDef(
      'growth',
      '[>10]**+0.0%**[GREEN]$UP_ARROW$;[>0]**+0.0%**[BLUE];[=0]**0.0%**[GRAY];"**"0.0%"**"[RED]$DOWN_ARROW$',
      { headerName: 'Growth %' }
    ),
    
    // Status with background colors
    parser.createColumnDef(
      'status',
      '[=1]"**ACTIVE**"{GREEN}[WHITE];[=2]"**PENDING**"{YELLOW}[BLACK];[=0]"**INACTIVE**"{RED}[WHITE];"**UNKNOWN**"{GRAY}[WHITE]',
      { headerName: 'Status' }
    )
  ];
}