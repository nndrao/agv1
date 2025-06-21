/**
 * ProfileManagementService Tests
 * 
 * Demonstrates how the service works with existing localStorage data
 */

import { ProfileManagementService } from './ProfileManagementService';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter';
import { STORAGE_KEYS } from '../storage/StorageAdapter';

// Example: Basic usage
async function basicUsageExample() {
  // Create service instance
  const service = new ProfileManagementService({
    storageAdapter: new LocalStorageAdapter(),
    autoMigrate: true,
    validateOnSave: true
  });

  // Initialize service (performs migration if needed)
  await service.initialize();

  // Get all profiles
  const profiles = await service.getProfiles();
  console.log('Total profiles:', profiles.length);

  // Get active profile
  const activeProfile = await service.getActiveProfile();
  console.log('Active profile:', activeProfile?.name);

  // Create a new profile
  const newProfile = await service.createProfile(
    'My Custom Profile',
    'A profile with custom settings',
    activeProfile?.id // Clone from active profile
  );
  console.log('Created profile:', newProfile.id);

  // Update profile settings
  const updated = await service.updateProfile(newProfile.id, {
    columnSettings: {
      ...newProfile.columnSettings,
      columnCustomizations: {
        'price': {
          field: 'price',
          valueFormatter: '${value}',
          cellStyle: { color: 'green', fontWeight: 'bold' }
        }
      }
    }
  });
  console.log('Updated profile:', updated.name);

  // Set as active profile
  await service.setActiveProfile(newProfile.id);
  console.log('Active profile changed to:', newProfile.name);

  // Export profile
  const exported = await service.exportProfile(newProfile.id);
  console.log('Exported profile:', {
    name: exported.name,
    exportedAt: new Date(exported.exportedAt),
    version: exported.exportVersion
  });

  // Delete profile
  await service.deleteProfile(newProfile.id);
  console.log('Profile deleted');
}

// Example: Working with existing profile.store.ts data
async function workWithExistingData() {
  const adapter = new LocalStorageAdapter();
  const service = new ProfileManagementService({ storageAdapter: adapter });

  // Check existing data structure
  const existingData = await adapter.get(STORAGE_KEYS.PROFILES);
  console.log('Existing localStorage structure:', {
    hasData: !!existingData,
    version: existingData?.version,
    profileCount: existingData?.state?.profiles?.length
  });

  // Initialize will migrate if needed
  await service.initialize();

  // The service now works with the migrated data
  const profiles = await service.getProfiles();
  profiles.forEach(profile => {
    console.log('Profile:', {
      id: profile.id,
      name: profile.name,
      hasColumnSettings: !!profile.columnSettings,
      hasGridState: !!profile.gridState,
      hasGridOptions: !!profile.gridOptions,
      hasLegacyData: !!profile.gridState_legacy
    });
  });
}

// Example: Import/Export workflow
async function importExportExample() {
  const service = new ProfileManagementService();
  await service.initialize();

  // Export all profiles to JSON
  const exportedJson = await service.exportToJson();
  console.log('Exported JSON size:', exportedJson.length, 'bytes');

  // Import profiles from JSON
  const importResult = await service.importFromJson(exportedJson, {
    generateNewIds: true, // Avoid ID conflicts
    skipInvalid: true     // Skip any invalid profiles
  });
  console.log('Import result:', {
    imported: importResult.imported.length,
    failed: importResult.failed.length
  });

  // Import a single profile with validation
  const singleProfile = {
    id: 'test-profile',
    name: 'Test Profile',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    columnSettings: {
      columnCustomizations: {},
      baseColumnDefs: []
    },
    gridState: {
      columnState: [],
      filterModel: {},
      sortModel: []
    },
    gridOptions: {}
  };

  const validation = service.validateProfile(singleProfile);
  console.log('Profile validation:', validation);

  if (validation.valid) {
    const imported = await service.importProfile(singleProfile, {
      generateNewId: true,
      setAsActive: false
    });
    console.log('Imported profile:', imported.id);
  }
}

// Example: Event handling
async function eventHandlingExample() {
  const service = new ProfileManagementService();
  await service.initialize();

  // Add event listener
  const unsubscribe = service.addEventListener((event) => {
    console.log('Profile event:', event);
    
    switch (event.type) {
      case 'profile-created':
        console.log('New profile created:', event.profile.name);
        break;
      case 'profile-updated':
        console.log('Profile updated:', event.profile.name);
        break;
      case 'profile-deleted':
        console.log('Profile deleted:', event.profileId);
        break;
      case 'active-profile-changed':
        console.log('Active profile changed to:', event.profileId);
        break;
    }
  });

  // Trigger some events
  const profile = await service.createProfile('Event Test Profile');
  await service.updateProfile(profile.id, { description: 'Updated description' });
  await service.setActiveProfile(profile.id);
  await service.deleteProfile(profile.id);

  // Cleanup
  unsubscribe();
}

// Example: Migration handling
async function migrationExample() {
  const service = new ProfileManagementService({
    autoMigrate: true // Will automatically migrate on initialize
  });

  // Get statistics before initialization
  const statsBefore = await service.getStatistics();
  console.log('Stats before migration:', statsBefore);

  // Initialize (triggers migration if needed)
  await service.initialize();

  // Get statistics after initialization
  const statsAfter = await service.getStatistics();
  console.log('Stats after migration:', statsAfter);

  // Check for legacy profiles
  if (statsAfter.hasLegacyProfiles) {
    console.log('Some profiles still have legacy data structures');
  }
}

// Example: Using with React hooks
function ReactComponentExample() {
  // This would be in a React component
  /*
  import { useProfileManagement } from './useProfileManagement';
  
  function MyComponent() {
    const {
      profiles,
      activeProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      isLoading,
      error
    } = useProfileManagement({
      autoLoad: true,
      onError: (error) => console.error('Profile error:', error),
      onProfileChange: (profile) => console.log('Active profile changed:', profile?.name)
    });

    if (isLoading) return <div>Loading profiles...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
      <div>
        <h2>Profiles ({profiles.length})</h2>
        <p>Active: {activeProfile?.name}</p>
        
        <button onClick={() => createProfile('New Profile')}>
          Create Profile
        </button>
      </div>
    );
  }
  */
}

// Run examples (uncomment to test)
// basicUsageExample().catch(console.error);
// workWithExistingData().catch(console.error);
// importExportExample().catch(console.error);
// eventHandlingExample().catch(console.error);
// migrationExample().catch(console.error);