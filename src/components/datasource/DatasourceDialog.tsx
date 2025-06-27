import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { StompDatasourceProvider } from '@/providers/StompDatasourceProvider';
import { useDatasourceStore, StompDatasourceConfig, ColumnDefinition, FieldInfo } from '@/stores/datasource.store';
import { useToast } from '@/hooks/use-toast';
import { AgGridReact } from 'ag-grid-react';
import { GridApi, ColDef, GridReadyEvent, CellValueChangedEvent, themeQuartz } from 'ag-grid-community';
import { useTheme } from '@/components/datatable/ThemeProvider';
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
  Search
} from 'lucide-react';

// Import FieldNode type
import { FieldNode } from './components/FieldSelector';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Dialog state
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'connection' | 'fields' | 'columns'>('connection');
  
  // Form state
  const [name, setName] = useState('');
  const [websocketUrl, setWebsocketUrl] = useState('');
  const [listenerTopic, setListenerTopic] = useState('');
  const [requestMessage, setRequestMessage] = useState('START');
  const [requestBody, setRequestBody] = useState('TriggerTopic');
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
  const [columnsGridApi, setColumnsGridApi] = useState<GridApi | null>(null);
  const [showUpdateColumnsAlert, setShowUpdateColumnsAlert] = useState(false);
  const { theme } = useTheme();

  // Load existing datasource
  useEffect(() => {
    if (datasourceId && open) {
      const datasource = getDatasource(datasourceId) as StompDatasourceConfig;
      if (datasource && datasource.type === 'stomp') {
        setName(datasource.name);
        setWebsocketUrl(datasource.websocketUrl);
        setListenerTopic(datasource.listenerTopic);
        setRequestMessage(datasource.requestMessage || 'START');
        setRequestBody(datasource.requestBody || 'TriggerTopic');
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
      requestBody,
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
      requestBody,
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
    // Find the field to check if it's an object
    const findField = (fields: FieldNode[], targetPath: string): FieldNode | undefined => {
      for (const field of fields) {
        if (field.path === targetPath) return field;
        if (field.children) {
          const found = findField(field.children, targetPath);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    const field = findField(inferredFields, path);
    
    if (field && field.type === 'object' && field.children) {
      // For object fields, toggle all child fields instead
      const isAnyChildSelected = field.children.some(child => selectedFields.has(child.path));
      selectFieldWithChildren(field, !isAnyChildSelected);
    } else {
      // For non-object fields, toggle normally
      setSelectedFields(prev => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    }
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
    
    const collectLeafFields = (f: FieldNode) => {
      // Only add non-object fields (leaf nodes)
      if (f.type !== 'object' || !f.children || f.children.length === 0) {
        fieldsToUpdate.add(f.path);
      }
      // Recursively collect from children
      if (f.children) {
        f.children.forEach(collectLeafFields);
      }
    };
    
    collectLeafFields(field);
    
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
    
    const collectAllLeafPaths = (fields: FieldNode[]) => {
      fields.forEach(field => {
        // Only add non-object fields (leaf nodes)
        if (field.type !== 'object' || !field.children || field.children.length === 0) {
          allPaths.add(field.path);
        }
        if (field.children) {
          collectAllLeafPaths(field.children);
        }
      });
    };
    
    collectAllLeafPaths(filteredFields);
    
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
    
    // For object fields, check if any/all children are selected
    let isChecked = false;
    let isIndeterminate = false;
    
    if (field.type === 'object' && field.children) {
      const leafChildren: string[] = [];
      const collectLeafPaths = (f: FieldNode) => {
        if (f.type !== 'object' || !f.children || f.children.length === 0) {
          leafChildren.push(f.path);
        }
        if (f.children) {
          f.children.forEach(collectLeafPaths);
        }
      };
      field.children.forEach(collectLeafPaths);
      
      const selectedCount = leafChildren.filter(path => selectedFields.has(path)).length;
      isChecked = selectedCount === leafChildren.length && leafChildren.length > 0;
      isIndeterminate = selectedCount > 0 && selectedCount < leafChildren.length;
    } else {
      isChecked = selectedFields.has(field.path);
    }
    
    return (
      <div key={field.path}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer",
            (isChecked || isIndeterminate) && "bg-muted/30"
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
            checked={isIndeterminate ? "indeterminate" : isChecked}
            onCheckedChange={() => toggleFieldSelection(field.path)}
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
  
  // Helper function to get field type from inferred fields
  const getFieldType = (fieldPath: string): ColumnDefinition['cellDataType'] => {
    const findFieldType = (fields: FieldNode[], path: string): string | undefined => {
      for (const field of fields) {
        if (field.path === path) {
          return field.type;
        }
        if (field.children) {
          const childType = findFieldType(field.children, path);
          if (childType) return childType;
        }
      }
      return undefined;
    };
    
    const fieldType = findFieldType(inferredFields, fieldPath);
    
    // Map field types to column data types
    switch (fieldType) {
      case 'string':
        return 'text';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'date';
      case 'object':
      case 'array':
        return 'object'; // Both object and array types map to 'object' column type
      default:
        return 'text'; // Default fallback
    }
  };
  
  // Get all columns for display
  const getAllColumns = useMemo(() => {
    const columnsFromFields = Array.from(selectedFields).map(path => ({
      field: path,
      headerName: path.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
      cellDataType: getFieldType(path),
      source: 'field' as const,
    }));
    
    const columnsFromManual = manualColumns.map(col => ({
      ...col,
      source: 'manual' as const,
    }));
    
    return [...columnsFromFields, ...columnsFromManual];
  }, [selectedFields, manualColumns, inferredFields]);
  
  // AG-Grid column definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'left',
      cellRenderer: (params: any) => {
        return (
          <button
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              if (params.data.source === 'field') {
                toggleFieldSelection(params.data.field);
              } else {
                setManualColumns(prev => prev.filter(col => col.field !== params.data.field));
              }
            }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        );
      },
    },
    {
      field: 'field',
      headerName: 'Field Name',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      floatingFilter: true,
      cellRenderer: (params: any) => {
        return (
          <div className="flex items-center gap-2">
            <span>{params.value}</span>
            {params.data.source === 'field' && (
              <Badge variant="secondary" className="text-xs px-1 py-0.5">auto</Badge>
            )}
          </div>
        );
      },
    },
    {
      field: 'cellDataType',
      headerName: 'Type',
      width: 120,
      sortable: true,
      filter: true,
      floatingFilter: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['text', 'number', 'boolean', 'date', 'object'],
      },
      editable: (params: any) => params.data.source === 'manual',
    },
    {
      field: 'headerName',
      headerName: 'Header Name',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: true,
      floatingFilter: true,
      editable: (params: any) => params.data.source === 'manual',
    },
  ], [toggleFieldSelection, setManualColumns]);
  
  // Grid theme configuration
  const gridTheme = useMemo(() => {
    const isDark = theme === 'dark';
    return themeQuartz.withParams({
      accentColor: isDark ? '#8AAAA7' : '#6B7280',
      backgroundColor: isDark ? '#161b22' : '#ffffff',
      borderColor: isDark ? '#30363d' : '#e5e7eb',
      foregroundColor: isDark ? '#FFF' : '#000',
      headerBackgroundColor: isDark ? '#21262d' : '#f9fafb',
      headerFontSize: 12,
      fontSize: 12,
      rowHeight: 32,
      headerHeight: 32,
      cellHorizontalPadding: 8,
    });
  }, [theme]);
  
  // Handle grid ready
  const onColumnsGridReady = useCallback((event: GridReadyEvent) => {
    setColumnsGridApi(event.api);
  }, []);
  
  // Handle cell value changed
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, colDef, newValue } = event;
    
    if (data.source === 'manual') {
      const index = manualColumns.findIndex(col => col.field === data.field);
      if (index !== -1) {
        const updated = [...manualColumns];
        if (colDef?.field === 'cellDataType') {
          updated[index] = { ...updated[index], cellDataType: newValue };
        } else if (colDef?.field === 'headerName') {
          updated[index] = { ...updated[index], headerName: newValue };
        }
        setManualColumns(updated);
      }
    }
  }, [manualColumns]);

  const handleUpdateColumns = () => {
    // Clear all manual columns and reset to only selected fields
    setManualColumns([]);
    setShowUpdateColumnsAlert(false);
    setActiveTab('columns');
    toast({
      title: 'Columns updated',
      description: `${selectedFields.size} columns created from selected fields`,
    });
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
      requestBody,
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
          "absolute bg-background border rounded-lg shadow-lg flex flex-col",
          isMaximized ? "inset-4" : "w-[700px] h-[700px]",
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
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
                      <Label htmlFor="request-destination">Destination</Label>
                      <Input
                        id="request-destination"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="/app/trigger"
                      />
                    </div>

                    <div>
                      <Label htmlFor="request-body">Body</Label>
                      <Input
                        id="request-body"
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        placeholder="TriggerTopic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="snapshot-token">Snapshot End Token</Label>
                      <Input
                        id="snapshot-token"
                        value={snapshotEndToken}
                        onChange={(e) => setSnapshotEndToken(e.target.value)}
                        placeholder="Success"
                      />
                    </div>

                    <div>
                      <Label htmlFor="key-column">Key Column</Label>
                      <Input
                        id="key-column"
                        value={keyColumn}
                        onChange={(e) => setKeyColumn(e.target.value)}
                        placeholder="id"
                      />
                    </div>
                  </div>

                  {listenerTopic.includes('/snapshot/') && (
                    <div>
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
                    </div>
                  )}

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

                  {previewData.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Preview (First 10 rows)</h4>
                        <div className="border rounded-lg overflow-auto max-h-48">
                          <pre className="text-xs p-2">
                            {JSON.stringify(previewData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </>
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
                        checked={selectAllIndeterminate ? "indeterminate" : selectAllChecked}
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


          {/* Columns Tab */}
          {activeTab === 'columns' && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b space-y-3">
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
                      <SelectItem value="object">Object</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddColumn} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
              </div>
              
              <div className="flex-1 overflow-hidden">
                {getAllColumns.length > 0 ? (
                  <div className="h-full">
                    <AgGridReact
                      rowData={getAllColumns}
                      columnDefs={columnDefs}
                      onGridReady={onColumnsGridReady}
                      onCellValueChanged={onCellValueChanged}
                      theme={gridTheme}
                      defaultColDef={{
                        sortable: true,
                        resizable: true,
                        filter: true,
                      }}
                      floatingFiltersHeight={30}
                      rowHeight={32}
                      headerHeight={32}
                      suppressMenuHide={true}
                      animateRows={true}
                      stopEditingWhenCellsLoseFocus={true}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <p>No columns defined.</p>
                      <p className="text-sm mt-2">Select fields from the Fields tab or add columns manually above.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center gap-3">
            {activeTab === 'connection' && (
              <>
                <Button 
                  variant="outline" 
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
              </>
            )}
            
            {activeTab === 'fields' && selectedFields.size > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowUpdateColumnsAlert(true)}
              >
                Update Columns ({selectedFields.size})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {datasourceId ? 'Update' : 'Create'} Datasource
            </Button>
          </div>
        </div>
      </div>
      
      {/* Update Columns Confirmation Dialog */}
      <AlertDialog open={showUpdateColumnsAlert} onOpenChange={setShowUpdateColumnsAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Columns</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all existing columns in the Columns tab with the currently selected fields. 
              Any manually added columns will be removed. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateColumns}>
              Update Columns
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};