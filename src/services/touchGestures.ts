/**
 * Touch Gesture Service
 * Handles touch gestures for mobile devices
 */

export class TouchGestures {
  private static instance: TouchGestures;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  private activeTouches: Touch[] = [];
  private minSwipeDistance: number = 50;
  private touchStartTime: number = 0;
  private touchEndTime: number = 0;
  private longPressThreshold: number = 500; // milliseconds

  private multiTouchStartDistance: number = 0;
  private multiTouchStartTime: number = 0;


  private constructor() {
    this.initializeTouchEvents();
  }

  static getInstance(): TouchGestures {
    if (!TouchGestures.instance) {
      TouchGestures.instance = new TouchGestures();
    }
    return TouchGestures.instance;
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
    console.log('Touch start, active touches:', this.activeTouches.length);
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();

    // Handle multi-touch
    if (event.touches.length === 2) {
      this.multiTouchStartTime = Date.now();
      console.log('Multi-touch gesture started at:', this.multiTouchStartTime);
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.multiTouchStartDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    this.activeTouches = Array.from(event.touches);
    
    // Prevent scrolling during horizontal swipes
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    
    // If horizontal movement is greater than vertical, prevent scrolling
    if (deltaX > deltaY && deltaX > 10) {
      event.preventDefault();
    }
    
    // Handle pinch gestures
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = currentDistance / this.multiTouchStartDistance;
      
      // Dispatch pinch event with scale factor
      const pinchEvent = new CustomEvent('pinch', {
        detail: { scale, distance: currentDistance }
      });
      document.dispatchEvent(pinchEvent);
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    this.activeTouches = Array.from(event.touches);
    const touch = event.changedTouches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;
    this.touchEndTime = Date.now();
    
    this.handleGesture();
  }

  /**
   * Handle touch cancel
   */
  private handleTouchCancel(event: TouchEvent): void {
    console.log('Touch cancelled for', event.touches.length, 'touches');
    this.activeTouches = [];
    // Reset all touch tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.touchStartTime = 0;
    this.touchEndTime = 0;
  }

  /**
   * Handle gesture detection
   */
  private handleGesture(): void {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = this.touchEndTime - this.touchStartTime;
    
    // Long press detection
    if (duration >= this.longPressThreshold && distance < 10) {
      this.dispatchLongPressEvent();
      return;
    }
    
    // Ignore small movements
    if (distance < this.minSwipeDistance) {
      // Handle tap
      if (duration < 200) {
        this.dispatchTapEvent();
      }
      return;
    }
    
    // Determine direction
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.dispatchSwipeEvent('swipe-right');
      } else {
        this.dispatchSwipeEvent('swipe-left');
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        this.dispatchSwipeEvent('swipe-down');
      } else {
        this.dispatchSwipeEvent('swipe-up');
      }
    }
  }

  /**
   * Dispatch swipe event
   */
  private dispatchSwipeEvent(direction: string): void {
    const event = new CustomEvent('swipe', {
      detail: { direction }
    });
    document.dispatchEvent(event);
  }

  /**
   * Dispatch tap event
   */
  private dispatchTapEvent(): void {
    const event = new CustomEvent('tap', {
      detail: {
        x: this.touchEndX,
        y: this.touchEndY
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Dispatch long press event
   */
  private dispatchLongPressEvent(): void {
    const event = new CustomEvent('longpress', {
      detail: {
        x: this.touchStartX,
        y: this.touchStartY,
        duration: this.touchEndTime - this.touchStartTime
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Add swipe listener
   */
  addSwipeListener(callback: (direction: string) => void): void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail.direction);
    };
    
    document.addEventListener('swipe', handler);
  }

  /**
   * Add tap listener
   */
  addTapListener(callback: (x: number, y: number) => void): void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail.x, customEvent.detail.y);
    };
    
    document.addEventListener('tap', handler);
  }

  /**
   * Add long press listener
   */
  addLongPressListener(callback: (x: number, y: number, duration: number) => void): void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail.x, customEvent.detail.y, customEvent.detail.duration);
    };
    
    document.addEventListener('longpress', handler);
  }

  /**
   * Add pinch listener
   */
  addPinchListener(callback: (scale: number, distance: number) => void): void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail.scale, customEvent.detail.distance);
    };
    
    document.addEventListener('pinch', handler);
  }

  /**
   * Remove swipe listener
   */
  removeSwipeListener(callback: (direction: string) => void): void {
    console.log('Removing swipe listener:', callback.name || 'anonymous function');
    // This would require storing the handler reference
    // For simplicity, we're not implementing this in the demo
  }

  /**
   * Handle pinch gestures for zoom
   */
  handlePinch(event: TouchEvent): void {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Dispatch pinch event with scale factor
      const pinchEvent = new CustomEvent('pinch', {
        detail: { distance }
      });
      document.dispatchEvent(pinchEvent);
    }
  }

  /**
   * Handle tap gestures
   */
  handleTap(event: TouchEvent): void {
    const touch = event.touches[0];
    const tapEvent = new CustomEvent('tap', {
      detail: {
        x: touch.clientX,
        y: touch.clientY
      }
    });
    document.dispatchEvent(tapEvent);
  }

  /**
   * Handle double tap gestures
   */
  handleDoubleTap(event: TouchEvent): void {
    const now = Date.now();
    const lastTap = (touchGestures as any).lastTap || 0;
    const tapDelta = now - lastTap;
    
    if (tapDelta < 300) { // Double tap threshold
      const touch = event.touches[0];
      const doubleTapEvent = new CustomEvent('doubletap', {
        detail: {
          x: touch.clientX,
          y: touch.clientY
        }
      });
      document.dispatchEvent(doubleTapEvent);
    }
    
    (touchGestures as any).lastTap = now;
  }

  /**
   * Set minimum swipe distance
   */
  setMinSwipeDistance(distance: number): void {
    this.minSwipeDistance = distance;
  }

  /**
   * Set long press threshold
   */
  setLongPressThreshold(threshold: number): void {
    this.longPressThreshold = threshold;
  }

  /**
   * Get current touch gesture settings
   */
  getSettings(): {
    minSwipeDistance: number;
    longPressThreshold: number;
  } {
    return {
      minSwipeDistance: this.minSwipeDistance,
      longPressThreshold: this.longPressThreshold
    };
  }
}

// Export a singleton instance
export const touchGestures = TouchGestures.getInstance();