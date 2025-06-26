import { StompDatasourceProvider } from '@/providers/StompDatasourceProvider';
import { DatasourceConfig, ColumnDefinition, FieldInfo } from '@/stores/datasource.store';

export interface DatasourceServiceConfig {
  maxRetries?: number;
  retryDelay?: number;
  connectionTimeout?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message?: string;
  error?: Error;
  latency?: number;
}

export interface FieldInferenceResult {
  success: boolean;
  fields?: FieldInfo[];
  sampleData?: any[];
  error?: Error;
}

/**
 * Service layer for datasource operations
 * Handles business logic and provider management
 */
export class DatasourceService {
  private providers: Map<string, StompDatasourceProvider> = new Map();
  private config: DatasourceServiceConfig;

  constructor(config: DatasourceServiceConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      connectionTimeout: 30000,
      ...config,
    };
  }

  /**
   * Test connection to a datasource
   */
  async testConnection(config: DatasourceConfig): Promise<ConnectionTestResult> {
    const startTime = performance.now();
    
    try {
      const provider = this.createProvider(config);
      const connected = await provider.checkConnection();
      const latency = performance.now() - startTime;
      
      provider.disconnect();
      
      return {
        success: connected,
        message: connected ? 'Connection successful' : 'Failed to connect',
        latency,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Infer fields from datasource data
   */
  async inferFields(config: DatasourceConfig, sampleSize = 100): Promise<FieldInferenceResult> {
    try {
      const provider = this.createProvider(config);
      const result = await provider.fetchSnapshot(sampleSize);
      
      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: false,
          error: new Error('No data received from datasource'),
        };
      }
      
      const fields = StompDatasourceProvider.inferFields(result.data);
      provider.disconnect();
      
      return {
        success: true,
        fields,
        sampleData: result.data.slice(0, 10),
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Connect to a datasource and start receiving updates
   */
  async connect(config: DatasourceConfig): Promise<StompDatasourceProvider> {
    const existingProvider = this.providers.get(config.id);
    if (existingProvider) {
      return existingProvider;
    }

    const provider = this.createProvider(config);
    await this.retryConnect(provider);
    
    this.providers.set(config.id, provider);
    return provider;
  }

  /**
   * Disconnect from a datasource
   */
  disconnect(datasourceId: string): void {
    const provider = this.providers.get(datasourceId);
    if (provider) {
      provider.disconnect();
      this.providers.delete(datasourceId);
    }
  }

  /**
   * Disconnect from all datasources
   */
  disconnectAll(): void {
    this.providers.forEach(provider => provider.disconnect());
    this.providers.clear();
  }

  /**
   * Get active provider for a datasource
   */
  getProvider(datasourceId: string): StompDatasourceProvider | undefined {
    return this.providers.get(datasourceId);
  }

  /**
   * Check if datasource is connected
   */
  isConnected(datasourceId: string): boolean {
    const provider = this.providers.get(datasourceId);
    return provider ? provider.isConnected() : false;
  }

  /**
   * Convert fields to column definitions
   */
  static fieldsToColumns(fields: FieldInfo[]): ColumnDefinition[] {
    const columns: ColumnDefinition[] = [];
    
    const processField = (field: FieldInfo, parentPath = '') => {
      const fullPath = parentPath ? `${parentPath}.${field.name}` : field.name;
      
      if (field.children && field.children.length > 0) {
        // Process nested fields
        field.children.forEach(child => processField(child, fullPath));
      } else {
        // Leaf node - create column
        columns.push({
          field: fullPath,
          headerName: field.name,
          cellDataType: this.mapFieldTypeToAgGridType(field.type),
        });
      }
    };
    
    fields.forEach(field => processField(field));
    return columns;
  }

  /**
   * Create provider instance based on config
   */
  private createProvider(config: DatasourceConfig): StompDatasourceProvider {
    if (config.type !== 'stomp') {
      throw new Error(`Unsupported datasource type: ${config.type}`);
    }

    return new StompDatasourceProvider({
      websocketUrl: config.websocketUrl,
      listenerTopic: config.listenerTopic,
      requestMessage: config.requestMessage,
      snapshotEndToken: config.snapshotEndToken,
      keyColumn: config.keyColumn,
      messageRate: config.messageRate,
    });
  }

  /**
   * Retry connection with exponential backoff
   */
  private async retryConnect(provider: StompDatasourceProvider): Promise<void> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < this.config.maxRetries!; i++) {
      try {
        await provider.connect();
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (i < this.config.maxRetries! - 1) {
          const delay = this.config.retryDelay! * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Failed to connect after retries');
  }

  /**
   * Map field types to AG-Grid cell data types
   */
  private static mapFieldTypeToAgGridType(type: string): ColumnDefinition['cellDataType'] {
    const typeMap: Record<string, ColumnDefinition['cellDataType']> = {
      'number': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'object': 'object',
      'array': 'object',
    };
    
    return typeMap[type] || 'text';
  }
}