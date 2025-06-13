import { ColDef, ValueFormatterParams, CellClassParams } from 'ag-grid-community'
import { 
  ColumnCustomization, 
  FormatSettings, 
  StyleSettings, 
  ConditionalFormat,
  ExcelFormat
} from '../types'

// Type for cell style params (simplified in AG-Grid v33)
type CellStyleParams = any
import { parseExcelFormat } from '../utils/formatters'

// Formatting engine that handles all formatting logic efficiently
export class FormattingEngine {
  private static instance: FormattingEngine
  
  // Caches for performance
  private formatterCache = new Map<string, (params: ValueFormatterParams) => string>()
  private styleCache = new Map<string, (params: any) => any>()
  private classCache = new Map<string, (params: CellClassParams) => string | string[]>()
  private compiledConditions = new Map<string, (value: any, data: any) => boolean>()
  
  private constructor() {}
  
  static getInstance(): FormattingEngine {
    if (!FormattingEngine.instance) {
      FormattingEngine.instance = new FormattingEngine()
    }
    return FormattingEngine.instance
  }
  
  // Apply all formatting to column definitions
  applyFormattingToColumns(
    columnDefs: ColDef[],
    customizations: Record<string, ColumnCustomization>
  ): ColDef[] {
    return columnDefs.map(colDef => {
      const customization = customizations[(colDef as any).field || (colDef as any).colId || '']
      if (!customization) return colDef
      
      return this.applyCustomizationToColumn(colDef, customization)
    })
  }
  
  // Apply single customization to a column
  private applyCustomizationToColumn(
    colDef: ColDef,
    customization: ColumnCustomization
  ): ColDef {
    const updatedColDef = { ...colDef }
    
    // Apply format settings
    if (customization.format) {
      updatedColDef.valueFormatter = this.createValueFormatter(customization.format)
    }
    
    // Apply style settings
    if (customization.style) {
      updatedColDef.cellStyle = this.createCellStyle(customization.style)
      updatedColDef.cellClass = this.createCellClass(customization.style)
    }
    
    // Apply editor settings
    if (customization.editor) {
      updatedColDef.cellEditor = customization.editor.type
      updatedColDef.cellEditorParams = customization.editor.params
      updatedColDef.editable = customization.editor.enabled
    }
    
    // Apply filter settings
    if (customization.filter) {
      updatedColDef.filter = typeof customization.filter === 'object' && customization.filter.type ? customization.filter.type : customization.filter
      updatedColDef.filterParams = typeof customization.filter === 'object' && customization.filter.params ? customization.filter.params : undefined
      updatedColDef.floatingFilter = typeof customization.filter === 'object' && customization.filter.showFloatingFilter ? customization.filter.showFloatingFilter : undefined
    }
    
    // Apply general settings
    if (customization.general) {
      Object.assign(updatedColDef, customization.general)
    }
    
    // Apply conditional formatting
    if (customization.conditionalFormats && customization.conditionalFormats.length > 0) {
      updatedColDef.cellStyle = this.createConditionalStyle(
        customization.conditionalFormats,
        updatedColDef.cellStyle as any
      ) as any
      updatedColDef.cellClass = this.createConditionalClass(
        customization.conditionalFormats,
        updatedColDef.cellClass as any
      ) as any
    }
    
    return updatedColDef
  }
  
  // Create value formatter function
  private createValueFormatter(format: FormatSettings): (params: ValueFormatterParams) => string {
    const cacheKey = JSON.stringify(format)
    
    if (this.formatterCache.has(cacheKey)) {
      return this.formatterCache.get(cacheKey)!
    }
    
    let formatter: (params: ValueFormatterParams) => string
    
    switch (format.type) {
      case 'excel':
        formatter = this.createExcelFormatter(format as ExcelFormat)
        break
        
      case 'number':
        formatter = this.createNumberFormatter(format)
        break
        
      case 'currency':
        formatter = this.createCurrencyFormatter(format)
        break
        
      case 'date':
        formatter = this.createDateFormatter(format)
        break
        
      case 'percentage':
        formatter = this.createPercentageFormatter(format)
        break
        
      case 'custom':
        formatter = this.createCustomFormatter(format)
        break
        
      default:
        formatter = (params) => params.value?.toString() || ''
    }
    
    this.formatterCache.set(cacheKey, formatter)
    return formatter
  }
  
  // Excel format handler
  private createExcelFormatter(format: ExcelFormat): (params: ValueFormatterParams) => string {
    const formatString = format.format || 'General'
    
    return (params: ValueFormatterParams) => {
      if (params.value == null) return ''
      
      try {
        const formatter = parseExcelFormat(formatString)
        return formatter(params.value)
      } catch (error) {
        console.error('Excel format error:', error)
        return params.value.toString()
      }
    }
  }
  
