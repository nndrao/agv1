import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Play,
  Loader2,
  Database,
  Globe,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataSourceList } from './components/DataSourceList';
import { StompConfiguration } from './components/StompConfiguration';
import { RestConfiguration } from './components/RestConfiguration';
import { SchemaEditor } from './components/SchemaEditor';
import { ColumnBuilder } from './components/ColumnBuilder';
import { useDataSourceStore } from './store/dataSource.store';
import type { DataSource, DataSourceType } from './types';

interface DataSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (dataSources: DataSource[]) => void;
  isFloating?: boolean;
}

export function DataSourceDialog({
  open,
  onOpenChange,
  onApply,
  isFloating = false
}: DataSourceDialogProps) {
  console.log('[DataSourceDialog] Rendering with open:', open);
  const { toast } = useToast();
  
  // Try to use the store
  let storeData;
  try {
    storeData = useDataSourceStore();
    console.log('[DataSourceDialog] Store data:', storeData);
  } catch (error) {
    console.error('[DataSourceDialog] Error using store:', error);
    // Provide fallback values
    storeData = {
      dataSources: [],
      activeDataSourceId: null,
      addDataSource: () => {},
      updateDataSource: () => {},
      deleteDataSource: () => {},
      setActiveDataSource: () => {},
      testDataSource: async () => ({ success: false, error: 'Store not available', duration: 0, recordCount: 0 })
    };
  }
  
  const {
    dataSources,
    activeDataSourceId,
    addDataSource,
    updateDataSource,
    deleteDataSource,
    testDataSource
  } = storeData;

  const [selectedTab, setSelectedTab] = useState<'list' | 'stomp' | 'rest'>('list');
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Create new data source
  const handleCreateNew = (type: DataSourceType) => {
    const newDataSource: DataSource = {
      id: `ds-${Date.now()}`,
      name: `New ${type === 'stomp' ? 'STOMP' : 'REST'} Source`,
      type,
      active: false,
      config: type === 'stomp' ? {
        websocketUrl: '',
        topic: '',
        triggerMessage: '',
        snapshotToken: 'SNAPSHOT_END'
      } : {
        url: '',
        method: 'GET',
        headers: {},
        body: ''
      },
      schema: null,
      columnDefs: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setEditingDataSource(newDataSource);
    setSelectedTab(type);
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!editingDataSource) return;

    setTesting(true);
    try {
      const results = await testDataSource(editingDataSource);
      setTestResults(results);
      
      // If no schema provided, infer it from test results
      if (!editingDataSource.schema && 'data' in results && results.data && results.data.length > 0) {
        const inferredSchema = inferSchema(results.data);
        setEditingDataSource({
          ...editingDataSource,
          schema: inferredSchema
        });
      }

      toast({
        title: "Connection successful",
        description: `Retrieved ${'data' in results ? results.data?.length || 0 : 0} records`
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  // Save data source
  const handleSave = () => {
    if (!editingDataSource) return;

    if (editingDataSource.id.startsWith('ds-temp')) {
      // New data source
      addDataSource(editingDataSource);
    } else {
      // Update existing
      updateDataSource(editingDataSource.id, editingDataSource);
    }

    setEditingDataSource(null);
    setSelectedTab('list');
    
    toast({
      title: "Data source saved",
      description: `${editingDataSource.name} has been saved`
    });
  };

  // Apply active data sources
  const handleApply = () => {
    const activeSources = dataSources.filter(ds => ds.active);
    onApply(activeSources);
    onOpenChange(false);
  };

  const content = (
    <>
      {!isFloating && (
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Source Configuration
          </DialogTitle>
        </DialogHeader>
      )}

      <div className="flex-1 overflow-hidden">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list" className="gap-2">
                <Database className="h-4 w-4" />
                Data Sources
              </TabsTrigger>
              <TabsTrigger value="stomp" className="gap-2">
                <Zap className="h-4 w-4" />
                STOMP Server
              </TabsTrigger>
              <TabsTrigger value="rest" className="gap-2">
                <Globe className="h-4 w-4" />
                REST Endpoint
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 overflow-auto max-h-[calc(90vh-200px)]">
              <TabsContent value="list" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Manage your data sources. Active sources will load automatically.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateNew('stomp')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New STOMP
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateNew('rest')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New REST
                    </Button>
                  </div>
                </div>

                <DataSourceList
                  dataSources={dataSources}
                  activeId={activeDataSourceId}
                  onEdit={setEditingDataSource}
                  onDelete={deleteDataSource}
                  onToggleActive={(id) => {
                    const ds = dataSources.find(d => d.id === id);
                    if (ds) {
                      updateDataSource(id, { ...ds, active: !ds.active });
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="stomp" className="space-y-4">
                {editingDataSource?.type === 'stomp' ? (
                  <>
                    <StompConfiguration
                      config={editingDataSource.config as any}
                      onChange={(config) => setEditingDataSource({
                        ...editingDataSource,
                        config
                      })}
                    />

                    <SchemaEditor
                      schema={editingDataSource.schema}
                      onChange={(schema) => setEditingDataSource({
                        ...editingDataSource,
                        schema
                      })}
                      testData={testResults?.data}
                    />

                    {editingDataSource.schema && (
                      <ColumnBuilder
                        schema={editingDataSource.schema}
                        columnDefs={editingDataSource.columnDefs}
                        onChange={(columnDefs) => setEditingDataSource({
                          ...editingDataSource,
                          columnDefs
                        })}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select or create a STOMP data source to configure
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rest" className="space-y-4">
                {editingDataSource?.type === 'rest' ? (
                  <>
                    <RestConfiguration
                      config={editingDataSource.config as any}
                      onChange={(config) => setEditingDataSource({
                        ...editingDataSource,
                        config
                      })}
                    />

                    <SchemaEditor
                      schema={editingDataSource.schema}
                      onChange={(schema) => setEditingDataSource({
                        ...editingDataSource,
                        schema
                      })}
                      testData={testResults?.data}
                    />

                    {editingDataSource.schema && (
                      <ColumnBuilder
                        schema={editingDataSource.schema}
                        columnDefs={editingDataSource.columnDefs}
                        onChange={(columnDefs) => setEditingDataSource({
                          ...editingDataSource,
                          columnDefs
                        })}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select or create a REST data source to configure
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
      </div>

      <DialogFooter className="gap-2">
          <div className="flex-1 flex gap-2">
            {editingDataSource && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={!editingDataSource.name || testing}
                >
                  Save Data Source
                </Button>
              </>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Active Sources
          </Button>
      </DialogFooter>
    </>
  );

  if (isFloating) {
    return <div className="flex flex-col h-full">{content}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {content}
      </DialogContent>
    </Dialog>
  );
}

// Utility function to infer schema from data
function inferSchema(data: any[]): any {
  if (!data || data.length === 0) return null;

  // Take a larger sample for better inference
  const sampleSize = Math.min(100, data.length);
  const sample = data.slice(0, sampleSize);

  const schema: any = {
    type: 'object',
    properties: {}
  };

  // Analyze all fields across the sample
  const fieldTypes: Record<string, Set<string>> = {};

  sample.forEach(record => {
    Object.entries(record).forEach(([key, value]) => {
      if (!fieldTypes[key]) {
        fieldTypes[key] = new Set();
      }

      if (value === null || value === undefined) {
        fieldTypes[key].add('null');
      } else if (typeof value === 'boolean') {
        fieldTypes[key].add('boolean');
      } else if (typeof value === 'number') {
        fieldTypes[key].add('number');
      } else if (typeof value === 'string') {
        // Check if it's a date
        if (!isNaN(Date.parse(value))) {
          fieldTypes[key].add('date');
        } else {
          fieldTypes[key].add('string');
        }
      } else if (Array.isArray(value)) {
        fieldTypes[key].add('array');
      } else if (typeof value === 'object') {
        fieldTypes[key].add('object');
      }
    });
  });

  // Build schema from field analysis
  Object.entries(fieldTypes).forEach(([field, types]) => {
    const typeArray = Array.from(types);
    
    // Determine the primary type
    let primaryType = 'string'; // default
    
    if (typeArray.includes('number') && !typeArray.includes('string')) {
      primaryType = 'number';
    } else if (typeArray.includes('boolean') && typeArray.length === 1) {
      primaryType = 'boolean';
    } else if (typeArray.includes('date') && !typeArray.includes('string')) {
      primaryType = 'string'; // dates are strings in JSON
      schema.properties[field] = {
        type: primaryType,
        format: 'date-time'
      };
      return;
    } else if (typeArray.includes('array')) {
      primaryType = 'array';
    } else if (typeArray.includes('object')) {
      primaryType = 'object';
    }

    schema.properties[field] = {
      type: primaryType
    };

    // Mark as nullable if null values were found
    if (typeArray.includes('null')) {
      schema.properties[field].nullable = true;
    }
  });

  return schema;
}