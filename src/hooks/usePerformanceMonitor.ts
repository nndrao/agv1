import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  slowRenders: number;
  memoryUsage?: number;
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  slowRenderThreshold?: number;
  enableMemoryTracking?: boolean;
  onSlowRender?: (metrics: PerformanceMetrics) => void;
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions) {
  const {
    componentName,
    slowRenderThreshold = 16, // 16ms = 60fps
    enableMemoryTracking = false,
    onSlowRender,
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    slowRenders: 0,
  });

  const renderStartTimeRef = useRef<number>(0);

  // Track render start
  useEffect(() => {
    renderStartTimeRef.current = performance.now();
  });

  // Track render completion
  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTimeRef.current;
    const metrics = metricsRef.current;

    // Update metrics
    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.averageRenderTime = 
      (metrics.averageRenderTime * (metrics.renderCount - 1) + renderTime) / metrics.renderCount;

    if (renderTime > slowRenderThreshold) {
      metrics.slowRenders++;
      onSlowRender?.(metrics);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Performance] Slow render detected in ${componentName}:`,
          `${renderTime.toFixed(2)}ms (threshold: ${slowRenderThreshold}ms)`
        );
      }
    }

    // Track memory usage if enabled
    if (enableMemoryTracking && 'memory' in performance) {
      metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
  });

  const logMetrics = useCallback(() => {
    const metrics = metricsRef.current;
    console.log(`[Performance] ${componentName} metrics:`, {
      renderCount: metrics.renderCount,
      averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
      slowRenders: metrics.slowRenders,
      slowRenderPercentage: `${((metrics.slowRenders / metrics.renderCount) * 100).toFixed(1)}%`,
      memoryUsage: metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
    });
  }, [componentName]);

  // Log metrics on unmount in development
  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development' && metricsRef.current.renderCount > 0) {
        logMetrics();
      }
    };
  }, [logMetrics]);

  return {
    metrics: metricsRef.current,
    logMetrics,
  };
}