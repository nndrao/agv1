// Performance monitoring utility
export interface PerformanceMetrics {
  appStartTime: number;
  gridInitTime?: number;
  profileLoadTime?: number;
  dataGenerationTime?: number;
  firstRenderTime?: number;
  fullyLoadedTime?: number;
  [key: string]: number | undefined;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private marks: Map<string, number> = new Map();

  constructor() {
    this.metrics = {
      appStartTime: performance.now()
    };
  }

  mark(name: string) {
    const time = performance.now();
    this.marks.set(name, time);
    // console.log(`[Performance] ${name}: ${time.toFixed(2)}ms`);
  }

  measure(name: string, startMark: string, endMark?: string) {
    const startTime = this.marks.get(startMark) || 0;
    const endTime = endMark ? (this.marks.get(endMark) || performance.now()) : performance.now();
    const duration = endTime - startTime;
    
    this.metrics[name] = duration;
    // console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    
    return duration;
  }

  measureFromStart(name: string) {
    const duration = performance.now() - this.metrics.appStartTime;
    this.metrics[name] = duration;
    // console.log(`[Performance] ${name} from start: ${duration.toFixed(2)}ms`);
    return duration;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  logSummary() {
    // console.group('📊 Performance Summary');
    // Object.entries(this.metrics).forEach(([key, value]) => {
    //   if (value !== undefined) {
    //     console.log(`${key}: ${value.toFixed(2)}ms`);
    //   }
    // });
    // console.groupEnd();
  }
}

export const perfMonitor = new PerformanceMonitor();

// Export to window for debugging
if (typeof window !== 'undefined') {
  (window as any).perfMonitor = perfMonitor;
}