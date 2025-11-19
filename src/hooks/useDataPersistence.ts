import { useState, useEffect, useCallback } from 'react';

// Helper functions
const generateChecksum = (data: string): string => {
  // Simple checksum implementation (in production, use a proper hashing algorithm)
  let checksum = 0;
  for (let i = 0; i < data.length; i++) {
    checksum = (checksum << 5) - checksum + data.charCodeAt(i);
    checksum |= 0; // Convert to 32bit integer
  }
  return checksum.toString(16);
};

const compressData = (data: string): string => {
  // In a real implementation, you would use a compression library like pako
  // For now, we'll just return the data as-is
  return data;
};

const decompressData = (data: string): string => {
  // In a real implementation, you would use a decompression library
  // For now, we'll just return the data as-is
  return data;
};

const encryptData = (data: string, key: string): string => {
  // Simple XOR encryption for demonstration (in production, use proper encryption)
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
};

const decryptData = (data: string, key: string): string => {
  // Simple XOR decryption for demonstration (in production, use proper decryption)
  const decoded = atob(data); // Base64 decode
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};

interface PersistenceOptions {
  storageKey: string;
  ttl?: number; // Time to live in milliseconds
  storageType?: 'localStorage' | 'sessionStorage' | 'indexedDB';
  enableCompression?: boolean;
  enableEncryption?: boolean;
  encryptionKey?: string;
  syncWithServer?: boolean;
  syncEndpoint?: string;
  syncInterval?: number; // in milliseconds
}

interface PersistentData<T> {
  data: T;
  timestamp: number;
  version: number;
  checksum: string;
  compressed?: boolean;
  encrypted?: boolean;
}