  // Number formatter with all options
  private createNumberFormatter(format: FormatSettings): (params: ValueFormatterParams) => string {
    const {
      decimalPlaces = 2,
      thousandsSeparator = true,
      prefix = '',
      suffix = '',
      negativeFormat = 'minus'
    } = format
    
    return (params: ValueFormatterParams) => {
      if (params.value == null || isNaN(params.value)) return ''
      
      const num = Number(params.value)
      const isNegative = num < 0
      const absNum = Math.abs(num)
      
      let formatted = absNum.toFixed(decimalPlaces)
      
      if (thousandsSeparator) {
        formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }
      
      if (isNegative) {
        switch (negativeFormat) {
          case 'parentheses':
            formatted = `(${formatted})`
            break
          case 'red':
            // This will be handled by cell styling
            formatted = `-${formatted}`
            break
          default:
            formatted = `-${formatted}`
        }
      }
      
      return `${prefix}${formatted}${suffix}`
    }
  }
  
  // Currency formatter
  private createCurrencyFormatter(format: FormatSettings): (params: ValueFormatterParams) => string {
    const {
      currency = 'USD',
      locale = 'en-US',
      decimalPlaces = 2
    } = format
    
    return (params: ValueFormatterParams) => {
      if (params.value == null || isNaN(params.value)) return ''
      
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces
        }).format(Number(params.value))
      } catch (error) {
        return `${currency} ${Number(params.value).toFixed(decimalPlaces)}`
      }
    }
  }
  
  // Date formatter
  private createDateFormatter(format: FormatSettings): (params: ValueFormatterParams) => string {
    const {
      dateFormat = 'MM/DD/YYYY',
      locale = 'en-US'
    } = format
    
    return (params: ValueFormatterParams) => {
      if (!params.value) return ''
      
      try {
        const date = new Date(params.value)
        if (isNaN(date.getTime())) return params.value.toString()
        
        // Handle common date formats
        switch (dateFormat) {
          case 'MM/DD/YYYY':
            return date.toLocaleDateString(locale)
          case 'DD/MM/YYYY':
            return date.toLocaleDateString('en-GB')
          case 'YYYY-MM-DD':
            return date.toISOString().split('T')[0]
          case 'relative':
            return this.getRelativeTimeString(date)
          default:
            return date.toLocaleDateString(locale)
        }
      } catch (error) {
        return params.value.toString()
      }
    }
  }
  
  // Percentage formatter
  private createPercentageFormatter(format: FormatSettings): (params: ValueFormatterParams) => string {
    const {
      decimalPlaces = 2,
      multiply100 = true
    } = format
    
    return (params: ValueFormatterParams) => {
      if (params.value == null || isNaN(params.value)) return ''
      
      const num = Number(params.value)
      const percentage = multiply100 ? num * 100 : num
      
      return `${percentage.toFixed(decimalPlaces)}%`
    }
  }
  
  // Custom formatter
  private createCustomFormatter(format: FormatSettings): (params: ValueFormatterParams) => string {
    const { customFunction } = format
    
    if (!customFunction) {
      return (params) => params.value?.toString() || ''
    }
    
    try {
      // Safely evaluate the custom function
      const func = new Function('params', customFunction)
      return (params: ValueFormatterParams) => {
        try {
          return func(params)
        } catch (error) {
          console.error('Custom formatter error:', error)
          return params.value?.toString() || ''
        }
      }
    } catch (error) {
      console.error('Invalid custom formatter:', error)
      return (params) => params.value?.toString() || ''
    }
  }
  
  // Create cell style function
  private createCellStyle(style: StyleSettings): (params: CellStyleParams) => any {
    const cacheKey = JSON.stringify(style)
    
    if (this.styleCache.has(cacheKey)) {
      return this.styleCache.get(cacheKey)!
    }
    
    const styleFunction = (_params: CellStyleParams) => {
      const styles: any = {}
      
      // Apply all style properties
      if (style.textColor) styles.color = style.textColor
      if (style.backgroundColor) styles.backgroundColor = style.backgroundColor
      if (style.fontSize) styles.fontSize = `${style.fontSize}px`
      if (style.fontWeight) styles.fontWeight = style.fontWeight
      if (style.fontStyle) styles.fontStyle = style.fontStyle
      if (style.textAlign) styles.textAlign = style.textAlign
      if (style.textDecoration) styles.textDecoration = style.textDecoration
      
      // Borders
      if (style.borderTop) styles.borderTop = style.borderTop
      if (style.borderRight) styles.borderRight = style.borderRight
      if (style.borderBottom) styles.borderBottom = style.borderBottom
      if (style.borderLeft) styles.borderLeft = style.borderLeft
      
      // Padding
      if (style.padding) styles.padding = style.padding
      
      return styles
    }
    
    this.styleCache.set(cacheKey, styleFunction)
    return styleFunction
  }
  
  // Create cell class function
  private createCellClass(style: StyleSettings): (params: CellClassParams) => string | string[] {
    const cacheKey = `class-${JSON.stringify(style)}`
    
    if (this.classCache.has(cacheKey)) {
      return this.classCache.get(cacheKey)!
    }
    
    const classFunction = (_params: CellClassParams) => {
      const classes: string[] = []
      
      if (style.className) {
        classes.push(style.className)
      }
      
      // Add utility classes based on style settings
      if (style.highlight) classes.push('cell-highlight')
      if (style.bold) classes.push('font-bold')
      if (style.italic) classes.push('italic')
      
      return classes
    }
    
    this.classCache.set(cacheKey, classFunction)
    return classFunction
  }
  
  // Create conditional style function
  private createConditionalStyle(
    conditions: ConditionalFormat[],
    baseStyle?: (params: CellStyleParams) => any
  ): (params: CellStyleParams) => any {
    return (params: CellStyleParams) => {
      let styles = baseStyle ? baseStyle(params) : {}
      
      for (const condition of conditions) {
        if (this.evaluateCondition(condition, params.value, params.data)) {
          styles = { ...styles, ...condition.style }
        }
      }
      
      return styles
    }
  }
  
  // Create conditional class function
  private createConditionalClass(
    conditions: ConditionalFormat[],
    baseClass?: (params: CellClassParams) => string | string[]
  ): (params: CellClassParams) => string | string[] {
    return (params: CellClassParams) => {
      let classes = baseClass ? baseClass(params) : []
      if (typeof classes === 'string') classes = [classes]
      
      for (const condition of conditions) {
        if (this.evaluateCondition(condition, params.value, params.data)) {
          if (condition.className) {
            classes.push(condition.className)
          }
        }
      }
      
      return classes
    }
  }
  
  // Evaluate conditional format condition
  private evaluateCondition(condition: ConditionalFormat, value: any, data: any): boolean {
    const cacheKey = `${condition.operator}-${condition.value}`
    
    if (!this.compiledConditions.has(cacheKey)) {
      const compiledCondition = this.compileCondition(condition)
      this.compiledConditions.set(cacheKey, compiledCondition)
    }
    
    const evaluator = this.compiledConditions.get(cacheKey)!
    return evaluator(value, data)
  }
  
  // Compile condition for performance
  private compileCondition(condition: ConditionalFormat): (value: any, data: any) => boolean {
    const { operator, value: conditionValue } = condition
    
    switch (operator) {
      case 'equals':
        return (value) => value == conditionValue
      case 'notEquals':
        return (value) => value != conditionValue
      case 'contains':
        return (value) => String(value).includes(String(conditionValue))
      case 'notContains':
        return (value) => !String(value).includes(String(conditionValue))
      case 'startsWith':
        return (value) => String(value).startsWith(String(conditionValue))
      case 'endsWith':
        return (value) => String(value).endsWith(String(conditionValue))
      case 'greaterThan':
        return (value) => Number(value) > Number(conditionValue)
      case 'greaterThanOrEqual':
        return (value) => Number(value) >= Number(conditionValue)
      case 'lessThan':
        return (value) => Number(value) < Number(conditionValue)
      case 'lessThanOrEqual':
        return (value) => Number(value) <= Number(conditionValue)
      case 'between':
        const [min, max] = conditionValue as [number, number]
        return (value) => Number(value) >= min && Number(value) <= max
      case 'empty':
        return (value) => value == null || value === ''
      case 'notEmpty':
        return (value) => value != null && value !== ''
      case 'custom':
        try {
          const func = new Function('value', 'data', condition.customExpression || 'return false')
          return func as (value: any, data: any) => boolean
        } catch {
          return () => false
        }
      default:
        return () => false
    }
  }
  
  // Helper function for relative time
  private getRelativeTimeString(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    
    return date.toLocaleDateString()
  }
  
  // Clear caches
  clearCache(type?: 'formatters' | 'styles' | 'classes' | 'conditions' | 'all'): void {
    if (!type || type === 'all' || type === 'formatters') {
      this.formatterCache.clear()
    }
    if (!type || type === 'all' || type === 'styles') {
      this.styleCache.clear()
    }
    if (!type || type === 'all' || type === 'classes') {
      this.classCache.clear()
    }
    if (!type || type === 'all' || type === 'conditions') {
      this.compiledConditions.clear()
    }
  }
  
  // Get cache statistics for debugging
  getCacheStats(): { formatters: number; styles: number; classes: number; conditions: number } {
    return {
      formatters: this.formatterCache.size,
      styles: this.styleCache.size,
      classes: this.classCache.size,
      conditions: this.compiledConditions.size
    }
  }
}