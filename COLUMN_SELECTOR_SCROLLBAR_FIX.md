# Column Selector Scrollbar and Width Fix

## Problem
The column selector panel had several visual issues:
1. Both vertical and horizontal scrollbars were showing
2. Panel was too wide (360px) for its content
3. Scrollbars were not theme-compatible

## Solution Implemented

### 1. Reduced Panel Width
- Changed from `w-[360px]` to `w-[340px]`
- This better fits the content without horizontal overflow

### 2. Improved Table Layout
- Reduced column widths and padding:
  - Checkbox column: `w-8` with `px-1.5`
  - Type column: `w-10` with `px-1`
  - Visibility icon: `w-8` with `px-1`
  - Settings icon: `w-8` with `px-1`
- Added max-width constraint to column names: `max-w-[140px]`
- Reduced badge heights for better vertical spacing

### 3. Fixed Scrollbar Styling
- Removed custom scrollbar classes that weren't working
- Used standard `overflow-auto` on the container
- Added theme-compatible scrollbar styles in `index.css`:
  ```css
  /* WebKit browsers */
  .overflow-auto::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .overflow-auto::-webkit-scrollbar-thumb {
    @apply bg-border rounded-full;
  }
  
  /* Firefox */
  .overflow-auto {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border)) transparent;
  }
  ```

### 4. Removed Horizontal Scrollbar
- Set `overflow-hidden` on the outer container
- Properly constrained table width to prevent overflow
- All content now fits within the 340px width

## Visual Improvements
- Clean, single vertical scrollbar when needed
- No horizontal scrolling required
- Theme-compatible scrollbar colors (adapts to light/dark mode)
- Better use of space with tighter padding
- Professional appearance matching shadcn/ui design system

## Technical Details
- Removed unused table component imports
- Added z-index to sticky header for proper layering
- Improved empty state positioning
- All changes maintain existing functionality