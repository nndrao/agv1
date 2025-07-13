export type ComponentType = 'workspace' | 'page' | 'profile' | 'datasource' | 'grid' | 'theme' | 'settings';

export interface UnifiedConfig {
  // Identity
  _id?: string;
  appId: string;
  userId: string;
  
  // Component Classification
  componentType: ComponentType;
  componentSubType?: string;
  componentId: string;
  
  // Metadata
  caption: string;
  description?: string;
  tags?: string[];
  isShared?: boolean;
  isDefault?: boolean;
  
  // Configuration Data
  config: any;
  
  // Version Management
  settings: ConfigVersion[];
  activeSettings: string;
  
  // Audit Fields
  createdBy: string;
  updatedBy: string;
  createdTime: Date;
  lastUpdated: Date;
  
  // Additional
  version: string;
  metadata?: Record<string, any>;
  
  // Soft delete
  deletedAt?: Date;
  deletedBy?: string;
}

export interface ConfigVersion {
  id: string;
  name: string;
  config: any;
  createdTime: Date;
  createdBy: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface QueryOptions {
  includeDeleted?: boolean;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
}

export interface ConfigQuery {
  appId?: string;
  userId?: string;
  componentType?: ComponentType;
  componentSubType?: string;
  componentId?: string;
  tags?: string[];
  isShared?: boolean;
  isDefault?: boolean;
  search?: string;
}