export const useDataPersistence = <T>(
  initialValue: T,
  options: PersistenceOptions
) => {
  const { 
    storageKey, 
    ttl = 0, 
    storageType = 'localStorage',
    enableCompression = false,
    enableEncryption = false,
    encryptionKey = '',
    syncWithServer = false,
    syncEndpoint = '',

  } = options;
  
  const [data, setData] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);
  const [version, setVersion] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(false);
  
  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        let storedData: string | null = null;
        
        if (storageType === 'localStorage') {
          storedData = localStorage.getItem(storageKey);
        } else if (storageType === 'sessionStorage') {
          storedData = sessionStorage.getItem(storageKey);
        } else if (storageType === 'indexedDB') {
          storedData = await loadFromIndexedDB(storageKey);
        }
        
        if (storedData) {
          let parsed: PersistentData<T> = JSON.parse(storedData);
          
          // Decrypt data if it was encrypted
          if (parsed.encrypted && enableEncryption && encryptionKey) {
            const decryptedData = decryptData(JSON.stringify(parsed.data), encryptionKey);
            parsed = {
              ...parsed,
              data: JSON.parse(decryptedData) as T,
              encrypted: false
            };
          }
          
          // Decompress data if it was compressed
          if (parsed.compressed && enableCompression) {
            const decompressedData = decompressData(JSON.stringify(parsed.data));
            parsed = {
              ...parsed,
              data: JSON.parse(decompressedData) as T,
              compressed: false
            };
          }
          
          // Verify checksum
          const dataString = JSON.stringify(parsed.data);
          const calculatedChecksum = generateChecksum(dataString);
          if (calculatedChecksum !== parsed.checksum) {
            console.warn('Data integrity check failed');
            // In a real app, you might want to handle this differently
          }
          
          // Check if data has expired
          if (ttl === 0 || (Date.now() - parsed.timestamp) < ttl) {
            setData(parsed.data);
            setVersion(parsed.version);
          } else {
            // Data expired, remove it
            removeData();
          }
        }
      } catch (error) {
        console.error('Failed to load data from storage:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadData();
  }, [storageKey, ttl, storageType, enableCompression, enableEncryption, encryptionKey]);
  
  // Save data to storage when it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveData = async () => {
      try {
        // Generate checksum for data integrity
        const dataString = JSON.stringify(data);
        const checksum = generateChecksum(dataString);
        
        let processedData = dataString;
        let isCompressed = false;
        let isEncrypted = false;
        
        // Compress data if enabled
        if (enableCompression) {
          processedData = compressData(processedData);
          isCompressed = true;
        }
        
        // Encrypt data if enabled
        if (enableEncryption && encryptionKey) {
          processedData = encryptData(processedData, encryptionKey);
          isEncrypted = true;
        }
        
        const persistentData: PersistentData<T> = {
          data: JSON.parse(processedData) as T,
          timestamp: Date.now(),
          version: version + 1,
          checksum,
          compressed: isCompressed,
          encrypted: isEncrypted
        };
        
        const serialized = JSON.stringify(persistentData);
        
        if (storageType === 'localStorage') {
          localStorage.setItem(storageKey, serialized);
        } else if (storageType === 'sessionStorage') {
          sessionStorage.setItem(storageKey, serialized);
        } else if (storageType === 'indexedDB') {
          await saveToIndexedDB(storageKey, serialized);
        }
        
        setVersion(prev => prev + 1);
        
        // Mark as pending sync if we're offline and sync is enabled
        if (syncWithServer && !isOnline) {
          setPendingSync(true);
        }
        
        // Sync with server if online and sync is enabled
        if (syncWithServer && isOnline) {
          await sync();
        }
      } catch (error) {
        console.error('Failed to save data to storage:', error);
      }
    };
    
    saveData();
  }, [data, storageKey, storageType, isInitialized, version, isOnline, syncWithServer]);
  
  // Update data
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setData(prev => {
      if (typeof newData === 'function') {
        return (newData as (prev: T) => T)(prev);
      }
      return newData;
    });
  }, []);
  
  // Remove data from storage
  const removeData = useCallback(async () => {
    try {
      if (storageType === 'localStorage') {
        localStorage.removeItem(storageKey);
      } else if (storageType === 'sessionStorage') {
        sessionStorage.removeItem(storageKey);
      } else if (storageType === 'indexedDB') {
        await removeFromIndexedDB(storageKey);
      }
      
      setData(initialValue);
      setVersion(0);
    } catch (error) {
      console.error('Failed to remove data from storage:', error);
    }
  }, [storageKey, storageType, initialValue]);
  
  // Clear all data from storage
  const clearAll = useCallback(async () => {
    try {
      if (storageType === 'localStorage') {
        localStorage.clear();
      } else if (storageType === 'sessionStorage') {
        sessionStorage.clear();
      } else if (storageType === 'indexedDB') {
        await clearIndexedDB();
      }
      
      setData(initialValue);
      setVersion(0);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }, [storageType, initialValue]);
  
  // Get data age
  const getDataAge = useCallback(() => {
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      try {
        const parsed: PersistentData<T> = JSON.parse(storedData);
        return Date.now() - parsed.timestamp;
      } catch (error) {
        return null;
      }
    }
    return null;
  }, [storageKey]);
  
  // Sync with server
  const sync = useCallback(async () => {
    if (!syncWithServer || !syncEndpoint) return;
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      // In a real implementation, you would send the data to your server
      // For now, we'll just simulate a sync operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSync(Date.now());
      setPendingSync(false);
      
      // In a real implementation, you would handle the server response
      // and potentially update local data based on server data
    } catch (error) {
      console.error('Failed to sync with server:', error);
      setSyncError('Failed to sync with server');
      
      // Mark as pending sync for retry when online
      if (!isOnline) {
        setPendingSync(true);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [syncWithServer, syncEndpoint, isOnline]);
  
  // Retry pending sync when coming online
  useEffect(() => {
    if (isOnline && pendingSync && syncWithServer) {
      sync();
    }
  }, [isOnline, pendingSync, syncWithServer, sync]);
  
  return {
    data,
    isInitialized,
    version,
    isOnline,
    isSyncing,
    lastSync,
    syncError,
    pendingSync,
    updateData,
    removeData,
    clearAll,
    getDataAge,
    sync
  };
};

// IndexedDB helper functions
const DB_NAME = 'ArtfulAgendaDB';
const DB_VERSION = 1;
const STORE_NAME = 'persistentData';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as any).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

const saveToIndexedDB = async (key: string, data: string): Promise<void> => {
  if (!('indexedDB' in window)) return;
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.put({ key, data });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error);
  }
};

const loadFromIndexedDB = async (key: string): Promise<string | null> => {
  if (!('indexedDB' in window)) return null;
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load from IndexedDB:', error);
    return null;
  }
};

const removeFromIndexedDB = async (key: string): Promise<void> => {
  if (!('indexedDB' in window)) return;
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.delete(key);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to remove from IndexedDB:', error);
  }
};

const clearIndexedDB = async (): Promise<void> => {
  if (!('indexedDB' in window)) return;
  
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.clear();
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
  }
};