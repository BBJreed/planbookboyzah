/**
 * Focus Mode Service
 * Provides distraction-free mode for deep work
 */

export class FocusMode {
  private static instance: FocusMode;
  private isActive: boolean = false;

  private focusElements: Set<string> = new Set();
  private blocklist: Set<string> = new Set([
    '.social-media',
    '.notifications',
    '.chat-widget',
    '.ads'
  ]);

  private constructor() {
    // Load saved preferences
    this.loadPreferences();
  }

  static getInstance(): FocusMode {
    if (!FocusMode.instance) {
      FocusMode.instance = new FocusMode();
    }
    return FocusMode.instance;
  }

  /**
   * Activate focus mode
   */
  activate(elementsToFocus?: string[]): void {
    if (this.isActive) return;
    
    this.isActive = true;
    
    // Store original styles
    // Apply focus mode styles
    this.applyFocusModeStyles();
    
    // Hide distracting elements
    this.hideDistractingElements();
    
    // Show only specified elements if provided
    if (elementsToFocus && elementsToFocus.length > 0) {
      this.focusElements = new Set(elementsToFocus);
      this.showOnlyFocusedElements();
    }
    
    // Dispatch event
    this.dispatchFocusEvent('focusmode:activated');
    
    // Save preferences
    this.savePreferences();
  }

  /**
   * Deactivate focus mode
   */
  deactivate(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Restore original styles
    this.restoreOriginalStyles();
    
    // Show all elements
    this.showAllElements();
    
    // Clear focus elements
    this.focusElements.clear();
    
    // Dispatch event
    this.dispatchFocusEvent('focusmode:deactivated');
    
    // Save preferences
    this.savePreferences();
  }

