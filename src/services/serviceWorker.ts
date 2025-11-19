/**
 * Service Worker Registration and Management
 * Enables offline functionality and push notifications
 */

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = 'serviceWorker' in navigator;

  private constructor() {
    this.initialize();
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * Initialize service worker
   */
  private async initialize(): Promise<void> {
    if (!this.isSupported) {
      console.warn('Service workers are not supported in this browser');
      return;
    }

    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered successfully');
      
      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              this.notifyUpdateAvailable();
            }
          });
        }
      });
      
      // Request notification permission
      await this.requestNotificationPermission();
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  /**
   * Request notification permission
   */
  private async requestNotificationPermission(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  /**
   * Show a notification
   */
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    // Try using the Service Worker Notification API first
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options
      });
      return;
    }

    // Fallback to regular Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  /**
   * Schedule a notification
   */
  scheduleNotification(
    title: string, 
    options: NotificationOptions, 
    timestamp: number
  ): void {
    // Store notification in IndexedDB for offline support
    this.storeScheduledNotification(title, options, timestamp);
    
    // Set up timer for when online
    const delay = timestamp - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.showNotification(title, options);
      }, delay);
    }
  }

  /**
   * Store scheduled notification in IndexedDB
   */
  private async storeScheduledNotification(
    title: string, 
    options: NotificationOptions, 
    timestamp: number
  ): Promise<void> {
    if (!('indexedDB' in window)) return;

    try {
      const db = await this.openNotificationsDB();
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      
      store.add({
        id: Date.now().toString(),
        title,
        options,
        timestamp
      });
      
      // Wait for transaction to complete
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to store scheduled notification:', error);
    }
  }

  /**
   * Open IndexedDB for notifications
   */
  private openNotificationsDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ArtfulAgendaNotifications', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('notifications')) {
          const store = db.createObjectStore('notifications', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(): Promise<any[]> {
    if (!('indexedDB' in window)) return [];

    try {
      const db = await this.openNotificationsDB();
      const transaction = db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(id: string): Promise<void> {
    if (!('indexedDB' in window)) return;

    try {
      const db = await this.openNotificationsDB();
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      
      store.delete(id);
      // Wait for transaction to complete
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Notify user about available update
   */
  private notifyUpdateAvailable(): void {
    // In a real app, this would show a notification to the user
    console.log('New version of the app is available. Refresh to update.');
    
    // Dispatch event for UI to handle
    window.dispatchEvent(new CustomEvent('swUpdateAvailable'));
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  /**
   * Get service worker status
   */
  getStatus(): {
    supported: boolean;
    registered: boolean;
    notificationPermission: NotificationPermission;
  } {
    return {
      supported: this.isSupported,
      registered: !!this.registration,
      notificationPermission: ('Notification' in window) ? Notification.permission : 'denied'
    };
  }

  /**
   * Enable offline mode
   */
  enableOfflineMode(): void {
    // This would be handled by the service worker caching strategy
    console.log('Offline mode enabled');
  }

  /**
   * Disable offline mode
   */
  disableOfflineMode(): void {
    console.log('Offline mode disabled');
  }
}

// Export a singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();