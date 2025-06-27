import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
import { StompDatasourceProvider } from '@/providers/StompDatasourceProvider';
import { useDatasourceStore, StompDatasourceConfig, ColumnDefinition, ConflationSettings } from '@/stores/datasource.store';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { DatasourceStatistics } from './DatasourceStatistics';
import { useDatasourceContext } from '@/contexts/DatasourceContext';

interface DatasourceEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasourceId?: string;
}

interface FieldNode {
  path: string;
  name: string;
  type: string;
  nullable: boolean;
  children?: FieldNode[];
  selected: boolean;
  expanded: boolean;
  sample?: any;
}

export const DatasourceEditor: React.FC<DatasourceEditorProps> = ({
  open,
  onOpenChange,
  datasourceId,
}) => {
  const { toast } = useToast();
  const { addDatasource, updateDatasource, getDatasource } = useDatasourceStore();
  
  // Form state
  const [name, setName] = useState('');
  const [websocketUrl, setWebsocketUrl] = useState('');
  const [listenerTopic, setListenerTopic] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [snapshotEndToken, setSnapshotEndToken] = useState('');
  const [keyColumn, setKeyColumn] = useState('');
  const [messageRate, setMessageRate] = useState('1000');
  const [snapshotTimeoutMs, setSnapshotTimeoutMs] = useState(60000);
  
  // Conflation settings state
  const [conflationEnabled, setConflationEnabled] = useState(true);
  const [conflationWindowMs, setConflationWindowMs] = useState(100);
  const [conflationMaxBatchSize, setConflationMaxBatchSize] = useState(1000);
  const [conflationEnableMetrics, setConflationEnableMetrics] = useState(true);
  
  // Test connection state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  // Field inference state
  const [inferredFields, setInferredFields] = useState<FieldNode[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  
  // Manual column state
  const [manualColumns, setManualColumns] = useState<ColumnDefinition[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newHeaderName, setNewHeaderName] = useState('');
  const [newCellDataType, setNewCellDataType] = useState<ColumnDefinition['cellDataType']>('text');

  // Load existing datasource if editing
  React.useEffect(() => {
    if (datasourceId) {
      const datasource = getDatasource(datasourceId) as StompDatasourceConfig;
      if (datasource && datasource.type === 'stomp') {
        setName(datasource.name);
        setWebsocketUrl(datasource.websocketUrl);
        setListenerTopic(datasource.listenerTopic);
        setRequestMessage(datasource.requestMessage);
        setSnapshotEndToken(datasource.snapshotEndToken);
        setKeyColumn(datasource.keyColumn);
        setManualColumns(datasource.columnDefinitions || []);
        setSnapshotTimeoutMs(datasource.snapshotTimeoutMs || 60000);
        
        // Load conflation settings
        if (datasource.conflationSettings) {
          setConflationEnabled(datasource.conflationSettings.enabled);
          setConflationWindowMs(datasource.conflationSettings.windowMs);
          setConflationMaxBatchSize(datasource.conflationSettings.maxBatchSize);
          setConflationEnableMetrics(datasource.conflationSettings.enableMetrics);
        }
      }
    }
  }, [datasourceId, getDatasource]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestError('');
    setTestResult(null);
    setPreviewData([]);
    
    // Validate required fields
    if (!websocketUrl || !listenerTopic) {
      setTestError('WebSocket URL and Listener Topic are required');
      setTesting(false);
      return;
    }
    
    const provider = new StompDatasourceProvider({
      websocketUrl,
      listenerTopic,
      requestMessage,
      snapshotEndToken: snapshotEndToken || 'Success', // Default to 'Success' if not provided
      keyColumn,
      messageRate,
      snapshotTimeoutMs,
    });

    try {
      console.log('[DatasourceEditor] Testing connection with:', {
        websocketUrl,
        listenerTopic,
        hasRequestMessage: !!requestMessage,
        snapshotEndToken: snapshotEndToken || 'Success'
      });
      
      const result = await provider.testConnection(100);
      
      if (result.success && result.data && result.data.length > 0) {
        setTestResult(result);
        setPreviewData(result.data);
        toast({
          title: 'Connection successful',
          description: `Received ${result.data.length} rows`,
        });
        
        // Auto-infer fields after successful connection
        const fields = StompDatasourceProvider.inferFields(result.data);
        const fieldNodes = convertToFieldNodes(fields);
        setInferredFields(fieldNodes);
      } else if (result.success && (!result.data || result.data.length === 0)) {
        setTestError('Connection successful but no data received. Check your topic and request message.');
      } else {
        setTestError(result.error || 'Failed to connect');
      }
    } catch (error) {
      console.error('[DatasourceEditor] Test connection error:', error);
      setTestError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      provider.disconnect();
      setTesting(false);
    }
  };

  const handleInferFields = () => {
    if (!testResult?.data || testResult.data.length === 0) {
      toast({
        title: 'No data available',
        description: 'Please test the connection first to fetch data',
        variant: 'destructive',
      });
      return;
    }

    const fields = StompDatasourceProvider.inferFields(testResult.data);
    const fieldNodes = convertToFieldNodes(fields);
    setInferredFields(fieldNodes);
    
    toast({
      title: 'Fields inferred',
      description: `Found ${Object.keys(fields).length} fields`,
    });
  };

  const convertToFieldNodes = (fields: Record<string, any>, parentPath = ''): FieldNode[] => {
    return Object.entries(fields).map(([key, field]) => {
      const node: FieldNode = {
        path: field.path,
        name: key.split('.').pop() || key,
        type: field.type,
        nullable: field.nullable,
        selected: false,
        expanded: false,
        sample: field.sample,
      };

      if (field.children) {
        node.children = convertToFieldNodes(field.children, field.path);
      }

      return node;
    });
  };

  const toggleFieldSelection = (path: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFields(newSelected);
  };

  const toggleFieldExpansion = (path: string) => {
    setInferredFields(updateFieldExpansion(inferredFields, path));
  };

  const updateFieldExpansion = (fields: FieldNode[], targetPath: string): FieldNode[] => {
    return fields.map(field => {
      if (field.path === targetPath) {
        return { ...field, expanded: !field.expanded };
      }
      if (field.children) {
        return { ...field, children: updateFieldExpansion(field.children, targetPath) };
      }
      return field;
    });
  };

  const renderFieldTree = (fields: FieldNode[], level = 0) => {
    return fields.map((field) => (
      <div key={field.path}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md transition-colors",
            selectedFields.has(field.path) && "bg-muted/30"
          )}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {field.children && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 flex-shrink-0"
              onClick={() => toggleFieldExpansion(field.path)}
            >
              {field.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          {!field.children && <div className="w-5 flex-shrink-0" />}
          
          <Checkbox
            checked={selectedFields.has(field.path)}
            onCheckedChange={() => toggleFieldSelection(field.path)}
            className="flex-shrink-0"
          />
          
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0 bg-muted/30 px-1.5 py-0.5 rounded">
            {field.type}
          </span>
          
          <span className="text-sm font-medium truncate flex-1">{field.name}</span>
          
          {field.nullable && (
            <span className="text-xs text-muted-foreground flex-shrink-0 italic">nullable</span>
          )}
        </div>
        
        {field.expanded && field.children && (
          <div className="mt-0.5">{renderFieldTree(field.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  const handleAddManualColumn = () => {
    if (!newFieldName || !newHeaderName) return;

    const newColumn: ColumnDefinition = {
      field: newFieldName,
      headerName: newHeaderName,
      cellDataType: newCellDataType,
    };

    setManualColumns([...manualColumns, newColumn]);
    setNewFieldName('');
    setNewHeaderName('');
    setNewCellDataType('text');
  };

  const handleSave = () => {
    if (!name || !websocketUrl || !listenerTopic) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Create column definitions from selected fields
    const columnsFromFields: ColumnDefinition[] = Array.from(selectedFields).map(path => {
      const field = findFieldByPath(inferredFields, path);
      return {
        field: path,
        headerName: path.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
        cellDataType: mapFieldTypeToColumnType(field?.type || 'string'),
      };
    });

    const allColumns = [...columnsFromFields, ...manualColumns];

    const conflationSettings: ConflationSettings = {
      enabled: conflationEnabled,
      windowMs: conflationWindowMs,
      maxBatchSize: conflationMaxBatchSize,
      enableMetrics: conflationEnableMetrics,
    };

    const datasource: StompDatasourceConfig = {
      id: datasourceId || `stomp-${Date.now()}`,
      name,
      type: 'stomp',
      websocketUrl,
      listenerTopic,
      requestMessage,
      snapshotEndToken,
      keyColumn,
      columnDefinitions: allColumns,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      snapshotTimeoutMs,
      conflationSettings,
    };

    if (datasourceId) {
      updateDatasource(datasourceId, datasource);
      toast({
        title: 'Datasource updated',
        description: `Updated datasource "${name}"`,
      });
    } else {
      addDatasource(datasource);
      toast({
        title: 'Datasource created',
        description: `Created new datasource "${name}"`,
      });
    }

    onOpenChange(false);
  };

  const findFieldByPath = (fields: FieldNode[], path: string): FieldNode | undefined => {
    for (const field of fields) {
      if (field.path === path) return field;
      if (field.children) {
        const found = findFieldByPath(field.children, path);
        if (found) return found;
      }
    }
    return undefined;
  };

  const mapFieldTypeToColumnType = (fieldType: string): ColumnDefinition['cellDataType'] => {
    switch (fieldType) {
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'date': return 'date';
      default: return 'text';
    }
  };

  // Preview grid columns
  const previewColumns: ColDef[] = previewData.length > 0
    ? Object.keys(previewData[0]).map(key => ({
        field: key,
        headerName: key,
        width: 150,
      }))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl" style={{ height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <DialogHeader>
          <DialogTitle>{datasourceId ? 'Edit' : 'Create'} STOMP Datasource</DialogTitle>
          <DialogDescription>
            Configure a WebSocket STOMP connection to fetch real-time data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="connection" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="fields" disabled={!testResult}>Fields</TabsTrigger>
            <TabsTrigger value="columns">Column Definitions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="flex-1 mt-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  placeholder="My STOMP Datasource"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="websocket-url" className="text-right">
                  WebSocket URL *
                </Label>
                <Input
                  id="websocket-url"
                  value={websocketUrl}
                  onChange={(e) => setWebsocketUrl(e.target.value)}
                  className="col-span-3"
                  placeholder="ws://localhost:8080/stomp"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="listener-topic" className="text-right">
                  Listener Topic *
                </Label>
                <Input
                  id="listener-topic"
                  value={listenerTopic}
                  onChange={(e) => setListenerTopic(e.target.value)}
                  className="col-span-3"
                  placeholder="/snapshot/positions or /topic/data"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="request-message" className="text-right">
                  Request Message
                </Label>
                <Textarea
                  id="request-message"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="col-span-3"
                  placeholder='START (or custom trigger message)'
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="snapshot-token" className="text-right">
                  Snapshot End Token
                </Label>
                <Input
                  id="snapshot-token"
                  value={snapshotEndToken}
                  onChange={(e) => setSnapshotEndToken(e.target.value)}
                  className="col-span-3"
                  placeholder="Success (or any string that marks end of data)"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="key-column" className="text-right">
                  Key Column
                </Label>
                <Input
                  id="key-column"
                  value={keyColumn}
                  onChange={(e) => setKeyColumn(e.target.value)}
                  className="col-span-3"
                  placeholder="id"
                />
              </div>

              {listenerTopic.includes('/snapshot/') && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="message-rate" className="text-right">
                    Message Rate (msg/s)
                  </Label>
                  <Input
                    id="message-rate"
                    type="number"
                    value={messageRate}
                    onChange={(e) => setMessageRate(e.target.value)}
                    className="col-span-3"
                    placeholder="1000"
                  />
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="snapshot-timeout" className="text-right">
                  Snapshot Timeout (ms)
                </Label>
                <Input
                  id="snapshot-timeout"
                  type="number"
                  value={snapshotTimeoutMs || 60000}
                  onChange={(e) => setSnapshotTimeoutMs(parseInt(e.target.value) || 60000)}
                  className="col-span-3"
                  placeholder="60000"
                  min="10000"
                  max="300000"
                />
                <div className="col-span-3 col-start-2 text-xs text-muted-foreground">
                  Time to wait for snapshot completion (default: 60 seconds)
                </div>
              </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleTestConnection}
                  disabled={testing || !websocketUrl || !listenerTopic}
                >
                  {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
              </div>

              <div className="space-y-3">
                {testing && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Connecting to WebSocket server and waiting for data...
                    </AlertDescription>
                  </Alert>
                )}

                {testError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{testError}</AlertDescription>
                  </Alert>
                )}

                {testResult && testResult.success && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Successfully received {testResult.data.length} rows
                      {inferredFields.length > 0 && ` • ${inferredFields.length} fields inferred`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {previewData.length > 0 && (
                <div className="flex-1 min-h-0">
                  <h4 className="text-sm font-medium mb-2">Data Preview</h4>
                  <div className="border rounded-lg overflow-hidden h-[300px]">
                    <div className="ag-theme-alpine h-full">
                      <AgGridReact
                        rowData={previewData}
                        columnDefs={previewColumns}
                        defaultColDef={{
                          sortable: true,
                          filter: true,
                          resizable: true,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fields" className="flex-1 overflow-hidden mt-6" style={{ height: 'calc(100% - 24px)' }}>
            <div className="h-full flex gap-4">
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Inferred Fields</h3>
                  <Button onClick={handleInferFields} size="sm">
                    Infer Fields
                  </Button>
                </div>
                
                <div className="flex-1 border rounded-lg overflow-hidden relative" style={{ height: 'calc(100% - 60px)' }}>
                  <ScrollArea className="absolute inset-0">
                    <div className="p-3">
                      {inferredFields.length > 0 ? (
                        renderFieldTree(inferredFields)
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          Click "Infer Fields" to analyze the data structure
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="w-1/3 flex flex-col">
                <h3 className="text-lg font-semibold mb-4">Selected Fields</h3>
                <div className="flex-1 border rounded-lg overflow-hidden relative" style={{ height: 'calc(100% - 60px)' }}>
                  <ScrollArea className="absolute inset-0">
                    <div className="p-3">
                      {Array.from(selectedFields).map(path => (
                        <div key={path} className="py-2 px-3 text-sm bg-muted/50 rounded mb-1">
                          {path}
                        </div>
                      ))}
                      {selectedFields.size === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          No fields selected
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="columns" className="flex-1 overflow-hidden mt-6" style={{ height: 'calc(100% - 24px)' }}>
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Column Definitions</h3>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Add Column Manually</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Field name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Header name"
                    value={newHeaderName}
                    onChange={(e) => setNewHeaderName(e.target.value)}
                    className="flex-1"
                  />
                  <Select 
                    value={newCellDataType} 
                    onValueChange={(value) => setNewCellDataType(value as ColumnDefinition['cellDataType'])}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddManualColumn}>Add</Button>
                </div>
              </div>

              <Separator className="mb-4" />

              <div className="flex-1 flex flex-col" style={{ height: 'calc(100% - 140px)' }}>
                <h4 className="text-sm font-medium mb-2">Current Columns</h4>
                <div className="flex-1 border rounded-lg overflow-hidden relative">
                  <ScrollArea className="absolute inset-0">
                    <div className="p-3">
                      {[...Array.from(selectedFields).map(path => ({
                        field: path,
                        headerName: path.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
                        cellDataType: 'text' as const,
                      })), ...manualColumns].length > 0 ? (
                        [...Array.from(selectedFields).map(path => ({
                          field: path,
                          headerName: path.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
                          cellDataType: 'text' as const,
                        })), ...manualColumns].map((col, index) => (
                          <div key={index} className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg mb-2">
                            <div className="flex-1">
                              <div className="font-medium">{col.headerName}</div>
                              <div className="text-sm text-muted-foreground">
                                {col.field} • {col.cellDataType}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (manualColumns.includes(col)) {
                                  setManualColumns(manualColumns.filter(c => c !== col));
                                } else {
                                  toggleFieldSelection(col.field);
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          No columns defined. Select fields or add columns manually.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="flex-1 overflow-hidden mt-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Conflation Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure update conflation to optimize performance for high-frequency data streams.
                </p>
                
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="conflation-enabled">Enable Conflation</Label>
                      <p className="text-sm text-muted-foreground">
                        Merge multiple updates for the same row within the batch window
                      </p>
                    </div>
                    <Switch
                      id="conflation-enabled"
                      checked={conflationEnabled}
                      onCheckedChange={setConflationEnabled}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="conflation-window">Conflation Window</Label>
                        <span className="text-sm text-muted-foreground">{conflationWindowMs}ms</span>
                      </div>
                      <Slider
                        id="conflation-window"
                        min={10}
                        max={1000}
                        step={10}
                        value={[conflationWindowMs]}
                        onValueChange={([value]) => setConflationWindowMs(value)}
                        disabled={!conflationEnabled}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Time window for batching updates (10-1000ms)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="max-batch-size">Max Batch Size</Label>
                        <span className="text-sm text-muted-foreground">{conflationMaxBatchSize}</span>
                      </div>
                      <Slider
                        id="max-batch-size"
                        min={100}
                        max={10000}
                        step={100}
                        value={[conflationMaxBatchSize]}
                        onValueChange={([value]) => setConflationMaxBatchSize(value)}
                        disabled={!conflationEnabled}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of updates in a single batch
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-metrics">Enable Metrics</Label>
                      <p className="text-sm text-muted-foreground">
                        Track performance metrics for monitoring
                      </p>
                    </div>
                    <Switch
                      id="enable-metrics"
                      checked={conflationEnableMetrics}
                      onCheckedChange={setConflationEnableMetrics}
                    />
                  </div>
                </div>
              </div>
              
              {datasourceId && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="text-lg font-semibold">Live Statistics</h3>
                  <DatasourceStatistics datasourceId={datasourceId} />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {datasourceId ? 'Update' : 'Create'} Datasource
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};