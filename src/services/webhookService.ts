/**
 * Webhook Service
 * Real-time data synchronization with external systems
 */

export interface Webhook {
  id: string;
  name: string;
  url: string;
  event: 'calendar:event:created' | 'calendar:event:updated' | 'calendar:event:deleted' | 'task:created' | 'task:completed' | 'sticker:added' | 'sticker:moved';
  enabled: boolean;
  secret?: string;
  lastTriggered?: Date;
  successCount: number;
  errorCount: number;
}

export class WebhookService {
  private static instance: WebhookService;
  private webhooks: Map<string, Webhook> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Register a new webhook
   */
  registerWebhook(webhook: Omit<Webhook, 'id' | 'successCount' | 'errorCount'>): Webhook {
    const newWebhook: Webhook = {
      ...webhook,
      id: `webhook-${Date.now()}`,
      successCount: 0,
      errorCount: 0
    };

    this.webhooks.set(newWebhook.id, newWebhook);
    console.log(`Webhook registered: ${webhook.name} (${newWebhook.id})`);
    return newWebhook;
  }

  /**
   * Unregister a webhook
   */
  unregisterWebhook(webhookId: string): boolean {
    const result = this.webhooks.delete(webhookId);
    if (result) {
      console.log(`Webhook unregistered: ${webhookId}`);
    }
    return result;
  }

  /**
   * Enable a webhook
   */
  enableWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      console.warn(`Webhook not found: ${webhookId}`);
      return false;
    }

    webhook.enabled = true;
    console.log(`Webhook enabled: ${webhook.name}`);
    return true;
  }

  /**
   * Disable a webhook
   */
  disableWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      console.warn(`Webhook not found: ${webhookId}`);
      return false;
    }

    webhook.enabled = false;
    console.log(`Webhook disabled: ${webhook.name}`);
    return true;
  }

  /**
   * Update a webhook
   */
  updateWebhook(webhookId: string, updates: Partial<Webhook>): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      console.warn(`Webhook not found: ${webhookId}`);
      return false;
    }

    Object.assign(webhook, updates);
    console.log(`Webhook updated: ${webhook.name}`);
    return true;
  }

  /**
   * Get all webhooks
   */
  getWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Get a specific webhook by ID
   */
  getWebhook(webhookId: string): Webhook | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * Trigger webhooks for an event
   */
  async triggerEvent(event: string, data: any): Promise<void> {
    console.log(`Triggering event: ${event}`);
    
    // Get all enabled webhooks for this event
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(
      webhook => webhook.enabled && webhook.event === event
    );

    // Trigger each webhook
    for (const webhook of matchingWebhooks) {
      try {
        await this.sendWebhook(webhook, data);
        webhook.successCount++;
        webhook.lastTriggered = new Date();
        console.log(`Webhook triggered successfully: ${webhook.name}`);
      } catch (error) {
        webhook.errorCount++;
        console.error(`Webhook trigger failed: ${webhook.name}`, error);
      }
    }

    // Notify local event listeners
    this.notifyLocalListeners(event, data);
  }

  /**
   * Send webhook request
   */
  private async sendWebhook(webhook: Webhook, data: any): Promise<void> {
    console.log(`Sending webhook to ${webhook.url} with data:`, data);
    // In a real application, this would make an HTTP POST request
    // For demo purposes, we'll simulate the request
    
    console.log(`Sending webhook to ${webhook.url}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate success/failure (90% success rate for demo)
    if (Math.random() > 0.1) {
      console.log(`Webhook sent successfully to ${webhook.url}`);
      return Promise.resolve();
    } else {
      throw new Error('Webhook delivery failed');
    }
  }

  /**
   * Register a local event listener
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(callback);
    console.log(`Local event listener registered for: ${event}`);
  }

  /**
   * Notify local event listeners
   */
  private notifyLocalListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners || listeners.length === 0) return;
    
    console.log(`Notifying ${listeners.length} local listeners for event: ${event}`);
    
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in local event listener:', error);
      }
    });
  }

  /**
   * Get webhook statistics
   */
  getStats(): {
    totalWebhooks: number;
    enabledWebhooks: number;
    totalEvents: number;
    successRate: number;
  } {
    const webhooks = this.getWebhooks();
    const enabled = webhooks.filter(w => w.enabled).length;
    const totalEvents = webhooks.reduce((sum, w) => sum + w.successCount + w.errorCount, 0);
    const successfulEvents = webhooks.reduce((sum, w) => sum + w.successCount, 0);
    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;
    
    return {
      totalWebhooks: webhooks.length,
      enabledWebhooks: enabled,
      totalEvents,
      successRate
    };
  }

  /**
   * Test a webhook
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; message: string }> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { success: false, message: 'Webhook not found' };
    }

    try {
      // Send a test payload
      const testData = {
        event: 'webhook:test',
        timestamp: new Date().toISOString(),
        test: true
      };

      await this.sendWebhook(webhook, testData);
      return { success: true, message: 'Webhook test successful' };
    } catch (error) {
      return { success: false, message: `Webhook test failed: ${error}` };
    }
  }

  /**
   * Get recent webhook activity
   */
  getRecentActivity(limit: number = 10): Array<{ webhookId: string; timestamp: Date; success: boolean }> {
    const activity: Array<{ webhookId: string; timestamp: Date; success: boolean }> = [];
    
    // For demo purposes, we'll generate mock activity
    const webhooks = this.getWebhooks();
    
    for (let i = 0; i < limit; i++) {
      if (webhooks.length === 0) break;
      
      const webhook = webhooks[Math.floor(Math.random() * webhooks.length)];
      if (!webhook.lastTriggered) continue;
      
      activity.push({
        webhookId: webhook.id,
        timestamp: new Date(webhook.lastTriggered.getTime() - Math.random() * 1000 * 60 * 60), // Random time within last hour
        success: Math.random() > 0.2 // 80% success rate
      });
    }
    
    // Sort by timestamp (newest first)
    return activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Export a singleton instance
export const webhookService = WebhookService.getInstance();