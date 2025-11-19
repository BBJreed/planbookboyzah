/**
 * Multi-Finger Gesture Service
 * Handles advanced touch gestures for mobile devices
 */

export class MultiFingerGestures {
  private static instance: MultiFingerGestures;
  private activeTouches: Touch[] = [];
  private touchStartTime: number = 0;
  private longPressThreshold: number = 500; // milliseconds
  private multiTouchStartDistance: number = 0;
  private multiTouchStartAngle: number = 0;
  private listeners: Map<string, Array<Function>> = new Map();

  private constructor() {
    this.initializeTouchEvents();
  }

  static getInstance(): MultiFingerGestures {
    if (!MultiFingerGestures.instance) {
      MultiFingerGestures.instance = new MultiFingerGestures();
    }
    return MultiFingerGestures.instance;
  }

  /**
   * Initialize touch events
   */
  private initializeTouchEvents(): void {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), false);
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    this.activeTouches = Array.from(event.touches);
    this.touchStartTime = Date.now();

    // Handle multi-touch
    if (event.touches.length > 1) {
      this.calculateMultiTouchProperties(event.touches);
    }

    // Handle long press detection
    if (event.touches.length === 1) {
      setTimeout(() => {
        if (this.activeTouches.length === 1 && 
            Date.now() - this.touchStartTime >= this.longPressThreshold) {
          this.dispatchGestureEvent('longpress', {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
            duration: Date.now() - this.touchStartTime
          });
        }
      }, this.longPressThreshold);
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    this.activeTouches = Array.from(event.touches);

    // Handle pinch gestures
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const currentAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );
      
      const scale = currentDistance / this.multiTouchStartDistance;
      const rotation = currentAngle - this.multiTouchStartAngle;
      
      this.dispatchGestureEvent('pinch', {
        scale,
        rotation,
        distance: currentDistance
      });
    }

    // Prevent scrolling during horizontal swipes
    if (event.touches.length === 1) {

      // In a real implementation, you would track the start position
      // and prevent default based on movement direction
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    const previousTouchCount = this.activeTouches.length;
    this.activeTouches = Array.from(event.touches);
    
    const touchEndTime = Date.now();
    const duration = touchEndTime - this.touchStartTime;

    // Handle tap gestures
    if (previousTouchCount === 1 && event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      
      // Simple tap detection
      if (duration < 200) {
        this.dispatchGestureEvent('tap', {
          x: touch.clientX,
          y: touch.clientY
        });
      }
      
      // Double tap detection
      // In a real implementation, you would track the last tap time
    }

    // Handle multi-touch end
    if (previousTouchCount > 1 && this.activeTouches.length < 2) {
      this.dispatchGestureEvent('multitouchend', {});
    }
  }

  /**
   * Handle touch cancel
   */
  private handleTouchCancel(event: TouchEvent): void {
    console.log('Touch cancelled, clearing touches:', event.touches.length);
    this.activeTouches = [];
    this.dispatchGestureEvent('touchcancel', {});
  }

  /**
   * Calculate multi-touch properties
   */
  private calculateMultiTouchProperties(touches: TouchList): void {
    if (touches.length < 2) return;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    this.multiTouchStartDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    this.multiTouchStartAngle = Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    );
  }

  /**
   * Dispatch gesture event
   */
  private dispatchGestureEvent(type: string, detail: any): void {
    const event = new CustomEvent(`gesture-${type}`, { detail });
    document.dispatchEvent(event);
    
    // Also call registered listeners
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(detail));
    }
  }

  /**
   * Add gesture listener
   */
  addGestureListener(type: string, callback: Function): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(callback);
  }

  /**
   * Remove gesture listener
   */
  removeGestureListener(type: string, callback: Function): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Handle edge swipe gestures
   */
  handleEdgeSwipe(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    const screenWidth = window.innerWidth;
    const edgeThreshold = 50; // pixels from edge
    
    // Check if touch started near edge
    if (touch.clientX < edgeThreshold || touch.clientX > screenWidth - edgeThreshold) {
      // Track movement
      // In a real implementation, you would track the touch movement
      // and determine if it's a valid edge swipe
    }
  }

  /**
   * Handle multi-finger tap gestures
   */
  handleMultiFingerTap(event: TouchEvent): void {
    const touchCount = event.touches.length;
    
    if (touchCount === 2) {
      this.dispatchGestureEvent('twofingertap', {
        touches: Array.from(event.touches)
      });
    } else if (touchCount === 3) {
      this.dispatchGestureEvent('threefingertap', {
        touches: Array.from(event.touches)
      });
    } else if (touchCount >= 4) {
      this.dispatchGestureEvent('multifingertap', {
        touchCount,
        touches: Array.from(event.touches)
      });
    }
  }

  /**
   * Set long press threshold
   */
  setLongPressThreshold(threshold: number): void {
    this.longPressThreshold = threshold;
  }

  /**
   * Get current touch count
   */
  getTouchCount(): number {
    return this.activeTouches.length;
  }
}

// Export a singleton instance
export const multiFingerGestures = MultiFingerGestures.getInstance();