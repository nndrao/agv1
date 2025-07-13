import type { WorkspacePlatformSettings } from '@openfin/workspace-platform';
import type { DockProviderConfigWithIdentity } from '@openfin/workspace';
import { getHttpIconUrl } from '../utils/iconGenerator';

// Define dock provider configuration following OpenFin's pattern
export const dockProvider: DockProviderConfigWithIdentity = {
  id: 'agv1-dock',
  title: 'AGV1 Workspace',
  icon: 'http://localhost:5173/vite.svg',
  workspaceComponents: ['home', 'notifications', 'store', 'switchWorkspace'],
  disableUserRearrangement: false,
  buttons: [
    {
      tooltip: 'New DataTable',
      iconUrl: getHttpIconUrl('newDataTable'),
      action: {
        id: 'launch-datatable'
      }
    },
    {
      tooltip: 'Data Sources',
      iconUrl: getHttpIconUrl('dataSources'),
      action: {
        id: 'open-datasources'
      }
    },
    {
      tooltip: 'Profiles',
      iconUrl: getHttpIconUrl('profiles'),
      action: {
        id: 'manage-profiles'
      }
    },
    {
      tooltip: 'Settings',
      iconUrl: getHttpIconUrl('settings'),
      action: {
        id: 'import-export-settings'
      }
    }
  ]
};

export function getWorkspaceSettings(): Partial<WorkspacePlatformSettings> {
  return {
    // Return empty settings for now - dock will be registered separately
  };
}