import { BehaviorSubject, Observable } from 'rxjs';

export interface DatasourceStats {
  // Snapshot metrics
  snapshotStartTime: number;
  snapshotEndTime: number;
  snapshotDuration: number;
  snapshotRowCount: number;
  snapshotBytesReceived: number;
  
  // Update metrics
  totalUpdatesReceived: number;
  updatesApplied: number;
  updatesConflated: number;
  updatesFailed: number;
  currentUpdateRate: number;
  averageUpdateRate: number;
  peakUpdateRate: number;
  
  // Performance metrics
  averageConflationLatency: number;
  lastUpdateTimestamp: number;
  memoryUsageMB: number;
  
  // Connection metrics
  connectionStartTime: number;
  connectionUptime: number;
  reconnectCount: number;
  lastReconnectTime: number;
  
  // Error metrics
  errorCount: number;
  lastError?: {
    message: string;
    timestamp: number;
    type: string;
  };
}

export class DatasourceStatistics {
  private stats$ = new BehaviorSubject<DatasourceStats>(this.getInitialStats());
  private latencyWindow: number[] = [];
  private latencyWindowSize = 100; // Keep last 100 measurements
  
  constructor(private datasourceId: string) {}
  
  private getInitialStats(): DatasourceStats {
    return {
      // Snapshot metrics
      snapshotStartTime: 0,
      snapshotEndTime: 0,
      snapshotDuration: 0,
      snapshotRowCount: 0,
      snapshotBytesReceived: 0,
      
      // Update metrics
      totalUpdatesReceived: 0,
      updatesApplied: 0,
      updatesConflated: 0,
      updatesFailed: 0,
      currentUpdateRate: 0,
      averageUpdateRate: 0,
      peakUpdateRate: 0,
      
      // Performance metrics
      averageConflationLatency: 0,
      lastUpdateTimestamp: 0,
      memoryUsageMB: 0,
      
      // Connection metrics
      connectionStartTime: Date.now(),
      connectionUptime: 0,
      reconnectCount: 0,
      lastReconnectTime: 0,
      
      // Error metrics
      errorCount: 0,
    };
  }
  
  // Snapshot tracking methods
  
  startSnapshot(): void {
    const current = this.stats$.value;
    this.stats$.next({
      ...current,
      snapshotStartTime: Date.now(),
      snapshotEndTime: 0,
      snapshotDuration: 0,
    });
  }
  
  completeSnapshot(rowCount: number, bytesReceived: number = 0): void {
    const current = this.stats$.value;
    const endTime = Date.now();
    const duration = endTime - current.snapshotStartTime;
    
    this.stats$.next({
      ...current,
      snapshotEndTime: endTime,
      snapshotDuration: duration,
      snapshotRowCount: rowCount,
      snapshotBytesReceived: bytesReceived,
    });
  }
  
  // Update tracking methods
  
  recordUpdate(success: boolean = true): void {
    const current = this.stats$.value;
    this.stats$.next({
      ...current,
      totalUpdatesReceived: current.totalUpdatesReceived + 1,
      updatesApplied: success ? current.updatesApplied + 1 : current.updatesApplied,
      updatesFailed: success ? current.updatesFailed : current.updatesFailed + 1,
      lastUpdateTimestamp: Date.now(),
    });
  }
  
  recordConflation(originalCount: number, conflatedCount: number): void {
    const current = this.stats$.value;
    const conflatedAway = originalCount - conflatedCount;
    
    this.stats$.next({
      ...current,
      updatesConflated: current.updatesConflated + conflatedAway,
    });
  }
  
  updateRates(currentRate: number, averageRate: number): void {
    const current = this.stats$.value;
    const peakRate = Math.max(current.peakUpdateRate, currentRate);
    
    this.stats$.next({
      ...current,
      currentUpdateRate: currentRate,
      averageUpdateRate: averageRate,
      peakUpdateRate: peakRate,
    });
  }
  
  // Performance tracking
  
  recordLatency(latencyMs: number): void {
    this.latencyWindow.push(latencyMs);
    
    // Keep only the latest measurements
    if (this.latencyWindow.length > this.latencyWindowSize) {
      this.latencyWindow.shift();
    }
    
    // Calculate average
    const avgLatency = this.latencyWindow.reduce((sum, val) => sum + val, 0) / this.latencyWindow.length;
    
    const current = this.stats$.value;
    this.stats$.next({
      ...current,
      averageConflationLatency: Math.round(avgLatency * 10) / 10, // Round to 1 decimal
    });
  }
  
  updateMemoryUsage(bytes: number): void {
    const current = this.stats$.value;
    const mb = bytes / (1024 * 1024);
    
    this.stats$.next({
      ...current,
      memoryUsageMB: Math.round(mb * 10) / 10, // Round to 1 decimal
    });
  }
  
  // Connection tracking
  
  recordReconnect(): void {
    const current = this.stats$.value;
    this.stats$.next({
      ...current,
      reconnectCount: current.reconnectCount + 1,
      lastReconnectTime: Date.now(),
    });
  }
  
  updateConnectionUptime(): void {
    const current = this.stats$.value;
    const uptime = Date.now() - current.connectionStartTime;
    
    this.stats$.next({
      ...current,
      connectionUptime: uptime,
    });
  }
  
  // Error tracking
  
  recordError(error: Error | string, type: string = 'unknown'): void {
    const current = this.stats$.value;
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    this.stats$.next({
      ...current,
      errorCount: current.errorCount + 1,
      lastError: {
        message: errorMessage,
        timestamp: Date.now(),
        type: type,
      },
    });
  }
  
  // Public API
  
  getStats(): DatasourceStats {
    return this.stats$.value;
  }
  
  getStats$(): Observable<DatasourceStats> {
    return this.stats$.asObservable();
  }
  
  reset(): void {
    this.stats$.next(this.getInitialStats());
    this.latencyWindow = [];
  }
  
  destroy(): void {
    this.stats$.complete();
  }
  
  // Export methods
  
  exportToJSON(): string {
    const stats = this.stats$.value;
    const exportData = {
      datasourceId: this.datasourceId,
      exportTime: new Date().toISOString(),
      stats: stats,
      summary: {
        totalRuntime: stats.connectionUptime,
        totalUpdates: stats.totalUpdatesReceived,
        successRate: stats.totalUpdatesReceived > 0 
          ? ((stats.updatesApplied / stats.totalUpdatesReceived) * 100).toFixed(2) + '%'
          : '0%',
        conflationRate: stats.totalUpdatesReceived > 0
          ? ((stats.updatesConflated / stats.totalUpdatesReceived) * 100).toFixed(2) + '%'
          : '0%',
        averageLatency: stats.averageConflationLatency + 'ms',
        peakUpdateRate: stats.peakUpdateRate + '/sec',
      },
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  exportToCSV(): string {
    const stats = this.stats$.value;
    const headers = Object.keys(stats).filter(key => key !== 'lastError');
    const values = headers.map(key => {
      const value = stats[key as keyof DatasourceStats];
      return typeof value === 'number' ? value : '';
    });
    
    return [
      headers.join(','),
      values.join(','),
    ].join('\n');
  }
}