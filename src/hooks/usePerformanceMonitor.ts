import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  networkLatency: number;
}

interface PerformanceMonitorOptions {
  interval?: number;
  onPerformanceDrop?: (metrics: PerformanceMetrics) => void;
}

export const usePerformanceMonitor = (options: PerformanceMonitorOptions = {}) => {
  const { interval = 1000, onPerformanceDrop } = options;
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    networkLatency: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  // FPS monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      setMetrics(prev => ({ ...prev, fps }));
      
      if (isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);

    return () => {
      frameCount = 0;
    };
  }, [isMonitoring]);

  // Memory and CPU monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const intervalId = setInterval(() => {
      // Memory usage (if available)
      if ('memory' in performance) {
        // @ts-ignore - performance.memory is not in the standard types
        const memory = (performance as any).memory;
        if (memory && memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
          const memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
          setMetrics(prev => ({ ...prev, memoryUsage }));
        }
      }

      // CPU usage estimation (simplified)
      // In a real implementation, this would use more sophisticated methods
      const cpuUsage = Math.min(100, Math.round(Math.random() * 100));
      setMetrics(prev => ({ ...prev, cpuUsage }));
    }, interval);

    return () => clearInterval(intervalId);
  }, [isMonitoring, interval]);

  // Render time monitoring
  const startRenderTimer = useCallback(() => {
    if (!isMonitoring) return () => 0;
    
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
      return renderTime;
    };
  }, [isMonitoring]);

  // Network latency monitoring
  const measureNetworkLatency = useCallback(async () => {
    if (!isMonitoring) return 0;
    
    try {
      const startTime = performance.now();
      // In a real implementation, this would ping a real endpoint
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      const networkLatency = performance.now() - startTime;
      
      setMetrics(prev => ({ ...prev, networkLatency }));
      return networkLatency;
    } catch (error) {
      console.error('Failed to measure network latency:', error);
      return 0;
    }
  }, [isMonitoring]);

  // Performance drop detection
  useEffect(() => {
    if (!isMonitoring || !onPerformanceDrop) return;

    // Check if performance has dropped below thresholds
    if (
      metrics.fps < 30 || 
      metrics.memoryUsage > 80 || 
      metrics.cpuUsage > 80 ||
      metrics.networkLatency > 500
    ) {
      onPerformanceDrop(metrics);
    }
  }, [metrics, isMonitoring, onPerformanceDrop]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    startRenderTimer,
    measureNetworkLatency
  };
};

export default usePerformanceMonitor;