import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StompDatasourceProvider } from '@/providers/StompDatasourceProvider';
import { useDatasourceStore, StompDatasourceConfig, ColumnDefinition } from '@/stores/datasource.store';
import { useToast } from '@/hooks/use-toast';
import { useDatasourceContext } from '@/contexts/DatasourceContext';

// Import new components
import { DraggableDialog } from './components/DraggableDialog';
import { ConnectionForm } from './components/ConnectionForm';
import { FieldSelector, FieldNode } from './components/FieldSelector';
import { TestingPanel } from './components/TestingPanel';
import { DataSourceStatistics } from './components/DataSourceStatistics';

interface DatasourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasourceId?: string;
}

export const DatasourceDialogRefactored: React.FC<DatasourceDialogProps> = ({ 
  open, 
  onOpenChange, 
  datasourceId 
}) => {
  const { toast } = useToast();
  const { addDatasource, updateDatasource, getDatasource } = useDatasourceStore();
  const { datasourceStatistics, componentUsage } = useDatasourceContext();
  
  // Form state
  const [name, setName] = useState('');
  const [websocketUrl, setWebsocketUrl] = useState('');
  const [listenerTopic, setListenerTopic] = useState('');
  const [requestMessage, setRequestMessage] = useState('START');
  const [snapshotEndToken, setSnapshotEndToken] = useState('Success');
  const [keyColumn, setKeyColumn] = useState('');
  const [messageRate, setMessageRate] = useState('1000');
  const [autoStart, setAutoStart] = useState(false);
  
  // Test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  // Field state
  const [inferredFields, setInferredFields] = useState<FieldNode[]>([]);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [selectAllChecked] = useState(false);
  const [selectAllIndeterminate] = useState(false);

  // Load existing datasource
  useEffect(() => {
    if (datasourceId && open) {
      const datasource = getDatasource(datasourceId) as StompDatasourceConfig;
      if (datasource && datasource.type === 'stomp') {
        setName(datasource.name);
        setWebsocketUrl(datasource.websocketUrl);
        setListenerTopic(datasource.listenerTopic);
        setRequestMessage(datasource.requestMessage || 'START');
        setSnapshotEndToken(datasource.snapshotEndToken || 'Success');
        setKeyColumn(datasource.keyColumn);
        setAutoStart(datasource.autoStart || false);
        
        // Load saved inferred fields
        if (datasource.inferredFields) {
          const fieldNodes = datasource.inferredFields.map(field => convertFieldInfoToNode(field));
          setInferredFields(fieldNodes);
        }
      }
    }
  }, [datasourceId, getDatasource, open]);

  // Clear state when closing for new datasource
  useEffect(() => {
    if (!open && !datasourceId) {
      setInferredFields([]);
      setSelectedFields(new Set());
      setExpandedFields(new Set());
      setFieldSearchQuery('');
    }
  }, [open, datasourceId]);

  // Auto-expand all object fields
  useEffect(() => {
    const objectPaths = new Set<string>();
    
    const findObjectFields = (fields: FieldNode[]) => {
      fields.forEach(field => {
        if (field.children) {
          objectPaths.add(field.path);
          findObjectFields(field.children);
        }
      });
    };
    
    findObjectFields(inferredFields);
    setExpandedFields(objectPaths);
  }, [inferredFields]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestError('');
    setTestResult(null);
    
    if (!websocketUrl) {
      setTestError('WebSocket URL is required');
      setTesting(false);
      return;
    }
    
    const provider = new StompDatasourceProvider({
      websocketUrl,
      listenerTopic,
      requestMessage,
      snapshotEndToken,
      keyColumn,
      messageRate,
    });

    try {
      const connected = await provider.checkConnection();
      
      if (connected) {
        setTestResult({ success: true });
        toast({
          title: 'Connection successful',
          description: 'Successfully connected to STOMP server',
        });
      } else {
        setTestError('Failed to connect to server');
      }
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      provider.disconnect();
      setTesting(false);
    }
  };

  const handleInferFields = async () => {
    setTesting(true);
    setTestError('');
    setPreviewData([]);
    
    if (!websocketUrl || !listenerTopic) {
      setTestError('WebSocket URL and Listener Topic are required');
      setTesting(false);
      return;
    }
    
    const provider = new StompDatasourceProvider({
      websocketUrl,
      listenerTopic,
      requestMessage,
      snapshotEndToken,
      keyColumn,
      messageRate,
    });

    try {
      const result = await provider.fetchSnapshot(100);
      
      if (result.success && result.data && result.data.length > 0) {
        setPreviewData(result.data.slice(0, 10));
        
        // Infer fields
        const fields = StompDatasourceProvider.inferFields(result.data);
        const fieldNodes = convertToFieldNodes(Object.values(fields));
        setInferredFields(fieldNodes);
        
        // Auto-select all fields
        const allPaths = new Set<string>();
        const collectPaths = (nodes: FieldNode[]) => {
          nodes.forEach(node => {
            allPaths.add(node.path);
            if (node.children) collectPaths(node.children);
          });
        };
        collectPaths(fieldNodes);
        setSelectedFields(allPaths);
        
        toast({
          title: 'Fields inferred successfully',
          description: `Found ${allPaths.size} fields from ${result.data.length} messages`,
        });
      } else {
        setTestError('No data received from server');
      }
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Failed to infer fields');
    } finally {
      provider.disconnect();
      setTesting(false);
    }
  };

  const handleFieldToggle = (path: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFields(newSelected);
  };

  const handleExpandToggle = (path: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFields(newExpanded);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPaths = new Set<string>();
      const collectPaths = (nodes: FieldNode[]) => {
        nodes.forEach(node => {
          allPaths.add(node.path);
          if (node.children) collectPaths(node.children);
        });
      };
      collectPaths(inferredFields);
      setSelectedFields(allPaths);
    } else {
      setSelectedFields(new Set());
    }
  };

  const handleSave = () => {
    if (!name || !websocketUrl || !listenerTopic) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    // Convert selected fields to column definitions
    const columnDefinitions: ColumnDefinition[] = Array.from(selectedFields)
      .filter(path => {
        // Only include leaf nodes
        const field = findFieldByPath(inferredFields, path);
        return field && (!field.children || field.children.length === 0);
      })
      .map(path => {
        const field = findFieldByPath(inferredFields, path)!;
        return {
          field: path,
          headerName: field.name,
          cellDataType: mapFieldTypeToAgGridType(field.type),
        };
      });

    const config: StompDatasourceConfig = {
      id: datasourceId || `datasource-${Date.now()}`,
      name,
      type: 'stomp',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      websocketUrl,
      listenerTopic,
      requestMessage,
      snapshotEndToken,
      keyColumn,
      // messageRate,
      autoStart,
      columnDefinitions,
      inferredFields: inferredFields.length > 0 ? convertFieldNodesToFieldInfo(inferredFields) : undefined,
    };

    if (datasourceId) {
      updateDatasource(datasourceId, config);
      toast({
        title: 'Datasource updated',
        description: 'Your changes have been saved',
      });
    } else {
      addDatasource(config);
      toast({
        title: 'Datasource created',
        description: 'New datasource has been added',
      });
    }

    onOpenChange(false);
  };

  return (
    <DraggableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={datasourceId ? 'Edit Datasource' : 'Create Datasource'}
      initialWidth={900}
      initialHeight={700}
    >
      <div className="flex flex-col h-full">
        <Tabs defaultValue="connection" className="flex-1">
          <TabsList className="w-full justify-start px-6">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
            {datasourceId && <TabsTrigger value="statistics">Statistics</TabsTrigger>}
          </TabsList>
          
          <div className="px-6 py-4 flex-1">
            <TabsContent value="connection" className="mt-0">
              <ConnectionForm
                name={name}
                websocketUrl={websocketUrl}
                listenerTopic={listenerTopic}
                requestMessage={requestMessage}
                snapshotEndToken={snapshotEndToken}
                keyColumn={keyColumn}
                messageRate={messageRate}
                autoStart={autoStart}
                testing={testing}
                testResult={testResult}
                testError={testError}
                onNameChange={setName}
                onWebsocketUrlChange={setWebsocketUrl}
                onListenerTopicChange={setListenerTopic}
                onRequestMessageChange={setRequestMessage}
                onSnapshotEndTokenChange={setSnapshotEndToken}
                onKeyColumnChange={setKeyColumn}
                onMessageRateChange={setMessageRate}
                onAutoStartChange={setAutoStart}
                onTestConnection={handleTestConnection}
              />
            </TabsContent>
            
            <TabsContent value="fields" className="mt-0">
              <FieldSelector
                fields={inferredFields}
                selectedFields={selectedFields}
                expandedFields={expandedFields}
                searchQuery={fieldSearchQuery}
                selectAllChecked={selectAllChecked}
                selectAllIndeterminate={selectAllIndeterminate}
                onFieldToggle={handleFieldToggle}
                onExpandToggle={handleExpandToggle}
                onSearchChange={setFieldSearchQuery}
                onSelectAllChange={handleSelectAll}
              />
            </TabsContent>
            
            <TabsContent value="test" className="mt-0">
              <TestingPanel
                testing={testing}
                testError={testError}
                previewData={previewData}
                websocketUrl={websocketUrl}
                listenerTopic={listenerTopic}
                onInferFields={handleInferFields}
              />
            </TabsContent>
            
            {datasourceId && (
              <TabsContent value="statistics" className="mt-0">
                <DataSourceStatistics
                  datasourceId={datasourceId}
                  statistics={datasourceStatistics?.get(datasourceId) as any}
                  componentUsage={componentUsage?.get(datasourceId) ? Array.from(componentUsage.get(datasourceId)!).map(id => ({ componentId: id, componentType: 'datatable', lastAccessed: Date.now() })) : []}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>
        
        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {datasourceId ? 'Update' : 'Create'} Datasource
          </Button>
        </div>
      </div>
    </DraggableDialog>
  );
};

// Helper functions
function convertFieldInfoToNode(field: any): FieldNode {
  return {
    path: field.path,
    name: field.name,
    type: field.type,
    nullable: field.nullable || false,
    children: field.children?.map(convertFieldInfoToNode),
    sample: field.sample,
  };
}

function convertToFieldNodes(fields: any[]): FieldNode[] {
  return fields.map(field => ({
    path: field.path,
    name: field.name,
    type: field.type,
    nullable: field.nullable || false,
    children: field.children ? convertToFieldNodes(field.children) : undefined,
    sample: field.sample,
  }));
}

function convertFieldNodesToFieldInfo(nodes: FieldNode[]): any[] {
  return nodes.map(node => ({
    path: node.path,
    name: node.name,
    type: node.type,
    nullable: node.nullable,
    children: node.children ? convertFieldNodesToFieldInfo(node.children) : undefined,
    sample: node.sample,
  }));
}

function findFieldByPath(fields: FieldNode[], path: string): FieldNode | null {
  for (const field of fields) {
    if (field.path === path) return field;
    if (field.children) {
      const found = findFieldByPath(field.children, path);
      if (found) return found;
    }
  }
  return null;
}

function mapFieldTypeToAgGridType(type: string): ColumnDefinition['cellDataType'] {
  switch (type) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'date';
    case 'object':
      return 'object';
    default:
      return 'text';
  }
}