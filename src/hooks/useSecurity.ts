import { useState, useEffect, useCallback } from 'react';

interface SecurityState {
  isAuthenticated: boolean;
  isBiometricAvailable: boolean;
  isTwoFactorEnabled: boolean;
  failedAttempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
  securityLevel: 'low' | 'medium' | 'high' | 'maximum';
  lastActivity: number;
  isIdle: boolean;
  encryptionKey: string | null;
}

interface SecurityOptions {
  maxFailedAttempts?: number;
  lockoutDuration?: number; // in milliseconds
  idleTimeout?: number; // in milliseconds
  requireBiometric?: boolean;
  enableEncryption?: boolean;
}

export const useSecurity = (options: SecurityOptions = {}) => {
  const {
    maxFailedAttempts = 3,
    lockoutDuration = 300000, // 5 minutes
    idleTimeout = 900000, // 15 minutes
    requireBiometric = false,
    enableEncryption = false
  } = options;

  const [state, setState] = useState<SecurityState>({
    isAuthenticated: false,
    isBiometricAvailable: false,
    isTwoFactorEnabled: false,
    failedAttempts: 0,
    isLocked: false,
    lockoutEndTime: null,
    securityLevel: 'medium',
    lastActivity: Date.now(),
    isIdle: false,
    encryptionKey: null
  });

  // Check biometric availability
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        // Check for WebAuthn support
        const available = !!(window.PublicKeyCredential);
        setState(prev => ({ 
          ...prev, 
          isBiometricAvailable: available,
          securityLevel: requireBiometric && available ? 'high' : 'medium'
        }));
      } catch (error) {
        console.warn('Biometric authentication not available:', error);
      }
    };

    checkBiometricAvailability();
  }, [requireBiometric]);

  // Check lockout status
  useEffect(() => {
    if (state.lockoutEndTime && Date.now() < state.lockoutEndTime) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLocked: false,
          lockoutEndTime: null,
          failedAttempts: 0
        }));
      }, state.lockoutEndTime - Date.now());

      return () => clearTimeout(timer);
    }
  }, [state.lockoutEndTime]);

  // Idle detection
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      setState(prev => ({ ...prev, lastActivity: Date.now(), isIdle: false }));
      
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setState(prev => ({ ...prev, isIdle: true }));
      }, idleTimeout);
    };

    // Set up event listeners for user activity
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);

    // Initialize timer
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keypress', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
    };
  }, [idleTimeout]);

  // Generate encryption key
  const generateEncryptionKey = useCallback(async (): Promise<string> => {
    if (!enableEncryption) return '';
    
    try {
      // Generate a random key for encryption
      const keyArray = new Uint8Array(32);
      crypto.getRandomValues(keyArray);
      return Array.from(keyArray).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      return '';
    }
  }, [enableEncryption]);

  // Initialize encryption
  useEffect(() => {
    if (enableEncryption && !state.encryptionKey) {
      generateEncryptionKey().then(key => {
        setState(prev => ({ ...prev, encryptionKey: key }));
      });
    }
  }, [enableEncryption, state.encryptionKey, generateEncryptionKey]);

  // Encrypt data
  const encryptData = useCallback((data: string): string => {
    if (!enableEncryption || !state.encryptionKey) return data;
    
    try {
      // Simple XOR encryption for demonstration (in production, use proper encryption)
      const key = state.encryptionKey;
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(result); // Base64 encode
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }, [enableEncryption, state.encryptionKey]);

  // Decrypt data
  const decryptData = useCallback((encryptedData: string): string => {
    if (!enableEncryption || !state.encryptionKey) return encryptedData;
    
    try {
      // Simple XOR decryption for demonstration (in production, use proper decryption)
      const data = atob(encryptedData); // Base64 decode
      const key = state.encryptionKey;
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }, [enableEncryption, state.encryptionKey]);

  // Authenticate user
  const authenticate = useCallback(async (credentials: { username: string; password: string }): Promise<boolean> => {
    // Check if account is locked
    if (state.isLocked) {
      throw new Error('Account is locked. Please try again later.');
    }

    try {
      // In a real implementation, this would call an authentication API
      // For demonstration, we'll simulate authentication
      const isAuthenticated = credentials.username === 'user' && credentials.password === 'password';
      
      if (isAuthenticated) {
        // Reset failed attempts on successful login
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          failedAttempts: 0,
          isLocked: false,
          lockoutEndTime: null
        }));
        return true;
      } else {
        // Increment failed attempts
        const newFailedAttempts = state.failedAttempts + 1;
        const isLocked = newFailedAttempts >= maxFailedAttempts;
        
        setState(prev => ({
          ...prev,
          failedAttempts: newFailedAttempts,
          isLocked,
          lockoutEndTime: isLocked ? Date.now() + lockoutDuration : null
        }));
        
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      throw error;
    }
  }, [state.isLocked, state.failedAttempts, maxFailedAttempts, lockoutDuration]);

  // Biometric authentication
  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!state.isBiometricAvailable) {
      throw new Error('Biometric authentication not available');
    }

    try {
      // In a real implementation, this would use WebAuthn API
      // For demonstration, we'll simulate biometric authentication
      const isAuthenticated = Math.random() > 0.2; // 80% success rate for demo
      
      if (isAuthenticated) {
        setState(prev => ({ ...prev, isAuthenticated: true }));
        return true;
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      throw error;
    }
  }, [state.isBiometricAvailable]);

  // Two-factor authentication
  const enableTwoFactor = useCallback(async (phoneNumber: string): Promise<boolean> => {
    try {
      // In a real implementation, this would send a code to the phone number
      // For demonstration, we'll simulate 2FA setup
      console.debug('Setting up 2FA for phone:', phoneNumber);
      setState(prev => ({ ...prev, isTwoFactorEnabled: true }));
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  // Verify two-factor code
  const verifyTwoFactorCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      // In a real implementation, this would verify the code with the server
      // For demonstration, we'll simulate code verification
      const isValid = code === '123456'; // Demo code
      
      if (isValid) {
        return true;
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      failedAttempts: 0,
      isLocked: false,
      lockoutEndTime: null
    }));
  }, []);

  // Change password
  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // In a real implementation, this would call a password change API
      // For demonstration, we'll simulate password change
      console.debug('Changing password, new length:', newPassword.length);
      if (oldPassword === 'password') {
        // Password changed successfully
        return true;
      } else {
        throw new Error('Current password is incorrect');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  // Set security level
  const setSecurityLevel = useCallback((level: SecurityState['securityLevel']) => {
    setState(prev => ({ ...prev, securityLevel: level }));
  }, []);

  // Check if user is authorized for a specific action
  const isAuthorized = useCallback((requiredLevel: SecurityState['securityLevel']): boolean => {
    const levelOrder: Record<SecurityState['securityLevel'], number> = {
      low: 1,
      medium: 2,
      high: 3,
      maximum: 4
    };
    
    return levelOrder[state.securityLevel] >= levelOrder[requiredLevel];
  }, [state.securityLevel]);

  return {
    ...state,
    authenticate,
    authenticateWithBiometric,
    enableTwoFactor,
    verifyTwoFactorCode,
    logout,
    changePassword,
    setSecurityLevel,
    isAuthorized,
    encryptData,
    decryptData
  };
};

export default useSecurity;