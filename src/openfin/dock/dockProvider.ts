import {
  Dock,
  type DockButton,
  type DockProviderConfig,
  type DockProviderRegistration
} from '@openfin/workspace';
import { getCurrentSync } from '@openfin/workspace-platform';
import { getDockIcon } from '../utils/iconGenerator';

let dockRegistration: DockProviderRegistration | undefined;

export async function registerDockProvider(
  id: string,
  title: string,
  icon: string
): Promise<DockProviderRegistration | undefined> {
  console.log('🚀 Registering AGV1 dock provider with ID:', id);

  try {
    // Try to deregister any existing dock provider first
    if (dockRegistration) {
      console.log('🔄 Deregistering existing dock provider...');
      try {
        await dockRegistration.deregister();
      } catch (e) {
        console.log('Could not deregister existing dock:', e);
      }
    }
    
    const dockConfig = buildDockConfiguration();
    console.log('📋 Dock configuration:', JSON.stringify(dockConfig, null, 2));
    
    // Log each button's icon URL to verify they're valid
    dockConfig.buttons?.forEach((button, index) => {
      console.log(`🔘 Button ${index} - ${button.tooltip}:`, button.iconUrl);
    });
    
    dockRegistration = await Dock.register({
      id,
      ...dockConfig
    });
    
    console.log('✅ Dock provider registered successfully:', dockRegistration);
    
    // Force show the dock after registration
    setTimeout(async () => {
      try {
        await Dock.show();
        console.log('📌 Dock shown after registration');
      } catch (e) {
        console.error('Failed to show dock:', e);
      }
    }, 500);
    
    return dockRegistration;
  } catch (error) {
    console.error('❌ Failed to register dock provider:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    return undefined;
  }
}

function buildDockConfiguration(): Omit<DockProviderConfig, 'id'> {
  console.log('🔧 Building dock configuration with custom buttons');
  
  const buttons: DockButton[] = [
    {
      tooltip: 'New DataTable',
      iconUrl: getDockIcon('newDataTable'),
      action: {
        id: 'launch-datatable',
      },
    },
    {
      tooltip: 'Data Sources',
      iconUrl: getDockIcon('dataSources'),
      action: {
        id: 'open-datasources',
      },
    },
    {
      tooltip: 'Profiles',
      iconUrl: getDockIcon('profiles'),
      action: {
        id: 'manage-profiles',
      },
    },
    {
      tooltip: 'Settings',
      iconUrl: getDockIcon('settings'),
      action: {
        id: 'import-export-settings',
      },
    },
  ];
  
  console.log('🔘 Created dock buttons:', buttons.map(b => ({ tooltip: b.tooltip, actionId: b.action.id })));

  return {
    title: 'AGV1 Workspace',
    icon: getDockIcon('mainApp'),
    workspaceComponents: ['home', 'switchWorkspace'],
    disableUserRearrangement: false,
    buttons,
  };
}

