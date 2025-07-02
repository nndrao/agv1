import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Database, Zap } from 'lucide-react';
import { useDatasourceContext } from '@/contexts/DatasourceContext';
import { DatasourceStats } from '@/services/datasource/DatasourceStatistics';
import { ConflationMetrics } from '@/services/datasource/ConflatedDataStore';

interface DatasourceStatisticsProps {
  datasourceId: string;
  compact?: boolean;
}

export function DatasourceStatistics({ datasourceId, compact = false }: DatasourceStatisticsProps) {
  const { dataStoreManager, getProvider } = useDatasourceContext();
  const [stats, setStats] = useState<DatasourceStats | null>(null);
  const [conflationMetrics, setConflationMetrics] = useState<ConflationMetrics | null>(null);
  const [providerStats, setProviderStats] = useState<any>(null);
  
  useEffect(() => {
    // Get statistics instance
    const statistics = dataStoreManager.getStatistics(datasourceId);
    const dataStore = dataStoreManager.getStore(datasourceId);
    
    if (!statistics || !dataStore) return;
    
    // Subscribe to statistics updates
    const statsSubscription = statistics.getStats$().subscribe(newStats => {
      setStats(newStats);
    });
    
    // Subscribe to conflation metrics
    const metricsSubscription = dataStore.getMetrics$().subscribe(metrics => {
      setConflationMetrics(metrics);
    });
    
    // Update connection uptime periodically
    const uptimeInterval = setInterval(() => {
      statistics.updateConnectionUptime();
    }, 1000);
    
    // Get provider statistics
    const provider = getProvider(datasourceId);
    const providerStatsInterval = setInterval(() => {
      if (provider && typeof provider.getStatistics === 'function') {
        setProviderStats(provider.getStatistics());
      }
    }, 1000);
    
    return () => {
      statsSubscription.unsubscribe();
      metricsSubscription.unsubscribe();
      clearInterval(uptimeInterval);
      clearInterval(providerStatsInterval);
    };
  }, [datasourceId, dataStoreManager, getProvider]);
  
  if (!stats || !conflationMetrics) {
    return null;
  }
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };
  
  const successRate = conflationMetrics.totalUpdatesReceived > 0 
    ? ((conflationMetrics.updatesApplied / conflationMetrics.totalUpdatesReceived) * 100).toFixed(1)
    : '100';
  
  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span>{conflationMetrics.snapshotSize.toLocaleString()} rows</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span>{conflationMetrics.currentUpdateRate} msg/s</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <span>{conflationMetrics.conflationRate.toFixed(1)}%</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <Badge variant={parseFloat(successRate) >= 95 ? "default" : "destructive"}>
          {successRate}% success
        </Badge>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
        {/* Snapshot Statistics */}
        <div>
          <h4 className="text-sm font-medium mb-2">Snapshot</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rows:</span>
              <span className="font-mono">{stats.snapshotRowCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-mono">{formatBytes(providerStats?.snapshotBytesReceived || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-mono">{formatDuration(stats.snapshotDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory:</span>
              <span className="font-mono">{stats.memoryUsageMB.toFixed(1)} MB</span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Update Statistics */}
        <div>
          <h4 className="text-sm font-medium mb-2">Real-time Updates</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Messages:</span>
              <span className="font-mono">{conflationMetrics.totalUpdatesReceived.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applied:</span>
              <span className="font-mono">{conflationMetrics.updatesApplied.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conflated:</span>
              <span className="font-mono">{conflationMetrics.updatesConflated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failed:</span>
              <span className="font-mono text-destructive">{stats.updatesFailed.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span>{successRate}%</span>
            </div>
            <Progress value={parseFloat(successRate)} className="h-2" />
          </div>
        </div>
        
        <Separator />
        
        {/* Performance Metrics */}
        <div>
          <h4 className="text-sm font-medium mb-2">Performance</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Messages/sec:</span>
              <span className="font-mono flex items-center gap-1">
                {conflationMetrics.currentUpdateRate}/s
                {conflationMetrics.currentUpdateRate > 0 && (
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Messages/sec:</span>
              <span className="font-mono">{conflationMetrics.averageUpdateRate}/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peak Rate:</span>
              <span className="font-mono">{stats.peakUpdateRate}/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Latency:</span>
              <span className="font-mono">{stats.averageConflationLatency}ms</span>
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Conflation Rate</span>
              <span>{conflationMetrics.conflationRate.toFixed(1)}%</span>
            </div>
            <Progress value={conflationMetrics.conflationRate} className="h-2" />
          </div>
        </div>
        
        <Separator />
        
        {/* Connection Info */}
        <div>
          <h4 className="text-sm font-medium mb-2">Connection</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime:</span>
              <span className="font-mono">{formatDuration(stats.connectionUptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reconnects:</span>
              <span className="font-mono">{stats.reconnectCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Bytes:</span>
              <span className="font-mono">{formatBytes(providerStats?.bytesReceived || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Errors:</span>
              <span className="font-mono text-destructive">{stats.errorCount}</span>
            </div>
          </div>
        </div>
        
        {stats.lastError && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2 text-destructive">Last Error</h4>
              <p className="text-xs text-muted-foreground">
                {new Date(stats.lastError.timestamp).toLocaleTimeString()}: {stats.lastError.message}
              </p>
            </div>
          </>
        )}
    </div>
  );
}