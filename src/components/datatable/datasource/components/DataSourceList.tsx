import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Trash2,
  Zap,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database
} from 'lucide-react';
import type { DataSource } from '../types';

interface DataSourceListProps {
  dataSources: DataSource[];
  activeId: string | null;
  onEdit: (dataSource: DataSource) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export function DataSourceList({
  dataSources,
  onEdit,
  onDelete,
  onToggleActive
}: DataSourceListProps) {
  if (dataSources.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No data sources configured</p>
        <p className="text-sm mt-2">
          Click "New STOMP" or "New REST" to create your first data source
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dataSources.map((dataSource) => (
        <Card key={dataSource.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {dataSource.type === 'stomp' ? (
                    <Zap className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <Globe className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {dataSource.name}
                    {dataSource.active && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {dataSource.type === 'stomp' ? 'STOMP Server' : 'REST Endpoint'}
                    {dataSource.lastFetch && (
                      <span className="ml-2">
                        • Last fetch: {new Date(dataSource.lastFetch).toLocaleTimeString()}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={dataSource.active}
                  onCheckedChange={() => onToggleActive(dataSource.id)}
                  aria-label="Toggle active"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(dataSource)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(dataSource.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {dataSource.type === 'stomp' ? (
                <>
                  <span>Topic: {(dataSource.config as any).topic || 'Not configured'}</span>
                  <span>•</span>
                  <span>URL: {(dataSource.config as any).websocketUrl || 'Not configured'}</span>
                </>
              ) : (
                <>
                  <span>{(dataSource.config as any).method || 'GET'}</span>
                  <span>•</span>
                  <span>{(dataSource.config as any).url || 'Not configured'}</span>
                </>
              )}
            </div>
            
            {dataSource.lastError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {dataSource.lastError}
              </div>
            )}
            
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                {dataSource.schema ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Schema configured</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>No schema</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs">
                {dataSource.columnDefs.length > 0 ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>{dataSource.columnDefs.length} columns defined</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>No columns defined</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}