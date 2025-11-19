import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveConnectionType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface OnlineStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
  networkStatus: NetworkStatus;
  connectionAttempts: number;
  maxRetries: number;
  retryDelay: number;
}

export const useOnlineStatus = (maxRetries: number = 3, retryDelay: number = 5000) => {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    lastOffline: navigator.onLine ? null : new Date(),
    networkStatus: {
      isOnline: navigator.onLine,
      connectionType: 'unknown',
      effectiveConnectionType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    },
    connectionAttempts: 0,
    maxRetries,
    retryDelay
  });
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckRef = useRef<AbortController | null>(null);

  // Get network information
  const getNetworkInfo = useCallback((): NetworkStatus => {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveConnectionType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    };
  }, []);

  // Check actual connectivity by pinging a reliable endpoint
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    // Cancel any previous connectivity check
    if (connectionCheckRef.current) {
      connectionCheckRef.current.abort();
    }

    connectionCheckRef.current = new AbortController();


    try {
      // Try to fetch a small resource to verify connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);      return response.ok;
    } catch (error) {
      // If it's an abort error, rethrow it
      if ((error as any).name === 'AbortError') {
        throw error;
      }
      // Any other error indicates connectivity issues
      return false;
    }
  }, []);

  // Update status with network information
  const updateStatus = useCallback((isOnline: boolean) => {
    const networkStatus = getNetworkInfo();
    
    setStatus(prev => ({
      ...prev,
      isOnline,
      isConnecting: false,
      lastOnline: isOnline ? new Date() : prev.lastOnline,
      lastOffline: isOnline ? prev.lastOffline : new Date(),
      networkStatus: {
        ...networkStatus,
        isOnline
      },
      connectionAttempts: isOnline ? 0 : prev.connectionAttempts
    }));

    // Clear any pending retry timeouts when we go online
    if (isOnline && retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [getNetworkInfo]);

  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    if (status.connectionAttempts >= status.maxRetries) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    setStatus(prev => ({
      ...prev,
      isConnecting: true,
      connectionAttempts: prev.connectionAttempts + 1
    }));

    // Set timeout for next retry
    retryTimeoutRef.current = setTimeout(() => {
      checkConnectivity().then(isConnected => {
        if (isConnected) {
          updateStatus(true);
        } else {
          // Schedule next retry
          attemptReconnect();
        }
      }).catch(() => {
        // Schedule next retry even if check failed
        attemptReconnect();
      });
    }, status.retryDelay);
  }, [status.connectionAttempts, status.maxRetries, status.retryDelay, checkConnectivity, updateStatus]);

  // Handle online event
  const handleOnline = useCallback(() => {
    // When browser reports online, check actual connectivity
    checkConnectivity().then(isConnected => {
      updateStatus(isConnected);
      
      // If we can't actually connect, start reconnection attempts
      if (!isConnected) {
        attemptReconnect();
      }
    }).catch(() => {
      // If connectivity check fails, start reconnection attempts
      attemptReconnect();
    });
  }, [checkConnectivity, updateStatus, attemptReconnect]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    updateStatus(false);
    // Start reconnection attempts
    attemptReconnect();
  }, [updateStatus, attemptReconnect]);

  // Initialize and set up event listeners
  useEffect(() => {
    // Set initial status
    updateStatus(navigator.onLine);
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up network change listener if available
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => {
        updateStatus(navigator.onLine);
      });
    }
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (connectionCheckRef.current) {
        connectionCheckRef.current.abort();
      }
    };
  }, [handleOnline, handleOffline, updateStatus]);

  // Manual connectivity check
  const checkConnection = useCallback(async () => {
    const isConnected = await checkConnectivity();
    updateStatus(isConnected);
    return isConnected;
  }, [checkConnectivity, updateStatus]);

  // Reset connection attempts
  const resetConnectionAttempts = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      connectionAttempts: 0
    }));
  }, []);

  // Update retry configuration
  const updateRetryConfig = useCallback((maxRetries?: number, retryDelay?: number) => {
    setStatus(prev => ({
      ...prev,
      maxRetries: maxRetries ?? prev.maxRetries,
      retryDelay: retryDelay ?? prev.retryDelay
    }));
  }, []);

  return {
    ...status,
    checkConnection,
    resetConnectionAttempts,
    updateRetryConfig
  };
};