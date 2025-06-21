# Profile Management Service

The ProfileManagementService provides a comprehensive solution for managing grid profiles with support for CRUD operations, versioning, migration, and import/export functionality. It works seamlessly with the existing localStorage data structure through the StorageAdapter interface.

## Features

- **CRUD Operations**: Create, read, update, and delete profiles
- **Profile Cloning**: Duplicate existing profiles with new names
- **Import/Export**: Export profiles to JSON and import from external sources
- **Data Migration**: Automatic migration from older profile formats
- **Validation**: Built-in profile validation with detailed error reporting
- **Event System**: Subscribe to profile changes with event listeners
- **React Integration**: Hooks and context providers for React components
- **Backward Compatibility**: Works with existing localStorage data

## Installation

The service is already included in the project. Import it from:

```typescript
import { 
  ProfileManagementService,
  ProfileProvider,
  useProfileManagement 
} from '@/services/profile';
```

## Basic Usage

### Using the Service Directly

```typescript
import { ProfileManagementService } from '@/services/profile';

// Create service instance
const profileService = new ProfileManagementService();

// Initialize (performs migration if needed)
await profileService.initialize();

// Get all profiles
const profiles = await profileService.getProfiles();

// Get active profile
const activeProfile = await profileService.getActiveProfile();

// Create a new profile
const newProfile = await profileService.createProfile(
  'My Profile',
  'Description here',
  'source-profile-id' // Optional: clone from existing profile
);

// Update profile
await profileService.updateProfile(newProfile.id, {
  columnSettings: {
    columnCustomizations: {
      'price': {
        field: 'price',
        valueFormatter: '${value}',
        cellStyle: { color: 'green' }
      }
    }
  }
});

// Set as active
await profileService.setActiveProfile(newProfile.id);

// Delete profile
await profileService.deleteProfile(newProfile.id);
```

### Using React Hooks

```typescript
import { useProfileManagement } from '@/services/profile';

function MyComponent() {
  const {
    profiles,
    activeProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    isLoading,
    error
  } = useProfileManagement({
    autoLoad: true,
    onError: (error) => console.error('Profile error:', error)
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Active Profile: {activeProfile?.name}</h2>
      <select 
        value={activeProfile?.id} 
        onChange={(e) => setActiveProfile(e.target.value)}
      >
        {profiles.map(profile => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Using React Context

```typescript
import { ProfileProvider, useActiveProfile } from '@/services/profile';

// Wrap your app
function App() {
  return (
    <ProfileProvider>
      <YourComponents />
    </ProfileProvider>
  );
}

// Use in components
function ProfileDisplay() {
  const { activeProfile, setActiveProfile } = useActiveProfile();
  
  return <div>Current: {activeProfile?.name}</div>;
}
```

## Import/Export

### Export Profiles

```typescript
// Export single profile
const exported = await profileService.exportProfile('profile-id');

// Export all profiles
const allExported = await profileService.exportProfiles();

// Export as JSON string
const jsonString = await profileService.exportToJson();

// Save to file
const blob = new Blob([jsonString], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'grid-profiles.json';
a.click();
```

### Import Profiles

```typescript
// Import from JSON string
const result = await profileService.importFromJson(jsonString, {
  generateNewIds: true,  // Avoid ID conflicts
  skipInvalid: true      // Continue on validation errors
});

console.log(`Imported: ${result.imported.length}`);
console.log(`Failed: ${result.failed.length}`);

// Import single profile
const imported = await profileService.importProfile(profileData, {
  generateNewId: true,
  setAsActive: true
});
```

## Event Handling

```typescript
// Subscribe to events
const unsubscribe = profileService.addEventListener((event) => {
  switch (event.type) {
    case 'profile-created':
      console.log('Created:', event.profile.name);
      break;
    case 'profile-updated':
      console.log('Updated:', event.profile.name);
      break;
    case 'profile-deleted':
      console.log('Deleted:', event.profileId);
      break;
    case 'active-profile-changed':
      console.log('Active changed:', event.profileId);
      break;
    case 'storage-error':
      console.error('Storage error:', event.error);
      break;
  }
});

// Cleanup
unsubscribe();
```

## Data Structure

The service works with the existing GridProfile structure:

```typescript
interface GridProfile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  description?: string;
  
  // Column settings (from ribbon)
  columnSettings?: {
    columnCustomizations?: Record<string, ColumnCustomization>;
    baseColumnDefs?: ColumnDef[];
    templates?: Record<string, unknown>[];
    columnTemplates?: Record<string, unknown>[];
  };
  
  // Grid state (from AG-Grid)
  gridState?: {
    columnState: ColumnState[];
    filterModel: FilterModel;
    sortModel: SortModelItem[];
  };
  
  // Grid options (from editor)
  gridOptions?: {
    rowHeight?: number;
    headerHeight?: number;
    font?: string;
    fontSize?: string;
    // ... other options
  };
  
  // Legacy data (for backward compatibility)
  gridState_legacy?: any;
}
```

## Migration

The service automatically migrates profiles from older formats:

1. **Version 1 → 2**: Cleans invalid column properties
2. **Version 2 → 3**: Converts header styles to new format
3. **Version 3 → 4**: Separates columnSettings, gridState, and gridOptions

Migration happens automatically on initialization:

```typescript
const service = new ProfileManagementService({
  autoMigrate: true  // Default: true
});

await service.initialize(); // Migration happens here
```

## Validation

Profiles are validated before save operations:

```typescript
const validation = profileService.validateProfile(profile);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}
```

Disable validation if needed:

```typescript
const service = new ProfileManagementService({
  validateOnSave: false
});
```

## Storage Adapter

The service uses StorageAdapter for flexibility:

```typescript
import { LocalStorageAdapter } from '@/services/storage';

// Use localStorage (default)
const service = new ProfileManagementService({
  storageAdapter: new LocalStorageAdapter()
});

// Or implement your own adapter
class CustomStorageAdapter implements StorageAdapter {
  async get(key: string) { /* ... */ }
  async set(key: string, value: any) { /* ... */ }
  // ... other methods
}

const service = new ProfileManagementService({
  storageAdapter: new CustomStorageAdapter()
});
```

## Integration with Existing Code

The service is designed to work seamlessly with the existing profile.store.ts:

```typescript
// Existing profile store continues to work
import { useProfileStore } from '@/components/datatable/stores/profile.store';

// New service can read/write the same data
const service = new ProfileManagementService();
await service.initialize();

// Both work with the same localStorage key
const profiles = await service.getProfiles();
// Same as: useProfileStore.getState().profiles
```

## Best Practices

1. **Initialize Once**: Call `initialize()` once at app startup
2. **Handle Errors**: Always handle promise rejections
3. **Use Events**: Subscribe to events for reactive updates
4. **Validate Imports**: Validate profiles before importing
5. **Clone Wisely**: Clone from appropriate source profiles
6. **Clean Up**: Unsubscribe from events when done

## Future Enhancements

The service is designed to support future unified schema:

- Multi-component profiles (DataTable, Charts, etc.)
- Profile versioning and history
- Cloud synchronization
- Profile sharing and collaboration
- Advanced migration strategies