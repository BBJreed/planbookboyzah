/**
 * Two-Factor Authentication Service
 * Provides additional security layer for user accounts
 */

export class TwoFactorAuth {
  private static instance: TwoFactorAuth;
  private is2FAEnabled: boolean = false;
  private backupCodes: string[] = [];
  private trustedDevices: string[] = [];

  private constructor() {
    // Load saved 2FA status
    this.load2FAStatus();
  }

  static getInstance(): TwoFactorAuth {
    if (!TwoFactorAuth.instance) {
      TwoFactorAuth.instance = new TwoFactorAuth();
    }
    return TwoFactorAuth.instance;
  }

  /**
   * Enable two-factor authentication
   */
  async enable2FA(): Promise<{ qrCode: string; secret: string }> {
    try {
      // In a real application, this would:
      // 1. Generate a secret key
      // 2. Create a QR code for authenticator apps
      // 3. Return both to the user
      
      const secret = this.generateSecret();
      const qrCode = this.generateQRCode(secret);
      
      this.is2FAEnabled = true;
      this.backupCodes = this.generateBackupCodes();
      
      // Save to localStorage for demo purposes
      this.save2FAStatus();
      
      return { qrCode, secret };
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw new Error('Failed to enable two-factor authentication');
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disable2FA(): Promise<void> {
    try {
      // In a real application, this would:
      // 1. Verify the user's identity
      // 2. Remove the 2FA configuration from the server
      // 3. Clear local 2FA data
      
      this.is2FAEnabled = false;
      this.backupCodes = [];
      this.trustedDevices = [];
      
      // Save to localStorage for demo purposes
      this.save2FAStatus();
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      throw new Error('Failed to disable two-factor authentication');
    }
  }

  /**
   * Verify 2FA token
   */
  async verifyToken(token: string, secret: string): Promise<boolean> {
    try {
      console.log('Verifying 2FA token with provided secret');
      // Validate secret is provided
      if (!secret) {
        throw new Error('Secret key is required for token verification');
      }
      // In a real application, this would:
      // 1. Validate the token against the secret
      // 2. Check if the token has already been used
      // 3. Return verification result
      
      // For demo purposes, we'll simulate verification
      const isValid = token.length === 6 && /^\d+$/.test(token);
      
      if (isValid) {
        console.log('2FA token verified successfully');
      } else {
        console.log('Invalid 2FA token');
      }
      
      return isValid;
    } catch (error) {
      console.error('Failed to verify 2FA token:', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      let code = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    return codes;
  }

  /**
   * Get backup codes
   */
  getBackupCodes(): string[] {
    return [...this.backupCodes];
  }

  /**
   * Use a backup code
   */
  useBackupCode(code: string): boolean {
    const index = this.backupCodes.indexOf(code);
    if (index !== -1) {
      this.backupCodes.splice(index, 1);
      this.save2FAStatus();
      return true;
    }
    return false;
  }

  /**
   * Generate secret key
   */
  private generateSecret(): string {
    // Generate 16-character base32 secret
    let secret = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Generate QR code URL
   */
  private generateQRCode(secret: string): string {
    // This would generate an actual QR code in a real application
    // For demo purposes, we'll return a placeholder
    return `otpauth://totp/ArtfulAgenda:${encodeURIComponent('user@example.com')}?secret=${secret}&issuer=ArtfulAgenda`;
  }

  /**
   * Check if 2FA is enabled
   */
  isEnabled(): boolean {
    return this.is2FAEnabled;
  }

  /**
   * Trust current device
   */
  trustCurrentDevice(): void {
    // Generate device identifier (in real app, this would be more secure)
    const deviceId = this.generateDeviceId();
    this.trustedDevices.push(deviceId);
    this.save2FAStatus();
  }

  /**
   * Check if current device is trusted
   */
  isDeviceTrusted(): boolean {
    const deviceId = this.generateDeviceId();
    return this.trustedDevices.includes(deviceId);
  }

  /**
   * Generate device identifier
   */
  private generateDeviceId(): string {
    // In a real application, this would use more sophisticated methods
    // like fingerprinting or secure device identifiers
    return btoa(navigator.userAgent + screen.width + screen.height);
  }

  /**
   * Revoke trust for a device
   */
  revokeDeviceTrust(deviceId: string): void {
    const index = this.trustedDevices.indexOf(deviceId);
    if (index !== -1) {
      this.trustedDevices.splice(index, 1);
      this.save2FAStatus();
    }
  }

  /**
   * Get trusted devices
   */
  getTrustedDevices(): string[] {
    return [...this.trustedDevices];
  }

  /**
   * Save 2FA status to localStorage
   */
  private save2FAStatus(): void {
    try {
      const data = {
        enabled: this.is2FAEnabled,
        backupCodes: this.backupCodes,
        trustedDevices: this.trustedDevices
      };
      localStorage.setItem('twoFactorAuth', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save 2FA status:', error);
    }
  }

  /**
   * Load 2FA status from localStorage
   */
  private load2FAStatus(): void {
    try {
      const dataStr = localStorage.getItem('twoFactorAuth');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        this.is2FAEnabled = data.enabled || false;
        this.backupCodes = data.backupCodes || [];
        this.trustedDevices = data.trustedDevices || [];
      }
    } catch (error) {
      console.warn('Failed to load 2FA status:', error);
    }
  }

  /**
   * Send 2FA code via SMS or email
   */
  async sendCode(destination: string, method: 'sms' | 'email'): Promise<boolean> {
    try {
      // In a real application, this would:
      // 1. Generate a time-limited code
      // 2. Send it via SMS or email
      // 3. Return success status
      
      console.log(`Sending 2FA code to ${destination} via ${method}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to send 2FA code:', error);
      return false;
    }
  }

  /**
   * Get 2FA configuration status
   */
  getConfiguration(): {
    enabled: boolean;
    hasBackupCodes: boolean;
    trustedDevicesCount: number;
  } {
    return {
      enabled: this.is2FAEnabled,
      hasBackupCodes: this.backupCodes.length > 0,
      trustedDevicesCount: this.trustedDevices.length
    };
  }
}

// Export a singleton instance
export const twoFactorAuth = TwoFactorAuth.getInstance();