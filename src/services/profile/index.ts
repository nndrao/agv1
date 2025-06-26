/**
 * Profile Management Service Exports
 * 
 * Central export file for all profile-related services, contexts, and hooks.
 */

// Service
export {
  ProfileManagementService,
  profileManagementService,
  type ExportedProfile,
  type ProfileValidationResult,
  type ProfileMigrationResult,
  type ProfileManagementServiceOptions,
  type ProfileServiceEvent,
  type ProfileServiceEventListener
} from './ProfileManagementService';

// Context and Provider
export {
  ProfileProvider,
  useProfileContext,
  useProfileService,
  useProfiles,
  useActiveProfile,
  useProfileOperations,
  type ProfileContextState,
  type ProfileProviderProps
} from './ProfileContext';

// Hooks
export {
  useProfileManagement,
  useActiveProfileOnly,
  useProfileCrud,
  type UseProfileManagementOptions,
  type UseProfileManagementReturn
} from './useProfileManagement';

// Re-export types from datatable
export type { GridProfile } from '../../components/datatable/types';