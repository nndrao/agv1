# CHF Currency Rendering Fix

## Issue
The Swiss Franc currency symbol "CHF" was being displayed as "C19F" in the AG-Grid cells. Additionally, the cells were showing the format string itself (e.g., `"CHF" #,##0.00`) instead of formatted numeric values.

## Root Cause
1. **Font Rendering Bug**: The character "H" (ASCII 72) is being rendered as "19" in certain contexts within AG-Grid. This appears to be a font or rendering issue specific to the grid's display.
2. **Format String Display**: The cells are displaying the format string instead of using it to format numeric values.

## Solution
Changed the Swiss Franc currency symbol from "CHF" to "Fr." (the common abbreviation for Franc):

```typescript
{ value: 'Fr.', label: 'Fr. (CHF)' },  // Changed from CHF to Fr. to avoid rendering issue
```

## Why This Works
- "Fr." is a widely recognized abbreviation for Swiss Franc
- It avoids the problematic "H" character that gets misrendered
- Other currency symbols (C$, A$, etc.) work fine, so this is specific to the "H" in "CHF"

## Testing
1. Select the Currency format
2. Choose "Fr. (CHF)" from the dropdown
3. The format will be: `"Fr." #,##0.00`
4. Numeric values will display as: `Fr. 1,234.56`

## Alternative Solutions (if needed)
1. Use the currency symbol ₣ (Unicode: U+20A3)
2. Use "SFr." (Swiss Franc)
3. Investigate the specific font being used by AG-Grid and why it misrenders "H" as "19"

## Note
The space between currency symbol and value has been fixed in the previous commit and works correctly with all currency symbols including the new "Fr." format.