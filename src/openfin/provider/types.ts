import type { CustomThemeOptions } from '@openfin/workspace-platform';

export interface CustomSettings {
  appId?: string;
  mongoDbUrl?: string;
  theme?: CustomThemeOptions;
  dockConfiguration?: DockConfiguration;
  browserConfig?: BrowserConfig;
}

export interface DockConfiguration {
  workspaceComponents?: {
    hideWorkspacesButton?: boolean;
    hideHomeButton?: boolean;
    hideNotificationsButton?: boolean;
    hideStorefrontButton?: boolean;
  };
  apps?: DockApp[];
}

export interface DockApp {
  appId: string;
  title: string;
  tooltip?: string;
  icon: string;
  action: {
    id: string;
    customData?: any;
  };
}

export interface BrowserConfig {
  toolbarOptions?: {
    buttons?: ToolbarButton[];
  };
}

export interface ToolbarButton {
  type: string;
  tooltip?: string;
  disabled?: boolean;
  iconUrl?: string;
  action?: {
    id: string;
    customData?: any;
  };
}

export interface AGV1Profile {
  id: string;
  name: string;
  description?: string;
  gridState: any;
  columnState: any;
  datasourceConfig?: any;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  isDefault?: boolean;
  isShared?: boolean;
}