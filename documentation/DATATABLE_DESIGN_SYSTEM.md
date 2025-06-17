# DataTable Design System

A comprehensive design system for DataTable components based on shadcn/ui design principles, ensuring consistent look and feel across light and dark modes.

## Table of Contents
1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Component Specifications](#component-specifications)
6. [DataTable Specific Guidelines](#datatable-specific-guidelines)
7. [Theme Implementation](#theme-implementation)
8. [Accessibility Guidelines](#accessibility-guidelines)

## Design Principles

### Core Principles
1. **Consistency**: All components follow the same visual language
2. **Accessibility**: WCAG AA compliance minimum
3. **Performance**: Optimized for large datasets
4. **Flexibility**: Components adapt to context
5. **Theme Support**: Seamless light/dark mode switching

### Visual Hierarchy
- Clear distinction between interactive and static elements
- Consistent use of color for meaning
- Proper contrast ratios for readability
- Logical spacing progression

## Color System

### Core Colors

#### Light Mode
```css
--dt-background: hsl(0 0% 100%);
--dt-foreground: hsl(222.2 84% 4.9%);
--dt-primary: hsl(222.2 47.4% 11.2%);
--dt-primary-foreground: hsl(210 40% 98%);
--dt-secondary: hsl(210 40% 96.1%);
--dt-secondary-foreground: hsl(222.2 47.4% 11.2%);
--dt-muted: hsl(210 40% 96.1%);
--dt-muted-foreground: hsl(215.4 16.3% 46.9%);
--dt-destructive: hsl(0 84.2% 60.2%);
--dt-destructive-foreground: hsl(210 40% 98%);
--dt-border: hsl(214.3 31.8% 91.4%);
```

#### Dark Mode
```css
--dt-background: hsl(222.2 84% 4.9%);
--dt-foreground: hsl(210 40% 98%);
--dt-primary: hsl(210 40% 98%);
--dt-primary-foreground: hsl(222.2 47.4% 11.2%);
--dt-secondary: hsl(217.2 32.6% 17.5%);
--dt-secondary-foreground: hsl(210 40% 98%);
--dt-muted: hsl(217.2 32.6% 17.5%);
--dt-muted-foreground: hsl(215 20.2% 65.1%);
--dt-destructive: hsl(0 62.8% 30.6%);
--dt-destructive-foreground: hsl(210 40% 98%);
--dt-border: hsl(217.2 32.6% 17.5%);
```

### DataTable Specific Colors

#### Light Mode
```css
--dt-header-bg: hsl(210 40% 98%);
--dt-row-hover: hsl(210 40% 98%);
--dt-row-selected: hsl(210 40% 96%);
--dt-row-stripe: hsl(210 40% 98.5%);
```

#### Dark Mode
```css
--dt-header-bg: hsl(217.2 32.6% 12%);
--dt-row-hover: hsl(217.2 32.6% 15%);
--dt-row-selected: hsl(217.2 32.6% 20%);
--dt-row-stripe: hsl(217.2 32.6% 8%);
```

### Semantic Colors
- **Success**: `hsl(142 76% 36%)` / `hsl(142 70% 45%)` (dark)
- **Warning**: `hsl(38 92% 50%)` / `hsl(38 80% 60%)` (dark)
- **Info**: `hsl(217 91% 60%)` / `hsl(217 85% 70%)` (dark)
- **Error**: Use destructive color

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
```

### Font Sizes
```css
--dt-text-xs: 0.75rem;    /* 12px - Labels, captions */
--dt-text-sm: 0.875rem;   /* 14px - Body text, buttons */
--dt-text-base: 1rem;     /* 16px - Default text */
--dt-text-lg: 1.125rem;   /* 18px - Subheadings */
--dt-text-xl: 1.25rem;    /* 20px - Headings */
```

### Font Weights
- `400` - Normal text
- `500` - Medium emphasis
- `600` - Semibold headings
- `700` - Bold emphasis

### Line Height
- Default: `1.6`
- Compact: `1.4` (for dense layouts)
- Relaxed: `1.8` (for readability)

## Spacing System

### Base Scale
```css
--dt-spacing-xs: 4px;
--dt-spacing-sm: 8px;
--dt-spacing-md: 12px;
--dt-spacing-lg: 16px;
--dt-spacing-xl: 24px;
--dt-spacing-2xl: 32px;
```

### Component Spacing Guidelines
- **Inline elements**: `spacing-xs` to `spacing-sm`
- **Related elements**: `spacing-sm` to `spacing-md`
- **Section gaps**: `spacing-lg` to `spacing-xl`
- **Major sections**: `spacing-xl` to `spacing-2xl`

## Component Specifications

### Heights
```css
--dt-height-input: 32px;
--dt-height-button: 32px;
--dt-height-button-sm: 28px;
--dt-height-button-xs: 24px;
--dt-height-row: 40px;
--dt-height-header: 48px;
```

### Border Radius
```css
--dt-radius-sm: 4px;     /* Inputs, small buttons */
--dt-radius-md: 6px;     /* Cards, dialogs */
--dt-radius-lg: 8px;     /* Panels, large cards */
--dt-radius-xl: 12px;    /* Featured elements */
--dt-radius-full: 9999px; /* Pills, badges */
```

### Shadows
```css
--dt-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--dt-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--dt-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--dt-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

### Transitions
```css
--dt-transition-fast: 150ms ease;
--dt-transition-base: 200ms ease;
--dt-transition-slow: 300ms ease;
```

## Component Specifications

### Buttons

#### Variants
1. **Primary**: Main actions
   - Background: `--dt-primary`
   - Text: `--dt-primary-foreground`
   - Hover: 90% opacity

2. **Secondary**: Secondary actions
   - Background: `--dt-secondary`
   - Text: `--dt-secondary-foreground`
   - Border: `--dt-border`

3. **Outline**: Tertiary actions
   - Background: transparent
   - Border: `--dt-input`
   - Hover: `--dt-accent` background

4. **Ghost**: Minimal actions
   - Background: transparent
   - Hover: `--dt-accent` background

5. **Destructive**: Dangerous actions
   - Background: `--dt-destructive`
   - Text: `--dt-destructive-foreground`

#### Sizes
- **Default**: 32px height, 16px horizontal padding
- **Small**: 28px height, 12px horizontal padding
- **Extra Small**: 24px height, 8px horizontal padding
- **Icon**: Square dimensions, no text padding

### Form Elements

#### Input Fields
- Height: 32px
- Padding: 12px horizontal
- Border: 1px solid `--dt-input`
- Border radius: 6px
- Focus: `--dt-ring` border with shadow

#### Select Dropdowns
- Same dimensions as input
- Chevron icon right-aligned
- Native styling removed

#### Switches
- Width: 40px
- Height: 20px
- Thumb: 16px diameter
- Travel: 20px
- Transition: 150ms

### DataTable Components

#### Table Structure
```
┌─────────────────────────────────────┐
│ Toolbar (48px)                      │
├─────────────────────────────────────┤
│ Header Row (48px)                   │
├─────────────────────────────────────┤
│ Data Row (40px)                     │
├─────────────────────────────────────┤
│ Data Row (40px) - Striped          │
├─────────────────────────────────────┤
│ Data Row (40px) - Hover            │
├─────────────────────────────────────┤
│ Data Row (40px) - Selected         │
└─────────────────────────────────────┘
```

#### Cell Formatting
- Padding: 8px horizontal, 0 vertical (centered)
- Text size: 14px
- Overflow: Ellipsis for long text
- Alignment: Configurable (left/center/right)

### Dialogs

#### Structure
- Border radius: 8px
- Shadow: `--dt-shadow-xl`
- Overlay: `rgba(0, 0, 0, 0.5)`

#### Sections
1. **Header**: 
   - Height: auto (min 56px)
   - Padding: 24px
   - Background: `--dt-muted`
   - Border bottom: 1px

2. **Content**:
   - Padding: 24px
   - Max height: 70vh
   - Scrollable

3. **Footer**:
   - Padding: 16px 24px
   - Background: `--dt-muted`
   - Border top: 1px
   - Right-aligned actions

### Badges

#### Variants
- **Primary**: Default emphasis
- **Secondary**: Low emphasis
- **Success**: Positive states
- **Warning**: Caution states
- **Destructive**: Error states

#### Specifications
- Height: 20px
- Padding: 2px 8px
- Border radius: full
- Font size: 12px
- Font weight: 500

## DataTable Specific Guidelines

### Column Headers
- Height: 48px
- Background: `--dt-header-bg`
- Font weight: 600
- Sticky positioning
- Resize handle: 4px wide

### Row States
1. **Default**: Standard background
2. **Hover**: `--dt-row-hover` background
3. **Selected**: `--dt-row-selected` background
4. **Striped**: Even rows with `--dt-row-stripe`

### Cell Types

#### Text Cells
- Standard formatting
- Truncate with ellipsis
- Tooltip on hover for full text

#### Numeric Cells
- Right-aligned
- Monospace font option
- Configurable decimal places

#### Status Cells
- Badge formatting
- Icon support
- Color coding

#### Action Cells
- Icon buttons
- Grouped actions
- Dropdown menus

### Filtering UI
- Inline filters in header
- Dropdown filter menus
- Search input styling
- Clear filter buttons

### Sorting Indicators
- Arrow icons in headers
- Multi-column sort numbers
- Click to toggle direction

## Theme Implementation

### CSS Variables Strategy
```css
.datatable-component {
  /* Use CSS variables for all colors */
  background: var(--dt-background);
  color: var(--dt-foreground);
  border: 1px solid var(--dt-border);
}

/* Dark mode automatically switches variables */
.dark .datatable-component {
  /* No changes needed - variables handle it */
}
```

### Component Theming
1. Never use hard-coded colors
2. Always reference CSS variables
3. Test in both light and dark modes
4. Consider contrast ratios

### Dynamic Theming
```typescript
// TypeScript example
interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  // ... other colors
}

const getThemeColors = (isDark: boolean): ThemeColors => {
  return isDark ? darkTheme : lightTheme;
};
```

## Accessibility Guidelines

### Color Contrast
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum
- Disabled states: No requirement but maintain readability

### Focus States
- Visible focus ring: 2px solid `--dt-ring`
- Focus offset: 2px
- High contrast mode support
- Sequential tab order

### Screen Reader Support
- Proper ARIA labels
- Role attributes
- Live regions for updates
- Descriptive button text

### Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order
- Escape to close dialogs
- Arrow keys for grid navigation

### Motion
- Respect `prefers-reduced-motion`
- Provide motion-free alternatives
- Keep transitions under 300ms

## Implementation Guidelines

### Component Structure
```tsx
// React/TypeScript example
interface DataTableProps {
  className?: string;
  darkMode?: boolean;
  // ... other props
}

export const DataTable: React.FC<DataTableProps> = ({
  className,
  darkMode = false,
  ...props
}) => {
  return (
    <div 
      className={cn(
        "dt-table",
        darkMode && "dark",
        className
      )}
      {...props}
    >
      {/* Component content */}
    </div>
  );
};
```

### Styling Best Practices
1. Use CSS modules or CSS-in-JS
2. Prefix all classes with `dt-`
3. Avoid `!important`
4. Use CSS variables for all values
5. Mobile-first responsive design

### Performance Considerations
1. Virtual scrolling for large datasets
2. Memoization for expensive renders
3. Debounced search inputs
4. Lazy loading for dialogs
5. CSS containment for better performance

This design system ensures consistency across all DataTable components while maintaining flexibility for customization and excellent support for both light and dark themes.