import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy,
  Database,
  Globe,
  PlayCircle,
  StopCircle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Activity,
  Clock,
  Users
} from 'lucide-react';
import { useDatasourceStore } from '@/stores/datasource.store';
import type { DatasourceConfig } from '@/stores/datasource.store';
import { DatasourceDialog } from './DatasourceDialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useDatasourceContext } from '@/contexts/DatasourceContext';

interface DatasourceListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDatasource?: (datasource: DatasourceConfig) => void;
}

export const DatasourceList: React.FC<DatasourceListProps> = ({
  open,
  onOpenChange,
  onSelectDatasource,
}) => {
  const { toast } = useToast();
  const { datasources, deleteDatasource, addDatasource } = useDatasourceStore();
  const { 
    activeDatasources, 
    connectionStatus, 
    activateDatasource, 
    deactivateDatasource,
    refreshDatasource,
    datasourceStatistics,
    componentUsage
  } = useDatasourceContext();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleEdit = (datasourceId: string) => {
    setEditingId(datasourceId);
    setEditorOpen(true);
  };

  const handleDelete = (datasourceId: string) => {
    const datasource = datasources.find(ds => ds.id === datasourceId);
    if (!datasource) return;

    if (confirm(`Are you sure you want to delete "${datasource.name}"?`)) {
      deleteDatasource(datasourceId);
      toast({
        title: 'Datasource deleted',
        description: `Deleted datasource "${datasource.name}"`,
      });
    }
  };

  const handleDuplicate = (datasourceId: string) => {
    const datasource = datasources.find(ds => ds.id === datasourceId);
    if (!datasource) return;

    const duplicated = {
      ...datasource,
      id: `${datasource.type}-${Date.now()}`,
      name: `Copy of ${datasource.name}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addDatasource(duplicated);
    toast({
      title: 'Datasource duplicated',
      description: `Created copy of "${datasource.name}"`,
    });
  };

  const handleSelect = (datasource: DatasourceConfig) => {
    if (onSelectDatasource) {
      onSelectDatasource(datasource);
      onOpenChange(false);
    }
  };

  const toggleRowExpansion = (datasourceId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(datasourceId)) {
        newSet.delete(datasourceId);
      } else {
        newSet.add(datasourceId);
      }
      return newSet;
    });
  };

  const renderStatus = (status: string | undefined, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    
    switch (status) {
      case 'connecting':
        return <Badge variant="secondary">Connecting...</Badge>;
      case 'connected':
        return <Badge variant="default">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Disconnected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'stomp':
        return <Database className="h-4 w-4" />;
      case 'rest':
        return <Globe className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stomp':
        return 'default';
      case 'rest':
        return 'secondary';
      default:
        return 'outline';
    }
  };


  // Always render the DatasourceDialog
  const datasourceDialog = (
    <DatasourceDialog
      open={editorOpen}
      onOpenChange={setEditorOpen}
      datasourceId={editingId}
    />
  );

  // Temporary: Use custom dialog implementation
  if (open) {
    return (
      <>
        {ReactDOM.createPortal(
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-[40]"
              onClick={() => onOpenChange(false)}
            />
        {/* Dialog */}
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[50] w-full max-w-4xl bg-background border rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Datasources</h2>
            <p className="text-sm text-muted-foreground">Manage your data connections and configurations</p>
          </div>
          
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingId(undefined);
                setEditorOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Datasource
            </Button>
          </div>
          
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
          
          {/* Table content */}
          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No datasources configured. Click "New Datasource" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  datasources.map((datasource) => {
                    const status = connectionStatus.get(datasource.id);
                    const isActive = activeDatasources.has(datasource.id);
                    const stats = datasourceStatistics.get(datasource.id);
                    const components = componentUsage.get(datasource.id);
                    const isExpanded = expandedRows.has(datasource.id);
                    
                    return (
                      <React.Fragment key={datasource.id}>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowExpansion(datasource.id);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              {getIcon(datasource.type)}
                              {datasource.name}
                              {'autoStart' in datasource && datasource.autoStart && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto-start
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        <TableCell>
                          <Badge variant={getTypeColor(datasource.type)}>
                            {datasource.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {renderStatus(status, isActive)}
                        </TableCell>
                        <TableCell>
                          {format(datasource.createdAt, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(datasource.updatedAt, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-[60]">
                              {onSelectDatasource && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(datasource);
                                  }}
                                >
                                  <Database className="mr-2 h-4 w-4" />
                                  Select
                                </DropdownMenuItem>
                              )}
                              {!isActive ? (
                                <DropdownMenuItem
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await activateDatasource(datasource.id);
                                    toast({
                                      title: 'Datasource activated',
                                      description: `${datasource.name} is now active`,
                                    });
                                  }}
                                >
                                  <PlayCircle className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deactivateDatasource(datasource.id);
                                      toast({
                                        title: 'Datasource deactivated',
                                        description: `${datasource.name} has been deactivated`,
                                      });
                                    }}
                                  >
                                    <StopCircle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await refreshDatasource(datasource.id);
                                      toast({
                                        title: 'Datasource refreshed',
                                        description: `${datasource.name} has been refreshed`,
                                      });
                                    }}
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Refresh
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(datasource.id);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(datasource.id);
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(datasource.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {stats ? (
                                <>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Database className="h-3 w-3" />
                                      <span>Snapshot Rows</span>
                                    </div>
                                    <p className="text-lg font-semibold">{(stats as any).snapshotRowCount || 0}</p>
                                    {(stats as any).snapshotDuration && (
                                      <p className="text-xs text-muted-foreground">
                                        {((stats as any).snapshotDuration / 1000).toFixed(2)}s
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Activity className="h-3 w-3" />
                                      <span>Update Rows</span>
                                    </div>
                                    <p className="text-lg font-semibold">{(stats as any).updateRowsReceived || 0}</p>
                                    <p className="text-xs text-muted-foreground">Real-time</p>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Activity className="h-3 w-3" />
                                      <span>Connections</span>
                                    </div>
                                    <p className="text-lg font-semibold">{(stats as any).connectionCount || 0}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {(stats as any).disconnectionCount || 0} disconnects
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Users className="h-3 w-3" />
                                      <span>Components</span>
                                    </div>
                                    <p className="text-lg font-semibold">{components?.size || 0}</p>
                                    <p className="text-xs text-muted-foreground">Using this datasource</p>
                                  </div>
                                  
                                  {(stats as any).lastConnectedAt && (
                                    <div className="col-span-2 lg:col-span-4 pt-2 border-t">
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          <span>Last connected: {new Date((stats as any).lastConnectedAt).toLocaleString()}</span>
                                        </div>
                                        {(stats as any).lastDisconnectedAt && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>Last disconnected: {new Date((stats as any).lastDisconnectedAt).toLocaleString()}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="col-span-2 lg:col-span-4 text-center text-muted-foreground">
                                  <p>No statistics available. Activate the datasource to see statistics.</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
          </>,
          document.body
        )}
        {datasourceDialog}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl" style={{ zIndex: 99999 }}>
          <DialogHeader>
            <DialogTitle>Datasources</DialogTitle>
            <DialogDescription>
              Manage your data connections and configurations
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingId(undefined);
                setEditorOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Datasource
            </Button>
          </div>

          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No datasources configured. Click "New Datasource" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  datasources.map((datasource) => {
                    const status = connectionStatus.get(datasource.id);
                    const isActive = activeDatasources.has(datasource.id);
                    
                    return (
                      <TableRow
                        key={datasource.id}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getIcon(datasource.type)}
                            {datasource.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeColor(datasource.type)}>
                            {datasource.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {renderStatus(status, isActive)}
                        </TableCell>
                        <TableCell>
                          {format(datasource.createdAt, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(datasource.updatedAt, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isActive ? (
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await activateDatasource(datasource.id);
                                  toast({
                                    title: 'Datasource activated',
                                    description: `${datasource.name} is now active`,
                                  });
                                }}
                              >
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deactivateDatasource(datasource.id);
                                    toast({
                                      title: 'Datasource deactivated',
                                      description: `${datasource.name} has been deactivated`,
                                    });
                                  }}
                                >
                                  <StopCircle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await refreshDatasource(datasource.id);
                                    toast({
                                      title: 'Datasource refreshed',
                                      description: `${datasource.name} has been refreshed`,
                                    });
                                  }}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Refresh
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('[DatasourceList] Edit menu clicked for:', datasource.id);
                                handleEdit(datasource.id);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(datasource.id);
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(datasource.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <DatasourceDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        datasourceId={editingId}
      />
    </>
  );
};