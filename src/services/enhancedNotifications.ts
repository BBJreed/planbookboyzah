/**
 * Enhanced Notification Service
 * Handles rich notifications with actions and scheduling
 */

export class EnhancedNotificationService {
  private static instance: EnhancedNotificationService;
  private permissionStatus: NotificationPermission = 'default';
  private scheduledNotifications: Map<string, number> = new Map();

  private constructor() {
    // Initialize notification service
    this.initializeNotifications();
  }

  static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService();
    }
    return EnhancedNotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  private async initializeNotifications(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    this.permissionStatus = Notification.permission;
    
    if (this.permissionStatus === 'default') {
      // Request permission
      this.permissionStatus = await Notification.requestPermission();
    }
  }

  /**
   * Show a basic notification
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (this.permissionStatus !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          ...options
        });
      } else {
        // Fallback to standard notification
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          ...options
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show a rich notification with actions
   */
  async showRichNotification(
    title: string,
    body: string,
    actions: Array<{ action: string; title: string; icon?: string }> = [],
    options?: NotificationOptions
  ): Promise<void> {
    const notificationOptions: NotificationOptions = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      requireInteraction: true,
      ...options
    };
    
    // Log actions for future implementation
    if (actions.length > 0) {
      console.log('Notification actions:', actions);
    }

    await this.showNotification(title, notificationOptions);
  }

  /**
   * Schedule a notification for a specific time
   */
  async scheduleNotification(
    id: string,
    title: string,
    body: string,
    timestamp: number,
    options?: NotificationOptions
  ): Promise<void> {
    const now = Date.now();
    const delay = timestamp - now;

    if (delay <= 0) {
      // Show immediately
      await this.showNotification(title, { body, ...options });
      return;
    }

    // Schedule for later
    const timeoutId = window.setTimeout(async () => {
      await this.showNotification(title, { body, ...options });
      this.scheduledNotifications.delete(id);
    }, delay);

    this.scheduledNotifications.set(id, timeoutId);
  }

  /**
   * Cancel a scheduled notification
   */
  cancelScheduledNotification(id: string): void {
    const timeoutId = this.scheduledNotifications.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(id);
    }
  }

  /**
   * Schedule a recurring notification
   */
  scheduleRecurringNotification(
    id: string,
    title: string,
    body: string,
    interval: 'daily' | 'weekly' | 'monthly',
    options?: NotificationOptions
  ): void {
    // Calculate next occurrence
    const now = new Date();
    let nextDate: Date;

    switch (interval) {
      case 'daily':
        nextDate = new Date(now);
        nextDate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextDate = new Date(now);
        nextDate.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextDate = new Date(now);
        nextDate.setMonth(now.getMonth() + 1);
        break;
      default:
        nextDate = new Date(now);
        nextDate.setDate(now.getDate() + 1);
    }

    // Schedule the notification
    this.scheduleNotification(
      id,
      title,
      body,
      nextDate.getTime(),
      options
    );

    // Reschedule for the next occurrence
    const reschedule = () => {
      this.scheduleRecurringNotification(id, title, body, interval, options);
    };

    const timeoutId = window.setTimeout(reschedule, nextDate.getTime() - now.getTime());
    this.scheduledNotifications.set(`${id}_reschedule`, timeoutId);
  }

  /**
   * Check notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.permissionStatus;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported in this browser');
    }

    this.permissionStatus = await Notification.requestPermission();
    return this.permissionStatus;
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(callback: (data: any) => void): void {
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        callback(event.data.data);
      }
    });
  }

  /**
   * Send a message to service worker to show notification
   */
  async sendMessageToServiceWorker(type: string, data: any): Promise<void> {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration && registration.active) {
      registration.active.postMessage({ type, data });
    }
  }
}

// Export a singleton instance
export const enhancedNotificationService = EnhancedNotificationService.getInstance();