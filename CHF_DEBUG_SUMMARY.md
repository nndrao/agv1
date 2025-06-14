# CHF Currency Display Issue - Debug Summary

## Issue Description
User reports that Swiss Franc (CHF) is showing as "C19F" in the format string display.

## Investigation Results

### 1. Format String Generation
The format string is being generated correctly:
- Currency symbol: `CHF`
- Generated format: `"CHF" #,##0.00`
- All characters are correct (C=67, H=72, F=70)

### 2. Possible Causes
The transformation of H (72) to 19 could be:
- **Character code offset**: 72 - 53 = 19
- **Display/rendering issue**: The format might be displayed incorrectly in the UI
- **Mode switching**: When switching between Standard and Custom modes, the format string might be transformed

### 3. Where User Might See "C19F"
The issue is likely visible when:
1. Switching from Standard mode (with CHF selected) to Custom mode
2. The format string appears in the custom format input field
3. Some display component is transforming the string

## Debugging Added
Added console logging to track:
1. Format string generation for CHF
2. Character-by-character breakdown
3. Full format details when applying

## To Test
1. Open the column formatter
2. Select Standard mode
3. Choose Currency format
4. Select "CHF" from the dropdown
5. Check browser console for `[DEBUG CHF]` messages
6. Switch to Custom mode and check if the format input shows "C19F"

## Next Steps
If the issue persists:
1. Check if there's a font rendering issue
2. Look for any string transformation in the UI components
3. Test with different browsers
4. Check if AG-Grid is transforming the display

The core formatting logic is correct - this appears to be a display issue rather than a logic error.