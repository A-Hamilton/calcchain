import React from 'react';

/**
 * Performance monitoring and optimization utilities
 */

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  componentMounts: number;
  memoryUsage?: number;
  bundleSize?: number;
}

// Web Vitals interfaces
interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
}

interface WebVitalsObserverCallbacks {
  onFCP?: (metric: WebVitalsMetric) => void;
  onLCP?: (metric: WebVitalsMetric) => void;
  onCLS?: (metric: WebVitalsMetric) => void;
  onINP?: (metric: WebVitalsMetric) => void;
  onTTFB?: (metric: WebVitalsMetric) => void;
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private renderStartTimes: Map<string, number> = new Map();
  private fpsData: number[] = [];
  private lastFrameTime: number = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start measuring render time for a component
  startRender(componentName: string): void {
    this.renderStartTimes.set(componentName, performance.now());
  }

  // End measuring render time for a component
  endRender(componentName: string): void {
    const startTime = this.renderStartTimes.get(componentName);
    if (startTime) {
      const renderTime = performance.now() - startTime;
      const existing = this.metrics.get(componentName);
      
      this.metrics.set(componentName, {
        renderTime: existing ? (existing.renderTime + renderTime) / 2 : renderTime,
        componentMounts: existing ? existing.componentMounts + 1 : 1,
        memoryUsage: this.getMemoryUsage(),
      });
      
      this.renderStartTimes.delete(componentName);
    }
  }

  // Get memory usage if available
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize;
    }
    return undefined;
  }

  // Get metrics for a component
  getMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  // Get all metrics
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }
  // Log performance metrics to console (development only)
  logMetrics(): void {
    if (import.meta.env.DEV) {
      console.group('🚀 Performance Metrics');
      this.metrics.forEach((metrics, componentName) => {
        console.log(`📊 ${componentName}:`, {
          'Avg Render Time': `${metrics.renderTime.toFixed(2)}ms`,
          'Mount Count': metrics.componentMounts,
          'Memory Usage': metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
        });
      });
      console.groupEnd();
    }
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    this.renderStartTimes.clear();
  }

  // Observe Web Vitals metrics
  observeWebVitals(callbacks: WebVitalsObserverCallbacks): void {
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      if (callbacks.onCLS) {
        onCLS(callbacks.onCLS);
      }
      if (callbacks.onINP) {
        onINP(callbacks.onINP);
      }
      if (callbacks.onLCP) {
        onLCP(callbacks.onLCP);
      }
      if (callbacks.onFCP) {
        onFCP(callbacks.onFCP);
      }
      if (callbacks.onTTFB) {
        onTTFB(callbacks.onTTFB);
      }
    });
  }

  // Log FPS (Frames Per Second) data
  logFPS(): void {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Cap the data array to the last 100 frames
    if (this.fpsData.length >= 100) {
      this.fpsData.shift();
    }

    this.fpsData.push(1000 / delta);

    const avgFPS = this.fpsData.reduce((a, b) => a + b, 0) / this.fpsData.length;

    console.log(`🎮 FPS: ${avgFPS.toFixed(2)}`);
  }
}

// React hook for measuring component performance
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();

  return {
    startRender: () => monitor.startRender(componentName),
    endRender: () => monitor.endRender(componentName),
    getMetrics: () => monitor.getMetrics(componentName),
  };
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memory cleanup utility
export const cleanupMemory = () => {
  // Clear any global references
  if (typeof window !== 'undefined') {
    // Clear any cached data that might be holding references
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('old') || cacheName.includes('temp')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  }
};

// Lazy loading utility with intersection observer
export const createLazyLoader = (threshold = 0.1) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const src = target.dataset.src;
          if (src) {
            target.setAttribute('src', src);
            target.removeAttribute('data-src');
          }
        }
      });
    },
    { threshold }
  );
};

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(async (script) => {
      try {
        const response = await fetch((script as HTMLScriptElement).src, { method: 'HEAD' });
        const size = parseInt(response.headers.get('content-length') || '0');
        totalSize += size;
        
        console.log(`📦 Bundle: ${(script as HTMLScriptElement).src.split('/').pop()} - ${(size / 1024).toFixed(2)}KB`);
      } catch (error) {
        console.warn('Could not analyze bundle size:', error);
      }
    });
    
    setTimeout(() => {
      console.log(`📦 Total estimated bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    }, 1000);
  }
};

// React component wrapper for performance monitoring
export const withPerformanceMonitor = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  const MemoizedComponent = React.memo((props: P) => {
    const monitor = usePerformanceMonitor(componentName);
    
    React.useEffect(() => {
      monitor.startRender();
      return () => {
        monitor.endRender();
      };
    });

    return React.createElement(WrappedComponent, props);
  });

  MemoizedComponent.displayName = `withPerformanceMonitor(${componentName})`;
  
  return MemoizedComponent;
};

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
