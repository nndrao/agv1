import type OpenFin from '@openfin/core';
import {
  Dock,
  Home,
  Storefront,
  type StorefrontFooter,
  type StorefrontLandingPage
} from '@openfin/workspace';
import {
  init,
  type WorkspacePlatformProvider,
  type CreateSavedPageRequest,
  type CreateSavedWorkspaceRequest,
  type UpdateSavedPageRequest,
  type UpdateSavedWorkspaceRequest,
  type Page,
  type Workspace,
  type WorkspacePlatformModule,
  getCurrentSync,
  type CustomActionsMap,
  CustomActionCallerType,
} from '@openfin/workspace-platform';
import { getCustomActions } from './customActions';
import { registerDockProvider } from '../dock/dockProvider';
import { MongoDBStorageEndpoint } from './storage/mongodbEndpoint';
import { getWorkspaceSettings, dockProvider } from './workspaceConfig';
import type { CustomSettings } from './types';

// Initialize storage endpoint
let storageEndpoint: MongoDBStorageEndpoint | null = null;

async function initializeWorkspacePlatform(): Promise<void> {
  console.log('Initializing AGV1 workspace platform');

  // Get custom settings from manifest
  const customSettings = await getManifestCustomSettings();

  // Initialize storage endpoint if MongoDB URL is provided
  if (customSettings.mongoDbUrl) {
    try {
      storageEndpoint = new MongoDBStorageEndpoint(customSettings.mongoDbUrl);
      await storageEndpoint.initialize();
    } catch (error) {
      console.warn('MongoDB storage not available, using default storage:', error);
      storageEndpoint = null;
    }
  } else {
    console.log('No MongoDB URL configured, using default OpenFin storage');
  }

  // Get workspace settings including dock configuration
  const workspaceSettings = getWorkspaceSettings();
  
  // Initialize workspace platform with dock configuration
  await init({
    browser: {
      defaultWindowOptions: {
        icon: 'http://localhost:5173/vite.svg',
        workspacePlatform: {
          pages: [],
          favicon: 'http://localhost:5173/vite.svg',
        },
      },
    },
    theme: [{
      label: 'AGV1 Theme',
      default: 'dark',
      palette: {
        brandPrimary: '#0A76D3',
        brandSecondary: '#383A40',
        backgroundPrimary: '#1E1F23'
      }
    }],
    customActions: getCustomActions(),
    overrideCallback,
    ...workspaceSettings
  });

  // When platform requests to be closed, quit
  const providerWindow = fin.Window.getCurrentSync();
  await providerWindow.once('close-requested', async () => {
    await fin.Platform.getCurrentSync().quit();
  });

  // Initialize workspace components to enable dock functionality
  await initializeWorkspaceComponents();

  console.log('AGV1 workspace platform initialized successfully');
}

// Initialize workspace components for dock functionality
async function initializeWorkspaceComponents(): Promise<void> {
  const PLATFORM_ID = 'agv1-workspace-platform';
  const PLATFORM_TITLE = 'AGV1 Workspace';
  const PLATFORM_ICON = 'http://localhost:5173/vite.svg';

  // Register dummy home component (required for dock to show home button)
  await Home.register({
    title: PLATFORM_TITLE,
    id: PLATFORM_ID,
    icon: PLATFORM_ICON,
    onUserInput: async () => ({ results: [] }),
    onResultDispatch: async () => {}
  });

  // Register dummy storefront component (optional, for app store)
  await Storefront.register({
    title: PLATFORM_TITLE,
    id: PLATFORM_ID,
    icon: PLATFORM_ICON,
    getApps: async () => [],
    getLandingPage: async () => ({}) as StorefrontLandingPage,
    getNavigation: async () => [],
    getFooter: async () => ({ 
      logo: { src: PLATFORM_ICON }, 
      links: [] 
    }) as unknown as StorefrontFooter,
    launchApp: async () => {}
  });

  // Register our custom dock with buttons
  console.log('🎨 Registering custom dock with buttons...');
  try {
    await Dock.register(dockProvider);
    console.log('✅ Custom dock registered successfully');
  } catch (error) {
    console.error('❌ Failed to register custom dock:', error);
  }

  // Show the dock
  await Dock.show();
  
  console.log('Workspace components initialized successfully');
}

// Get custom settings from manifest
async function getManifestCustomSettings(): Promise<CustomSettings> {
  const app = await fin.Application.getCurrent();
  const manifest: OpenFin.Manifest & { customSettings?: CustomSettings } = await app.getManifest();
  return manifest.customSettings ?? {};
}

