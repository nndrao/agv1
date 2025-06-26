# Profile-Specific Datasource Implementation

## Overview
This implementation makes datasource selection profile-specific, so each profile can have its own associated datasource. When switching profiles, the corresponding datasource is automatically loaded and activated.

## Changes Made

### 1. Profile Store Updates
- Added `datasourceId?: string` to the `GridProfile` interface in `/src/components/datatable/stores/profile.store.ts`
- The datasource ID is now saved as part of the profile

### 2. Component Datasource Hook
- Modified `/src/components/datatable/hooks/useComponentDatasource.ts`:
  - Removed component-level datasource storage
  - Now reads datasource from the active profile
  - When datasource changes, it updates the profile with new column definitions
  - Clears column customizations and grid state when switching datasources

### 3. Profile Sync Hook
- Updated `/src/components/datatable/hooks/useProfileSync.ts`:
  - Added `onDatasourceChange` callback parameter
  - When profile changes, it triggers datasource update

### 4. DataTable Container
- Modified `/src/components/datatable/DataTableContainer.tsx`:
  - Passes `handleDatasourceChange` to `useProfileSync`
  - Watches for datasource changes and updates grid accordingly
  - Resets column state when datasource changes

### 5. DataTable Toolbar
- Updated `/src/components/datatable/DataTableToolbar.tsx`:
  - Added datasource saving to `handleSaveProfile`
  - Datasource ID is now saved when saving profile

## How It Works

1. **Datasource Selection**: User selects a datasource from the dropdown in the toolbar
2. **Column Replacement**: When a datasource is selected, its column definitions replace the current ones
3. **Profile Association**: When the profile is saved, the datasource ID is stored with the profile
4. **Profile Switching**: When switching profiles, the associated datasource is automatically loaded
5. **State Reset**: Grid state (filters, sorts, column order) is reset when datasource changes

## Test Component
Created `TestProfileDatasource.tsx` to demonstrate the functionality:
- Create multiple profiles
- Select different datasources for each profile
- Switch between profiles to see datasources change

## Key Benefits
- Each profile can have its own datasource configuration
- Column definitions from datasources are automatically applied
- Seamless switching between profiles with different data sources
- Grid state is properly reset to avoid conflicts