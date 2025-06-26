# Migration Guide: Moving to Unified Profile Management Architecture

This guide explains how to gradually migrate from the current localStorage-based system to the new unified profile management architecture without breaking existing functionality.

## Overview

The migration is designed to be done in phases, allowing the old and new systems to work side-by-side until the migration is complete.

## Phase 1: Storage Adapter Layer (Complete)

### What's Available
- `StorageAdapter` interface for abstracted storage operations
- `LocalStorageAdapter` implementation that works with existing localStorage
- Type-safe storage operations

### How to Use
```typescript
import { storageAdapter } from '@/services/storage';

// Instead of:
const profiles = JSON.parse(localStorage.getItem('grid-profile-storage') || '[]');

// Use:
const profiles = await storageAdapter.get('grid-profile-storage', []);
```

### Benefits
- Async-ready for future remote storage
- Type safety
- Centralized storage key management

## Phase 2: Profile Management Service (Complete)

### What's Available
- `ProfileManagementService` for profile CRUD operations
- React Context and hooks for profile management
- Event-driven updates

### How to Use

#### Option 1: Direct Service Usage
```typescript
import { ProfileManagementService } from '@/services/profile';

const service = new ProfileManagementService();
await service.initialize();

// Create profile
const profile = await service.createProfile('New Profile');

// Update profile
await service.updateProfile(profile.id, { name: 'Updated Name' });
```

#### Option 2: React Hooks
```typescript
import { useProfileManagement } from '@/services/profile';

function MyComponent() {
  const { profiles, activeProfile, createProfile } = useProfileManagement();
  
  const handleCreate = async () => {
    await createProfile('New Profile');
  };
  
  return (
    <div>
      {profiles.map(profile => (
        <div key={profile.id}>{profile.name}</div>
      ))}
    </div>
  );
}
```

#### Option 3: React Context
```typescript
import { ProfileProvider, useProfiles } from '@/services/profile';

// Wrap your app
<ProfileProvider>
  <App />
</ProfileProvider>

// Use in components
function ProfileSelector() {
  const { profiles, activeProfile, setActiveProfile } = useProfiles();
  // ...
}
```

## Phase 3: Unified Config Store (Complete)

### What's Available
- `UnifiedConfigStore` that maps old localStorage to new schema
- `useUnifiedConfig` hook for React components
- Conversion utilities between old and new formats

### How to Use

#### Basic Usage
```typescript
import { useUnifiedConfig } from '@/components/datatable/hooks/useUnifiedConfig';

function MyDataTable() {
  const {
    config,
    loading,
    createVersion,
    activateVersion
  } = useUnifiedConfig({
    instanceId: 'my-datatable',
    autoLoad: true
  });
  
  // Use config in your component
  const activeVersion = config?.settings.versions[config.settings.activeVersionId];
}
```

#### Converting Between Formats
```typescript
// Convert existing GridProfile to ComponentConfig
const configUpdate = profileToConfig(existingProfile);
await updateConfig(configUpdate);

// Convert ComponentConfig back to GridProfile
const profile = configToProfile(config);
```

## Migration Strategy

### Step 1: Update Storage Access (Low Risk)
Replace direct localStorage calls with StorageAdapter:

```typescript
// Before
localStorage.setItem('grid-profile-storage', JSON.stringify(profiles));

// After
await storageAdapter.set('grid-profile-storage', profiles);
```

### Step 2: Use Profile Service for New Features (Medium Risk)
For new features, use the ProfileManagementService:

```typescript
// Use service for new profile operations
const { createProfile, updateProfile } = useProfileManagement();

// Keep existing store for backward compatibility
const { profiles } = useProfileStore();
```

### Step 3: Gradual Component Migration (Medium Risk)
Create new components that use unified config:

```typescript
// New component with unified config
export const DataTableV2 = () => {
  const { config } = useUnifiedConfig();
  // New implementation
};

// Keep old component working
export const DataTable = () => {
  const { activeProfile } = useProfileStore();
  // Existing implementation
};
```

### Step 4: Data Migration (High Risk - Do Last)
Only after all components are updated:

```typescript
// One-time migration script
async function migrateToUnifiedSchema() {
  const store = new UnifiedConfigStore();
  
  // Get all old data
  const profiles = await storageAdapter.get('grid-profile-storage', []);
  const templates = await storageAdapter.get('column-template-store', {});
  
  // Convert and save in new format
  for (const profile of profiles) {
    const config = convertProfileToConfig(profile);
    await store.setConfig(config);
  }
}
```

## Testing Migration

### 1. Test Storage Adapter
```typescript
// Run in browser console
const testStorage = async () => {
  const { storageAdapter } = await import('./services/storage');
  
  // Test basic operations
  await storageAdapter.set('test-key', { data: 'test' });
  const result = await storageAdapter.get('test-key');
  console.log('Storage test:', result);
  
  await storageAdapter.remove('test-key');
};
```

### 2. Test Profile Service
```typescript
// Test profile operations
const testProfiles = async () => {
  const { ProfileManagementService } = await import('./services/profile');
  const service = new ProfileManagementService();
  await service.initialize();
  
  // Create test profile
  const profile = await service.createProfile('Test Profile');
  console.log('Created profile:', profile);
  
  // List profiles
  const profiles = await service.getProfiles();
  console.log('All profiles:', profiles);
};
```

### 3. Test Unified Config
```typescript
// Test unified config
const testUnifiedConfig = async () => {
  const { UnifiedConfigStore } = await import('./services/config');
  const store = new UnifiedConfigStore('test-user', 'test-app');
  
  // Get all configs
  const configs = await store.getAllConfigs();
  console.log('All configs:', configs);
};
```

## Rollback Plan

If issues occur during migration:

1. **Storage Adapter**: Remove adapter usage and return to direct localStorage
2. **Profile Service**: Continue using existing profile.store.ts
3. **Unified Config**: Remove new components and keep existing ones
4. **Data Migration**: Keep backup of localStorage before migration

## Common Issues and Solutions

### Issue: TypeScript Errors
**Solution**: Ensure all imports are updated:
```typescript
// Update imports
import { GridProfile } from '@/components/datatable/stores/profile.store';
import { ComponentConfig } from '@/services/config/UnifiedConfigStore';
```

### Issue: State Not Syncing
**Solution**: Use event system for updates:
```typescript
// Subscribe to changes
service.on('profilesChanged', (profiles) => {
  // Update UI
});
```

### Issue: Performance
**Solution**: Use selective loading:
```typescript
// Load only what you need
const config = await store.getConfig(instanceId);
// Instead of loading all configs
```

## Next Steps

1. Start with Phase 1 - Replace localStorage calls with StorageAdapter
2. Test thoroughly in development
3. Deploy Phase 1 to production
4. Repeat for subsequent phases
5. Only do full data migration after all components are updated

## Support

For questions or issues during migration:
1. Check the test files for examples
2. Review the architecture document
3. Keep the old system running until migration is complete