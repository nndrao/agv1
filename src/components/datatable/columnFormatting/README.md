# Column Formatting Implementation

This folder contains the consolidated column formatting implementation using the Floating Ribbon UI pattern.

## Structure

```
columnFormatting/
├── ColumnFormattingDialog.tsx    # Main entry point (renamed from ColumnCustomizationDialog)
├── FloatingRibbonUI.tsx          # Main ribbon UI component
├── ribbon-styles.css             # Ribbon-specific styles
├── components/                   # UI components
│   ├── ribbon/                   # Ribbon-specific components
│   │   ├── RibbonHeader.tsx
│   │   ├── RibbonTabs.tsx
│   │   ├── RibbonContent.tsx
│   │   └── RibbonPreview.tsx
│   ├── tabs/                     # Tab content components
│   │   ├── GeneralTab.tsx
│   │   ├── StylingTab.tsx
│   │   ├── FormatTab.tsx
│   │   ├── FilterTab.tsx
│   │   └── EditorTab.tsx
│   ├── controls/                 # Shared control components
│   │   ├── AlignmentIconPicker.tsx
│   │   ├── CollapsibleSection.tsx
│   │   ├── CustomizationBadges.tsx
│   │   ├── FormatWizard.tsx
│   │   ├── MixedValueInput.tsx
│   │   ├── NumericInput.tsx
│   │   ├── OptimizedSelect.tsx
│   │   └── ThreeStateCheckbox.tsx
│   └── templates/                # Template-related components
│       ├── TemplateSelector.tsx
│       ├── SimpleTemplateControls.tsx
│       └── BulkTemplateApplication.tsx
├── hooks/                        # Custom hooks
│   ├── useRibbonState.ts
│   ├── useOptimizedStore.ts
│   └── useSoundPreference.ts
├── store/                        # State management
│   └── columnFormatting.store.ts
├── types/                        # TypeScript types
│   └── index.ts
└── utils/                        # Utility functions
    └── feedback.ts
```

## Usage

The column formatting is triggered from the AG-Grid context menu:

1. User right-clicks column header → "Format Column"
2. `DataTableContainer` listens for the 'format-column' event
3. Opens `ColumnFormattingDialog`
4. Dialog renders `FloatingRibbonUI`
5. User makes changes in the ribbon interface
6. Changes are applied to the grid

## Key Features

- **Floating Ribbon UI**: Microsoft Office-inspired interface
- **Multi-column support**: Format multiple columns at once
- **Templates**: Pre-built and custom formatting templates
- **Live preview**: See changes in real-time
- **Draggable**: Reposition the ribbon anywhere on screen