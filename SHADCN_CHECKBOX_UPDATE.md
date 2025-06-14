# Shadcn Checkbox Component Update

## Overview
Updated all format modifier checkboxes to use the shadcn-ui Checkbox component instead of native HTML checkboxes for better consistency and styling.

## Changes Made

### 1. Import Addition
Added the Checkbox component import:
```typescript
import { Checkbox } from '@/components/ui/checkbox';
```

### 2. Component Updates
Replaced all native checkbox inputs with the shadcn Checkbox component:

#### Before:
```html
<label className="flex items-center gap-1">
  <input
    type="checkbox"
    checked={useThousandsSeparator}
    onChange={(e) => setUseThousandsSeparator(e.target.checked)}
    className="rounded border-gray-300"
  />
  <span>Thousands separator</span>
</label>
```

#### After:
```tsx
<div className="flex items-center space-x-2">
  <Checkbox
    id="number-thousands-sep"
    checked={useThousandsSeparator}
    onCheckedChange={(checked) => setUseThousandsSeparator(!!checked)}
  />
  <label
    htmlFor="number-thousands-sep"
    className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    Thousands separator
  </label>
</div>
```

### 3. Unique IDs
Added unique IDs for each checkbox to ensure proper label association:
- Number format: `number-thousands-sep`, `number-color-sign`
- Currency format: `currency-thousands-sep`, `currency-color-sign`
- Percentage format: `percentage-thousands-sep`, `percentage-color-sign`, `percentage-multiply`

### 4. Consistent Styling
- Used `space-x-2` for consistent spacing between checkbox and label
- Applied shadcn's label styling classes for proper disabled states
- Maintained `text-xs` for consistency with other form controls

## Benefits
1. **Consistency**: All checkboxes now use the same component library
2. **Accessibility**: Proper label association with unique IDs
3. **Styling**: Matches the rest of the UI with shadcn theming
4. **Dark Mode**: Automatically adapts to theme changes
5. **Animation**: Smooth check/uncheck animations

## Testing
The checkboxes function identically to before:
- Click checkbox or label to toggle
- State updates trigger format string regeneration
- Preview updates immediately
- All three format types (Number, Currency, Percentage) have working modifiers