import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Database, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatasourceStatistics {
  messagesReceived: number;
  lastMessageTime?: number;
  bytesReceived: number;
  averageMessageSize: number;
  messagesPerSecond: number;
  errorCount: number;
  connectionUptime: number;
}

interface ComponentUsage {
  componentId: string;
  componentType: string;
  lastAccessed: number;
}

interface DataSourceStatisticsProps {
  datasourceId: string;
  statistics?: DatasourceStatistics;
  componentUsage?: ComponentUsage[];
}

export const DataSourceStatistics: React.FC<DataSourceStatisticsProps> = ({
  datasourceId,
  statistics,
  componentUsage = [],
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (!statistics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No statistics available. Connect to the datasource to see live metrics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>Messages</span>
          </div>
          <p className="text-2xl font-semibold">{statistics.messagesReceived.toLocaleString()}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Rate</span>
          </div>
          <p className="text-2xl font-semibold">{statistics.messagesPerSecond.toFixed(1)}/s</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>Data</span>
          </div>
          <p className="text-2xl font-semibold">{formatBytes(statistics.bytesReceived)}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Uptime</span>
          </div>
          <p className="text-2xl font-semibold">{formatUptime(statistics.connectionUptime)}</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average Message Size</span>
            <span>{formatBytes(statistics.averageMessageSize)}</span>
          </div>
          {statistics.lastMessageTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Message</span>
              <span>{formatTime(statistics.lastMessageTime)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Error Count</span>
            <span className={cn(
              statistics.errorCount > 0 && "text-destructive font-medium"
            )}>
              {statistics.errorCount}
            </span>
          </div>
        </div>
      </div>

      {/* Component Usage */}
      {componentUsage.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Connected Components</h4>
          <div className="space-y-2">
            {componentUsage.map((usage) => (
              <div
                key={usage.componentId}
                className="flex items-center justify-between p-2 rounded-sm border"
              >
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {usage.componentType}
                  </Badge>
                  <span className="text-sm font-mono">{usage.componentId}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTime(usage.lastAccessed)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};