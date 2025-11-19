/**
 * Camera Service
 * Handles camera access for QR code scanning and photo capture
 */

export class CameraService {
  private static instance: CameraService;
  private videoStream: MediaStream | null = null;


  private constructor() {
    // Initialize QR scanner if available
    this.initializeQRScanner();
  }

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Initialize QR scanner
   */
  private initializeQRScanner(): void {
    // In a real app, this would initialize a QR scanning library
    // For demo purposes, we'll just set a flag
    console.log('QR scanner initialized');
  }

  /**
   * Access device camera
   */
  async accessCamera(videoElement: HTMLVideoElement, options: { facingMode?: 'user' | 'environment', width?: number, height?: number } = {}): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || 'environment',
          width: { ideal: options.width || 1280 },
          height: { ideal: options.height || 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoStream = stream;
      
      if (videoElement) {
        videoElement.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error(`Failed to access camera: ${error}`);
    }
  }

  /**
   * Capture photo from video stream
   */
  capturePhoto(videoElement: HTMLVideoElement): string | null {
    if (!videoElement || !this.videoStream) {
      console.error('No video stream available');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Could not get canvas context');
      return null;
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Stop camera stream
   */
  stopCamera(): void {
    if (this.videoStream) {
      const tracks = this.videoStream.getTracks();
      tracks.forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  /**
   * Scan QR code from video stream
   */
  async scanQRCode(videoElement: HTMLVideoElement): Promise<string | null> {
    console.log('Scanning QR code from video element:', videoElement.videoWidth, 'x', videoElement.videoHeight);
    
    // In a real app, this would use a QR scanning library
    // For demo purposes, we'll simulate a successful scan
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('https://example.com/scanned-qr-code');
      }, 2000);
    });
  }

  /**
   * Check if camera is supported
   */
  isCameraSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check available camera devices
   */
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const cameraService = CameraService.getInstance();