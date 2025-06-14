# Currency Formatter Fix

## Changes Made

### 1. Added Space Between Currency Symbol and Value
Updated the `buildFormatString` function in `FormatRibbonContent.tsx` to add a space between all currency symbols and the number:

```typescript
case 'currency':
  const baseFormat = decimalPlaces === 0 ? '#,##0' : `#,##0.${'0'.repeat(decimalPlaces)}`;
  // Apply currency symbol with space
  if (currencySymbol === 'kr') {
    formatString = `${baseFormat} ${currencySymbol}`;
  } else {
    // Add space between currency symbol and number for all currencies
    formatString = `${currencySymbol} ${baseFormat}`;
  }
  break;
```

Now all currencies display with proper spacing:
- `$ 1,234.56` (USD)
- `€ 1,234.56` (EUR)
- `£ 1,234.56` (GBP)
- `CHF 1,234.56` (Swiss Franc)
- `1,234.56 kr` (Swedish Krona - after the number)

### 2. Fixed Percentage Formatter
Added logic to handle the "Multiply by 100" checkbox for percentage formatting:

```typescript
if (formatMode === 'standard' && selectedStandardFormat === 'percentage' && !multiplyBy100) {
  // For percentage format with multiplyBy100 disabled, wrap the formatter
  const baseFormatter = createExcelFormatter(formatString);
  formatter = (params: any) => {
    // Multiply by 100 before formatting since the value is already in decimal form
    const adjustedParams = { ...params, value: params.value * 100 };
    return baseFormatter(adjustedParams);
  };
}
```

### 3. Added Debug Logging
Added console logging to help debug formatter issues:

```typescript
console.log('[FormatRibbonContent] Applying format:', {
  formatMode,
  selectedStandardFormat,
  formatString,
  currencySymbol,
  decimalPlaces
});
```

## How to Test

1. Open the column formatter
2. Select a numeric column
3. Choose "Standard" mode
4. Select "Currency" from the format dropdown
5. Choose any currency symbol
6. Adjust decimal places as needed
7. Click outside or tab away - the format should apply automatically
8. Check that the values show with proper spacing

## Debugging

If formatters still aren't working:

1. Open browser console
2. Look for `[FormatRibbonContent] Applying format:` messages
3. Verify the format string is correct
4. Check if `[RibbonState] Updating bulk property: valueFormatter` appears
5. Make sure to click "Apply" button in the ribbon to commit changes

## Test File

Created `test-currency-formatter.html` to test the formatter in isolation. Open this file in a browser to verify the formatter is working correctly.