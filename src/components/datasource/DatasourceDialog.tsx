import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { StompDatasourceProvider } from '@/providers/StompDatasourceProvider';
import { useDatasourceStore, StompDatasourceConfig, ColumnDefinition, FieldInfo } from '@/stores/datasource.store';
import { useToast } from '@/hooks/use-toast';
import { useDatasourceContext } from '@/contexts/DatasourceContext';
import { 
  GripVertical, 
  Maximize2, 
  Minimize2, 
  X, 
  ChevronRight, 
  ChevronDown, 
  PlayCircle, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2,
  Loader2,
  Database,
  Search,
  BarChart3,
  Activity,
  Clock
} from 'lucide-react';

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

export const DatasourceDialog: React.FC<DatasourceDialogProps> = ({ 
  open, 
  onOpenChange, 
  datasourceId 
}) => {
  const { toast } = useToast();
  const { addDatasource, updateDatasource, getDatasource } = useDatasourceStore();
  const { datasourceStatistics, componentUsage } = useDatasourceContext();
  const dialogRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Dialog state
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'connection' | 'fields' | 'columns' | 'statistics'>('connection');
  
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
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectAllIndeterminate, setSelectAllIndeterminate] = useState(false);
  
  // Column state
  const [manualColumns, setManualColumns] = useState<ColumnDefinition[]>([]);
  const [newColumn, setNewColumn] = useState({ field: '', header: '', type: 'text' as ColumnDefinition['cellDataType'] });

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
        setManualColumns(datasource.columnDefinitions || []);
        
        // Load saved inferred fields
        if (datasource.inferredFields) {
          const fieldNodes = datasource.inferredFields.map(field => convertFieldInfoToNode(field));
          setInferredFields(fieldNodes);
        }
      }
    }
  }, [datasourceId, getDatasource, open]);
  
  // Auto-expand all object fields when fields are inferred
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
  
  // Update select all checkbox state
  useEffect(() => {
    const filteredFields = filterFields(inferredFields, fieldSearchQuery);
    const allPaths = new Set<string>();
    
    const collectAllPaths = (fields: FieldNode[]) => {
      fields.forEach(field => {
        allPaths.add(field.path);
        if (field.children) {
          collectAllPaths(field.children);
        }
      });
    };
    
    collectAllPaths(filteredFields);
    
    const selectedCount = Array.from(allPaths).filter(path => selectedFields.has(path)).length;
    const totalCount = allPaths.size;
    
    if (selectedCount === 0) {
      setSelectAllChecked(false);
      setSelectAllIndeterminate(false);
    } else if (selectedCount === totalCount) {
      setSelectAllChecked(true);
      setSelectAllIndeterminate(false);
    } else {
      setSelectAllChecked(false);
      setSelectAllIndeterminate(true);
    }
  }, [selectedFields, inferredFields, fieldSearchQuery]);

  // Center dialog on open
  useEffect(() => {
    if (open && !isDragging) {
      const centerX = (window.innerWidth - 800) / 2;
      const centerY = (window.innerHeight - 600) / 2;
      setPosition({ x: centerX, y: centerY });
    }
    
    // Clear fields when dialog is closed and creating a new datasource
    if (!open && !datasourceId) {
      setInferredFields([]);
      setSelectedFields(new Set());
      setExpandedFields(new Set());
      setFieldSearchQuery('');
    }
  }, [open, datasourceId]);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

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
        setPreviewData(result.data.slice(0, 10)); // Show first 10 rows
        
        // Infer fields
        const fields = StompDatasourceProvider.inferFields(result.data);
        const fieldNodes = convertToFieldNodes(fields);
        setInferredFields(fieldNodes);
        
        toast({
          title: 'Fields inferred successfully',
          description: `Analyzed ${result.data.length} rows and found ${fieldNodes.length} fields`,
        });
      } else {
        setTestError('No data received. Check your configuration.');
      }
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      provider.disconnect();
      setTesting(false);
    }
  };

  const convertToFieldNodes = (fields: Record<string, any>, parentPath = ''): FieldNode[] => {
    return Object.entries(fields).map(([key, field]) => ({
      path: field.path,
      name: key.split('.').pop() || key,
      type: field.type,
      nullable: field.nullable,
      sample: field.sample,
      children: field.children ? convertToFieldNodes(field.children, field.path) : undefined,
    }));
  };
  
  const convertFieldInfoToNode = (fieldInfo: FieldInfo): FieldNode => {
    return {
      path: fieldInfo.path,
      name: fieldInfo.path.split('.').pop() || fieldInfo.path,
      type: fieldInfo.type,
      nullable: fieldInfo.nullable,
      sample: fieldInfo.sample,
      children: fieldInfo.children ? Object.entries(fieldInfo.children).map(([key, child]) => convertFieldInfoToNode(child)) : undefined,
    };
  };
  
  const convertFieldNodeToInfo = (fieldNode: FieldNode): FieldInfo => {
    const info: FieldInfo = {
      path: fieldNode.path,
      type: fieldNode.type as FieldInfo['type'],
      nullable: fieldNode.nullable,
      sample: fieldNode.sample,
    };
    
    if (fieldNode.children) {
      info.children = {};
      fieldNode.children.forEach(child => {
        const childName = child.path.split('.').pop() || child.path;
        info.children![childName] = convertFieldNodeToInfo(child);
      });
    }
    
    return info;
  };

  const toggleFieldExpansion = (path: string) => {
    setExpandedFields(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const toggleFieldSelection = (path: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  // Filter fields based on search query
  const filterFields = (fields: FieldNode[], query: string): FieldNode[] => {
    if (!query) return fields;
    
    const lowerQuery = query.toLowerCase();
    
    return fields.reduce((acc: FieldNode[], field) => {
      const matchesQuery = 
        field.path.toLowerCase().includes(lowerQuery) ||
        field.name.toLowerCase().includes(lowerQuery);
      
      if (field.children) {
        const filteredChildren = filterFields(field.children, query);
        if (matchesQuery || filteredChildren.length > 0) {
          acc.push({
            ...field,
            children: filteredChildren.length > 0 ? filteredChildren : field.children
          });
        }
      } else if (matchesQuery) {
        acc.push(field);
      }
      
      return acc;
    }, []);
  };
  
  // Select field with all its children
  const selectFieldWithChildren = (field: FieldNode, select: boolean) => {
    const fieldsToUpdate = new Set<string>();
    
    const collectFields = (f: FieldNode) => {
      fieldsToUpdate.add(f.path);
      if (f.children) {
        f.children.forEach(collectFields);
      }
    };
    
    collectFields(field);
    
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      fieldsToUpdate.forEach(path => {
        if (select) {
          newSet.add(path);
        } else {
          newSet.delete(path);
        }
      });
      return newSet;
    });
  };
  
  // Handle select all functionality
  const handleSelectAll = (checked: boolean) => {
    const filteredFields = filterFields(inferredFields, fieldSearchQuery);
    const allPaths = new Set<string>();
    
    const collectAllPaths = (fields: FieldNode[]) => {
      fields.forEach(field => {
        allPaths.add(field.path);
        if (field.children) {
          collectAllPaths(field.children);
        }
      });
    };
    
    collectAllPaths(filteredFields);
    
    if (checked) {
      setSelectedFields(prev => new Set([...prev, ...allPaths]));
    } else {
      setSelectedFields(prev => {
        const newSet = new Set(prev);
        allPaths.forEach(path => newSet.delete(path));
        return newSet;
      });
    }
    
    setSelectAllChecked(checked);
    setSelectAllIndeterminate(false);
  };

  const renderFieldItem = (field: FieldNode, level = 0) => {
    const isExpanded = expandedFields.has(field.path);
    const isSelected = selectedFields.has(field.path);
    
    return (
      <div key={field.path}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer",
            isSelected && "bg-muted/30"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {field.children && (
            <button
              onClick={() => toggleFieldExpansion(field.path)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          )}
          {!field.children && <div className="w-4" />}
          
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (field.children) {
                // If it's an object field, select/deselect all children
                selectFieldWithChildren(field, checked as boolean);
              } else {
                toggleFieldSelection(field.path);
              }
            }}
            className="h-4 w-4"
          />
          
          <Badge variant="outline" className="text-xs py-0 px-1">
            {field.type}
          </Badge>
          
          <span className="text-sm font-medium flex-1 truncate">{field.name}</span>
        </div>
        
        {isExpanded && field.children && (
          <div>{field.children.map(child => renderFieldItem(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const handleAddColumn = () => {
    if (!newColumn.field || !newColumn.header) return;
    
    setManualColumns([...manualColumns, {
      field: newColumn.field,
      headerName: newColumn.header,
      cellDataType: newColumn.type,
    }]);
    
    setNewColumn({ field: '', header: '', type: 'text' });
  };

  const handleSave = () => {
    if (!name || !websocketUrl || !listenerTopic) {
      toast({
        title: 'Missing required fields',
        variant: 'destructive',
      });
      return;
    }

    // Build columns from selected fields + manual columns
    const columnsFromFields: ColumnDefinition[] = Array.from(selectedFields).map(path => ({
      field: path,
      headerName: path.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
      cellDataType: 'text',
    }));

    const datasource: StompDatasourceConfig = {
      id: datasourceId || `stomp-${Date.now()}`,
      name,
      type: 'stomp',
      websocketUrl,
      listenerTopic,
      requestMessage,
      snapshotEndToken,
      keyColumn,
      columnDefinitions: [...columnsFromFields, ...manualColumns],
      autoStart,
      inferredFields: inferredFields.map(field => convertFieldNodeToInfo(field)),
      createdAt: datasourceId ? getDatasource(datasourceId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    };

    if (datasourceId) {
      updateDatasource(datasourceId, datasource);
    } else {
      addDatasource(datasource);
    }

    toast({
      title: datasourceId ? 'Datasource updated' : 'Datasource created',
    });
    
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          "absolute bg-background border rounded-lg shadow-lg",
          isMaximized ? "inset-4" : "w-[800px] h-[600px]",
          isDragging && "cursor-move"
        )}
        style={!isMaximized ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
        } : undefined}
      >
        {/* Header */}
        <div
          ref={headerRef}
          className="flex items-center justify-between p-4 border-b cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              {datasourceId ? 'Edit' : 'Create'} STOMP Datasource
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === 'connection' 
                ? "border-b-2 border-primary text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('connection')}
          >
            Connection
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === 'fields' 
                ? "border-b-2 border-primary text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('fields')}
          >
            Fields {inferredFields.length > 0 && (
              <Badge variant="secondary" className="ml-2">{inferredFields.length}</Badge>
            )}
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === 'columns' 
                ? "border-b-2 border-primary text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('columns')}
          >
            Columns {(selectedFields.size + manualColumns.length) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedFields.size + manualColumns.length}
              </Badge>
            )}
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === 'statistics' 
                ? "border-b-2 border-primary text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('statistics')}
            disabled={!datasourceId}
          >
            Statistics
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 120px)' }}>
          {/* Connection Tab */}
          {activeTab === 'connection' && (
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My STOMP Datasource"
                    />
                  </div>

                  <div>
                    <Label htmlFor="websocket-url">WebSocket URL *</Label>
                    <Input
                      id="websocket-url"
                      value={websocketUrl}
                      onChange={(e) => setWebsocketUrl(e.target.value)}
                      placeholder="ws://localhost:8080"
                    />
                  </div>

                  <div>
                    <Label htmlFor="listener-topic">Listener Topic *</Label>
                    <Input
                      id="listener-topic"
                      value={listenerTopic}
                      onChange={(e) => setListenerTopic(e.target.value)}
                      placeholder="/snapshot/positions"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="request-message">Request Message</Label>
                      <Input
                        id="request-message"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="START"
                      />
                    </div>

                    <div>
                      <Label htmlFor="snapshot-token">Snapshot End Token</Label>
                      <Input
                        id="snapshot-token"
                        value={snapshotEndToken}
                        onChange={(e) => setSnapshotEndToken(e.target.value)}
                        placeholder="Success"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="key-column">Key Column</Label>
                      <Input
                        id="key-column"
                        value={keyColumn}
                        onChange={(e) => setKeyColumn(e.target.value)}
                        placeholder="id"
                      />
                    </div>

                    {listenerTopic.includes('/snapshot/') && (
                      <div>
                        <Label htmlFor="message-rate">Message Rate (msg/s)</Label>
                        <Input
                          id="message-rate"
                          type="number"
                          value={messageRate}
                          onChange={(e) => setMessageRate(e.target.value)}
                          placeholder="1000"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-start"
                      checked={autoStart}
                      onCheckedChange={(checked) => setAutoStart(checked as boolean)}
                    />
                    <label
                      htmlFor="auto-start"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Auto-start on application load
                    </label>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleTestConnection}
                      disabled={testing || !websocketUrl || !listenerTopic}
                    >
                      {testing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>

                    {testResult && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Connected successfully</span>
                      </div>
                    )}

                    {testError && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{testError}</span>
                      </div>
                    )}
                  </div>

                  {previewData.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Preview (First 10 rows)</h4>
                      <div className="border rounded-lg overflow-auto max-h-48">
                        <pre className="text-xs p-2">
                          {JSON.stringify(previewData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Fields Tab */}
          {activeTab === 'fields' && (
            <div className="h-full flex">
              <div className="flex-1 border-r">
                <div className="p-3 border-b space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectAllChecked}
                        indeterminate={selectAllIndeterminate}
                        onCheckedChange={handleSelectAll}
                        className="h-4 w-4"
                      />
                      <h3 className="text-sm font-medium">
                        Inferred Fields {inferredFields.length > 0 && `(${filterFields(inferredFields, fieldSearchQuery).length})`}
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleInferFields}
                      disabled={testing || !websocketUrl || !listenerTopic}
                    >
                      {testing ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Inferring...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-3 w-3" />
                          Infer Fields
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search fields..."
                      value={fieldSearchQuery}
                      onChange={(e) => setFieldSearchQuery(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
                
                <ScrollArea className="h-full">
                  <div className="p-2">
                    {(() => {
                      const filteredFields = filterFields(inferredFields, fieldSearchQuery);
                      
                      if (filteredFields.length === 0) {
                        return (
                          <div className="text-center text-muted-foreground py-8">
                            {fieldSearchQuery ? 'No fields match your search' : 'No fields inferred yet'}
                          </div>
                        );
                      }
                      
                      return filteredFields.map(field => renderFieldItem(field));
                    })()}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="w-64">
                <div className="p-3 border-b">
                  <h3 className="text-sm font-medium">
                    Selected ({selectedFields.size})
                  </h3>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {Array.from(selectedFields).sort().map(path => (
                      <div key={path} className="text-xs p-2 bg-muted rounded flex items-center justify-between group">
                        <span className="truncate">{path}</span>
                        <button
                          onClick={() => toggleFieldSelection(path)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && datasourceId && (
            <div className="h-full flex flex-col p-6">
              {(() => {
                const stats = datasourceStatistics.get(datasourceId);
                const components = componentUsage.get(datasourceId);
                
                if (!stats) {
                  return (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                        <p>No statistics available yet.</p>
                        <p className="text-sm mt-2">Activate the datasource to see statistics.</p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Connection Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Connection Status</span>
                          </div>
                          <p className="text-2xl font-semibold">
                            {stats.isConnected ? (
                              <span className="text-green-500">Connected</span>
                            ) : (
                              <span className="text-red-500">Disconnected</span>
                            )}
                          </p>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Total Connections</span>
                          </div>
                          <p className="text-2xl font-semibold">{stats.connectionCount}</p>
                          <p className="text-xs text-muted-foreground">
                            Disconnections: {stats.disconnectionCount}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Data Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Snapshot Rows</span>
                          </div>
                          <p className="text-2xl font-semibold">{stats.snapshotRowsReceived}</p>
                          {stats.snapshotDuration && (
                            <p className="text-xs text-muted-foreground">
                              Duration: {(stats.snapshotDuration / 1000).toFixed(2)}s
                            </p>
                          )}
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Update Rows</span>
                          </div>
                          <p className="text-2xl font-semibold">{stats.updateRowsReceived}</p>
                          <p className="text-xs text-muted-foreground">Real-time updates</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Component Usage</h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-lg">
                          <span className="text-2xl font-semibold">{components?.size || 0}</span>
                          <span className="text-muted-foreground ml-2">components connected</span>
                        </p>
                        {components && components.size > 0 && (
                          <div className="mt-3 space-y-1">
                            {Array.from(components).map(componentId => (
                              <div key={componentId} className="text-xs text-muted-foreground">
                                • {componentId}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {stats.lastConnectedAt && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Last Connected:</span>
                            <span className="text-muted-foreground">
                              {new Date(stats.lastConnectedAt).toLocaleString()}
                            </span>
                          </div>
                          {stats.lastDisconnectedAt && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>Last Disconnected:</span>
                              <span className="text-muted-foreground">
                                {new Date(stats.lastDisconnectedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Columns Tab */}
          {activeTab === 'columns' && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex gap-2">
                  <Input
                    placeholder="Field name"
                    value={newColumn.field}
                    onChange={(e) => setNewColumn({ ...newColumn, field: e.target.value })}
                  />
                  <Input
                    placeholder="Header name"
                    value={newColumn.header}
                    onChange={(e) => setNewColumn({ ...newColumn, header: e.target.value })}
                  />
                  <Select
                    value={newColumn.type}
                    onValueChange={(value) => setNewColumn({ ...newColumn, type: value as any })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddColumn} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {[...Array.from(selectedFields).map(path => ({
                    field: path,
                    headerName: path.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
                    cellDataType: 'text' as const,
                  })), ...manualColumns].map((col, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{col.headerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {col.field} • {col.cellDataType}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (selectedFields.has(col.field)) {
                            toggleFieldSelection(col.field);
                          } else {
                            setManualColumns(manualColumns.filter(c => c !== col));
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {selectedFields.size === 0 && manualColumns.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No columns defined. Select fields or add columns manually.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {datasourceId ? 'Update' : 'Create'} Datasource
          </Button>
        </div>
      </div>
    </div>
  );
};