# Import Updates Summary for Column Formatting Module

## Overview
All imports in the columnFormatting module have been updated to reflect the new folder structure.

## Key Changes Made

### 1. Store Import Updates
- Changed: `useColumnCustomizationStore` → `useColumnFormattingStore`
- Changed: `columnCustomization.store` → `columnFormatting.store`
- All references updated across 15+ files

### 2. Path Updates

#### In Ribbon Components (components/ribbon/):
- Updated imports from `../../columnCustomizations/store/` → `../../store/`
- Updated imports from `../../columnCustomizations/components/` → `../controls/`
- Updated imports from relative utils paths → absolute paths `@/components/datatable/utils/`

#### In Tab Components (components/tabs/):
- Updated store imports to `../../store/columnFormatting.store`
- Updated utility imports to use absolute paths

#### In Hooks (hooks/):
- Updated store imports to `../store/columnFormatting.store`
- Updated profile store imports to absolute paths

#### In Controls (components/controls/):
- Updated store imports to `../../store/columnFormatting.store`

### 3. Index.ts Updates
- Updated sub-component exports to include correct subdirectory paths
- Added `/ribbon/` to ribbon component exports

### 4. External Dependencies
- Template store imports updated to: `@/components/datatable/stores/columnTemplate.store`
- Profile store imports updated to: `@/components/datatable/stores/profile.store`
- Utility imports updated to: `@/components/datatable/utils/`

## Files Modified
1. ColumnFormattingDialog.tsx
2. FloatingRibbonUI.tsx
3. hooks/useRibbonState.ts
4. hooks/useOptimizedStore.ts
5. components/ribbon/RibbonHeader.tsx
6. components/ribbon/RibbonContent.tsx
7. components/ribbon/RibbonTabs.tsx
8. components/ribbon/RibbonPreview.tsx
9. components/ribbon/TemplateSelector.tsx
10. components/ribbon/SimpleTemplateControls.tsx
11. components/ribbon/BulkTemplateApplication.tsx
12. components/tabs/GeneralRibbonContent.tsx
13. components/tabs/StylingRibbonContent.tsx
14. components/tabs/FormatRibbonContent.tsx
15. components/tabs/FilterRibbonContent.tsx
16. components/tabs/EditorRibbonContent.tsx
17. components/controls/CollapsibleSection.tsx
18. index.ts

## Verification
All imports have been verified and updated to work with the new folder structure. The module is now fully self-contained with proper import paths.