import type {
  Page,
  Workspace,
  CreateSavedPageRequest,
  CreateSavedWorkspaceRequest,
  UpdateSavedPageRequest,
  UpdateSavedWorkspaceRequest,
} from '@openfin/workspace-platform';
import type { UnifiedConfig, ConfigQuery, QueryOptions, ComponentType, ConfigVersion } from './types';

export class MongoDBStorageEndpoint {
  private apiUrl: string;
  private initialized = false;

  constructor(mongoDbUrl: string) {
    // In production, this would be your API server URL
    // For now, we'll use a REST API endpoint
    this.apiUrl = mongoDbUrl.replace('mongodb://', 'http://').split('/')[0] + ':3001/api';
  }

  async initialize(): Promise<void> {
    try {
      // Verify connection to API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${this.apiUrl}/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API server returned ${response.status}`);
      }
      
      this.initialized = true;
      console.log('MongoDB storage endpoint initialized');
    } catch (error) {
      console.warn('MongoDB storage not available:', error.message);
      // Don't throw - allow fallback to default storage
      this.initialized = false;
    }
  }

  // Workspace Operations
  async getWorkspaces(query?: string): Promise<Workspace[]> {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }
    
    const configs = await this.queryConfigs({
      componentType: 'workspace',
      search: query,
    });

    return configs.map(config => this.mapConfigToWorkspace(config));
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const config = await this.getConfig(id);
    return config ? this.mapConfigToWorkspace(config) : undefined;
  }

  async createWorkspace(req: CreateSavedWorkspaceRequest): Promise<void> {
    const config: Partial<UnifiedConfig> = {
      appId: 'agv1-workspace',
      userId: await this.getCurrentUserId(),
      componentType: 'workspace',
      componentSubType: 'openfin-workspace',
      componentId: req.workspace.workspaceId,
      caption: req.workspace.title,
      config: req.workspace,
      settings: [],
      activeSettings: 'current',
      createdBy: await this.getCurrentUserId(),
      updatedBy: await this.getCurrentUserId(),
      createdTime: new Date(),
      lastUpdated: new Date(),
      version: '1.0',
    };

    await this.createConfig(config);
  }

  async updateWorkspace(req: UpdateSavedWorkspaceRequest): Promise<void> {
    const existing = await this.getConfigByComponentId(req.workspaceId, 'workspace');
    if (!existing) {
      throw new Error(`Workspace ${req.workspaceId} not found`);
    }

    existing.config = req.workspace;
    existing.caption = req.workspace.title;
    existing.lastUpdated = new Date();
    existing.updatedBy = await this.getCurrentUserId();

    await this.updateConfig(existing._id!, existing);
  }

  async deleteWorkspace(id: string): Promise<void> {
    const config = await this.getConfigByComponentId(id, 'workspace');
    if (config) {
      await this.deleteConfig(config._id!);
    }
  }

  // Page Operations
  async getPages(query?: string): Promise<Page[]> {
    const configs = await this.queryConfigs({
      componentType: 'page',
      search: query,
    });

    return configs.map(config => this.mapConfigToPage(config));
  }

  async getPage(id: string): Promise<Page | undefined> {
    const config = await this.getConfigByComponentId(id, 'page');
    return config ? this.mapConfigToPage(config) : undefined;
  }

  async createPage(req: CreateSavedPageRequest): Promise<void> {
    const config: Partial<UnifiedConfig> = {
      appId: 'agv1-workspace',
      userId: await this.getCurrentUserId(),
      componentType: 'page',
      componentSubType: 'openfin-page',
      componentId: req.page.pageId,
      caption: req.page.title,
      config: req.page,
      settings: [],
      activeSettings: 'current',
      createdBy: await this.getCurrentUserId(),
      updatedBy: await this.getCurrentUserId(),
      createdTime: new Date(),
      lastUpdated: new Date(),
      version: '1.0',
    };

    await this.createConfig(config);
  }

  async updatePage(req: UpdateSavedPageRequest): Promise<void> {
    const existing = await this.getConfigByComponentId(req.pageId, 'page');
    if (!existing) {
      throw new Error(`Page ${req.pageId} not found`);
    }

    existing.config = req.page;
    existing.caption = req.page.title;
    existing.lastUpdated = new Date();
    existing.updatedBy = await this.getCurrentUserId();

    await this.updateConfig(existing._id!, existing);
  }

  async deletePage(id: string): Promise<void> {
    const config = await this.getConfigByComponentId(id, 'page');
    if (config) {
      await this.deleteConfig(config._id!);
    }
  }

  // Profile Operations (AGV1 specific)
  async getProfiles(userId?: string): Promise<UnifiedConfig[]> {
    return this.queryConfigs({
      componentType: 'profile',
      userId: userId || await this.getCurrentUserId(),
    });
  }

  async saveProfile(profileData: any, name: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    const existing = await this.getConfigByComponentId(profileData.id, 'profile');

    if (existing) {
      // Add to settings array
      const version: ConfigVersion = {
        id: `v${existing.settings.length + 1}`,
        name,
        config: profileData,
        createdTime: new Date(),
        createdBy: userId,
      };
      existing.settings.push(version);
      existing.activeSettings = version.id;
      existing.config = profileData;
      existing.lastUpdated = new Date();
      existing.updatedBy = userId;

      await this.updateConfig(existing._id!, existing);
    } else {
      // Create new profile
      const config: Partial<UnifiedConfig> = {
        appId: 'agv1-workspace',
        userId,
        componentType: 'profile',
        componentSubType: 'datatable-profile',
        componentId: profileData.id,
        caption: name,
        config: profileData,
        settings: [{
          id: 'v1',
          name,
          config: profileData,
          createdTime: new Date(),
          createdBy: userId,
        }],
        activeSettings: 'v1',
        createdBy: userId,
        updatedBy: userId,
        createdTime: new Date(),
        lastUpdated: new Date(),
        version: '1.0',
      };

      await this.createConfig(config);
    }
  }

  // Generic Config Operations
  private async queryConfigs(query: ConfigQuery, options?: QueryOptions): Promise<UnifiedConfig[]> {
    const params = new URLSearchParams();
    
    if (query.appId) params.append('appId', query.appId);
    if (query.userId) params.append('userId', query.userId);
    if (query.componentType) params.append('componentType', query.componentType);
    if (query.componentSubType) params.append('componentSubType', query.componentSubType);
    if (query.search) params.append('search', query.search);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.skip) params.append('skip', options.skip.toString());

    const response = await fetch(`${this.apiUrl}/configs?${params}`);
    if (!response.ok) {
      throw new Error('Failed to query configs');
    }

    return response.json();
  }

  private async getConfig(id: string): Promise<UnifiedConfig | undefined> {
    try {
      const response = await fetch(`${this.apiUrl}/configs/${id}`);
      if (response.status === 404) {
        return undefined;
      }
      if (!response.ok) {
        throw new Error('Failed to get config');
      }
      return response.json();
    } catch (error) {
      console.error('Failed to get config:', error);
      return undefined;
    }
  }

  private async getConfigByComponentId(componentId: string, componentType: ComponentType): Promise<UnifiedConfig | undefined> {
    const configs = await this.queryConfigs({ componentId, componentType });
    return configs[0];
  }

  private async createConfig(config: Partial<UnifiedConfig>): Promise<UnifiedConfig> {
    const response = await fetch(`${this.apiUrl}/configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to create config');
    }

    return response.json();
  }

  private async updateConfig(id: string, config: UnifiedConfig): Promise<UnifiedConfig> {
    const response = await fetch(`${this.apiUrl}/configs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to update config');
    }

    return response.json();
  }

  private async deleteConfig(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/configs/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete config');
    }
  }

  // Mapping functions
  private mapConfigToWorkspace(config: UnifiedConfig): Workspace {
    return config.config as Workspace;
  }

  private mapConfigToPage(config: UnifiedConfig): Page {
    return config.config as Page;
  }

  private async getCurrentUserId(): Promise<string> {
    // In a real implementation, this would get the current user from auth
    return 'current-user';
  }
}