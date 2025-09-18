/**
 * Service Worker registration and management utilities
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

// Check if service workers are supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Register service worker with enhanced error handling
export const registerServiceWorker = async (config: ServiceWorkerConfig = {}): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Worker not supported in this browser');
    return;
  }
  if (import.meta.env.DEV) {
    console.log('Service Worker registration skipped in development mode');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('✅ Service Worker registered successfully:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available
              console.log('🔄 New content available, will update on next visit');
              config.onUpdate?.(registration);
            } else {
              // Content is cached for offline use
              console.log('📦 Content cached for offline use');
              config.onSuccess?.(registration);
            }
          }
        });
      }
    });

    // Check for updates immediately
    registration.update();

  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    config.onError?.(error as Error);
  }
};

// Unregister service worker
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    console.log('🗑️ Service Worker unregistered:', result);
    return result;
  } catch (error) {
    console.error('❌ Service Worker unregistration failed:', error);
    return false;
  }
};

// Check for service worker updates
export const checkForUpdates = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('🔍 Checked for Service Worker updates');
  } catch (error) {
    console.error('❌ Failed to check for updates:', error);
  }
};

// Skip waiting and activate new service worker
export const skipWaiting = (): void => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
};

// Listen for service worker messages
export const listenForServiceWorkerMessages = (
  callback: (message: any) => void
): (() => void) => {
  if (!isServiceWorkerSupported()) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    callback(event.data);
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage);
  };
};

// Cache specific URLs using service worker
export const cacheUrls = async (urls: string[]): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const messageChannel = new MessageChannel();
    
    return new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };

      if (registration.active) {
        registration.active.postMessage(
          { type: 'CACHE_URLS', payload: urls },
          [messageChannel.port2]
        );
      } else {
        resolve(false);
      }
    });
  } catch (error) {
    console.error('❌ Failed to cache URLs:', error);
    return false;
  }
};

// Get cache size information
export const getCacheInfo = async (): Promise<{
  caches: string[];
  totalSize: number;
} | null> => {
  if (!('caches' in window)) {
    return null;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return {
      caches: cacheNames,
      totalSize,
    };
  } catch (error) {
    console.error('❌ Failed to get cache info:', error);
    return null;
  }
};

// Clear all caches
export const clearAllCaches = async (): Promise<boolean> => {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    console.log('🧹 All caches cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
    return false;
  }
};

// Service worker update notification component
export const createUpdateNotification = (onUpdate: () => void) => {
  // Safety check for DOM availability
  if (typeof document === 'undefined') {
    console.warn('DOM not available for creating update notification');
    return null;
  }

  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1976d2;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 300px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  notification.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: 500;">
      🔄 App Update Available
    </div>
    <div style="margin-bottom: 12px; opacity: 0.9;">
      A new version of the app is available. Refresh to get the latest features and improvements.
    </div>
    <button id="update-btn" style="
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
      font-size: 12px;
    ">Update Now</button>
    <button id="dismiss-btn" style="
      background: transparent;
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    ">Later</button>
  `;

  // Safely append to document
  try {
    document.body.appendChild(notification);
  } catch (error) {
    console.error('Failed to append notification to document:', error);
    return null;
  }

  // Animate in
  const animateIn = setTimeout(() => {
    if (notification.parentNode) {
      notification.style.transform = 'translateX(0)';
    }
  }, 100);

  // Cleanup function for removing notification
  const removeNotification = () => {
    clearTimeout(animateIn);
    if (notification.parentNode) {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  };

  // Event listeners
  const updateBtn = notification.querySelector('#update-btn');
  const dismissBtn = notification.querySelector('#dismiss-btn');

  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      try {
        skipWaiting();
        onUpdate();
        removeNotification();
      } catch (error) {
        console.error('Error handling update:', error);
        removeNotification();
      }
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', removeNotification);
  }

  return notification;
};
