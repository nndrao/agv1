# Switch Component Update for Format Modifiers

## Overview
Replaced all shadcn Checkbox components with Switch components for the format modifiers due to checkbox rendering issues in dark mode.

## Changes Made

### 1. Import Update
Changed from Checkbox to Switch component:
```typescript
import { Switch } from '@/components/ui/switch';
```

### 2. Component Replacements
Replaced all Checkbox instances with Switch components:

#### Before:
```tsx
<Checkbox
  id="number-thousands-sep"
  checked={useThousandsSeparator}
  onCheckedChange={(checked) => setUseThousandsSeparator(!!checked)}
  className="format-ribbon-checkbox"
/>
```

#### After:
```tsx
<Switch
  id="number-thousands-sep"
  checked={useThousandsSeparator}
  onCheckedChange={setUseThousandsSeparator}
/>
```

### 3. Simplified Props
- Removed the `className` prop as switches have built-in styling
- Simplified `onCheckedChange` to pass the setter directly (no need for `!!checked`)
- Added `cursor-pointer` to labels for better UX

### 4. All Updated Controls
- **Number Format:**
  - Thousands separator switch
  - +/- colors switch
- **Currency Format:**
  - Thousands separator switch
  - +/- colors switch
- **Percentage Format:**
  - Multiply by 100 switch
  - Thousands separator switch
  - +/- colors switch

## Benefits
1. **Better Visual Design**: Switches are more intuitive for on/off toggles
2. **No Rendering Issues**: Switches work correctly in both light and dark modes
3. **Clearer State**: The sliding animation makes state changes more obvious
4. **Consistent Styling**: Switches automatically adapt to the theme
5. **Better Accessibility**: Native switch role with proper ARIA attributes

## Usage
The switches function identically to the previous checkboxes:
- Click the switch or its label to toggle
- State updates trigger immediate format string regeneration
- Preview updates in real-time
- All format types work with the same modifier switches

## Visual Appearance
- **Off State**: Gray background with white thumb on the left
- **On State**: Primary color background with white thumb on the right
- **Transition**: Smooth sliding animation between states
- **Dark Mode**: Automatically adjusts colors for proper contrast