// Override platform provider for custom storage
function overrideCallback(
  WorkspacePlatformProvider: OpenFin.Constructor<WorkspacePlatformProvider>
): WorkspacePlatformProvider {
  class Override extends WorkspacePlatformProvider {
    // Workspace persistence overrides
    public async getSavedWorkspaces(query?: string): Promise<Workspace[]> {
      if (storageEndpoint) {
        try {
          return await storageEndpoint.getWorkspaces(query);
        } catch (error) {
          console.warn('Failed to get workspaces from MongoDB, using default storage:', error);
        }
      }
      return super.getSavedWorkspaces(query);
    }

    public async getSavedWorkspace(id: string): Promise<Workspace | undefined> {
      if (storageEndpoint) {
        try {
          return await storageEndpoint.getWorkspace(id);
        } catch (error) {
          console.error('Failed to get workspace from MongoDB:', error);
        }
      }
      return super.getSavedWorkspace(id);
    }

    public async createSavedWorkspace(req: CreateSavedWorkspaceRequest): Promise<void> {
      if (storageEndpoint) {
        try {
          await storageEndpoint.createWorkspace(req);
          return;
        } catch (error) {
          console.error('Failed to create workspace in MongoDB:', error);
        }
      }
      return super.createSavedWorkspace(req);
    }

    public async updateSavedWorkspace(req: UpdateSavedWorkspaceRequest): Promise<void> {
      if (storageEndpoint) {
        try {
          await storageEndpoint.updateWorkspace(req);
          return;
        } catch (error) {
          console.error('Failed to update workspace in MongoDB:', error);
        }
      }
      return super.updateSavedWorkspace(req);
    }

    public async deleteSavedWorkspace(id: string): Promise<void> {
      if (storageEndpoint) {
        try {
          await storageEndpoint.deleteWorkspace(id);
          return;
        } catch (error) {
          console.error('Failed to delete workspace from MongoDB:', error);
        }
      }
      return super.deleteSavedWorkspace(id);
    }

    // Page persistence overrides
    public async getSavedPages(query?: string): Promise<Page[]> {
      if (storageEndpoint) {
        try {
          return await storageEndpoint.getPages(query);
        } catch (error) {
          console.error('Failed to get pages from MongoDB:', error);
        }
      }
      return super.getSavedPages(query);
    }

    public async getSavedPage(id: string): Promise<Page | undefined> {
      if (storageEndpoint) {
        try {
          return await storageEndpoint.getPage(id);
        } catch (error) {
          console.error('Failed to get page from MongoDB:', error);
        }
      }
      return super.getSavedPage(id);
    }

    public async createSavedPage(req: CreateSavedPageRequest): Promise<void> {
      if (storageEndpoint) {
        try {
          await storageEndpoint.createPage(req);
          return;
        } catch (error) {
          console.error('Failed to create page in MongoDB:', error);
        }
      }
      return super.createSavedPage(req);
    }

    public async updateSavedPage(req: UpdateSavedPageRequest): Promise<void> {
      if (storageEndpoint) {
        try {
          await storageEndpoint.updatePage(req);
          return;
        } catch (error) {
          console.error('Failed to update page in MongoDB:', error);
        }
      }
      return super.updateSavedPage(req);
    }

    public async deleteSavedPage(id: string): Promise<void> {
      if (storageEndpoint) {
        try {
          await storageEndpoint.deletePage(id);
          return;
        } catch (error) {
          console.error('Failed to delete page from MongoDB:', error);
        }
      }
      await super.deleteSavedPage(id);
    }
  }
  return new Override();
}

// Export platform API for other modules
export { getCurrentSync as getPlatform };

// Track initialization state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Export initialization function
export async function initializePlatform(): Promise<void> {
  if (isInitialized) {
    return;
  }
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = initializeWorkspacePlatform();
  await initializationPromise;
  isInitialized = true;
}

// Auto-initialize if this is the provider window
if (typeof fin !== 'undefined' && window.location.pathname === '/provider') {
  console.log('🎯 Provider module loaded, auto-initializing platform...');
  initializePlatform().catch(console.error);
  
  // Make test functions available globally
  import('../test/testDataFlow').then(module => {
    (window as any).testDataFlow = module.testDataFlow;
    (window as any).testDockButtons = module.testDockButtons;
    console.log('🧪 Test functions available: testDataFlow(), testDockButtons()');
  });
}