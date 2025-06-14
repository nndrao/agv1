# Currency Formatter Space Fix - Complete

## Problem
The currency formatter was not showing spaces between currency symbols and values. Formats like `"$" #,##0.00` were displaying as `$1,234.56` instead of `$ 1,234.56`.

## Root Cause
In the `processFormatSection` function in `formatters.ts`, when extracting quoted text (currency symbols) from the format string, the space after the quoted text was being discarded. The function was only extracting the text within quotes and not preserving the space that followed it.

## Solution
Modified the text extraction logic in `processFormatSection` to:
1. Check if there's a space after the quoted text in the format string
2. If a space exists between the quoted text and the number format, include it in the prefix
3. Remove both the quoted text AND the space from the numberFormat string to avoid duplication

## Code Changes

### In `/src/components/datatable/utils/formatters.ts` (lines 179-204):

```typescript
textMatches.forEach(match => {
  const text = match.replace(/"/g, '');
  const index = cleanFormat.indexOf(match);
  const matchEnd = index + match.length;
  
  // Find where the number format starts (first occurrence of #, 0, @, or $)
  const numberStartMatch = cleanFormat.match(/[$#0@]/);
  const numberStart = numberStartMatch ? cleanFormat.indexOf(numberStartMatch[0]) : cleanFormat.length;
  
  if (index < numberStart) {
    // Check if there's a space after the quoted text before the number format
    if (matchEnd < cleanFormat.length && cleanFormat[matchEnd] === ' ' && numberStartMatch) {
      prefix += text + ' ';
      // Remove the quoted text AND the space after it
      numberFormat = numberFormat.replace(match + ' ', '');
    } else {
      prefix += text;
      // Remove just the quoted text
      numberFormat = numberFormat.replace(match, '');
    }
  } else {
    suffix += text;
    // Remove the quoted text from the format
    numberFormat = numberFormat.replace(match, '');
  }
});
```

## Result
Now all currency formats correctly display with spaces:
- `"$" #,##0.00` → `$ 1,234.56`
- `"€" #,##0.00` → `€ 1,234.56`
- `"£" #,##0.00` → `£ 1,234.56`
- `"C$" #,##0.00` → `C$ 1,234.56`
- `"A$" #,##0.00` → `A$ 1,234.56`
- `"CHF" #,##0.00` → `CHF 1,234.56`
- `#,##0.00 "kr"` → `1,234.56 kr`

## Testing
The fix properly handles:
1. Currency symbols with spaces in the format string
2. Both prefix and suffix currency positions
3. All currency symbols including multi-character ones (C$, A$, CHF)
4. Negative values maintain proper formatting
5. The format string coming from `FormatRibbonContent.tsx` already includes spaces in the correct places

## No Additional Changes Required
The `FormatRibbonContent.tsx` component was already generating format strings with spaces (e.g., `"$" #,##0.00`). The issue was solely in the formatter's parsing logic, which has now been fixed.