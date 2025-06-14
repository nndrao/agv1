# Column Formatting Refactoring Plan

**Note: All components previously named "Custom*" have been renamed to "Custom*"**

## Overview
The columnFormatting module can be reduced from 8,943 lines to approximately 7,000 lines (~22% reduction) by extracting common UI components and patterns.

## Proposed Reusable Components

### 1. Core Components (`/components/datatable/columnFormatting/components/common/`)

#### CustomSection.tsx
```tsx
interface CustomSectionProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}
```
- Standardizes section headers across all tabs
- Estimated savings: ~100 lines

#### CustomSwitch.tsx
```tsx
interface CustomSwitchProps {
  id: string;
  label: string;
  property: string;
  value: boolean | MixedValue;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}
```
- Replaces ~50+ inline switch implementations
- Estimated savings: ~200 lines

#### CustomSelect.tsx
```tsx
interface CustomSelectProps<T> {
  value: T | MixedValue;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
    icon?: React.ComponentType;
  }>;
  placeholder?: string;
  showIcons?: boolean;
}
```
- Replaces ~30+ select implementations
- Estimated savings: ~300 lines

#### CustomColorPicker.tsx
```tsx
interface CustomColorPickerProps {
  icon?: React.ComponentType;
  value: string | MixedValue;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}
```
- Consolidates color input patterns
- Estimated savings: ~90 lines

#### CustomField.tsx
```tsx
interface CustomFieldProps {
  label: string;
  labelWidth?: string;
  children: React.ReactNode;
  required?: boolean;
}
```
- Standardizes form field layouts
- Estimated savings: ~150 lines

### 2. Hooks (`/components/datatable/columnFormatting/hooks/`)

#### useMixedValue.ts
```tsx
export function useMixedValue(property: string) {
  // Centralized mixed value logic
  return { value, isMixed, allValues };
}
```
- Replaces getMixedValueLocal in all components
- Estimated savings: ~200 lines

### 3. Constants (`/components/datatable/columnFormatting/constants/`)

#### formatTemplates.ts
- Extract all format templates, currency symbols, date formats
- Estimated savings: ~200 lines

#### styleOptions.ts
- Extract color palettes, font options, border styles
- Estimated savings: ~100 lines

## Implementation Priority

### Phase 1: High Impact Components (Week 1)
1. `useMixedValue` hook - removes most duplication
2. `CustomSection` - used everywhere
3. `CustomSwitch` - very common pattern
4. `CustomSelect` - complex, high reuse

### Phase 2: Specialized Components (Week 2)
1. `CustomColorPicker`
2. `CustomField`
3. `CustomToggleGroup`
4. `CustomExpandButton`

### Phase 3: Template Extraction (Week 3)
1. Move all templates to constants
2. Create template type definitions
3. Add template validation

## Benefits

### Immediate Benefits
- **~1,900 lines reduction** in tab components
- **Consistency** across all formatting controls
- **Type safety** with strongly typed components
- **Easier testing** - test once, use everywhere

### Long-term Benefits
- **Maintainability** - single source of truth
- **Performance** - centralized optimization
- **Accessibility** - standardized ARIA patterns
- **Extensibility** - easy to add new format options

## Migration Strategy

1. **Create new components** without breaking existing code
2. **Gradually replace** inline implementations
3. **Test each replacement** thoroughly
4. **Remove old code** once all references updated

## Example Refactoring

### Before (FormatCustomContent.tsx):
```tsx
<div className="flex items-center gap-2">
  <Switch 
    id="use-colors"
    checked={!getMixedValueLocal('useColorForSign').isMixed && 
             getMixedValueLocal('useColorForSign').value === true}
    onCheckedChange={(checked) => updateBulkProperty('useColorForSign', checked)}
  />
  <Label htmlFor="use-colors" className="cursor-pointer">
    +/- Colors
  </Label>
</div>
```

### After:
```tsx
<CustomSwitch
  id="use-colors"
  label="+/- Colors"
  property="useColorForSign"
  value={getMixedValue('useColorForSign')}
  onChange={(checked) => updateBulkProperty('useColorForSign', checked)}
/>
```

## Success Metrics
- Line count reduction: Target 20-25%
- Component reuse: Each common component used 5+ times
- Test coverage: 90%+ for common components
- Performance: No regression in render times

## Next Steps
1. Review and approve this plan
2. Create feature branch for refactoring
3. Implement Phase 1 components
4. Migrate one tab as proof of concept
5. Complete remaining migrations