  /**
   * Toggle focus mode
   */
  toggle(elementsToFocus?: string[]): void {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate(elementsToFocus);
    }
  }

  /**
   * Check if focus mode is active
   */
  isActiveMode(): boolean {
    return this.isActive;
  }

  /**
   * Add element to blocklist
   */
  addToBlocklist(selector: string): void {
    this.blocklist.add(selector);
    this.savePreferences();
  }

  /**
   * Remove element from blocklist
   */
  removeFromBlocklist(selector: string): void {
    this.blocklist.delete(selector);
    this.savePreferences();
  }

  /**
   * Get current blocklist
   */
  getBlocklist(): string[] {
    return Array.from(this.blocklist);
  }

  /**
   * Apply focus mode styles
   */
  private applyFocusModeStyles(): void {
    // Create focus mode style element
    const styleId = 'focus-mode-styles';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Apply focus mode styles
    styleElement.textContent = `
      /* Focus mode base styles */
      body.focus-mode {
        background-color: #f8f9fa !important;
        transition: background-color 0.3s ease;
      }
      
      /* Hide all elements except focused ones */
      body.focus-mode .focus-mode-hidden {
        display: none !important;
      }
      
      /* Dim non-focused elements */
      body.focus-mode .focus-mode-dimmed {
        opacity: 0.3 !important;
        transition: opacity 0.3s ease;
      }
      
      /* Focus overlay */
      .focus-mode-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        pointer-events: none;
      }
      
      /* Focus mode toolbar */
      .focus-mode-toolbar {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: white;
        padding: 10px 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        gap: 10px;
      }
      
      .focus-mode-toolbar button {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        background: #3b82f6;
        color: white;
        cursor: pointer;
        font-size: 14px;
      }
      
      .focus-mode-toolbar button:hover {
        background: #2563eb;
      }
    `;
    
    // Add focus mode class to body
    document.body.classList.add('focus-mode');
    
    // Add toolbar
    this.createToolbar();
  }

  /**
   * Create focus mode toolbar
   */
  private createToolbar(): void {
    // Remove existing toolbar if present
    const existingToolbar = document.querySelector('.focus-mode-toolbar');
    if (existingToolbar) {
      existingToolbar.remove();
    }
    
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'focus-mode-toolbar';
    toolbar.innerHTML = `
      <button id="exit-focus-mode">Exit Focus Mode</button>
      <button id="toggle-dim">Toggle Dim</button>
    `;
    
    document.body.appendChild(toolbar);
    
    // Add event listeners
    document.getElementById('exit-focus-mode')?.addEventListener('click', () => {
      this.deactivate();
    });
    
    document.getElementById('toggle-dim')?.addEventListener('click', () => {
      this.toggleDimming();
    });
  }

  /**
   * Toggle dimming of non-focused elements
   */
  private toggleDimming(): void {
    const dimmedElements = document.querySelectorAll('.focus-mode-dimmed');
    if (dimmedElements.length > 0) {
      dimmedElements.forEach(el => el.classList.remove('focus-mode-dimmed'));
    } else {
      this.dimNonFocusedElements();
    }
  }

  /**
   * Dim non-focused elements
   */
  private dimNonFocusedElements(): void {
    const allElements = document.querySelectorAll('body > *:not(.focus-mode-toolbar)');
    allElements.forEach(el => {
      if (!el.classList.contains('focus-mode-focused')) {
        el.classList.add('focus-mode-dimmed');
      }
    });
  }

  /**
   * Hide distracting elements
   */
  private hideDistractingElements(): void {
    this.blocklist.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.classList.add('focus-mode-hidden');
      });
    });
  }

  /**
   * Show only focused elements
   */
  private showOnlyFocusedElements(): void {
    // Hide all elements first
    const allElements = document.querySelectorAll('body > *:not(.focus-mode-toolbar)');
    allElements.forEach(el => {
      el.classList.add('focus-mode-hidden');
    });
    
    // Show focused elements
    this.focusElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.classList.remove('focus-mode-hidden');
        el.classList.add('focus-mode-focused');
      });
    });
  }

  /**
   * Show all elements
   */
  private showAllElements(): void {
    // Remove all focus mode classes
    const hiddenElements = document.querySelectorAll('.focus-mode-hidden');
    hiddenElements.forEach(el => el.classList.remove('focus-mode-hidden'));
    
    const dimmedElements = document.querySelectorAll('.focus-mode-dimmed');
    dimmedElements.forEach(el => el.classList.remove('focus-mode-dimmed'));
    
    const focusedElements = document.querySelectorAll('.focus-mode-focused');
    focusedElements.forEach(el => el.classList.remove('focus-mode-focused'));
  }

  /**
   * Restore original styles
   */
  private restoreOriginalStyles(): void {
    // Remove focus mode class from body
    document.body.classList.remove('focus-mode');
    
    // Remove focus mode styles
    const styleElement = document.getElementById('focus-mode-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    // Remove toolbar
    const toolbar = document.querySelector('.focus-mode-toolbar');
    if (toolbar) {
      toolbar.remove();
    }
    
    // Remove overlay
    const overlay = document.querySelector('.focus-mode-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Dispatch focus event
   */
  private dispatchFocusEvent(eventName: string): void {
    const event = new CustomEvent(eventName, {
      detail: { active: this.isActive }
    });
    document.dispatchEvent(event);
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      const preferences = {
        active: this.isActive,
        blocklist: Array.from(this.blocklist),
        focusElements: Array.from(this.focusElements)
      };
      localStorage.setItem('focusModePreferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save focus mode preferences:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const preferencesStr = localStorage.getItem('focusModePreferences');
      if (preferencesStr) {
        const preferences = JSON.parse(preferencesStr);
        this.blocklist = new Set(preferences.blocklist || []);
        this.focusElements = new Set(preferences.focusElements || []);
        
        // Restore active state if needed
        if (preferences.active) {
          this.activate();
        }
      }
    } catch (error) {
      console.warn('Failed to load focus mode preferences:', error);
    }
  }

  /**
   * Set custom focus duration
   */
  setFocusDuration(minutes: number): void {
    // This would integrate with a timer service
    console.log(`Focus duration set to ${minutes} minutes`);
  }

  /**
   * Get focus mode statistics
   */
  getStatistics(): {
    isActive: boolean;
    sessions: number;
    totalTime: number; // in minutes
  } {
    // In a real implementation, this would track actual usage
    return {
      isActive: this.isActive,
      sessions: 0,
      totalTime: 0
    };
  }
}

// Export a singleton instance
export const focusMode = FocusMode.getInstance();