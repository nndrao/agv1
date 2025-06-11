# DataSource Floating Dialog Implementation

## Overview
The DataSource dialog has been converted to use the existing FloatingDialog component, making it draggable, resizable, and maximizable.

## Changes Made

### 1. Created DataSourceFloatingDialog Wrapper
**File**: `src/components/datatable/datasource/DataSourceFloatingDialog.tsx`
- Wraps the DataSourceDialog with FloatingDialog component
- Provides default sizing and constraints
- Enables drag, resize, and maximize functionality

### 2. Modified DataSourceDialog
**File**: `src/components/datatable/datasource/DataSourceDialog.tsx`
- Added `isFloating` prop to support rendering without Dialog wrapper
- Refactored render logic to conditionally wrap content
- When `isFloating=true`, returns content without Dialog component

### 3. Updated DataTableContainer
**File**: `src/components/datatable/DataTableContainer.tsx`
- Replaced DataSourceDialog with DataSourceFloatingDialog
- Removed the DataSourceDialogSimple import

### 4. Added Styles
**File**: `src/components/datatable/datasource/datasource-floating-dialog.css`
- Custom styles for the floating dialog variant
- Ensures proper layout and spacing

## Features

### Floating Dialog Capabilities
- **Draggable**: Click and drag the header to move the dialog
- **Resizable**: Drag the bottom-right corner to resize
- **Maximizable**: Click the maximize button to fill the screen
- **Persistent Position**: Dialog position and size are saved to localStorage
- **Escape to Close**: Press ESC to close the dialog

### Configuration
```typescript
<FloatingDialog
  title="Data Source Configuration"
  initialSize={{ width: 900, height: 700 }}
  minWidth={600}
  minHeight={400}
  maxWidth={1200}
  maxHeight={900}
  resizable={true}
  maximizable={true}
/>
```

## Usage
Click the Database icon in the toolbar to open the floating DataSource dialog. You can then:
- Drag it around the screen
- Resize it to your preference
- Maximize it for full-screen editing
- Configure STOMP and REST data sources
- Test connections and build column definitions

The dialog will remember its position and size between sessions.