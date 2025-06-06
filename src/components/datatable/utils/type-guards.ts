import { FormatterFunction, CellStyleFunction } from '../types';

/**
 * Type guard to check if a function is a formatter with metadata
 */
export function isFormatterFunction(fn: unknown): fn is FormatterFunction {
  return typeof fn === 'function' && '__formatString' in fn;
}

/**
 * Type guard to check if a function is a cell style function with metadata
 */
export function isCellStyleFunction(fn: unknown): fn is CellStyleFunction {
  return typeof fn === 'function' && ('__formatString' in fn || '__baseStyle' in fn);
}

/**
 * Safely extract formatter metadata from a function
 */
export function getFormatterMetadata(fn: unknown): {
  formatString?: string;
  formatterType?: 'excel' | 'visual' | 'custom';
  visualRules?: any[];
  visualDefaultFallback?: any;
} | null {
  if (!isFormatterFunction(fn)) {
    return null;
  }
  
  return {
    formatString: (fn as any).__formatString,
    formatterType: (fn as any).__formatterType,
    visualRules: (fn as any).__visualRules,
    visualDefaultFallback: (fn as any).__visualDefaultFallback,
  };
}

/**
 * Safely extract cell style metadata from a function
 */
export function getCellStyleMetadata(fn: unknown): {
  formatString?: string;
  baseStyle?: React.CSSProperties;
  cacheKey?: string;
} | null {
  if (!isCellStyleFunction(fn)) {
    return null;
  }
  
  return {
    formatString: (fn as any).__formatString,
    baseStyle: (fn as any).__baseStyle,
    cacheKey: (fn as any).__cacheKey,
  };
}