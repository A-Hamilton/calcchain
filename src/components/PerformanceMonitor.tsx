import React, { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  ttfb: number | null;
  fps: number | null;
  memoryUsage: number | null;
}

/**
 * A component that monitors performance metrics in production
 * This is only rendered in production and only for a sample of users
 */
const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    ttfb: null,
    fps: null,
    memoryUsage: null
  });
  const monitoringActive = useRef(false);
  
  useEffect(() => {
    // Only monitor performance for a small percentage of users
    const shouldMonitor = Math.random() < 0.1; // 10% of users
    
    if (import.meta.env.PROD && shouldMonitor && !monitoringActive.current) {
      monitoringActive.current = true;
      let cleanupFunctions: Array<() => void> = [];
      
      // These are manual implementations for performance monitoring
      if ('PerformanceObserver' in window) {
        try {
          // Track FCP - First Contentful Paint
          const fcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              setMetrics(prev => ({ 
                ...prev, 
                fcp: entries[0].startTime 
              }));
            }
          });
          
          try {
            fcpObserver.observe({ type: 'paint', buffered: true });
            cleanupFunctions.push(() => fcpObserver.disconnect());
          } catch (e) {
            console.error('Failed to observe FCP:', e);
          }
          
          // Track LCP - Largest Contentful Paint
          const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              const lastEntry = entries[entries.length - 1];
              setMetrics(prev => ({ 
                ...prev, 
                lcp: lastEntry.startTime 
              }));
            }
          });
          
          try {
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            cleanupFunctions.push(() => lcpObserver.disconnect());
          } catch (e) {
            console.error('Failed to observe LCP:', e);
          }
          
          // Track CLS - Cumulative Layout Shift
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            for (const entry of entries) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
                setMetrics(prev => ({ 
                  ...prev, 
                  cls: clsValue 
                }));
              }
            }
          });
          
          try {
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            cleanupFunctions.push(() => clsObserver.disconnect());
          } catch (e) {
            console.error('Failed to observe CLS:', e);
          }
          
          // Track TTFB - Time to First Byte
          const navigationObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            for (const entry of entries) {
              if (entry.entryType === 'navigation') {
                setMetrics(prev => ({ 
                  ...prev, 
                  ttfb: (entry as any).responseStart 
                }));
              }
            }
          });
          
          try {
            navigationObserver.observe({ type: 'navigation', buffered: true });
            cleanupFunctions.push(() => navigationObserver.disconnect());
          } catch (e) {
            console.error('Failed to observe TTFB:', e);
          }
          
          // Track FPS - Frames Per Second
          let frameCount = 0;
          let lastTime = performance.now();
          let fps = 0;
          let frameId: number;
          
          const measureFPS = () => {
            const now = performance.now();
            const elapsed = now - lastTime;
            
            if (elapsed >= 1000) { // Update every second
              fps = (frameCount * 1000) / elapsed;
              frameCount = 0;
              lastTime = now;
              
              setMetrics(prev => ({ 
                ...prev, 
                fps
              }));
            }
            
            frameCount++;
            frameId = requestAnimationFrame(measureFPS);
          };
          
          frameId = requestAnimationFrame(measureFPS);
          cleanupFunctions.push(() => cancelAnimationFrame(frameId));
          
          // Memory Usage
          const memoryInterval = setInterval(() => {
            if ('memory' in performance) {
              const memoryInfo = (performance as any).memory;
              if (memoryInfo) {
                setMetrics(prev => ({ 
                  ...prev, 
                  memoryUsage: memoryInfo.usedJSHeapSize / (1024 * 1024) // Convert to MB
                }));
              }
            }
          }, 10000); // Check every 10 seconds
          
          cleanupFunctions.push(() => clearInterval(memoryInterval));
            // Send metrics to analytics when user is about to leave
          const sendMetricsOnExit = () => {
            if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
              const analyticsData = new Blob([JSON.stringify({
                metrics,
                url: window.location.href,
                timestamp: Date.now(),
                userAgent: navigator.userAgent
              })], { type: 'application/json' });
              
              // Replace with actual analytics endpoint when available
              // navigator.sendBeacon('/api/performance-metrics', analyticsData);
              
              // For now, just log to console
              console.info('📊 Performance metrics collected:', metrics);
            }
          };
          
          window.addEventListener('beforeunload', sendMetricsOnExit);
          cleanupFunctions.push(() => window.removeEventListener('beforeunload', sendMetricsOnExit));
          
        } catch (error) {
          console.error('Performance monitoring error:', error);
        }
      }
      
      // Return cleanup function
      return () => {
        cleanupFunctions.forEach(fn => fn());
      };
    }
    
    return undefined;
  }, []); // Removed metrics dependency to avoid infinite loop
  
  // This component doesn't render anything visible
  return null;
};

export default React.memo(PerformanceMonitor);
PerformanceMonitor.displayName = 'PerformanceMonitor';
