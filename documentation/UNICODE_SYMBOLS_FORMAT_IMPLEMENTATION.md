# Unicode Symbols Format Implementation

## Overview
Added comprehensive Unicode symbol format options to FormatWizard.tsx and FormatTab.tsx with instructions for customizing color and size.

## Changes Made

### 1. FormatWizard.tsx Updates

#### Added Unicode Symbols Section in Conditional Tab
- Added a new "Unicode Symbols" section after the emoji formats
- Included 6 symbol format templates:
  1. **Colored circles**: `[>0][Green]"●";[<0][Red]"●";"●"`
  2. **Triangle arrows**: `[>0][Green]"▲";[<0][Red]"▼";"▬"`
  3. **5-Star rating**: `[>=4]"★★★★★";[>=3]"★★★★☆";[>=2]"★★★☆☆";[>=1]"★★☆☆☆";"★☆☆☆☆"`
  4. **Check/Cross marks**: `[>0][Green]"✓";[<0][Red]"✗";"○"`
  5. **Progress bars**: `[>=80]"█████";[>=60]"████░";[>=40]"███░░";[>=20]"██░░░";"█░░░░"`
  6. **Colored diamonds**: `[>0][#4169E1]"◆";[<0][#DC143C]"◇";"◈"`

#### Added Help Instructions
- Added a blue info box with color and size customization tips:
  - **Color Tips**: Use `[Red]`, `[Green]`, `[Blue]`, or hex codes like `[#FF0000]`
  - **Size Tips**: Symbol size inherits from the column's font size (set in Styling tab)

### 2. FormatTab.tsx Updates

#### Enhanced 'symbols' Category in PREDEFINED_FORMATTERS
The symbols category now includes 14 different Unicode symbol options:
1. Colored circles (filled)
2. Circled dot
3. Empty/Filled circles
4. Triangle arrows
5. Simple arrows
6. Bold arrows
7. 5-Star rating
8. Check/Cross marks
9. Bold check/cross
10. Filled/Empty squares
11. Small squares
12. Diamonds
13. Progress bars
14. Vertical bars

#### Updated Quick Tips Section
Added three new tips:
- **Unicode symbols**: Change color with `[Red]`, `[Green]`, or `[#FF0000]`
- **Symbol size**: Controlled by the column's font size in the Styling tab
- **Combine with values**: `[Green]"✓ "#,##0` shows check + number

#### Enhanced Format Guide Dialog
1. Added a new "Symbols" tab to the format guide
2. Updated the symbols examples with additional patterns:
   - Symbol + value combinations
   - Value + symbol combinations
   - Progress level indicators
   - Hex color arrows

3. Expanded the Unicode symbols reference in the Advanced tab:
   - Circles: ● ◉ ○ ◎ ⊙ ⊚ ⊛
   - Squares: ■ □ ▪ ▫ ◼ ◻ ▰ ▱
   - Arrows: ▲ ▼ ↑ ↓ ⬆ ⬇ → ← ↔ ⇧ ⇩
   - Stars: ★ ☆ ✦ ✧ ⭐
   - Marks: ✓ ✗ ✔ ✖ ☑ ☒ ⊕ ⊖
   - Diamonds: ◆ ◈ ◇ ⬧ ⬦ ♦
   - Bars: █ ▌ ▎ ▏ ░ ▒ ▓
   - Progress: ▰▱▱▱▱ ▰▰▰▱▱ ▰▰▰▰▰
   - Other: • · ◦ ‣ ⁃ ⁍ ⁎ ⁕

## Key Features

### Color Customization
Users can customize symbol colors using:
- Named colors: `[Red]`, `[Green]`, `[Blue]`, `[Yellow]`, `[Orange]`, `[Purple]`, `[Gray]`, `[Black]`, `[White]`
- Hex colors: `[#FF0000]`, `[#00FF00]`, `[#0000FF]`, etc.

### Size Control
- Symbol size is controlled by the column's font size setting in the Styling tab
- Symbols inherit the cell's font size automatically

### Combining Symbols with Values
Users can combine symbols with numeric values in various ways:
- Before value: `[Green]"✓ "#,##0` → ✓ 1,234
- After value: `#,##0" "[Green]"●"` → 1,234 ●
- Replace value: `[Green]"●"` → ●

### Conditional Formatting
All symbol formats support conditional logic:
- Based on value ranges: `[>=80]"████░"`
- Based on positive/negative: `[>0][Green]"↑";[<0][Red]"↓"`
- Multiple conditions: `[>=90]"★★★★★";[>=70]"★★★★☆";[>=50]"★★★☆☆"`

## Usage Examples

### Traffic Light Status
```
[>=80][Green]"●";[>=50][#FFA500]"●";[Red]"●"
```
Shows green circle for values ≥80, orange for ≥50, red for <50

### Progress Indicator with Value
```
[>=80]"████░ "#,##0"%";[>=60]"███░░ "#,##0"%";[>=40]"██░░░ "#,##0"%";"█░░░░ "#,##0"%"
```
Shows progress bar with percentage value

### Trend Arrows with Color
```
[>0][#00AA00]"⬆";[<0][#FF0000]"⬇";"➡"
```
Shows green up arrow for positive, red down arrow for negative, right arrow for zero

## Implementation Notes

1. All Unicode symbols are properly escaped in the format strings
2. The Format Wizard provides visual templates for quick selection
3. The Format Guide includes comprehensive examples and syntax reference
4. Both named colors and hex colors are supported for maximum flexibility
5. Symbol formats can be combined with number formatting (thousands, decimals, etc.)