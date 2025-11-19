/**
 * API Gateway Service
 * Central hub for connecting to third-party services
 */

export interface APIService {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  authType: 'oauth' | 'apikey' | 'basic' | 'none';
  enabled: boolean;
  connected: boolean;
}

export interface APIEndpoint {
  id: string;
  serviceId: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
}

export class APIGateway {
  private static instance: APIGateway;
  private services: Map<string, APIService> = new Map();
  private endpoints: Map<string, APIEndpoint> = new Map();
  private apiKeys: Map<string, string> = new Map();

  private constructor() {
    this.initializeDefaultServices();
  }

  static getInstance(): APIGateway {
    if (!APIGateway.instance) {
      APIGateway.instance = new APIGateway();
    }
    return APIGateway.instance;
  }

  /**
   * Initialize default third-party services
   */
  private initializeDefaultServices(): void {
    // Google Calendar API
    this.registerService({
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync events with Google Calendar',
      baseUrl: 'https://www.googleapis.com/calendar/v3',
      authType: 'oauth',
      enabled: false,
      connected: false
    });

    // Microsoft Outlook API
    this.registerService({
      id: 'outlook-calendar',
      name: 'Outlook Calendar',
      description: 'Sync events with Outlook Calendar',
      baseUrl: 'https://graph.microsoft.com/v1.0/me',
      authType: 'oauth',
      enabled: false,
      connected: false
    });

    // Slack API
    this.registerService({
      id: 'slack',
      name: 'Slack',
      description: 'Send notifications to Slack channels',
      baseUrl: 'https://slack.com/api',
      authType: 'oauth',
      enabled: false,
      connected: false
    });

    // Zoom API
    this.registerService({
      id: 'zoom',
      name: 'Zoom',
      description: 'Create and manage Zoom meetings',
      baseUrl: 'https://api.zoom.us/v2',
      authType: 'oauth',
      enabled: false,
      connected: false
    });

    // Trello API
    this.registerService({
      id: 'trello',
      name: 'Trello',
      description: 'Sync tasks with Trello boards',
      baseUrl: 'https://api.trello.com/1',
      authType: 'oauth',
      enabled: false,
      connected: false
    });
  }

  /**
   * Register a new API service
   */
  registerService(service: APIService): void {
    this.services.set(service.id, service);
    console.log(`API service registered: ${service.name} (${service.id})`);
  }

  /**
   * Unregister an API service
   */
  unregisterService(serviceId: string): boolean {
    const result = this.services.delete(serviceId);
    if (result) {
      console.log(`API service unregistered: ${serviceId}`);
    }
    return result;
  }

  /**
   * Enable an API service
   */
  enableService(serviceId: string): boolean {
    const service = this.services.get(serviceId);
    if (!service) {
      console.warn(`API service not found: ${serviceId}`);
      return false;
    }

    service.enabled = true;
    console.log(`API service enabled: ${service.name}`);
    return true;
  }

  /**
   * Disable an API service
   */
  disableService(serviceId: string): boolean {
    const service = this.services.get(serviceId);
    if (!service) {
      console.warn(`API service not found: ${serviceId}`);
      return false;
    }

    service.enabled = false;
    console.log(`API service disabled: ${service.name}`);
    return true;
  }

  /**
   * Connect to an API service
   */
  async connectService(serviceId: string, credentials: any): Promise<boolean> {
    console.log(`Connecting to service ${serviceId} with provided credentials`);
    
    const service = this.services.get(serviceId);
    if (!service) {
      console.warn(`API service not found: ${serviceId}`);
      return false;
    }

    // Validate credentials
    if (!credentials) {
      console.error('No credentials provided for service connection');
      return false;
    }

    if (!service.enabled) {
      console.warn(`API service is not enabled: ${service.name}`);
      return false;
    }

    try {
      // In a real application, this would authenticate with the service
      // For demo purposes, we'll simulate a successful connection
      console.log(`Connecting to ${service.name}...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      service.connected = true;
      console.log(`Successfully connected to ${service.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to connect to ${service.name}:`, error);
      service.connected = false;
      return false;
    }
  }

  /**
   * Disconnect from an API service
   */
  disconnectService(serviceId: string): boolean {
    const service = this.services.get(serviceId);
    if (!service) {
      console.warn(`API service not found: ${serviceId}`);
      return false;
    }

    service.connected = false;
    console.log(`Disconnected from ${service.name}`);
    return true;
  }

  /**
   * Register an API endpoint
   */
  registerEndpoint(endpoint: APIEndpoint): void {
    this.endpoints.set(endpoint.id, endpoint);
    console.log(`API endpoint registered: ${endpoint.name} (${endpoint.id})`);
  }

  /**
   * Get all registered services
   */
  getServices(): APIService[] {
    return Array.from(this.services.values());
  }

  /**
   * Get a specific service by ID
   */
  getService(serviceId: string): APIService | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Get all endpoints for a service
   */
  getServiceEndpoints(serviceId: string): APIEndpoint[] {
    return Array.from(this.endpoints.values()).filter(
      endpoint => endpoint.serviceId === serviceId
    );
  }

  /**
   * Make an API request
   */
  async makeRequest(
    serviceId: string,
    endpointId: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const service = this.services.get(serviceId);
    const endpoint = this.endpoints.get(endpointId);

    if (!service) {
      throw new Error(`API service not found: ${serviceId}`);
    }

    if (!endpoint) {
      throw new Error(`API endpoint not found: ${endpointId}`);
    }

    if (!service.enabled) {
      throw new Error(`API service is not enabled: ${service.name}`);
    }

    if (!service.connected) {
      throw new Error(`API service is not connected: ${service.name}`);
    }

    try {
      // Construct the full URL
      const url = `${service.baseUrl}${endpoint.path}`;
      
      // Prepare request options
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      // Add authentication headers if needed
      if (service.authType === 'apikey') {
        const apiKey = this.apiKeys.get(serviceId);
        if (apiKey) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${apiKey}`
          };
        }
      }

      // Add request body for POST, PUT, PATCH requests
      if (data && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        options.body = JSON.stringify(data);
      }

      // In a real application, this would make the actual HTTP request
      // For demo purposes, we'll simulate a response
      console.log(`Making ${endpoint.method} request to ${url}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      // Return mock response
      return {
        success: true,
        data: {
          message: `Successfully executed ${endpoint.name}`,
          service: service.name,
          endpoint: endpoint.name,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`API request failed:`, error);
      throw new Error(`API request failed: ${error}`);
    }
  }

  /**
   * Set API key for a service
   */
  setApiKey(serviceId: string, apiKey: string): void {
    this.apiKeys.set(serviceId, apiKey);
    console.log(`API key set for service: ${serviceId}`);
  }

  /**
   * Get service connection status
   */
  getServiceStatus(serviceId: string): { enabled: boolean; connected: boolean } {
    const service = this.services.get(serviceId);
    if (!service) {
      return { enabled: false, connected: false };
    }
    return { enabled: service.enabled, connected: service.connected };
  }

  /**
   * Get statistics about API usage
   */
  getStats(): {
    totalServices: number;
    enabledServices: number;
    connectedServices: number;
    totalEndpoints: number;
  } {
    const services = this.getServices();
    const enabled = services.filter(service => service.enabled).length;
    const connected = services.filter(service => service.connected).length;
    
    return {
      totalServices: services.length,
      enabledServices: enabled,
      connectedServices: connected,
      totalEndpoints: this.endpoints.size
    };
  }
}

// Export a singleton instance
export const apiGateway = APIGateway.getInstance();