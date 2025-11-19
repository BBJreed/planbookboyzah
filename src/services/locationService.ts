/**
 * Location Service
 * Handles geolocation and geofencing for location-based reminders
 */

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private currentLocation: GeolocationPosition | null = null;
  private geofences: Array<{
    id: string;
    latitude: number;
    longitude: number;
    radius: number;
    onEnter: () => void;
    onExit: () => void;
  }> = [];

  private constructor() {
    // Initialize location service
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Get current location
   */
  async getCurrentLocation(options?: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = position;
          resolve(position);
        },
        (error) => {
          reject(error);
        },
        options || {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * Watch position changes
   */
  watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback,
    options?: PositionOptions
  ): number {
    if (!navigator.geolocation) {
      if (errorCallback) {
        errorCallback(new GeolocationPositionError());
      }
      return -1;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentLocation = position;
        successCallback(position);
        this.checkGeofences(position);
      },
      errorCallback,
      options || {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    return this.watchId;
  }

  /**
   * Stop watching position
   */
  stopWatching(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Add geofence
   */
  addGeofence(
    id: string,
    latitude: number,
    longitude: number,
    radius: number,
    onEnter: () => void,
    onExit: () => void
  ): void {
    this.geofences.push({
      id,
      latitude,
      longitude,
      radius,
      onEnter,
      onExit
    });
  }

  /**
   * Remove geofence
   */
  removeGeofence(id: string): void {
    this.geofences = this.geofences.filter(geofence => geofence.id !== id);
  }

  /**
   * Check if current position is within any geofences
   */
  private checkGeofences(position: GeolocationPosition): void {
    const { latitude, longitude } = position.coords;

    this.geofences.forEach(geofence => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        geofence.latitude,
        geofence.longitude
      );

      // For demo purposes, we'll just log when entering/exiting
      // In a real app, you would track entry/exit state
      if (distance <= geofence.radius) {
        console.log(`Entered geofence: ${geofence.id}`);
        geofence.onEnter();
      } else {
        console.log(`Exited geofence: ${geofence.id}`);
        geofence.onExit();
      }
    });
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Get current location
   */
  getCurrentLocationData(): GeolocationPosition | null {
    return this.currentLocation;
  }

  /**
   * Check if geolocation is supported
   */
  isGeolocationSupported(): boolean {
    return !!navigator.geolocation;
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    // In a real app, this would call a geocoding service
    // For demo purposes, we'll return a mock address
    return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  /**
   * Get coordinates from address (forward geocoding)
   */
  async getCoordinatesFromAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    console.log('Geocoding address:', address);
    
    if (!address.trim()) {
      console.error('Address cannot be empty');
      return null;
    }
    
    // In a real app, this would call a geocoding service
    // For demo purposes, we'll return mock coordinates
    return {
      latitude: 40.7128,
      longitude: -74.0060
    };
  }
}

// Export a singleton instance
export const locationService = LocationService.getInstance();