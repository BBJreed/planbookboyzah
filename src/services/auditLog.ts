/**
 * Audit Log Service
 * Tracks user actions for security monitoring
 */

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: any;
}

export class AuditLog {
  private static instance: AuditLog;
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    // Load existing logs
    this.loadLogs();
  }

  static getInstance(): AuditLog {
    if (!AuditLog.instance) {
      AuditLog.instance = new AuditLog();
    }
    return AuditLog.instance;
  }

  /**
   * Log an action
   */
  logAction(
    userId: string,
    action: string,
    resource: string,
    success: boolean = true,
    details?: any
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      userId,
      action,
      resource,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      success,
      details
    };

    // Add to logs
    this.logs.unshift(entry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Save logs
    this.saveLogs();

    // Log to console for debugging
    console.log(`Audit Log: ${action} ${resource} by user ${userId} - ${success ? 'SUCCESS' : 'FAILURE'}`);
  }

  /**
   * Get logs with filtering options
   */
  getLogs(options?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditLogEntry[] {
    let filteredLogs = [...this.logs];

    if (options?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === options.userId);
    }

    if (options?.action) {
      filteredLogs = filteredLogs.filter(log => log.action === options.action);
    }

    if (options?.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === options.resource);
    }

    if (options?.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= options.endDate!);
    }

    if (options?.limit) {
      filteredLogs = filteredLogs.slice(0, options.limit);
    }

    return filteredLogs;
  }

  /**
   * Get failed login attempts
   */
  getFailedLoginAttempts(userId?: string, hours: number = 24): AuditLogEntry[] {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.getLogs({
      action: 'login',
      userId,
      startDate: since
    }).filter(log => !log.success);
  }

  /**
   * Get security events
   */
  getSecurityEvents(hours: number = 24): AuditLogEntry[] {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const securityActions = [
      'login',
      'logout',
      'password_change',
      '2fa_enable',
      '2fa_disable',
      'permission_change',
      'data_export',
      'data_delete'
    ];
    
    return this.getLogs({
      startDate: since
    }).filter(log => securityActions.includes(log.action));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get client IP address
   */
  private getClientIP(): string {
    // In a real application, this would come from server headers
    // For client-side, we'll return a placeholder
    return '127.0.0.1';
  }

  /**
   * Save logs to localStorage
   */
  private saveLogs(): void {
    try {
      const serializableLogs = this.logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }));
      
      localStorage.setItem('auditLogs', JSON.stringify(serializableLogs));
    } catch (error) {
      console.warn('Failed to save audit logs:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadLogs(): void {
    try {
      const logsStr = localStorage.getItem('auditLogs');
      if (logsStr) {
        const parsedLogs = JSON.parse(logsStr);
        this.logs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load audit logs:', error);
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('auditLogs');
  }

  /**
   * Export logs
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV export
      const headers = ['ID', 'User ID', 'Action', 'Resource', 'Timestamp', 'IP Address', 'Success'];
      const csvContent = [
        headers.join(','),
        ...this.logs.map(log => [
          log.id,
          log.userId,
          log.action,
          log.resource,
          log.timestamp.toISOString(),
          log.ipAddress,
          log.success ? 'SUCCESS' : 'FAILURE'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      return csvContent;
    }
  }

  /**
   * Get log statistics
   */
  getStatistics(): {
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    uniqueUsers: number;
    commonActions: { action: string; count: number }[];
  } {
    const successfulActions = this.logs.filter(log => log.success).length;
    const failedActions = this.logs.filter(log => !log.success).length;
    
    const users = new Set(this.logs.map(log => log.userId));
    
    // Count common actions
    const actionCounts: Record<string, number> = {};
    this.logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    
    const commonActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalLogs: this.logs.length,
      successfulActions,
      failedActions,
      uniqueUsers: users.size,
      commonActions
    };
  }

  /**
   * Check for suspicious activity
   */
  checkForSuspiciousActivity(userId?: string): AuditLogEntry[] {

    
    // Look for patterns that might indicate suspicious activity:
    // 1. Multiple failed login attempts
    // 2. Unusual geographic locations (not implemented in this demo)
    // 3. Access to sensitive resources
    // 4. Actions at unusual times
    
    const failedLogins = this.getFailedLoginAttempts(userId, 1);
    
    // If more than 5 failed attempts in an hour, flag as suspicious
    if (failedLogins.length > 5) {
      return failedLogins;
    }
    
    return [];
  }
}

// Export a singleton instance
export const auditLog = AuditLog.getInstance();