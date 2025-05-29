# Lightweight Column Serialization System

## Overview

This document describes the lightweight serialization system for AG-Grid column definitions that dramatically reduces storage size while maintaining all functionality.

## Problem Statement

Previously, the entire column definition object was saved for each profile, including:
- All default properties
- Unchanged values
- Function references (which couldn't be serialized properly)
- Duplicate data across profiles

This resulted in:
- Large localStorage usage (10-50KB per profile)
- Performance issues with many profiles
- Difficulty maintaining and migrating data
- Risk of hitting localStorage limits

## Solution: Diff-Based Serialization

The lightweight system only saves properties that differ from defaults:

### Key Components

1. **Column Serializer** (`src/stores/column-serializer.ts`)
   - `serializeColumnCustomizations()` - Creates lightweight diff objects
   - `deserializeColumnCustomizations()` - Reconstructs full column definitions
   - Only stores changed properties

2. **Profile Store Updates** (`src/stores/profile.store.ts`)
   - New format: `columnCustomizations` instead of `columnDefs`
   - Stores base column definitions separately
   - Automatic migration from old format

3. **Storage Analyzer** (`src/stores/storage-analyzer.ts`)
   - Analyzes storage usage
   - Shows savings per profile
   - Available via `window.analyzeProfileStorage()`

## Data Structure

### Old Format
```javascript
{
  columnDefs: [
    {
      field: "id",
      headerName: "ID",
      sortable: true,      // Default value stored
      resizable: true,     // Default value stored
      filter: true,        // Default value stored
      flex: 1,             // Default value stored
      minWidth: 100,       // Default value stored
      // ... 20+ more properties
    }
  ]
}
```

### New Format
```javascript
{
  columnCustomizations: {
    "id": {
      field: "id",
      headerName: "Order ID",  // Only changed properties
      cellStyle: { color: "blue" }
    }
  },
  baseColumnDefs: [...]  // Minimal reference
}
```

## What Gets Saved

Only properties that differ from defaults:
- Custom header names
- Styles (cellStyle, headerStyle)
- Formatters (as metadata)
- CSS classes
- Boolean flags (if changed)
- Width/pinned state (if changed)
- Cell data types
- Alignment classes

## Benefits

1. **Storage Reduction**: 70-90% reduction in storage size
2. **Performance**: Faster save/load operations
3. **Maintainability**: Easier to see what's actually customized
4. **Scalability**: Support many more profiles
5. **Migration**: Cleaner data migrations

## Usage

### Console Commands

```javascript
// Analyze current storage usage
window.analyzeProfileStorage()

// Migrate all profiles to lightweight format
window.migrateProfiles()

// Refresh all profiles
window.refreshProfiles()
```

### Programmatic Usage

```javascript
import { serializeColumnCustomizations, deserializeColumnCustomizations } from '@/stores/column-serializer';

// Serialize
const customizations = serializeColumnCustomizations(columnDefs, baseColumns);

// Deserialize
const fullColumnDefs = deserializeColumnCustomizations(customizations, baseColumns);
```

## Migration

The system includes automatic migration:
1. Version 4 of the storage schema triggers migration
2. Existing profiles are converted on first load
3. Both formats work during transition
4. Old format is removed on next save

## Technical Details

### Serialization Process
1. Compare each column against base/default
2. Extract only changed properties
3. Store special handling for:
   - Functions (converted to metadata)
   - Styles (preserved as objects)
   - Formatters (stored as config)

### Deserialization Process
1. Start with base column definitions
2. Apply customizations as patches
3. Recreate functions from metadata
4. Restore full column objects

### Special Handling

**Value Formatters**:
- Stored as `{ type: 'excel', formatString: '...' }`
- Recreated using `createExcelFormatter()`

**Header Styles**:
- Stored as `{ type: 'function', regular: {...}, floating: {...} }`
- Recreated as conditional functions

**Cell Styles**:
- Static styles stored directly
- Conditional styles stored with format string

## Future Enhancements

1. **Compression**: Further reduce size with compression
2. **Cloud Sync**: Easier to sync lightweight data
3. **Profile Sharing**: Share minimal customization files
4. **Incremental Updates**: Only sync changes
5. **Template System**: Build on lightweight format