import { useState, useEffect, useCallback } from 'react';
import { VisualTheme } from '../types';

interface ThemeState {
  currentTheme: VisualTheme | null;
  availableThemes: VisualTheme[];
  isDarkMode: boolean;
  isOledMode: boolean;
  isHighContrast: boolean;
  isColorBlindMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  animationLevel: 'none' | 'reduced' | 'full';
}

interface ThemeOptions {
  defaultThemeId?: string;
  enableSystemTheme?: boolean;
  enableDynamicThemes?: boolean;
  enableHighContrast?: boolean;
  enableColorBlindMode?: boolean;
}

// Default themes
const DEFAULT_THEMES: VisualTheme[] = [
  {
    id: 'default',
    name: 'Default',
    svgTemplate: '<svg></svg>',
    cssVariables: {
      'primary-color': '#3b82f6',
      'secondary-color': '#60a5fa',
      'background-color': '#ffffff',
      'text-color': '#1f2937',
      'border-color': '#e5e7eb',
      'accent-color': '#10b981'
    },
    fontPairings: {
      header: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    svgTemplate: '<svg></svg>',
    cssVariables: {
      'primary-color': '#3b82f6',
      'secondary-color': '#60a5fa',
      'background-color': '#1f2937',
      'text-color': '#f9fafb',
      'border-color': '#374151',
      'accent-color': '#10b981'
    },
    fontPairings: {
      header: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    }
  },
  {
    id: 'oled',
    name: 'OLED Dark',
    svgTemplate: '<svg></svg>',
    cssVariables: {
      'primary-color': '#3b82f6',
      'secondary-color': '#60a5fa',
      'background-color': '#000000',
      'text-color': '#ffffff',
      'border-color': '#111827',
      'accent-color': '#10b981'
    },
    fontPairings: {
      header: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    svgTemplate: '<svg></svg>',
    cssVariables: {
      'primary-color': '#f97316',
      'secondary-color': '#fb923c',
      'background-color': '#fff7ed',
      'text-color': '#7c2d12',
      'border-color': '#fed7aa',
      'accent-color': '#ea580c'
    },
    fontPairings: {
      header: 'Playfair Display, serif',
      body: 'Inter, sans-serif'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    svgTemplate: '<svg></svg>',
    cssVariables: {
      'primary-color': '#0ea5e9',
      'secondary-color': '#38bdf8',
      'background-color': '#f0f9ff',
      'text-color': '#0c4a6e',
      'border-color': '#bae6fd',
      'accent-color': '#0284c7'
    },
    fontPairings: {
      header: 'Merriweather, serif',
      body: 'Inter, sans-serif'
    }
  }
];

export const useTheme = (options: ThemeOptions = {}) => {
  const { 
    defaultThemeId = 'default', 
    enableSystemTheme = true,
    enableDynamicThemes = true,
    enableHighContrast = false,
    enableColorBlindMode = false
  } = options;
  
  const [state, setState] = useState<ThemeState>({
    currentTheme: null,
    availableThemes: DEFAULT_THEMES,
    isDarkMode: false,
    isOledMode: false,
    isHighContrast: enableHighContrast,
    isColorBlindMode: enableColorBlindMode,
    fontSize: 'medium',
    animationLevel: enableDynamicThemes ? 'full' : 'reduced'
  });
  
  // Load theme from localStorage or system preference
  useEffect(() => {
    const loadTheme = () => {
      try {
        // Check localStorage first
        const storedThemeId = localStorage.getItem('themeId');
        const storedDarkMode = localStorage.getItem('darkMode');
        const storedOledMode = localStorage.getItem('oledMode');
        const storedHighContrast = localStorage.getItem('highContrast');
        const storedColorBlindMode = localStorage.getItem('colorBlindMode');
        const storedFontSize = localStorage.getItem('fontSize') as ThemeState['fontSize'] | null;
        const storedAnimationLevel = localStorage.getItem('animationLevel') as ThemeState['animationLevel'] | null;
        
        let themeId = storedThemeId || defaultThemeId;
        let isDarkMode = storedDarkMode === 'true';
        let isOledMode = storedOledMode === 'true';
        let isHighContrast = storedHighContrast === 'true';
        let isColorBlindMode = storedColorBlindMode === 'true';
        let fontSize = storedFontSize || 'medium';
        let animationLevel = storedAnimationLevel || 'full';
        
        // Check system preference if enabled
        if (enableSystemTheme && storedThemeId === null) {
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          isDarkMode = systemPrefersDark;
          
          if (isDarkMode && !storedThemeId) {
            themeId = 'dark';
          }
        }
        
        // Find the theme
        const theme = DEFAULT_THEMES.find(t => t.id === themeId) || DEFAULT_THEMES[0];
        
        setState(prev => ({
          ...prev,
          currentTheme: theme,
          isDarkMode,
          isOledMode,
          isHighContrast,
          isColorBlindMode,
          fontSize,
          animationLevel
        }));
        
        // Apply theme
        applyTheme(theme, isDarkMode, isOledMode);
      } catch (error) {
        console.error('Failed to load theme:', error);
        // Fallback to default theme
        const defaultTheme = DEFAULT_THEMES[0];
        setState(prev => ({ ...prev, currentTheme: defaultTheme }));
        applyTheme(defaultTheme);
      }
    };
    
    loadTheme();
  }, [defaultThemeId, enableSystemTheme]);
  
  // Apply theme to document
  const applyTheme = useCallback((
    theme: VisualTheme, 
    isDarkMode: boolean = false, 
    isOledMode: boolean = false,
    isHighContrast: boolean = false,
    isColorBlindMode: boolean = false,
    fontSize: ThemeState['fontSize'] = 'medium',
    animationLevel: ThemeState['animationLevel'] = 'full'
  ) => {
    // Helper function to enhance color contrast
    const enhanceContrast = (color: string): string => {
      // Simple implementation - in a real app, you'd use a more sophisticated algorithm
      if (isDarkMode) {
        // For dark themes, lighten colors
        return lightenColor(color, 0.2);
      } else {
        // For light themes, darken colors
        return darkenColor(color, 0.2);
      }
    };
    
    // Helper function to lighten a color
    const lightenColor = (color: string, amount: number): string => {
      // Simple implementation for hex colors
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        const newR = Math.min(255, r + amount * 255);
        const newG = Math.min(255, g + amount * 255);
        const newB = Math.min(255, b + amount * 255);
        
        return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
      }
      return color;
    };
    
    // Helper function to darken a color
    const darkenColor = (color: string, amount: number): string => {
      // Simple implementation for hex colors
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        const newR = Math.max(0, r - amount * 255);
        const newG = Math.max(0, g - amount * 255);
        const newB = Math.max(0, b - amount * 255);
        
        return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
      }
      return color;
    };
    
    // Apply color blind friendly palette
    const applyColorBlindPalette = (theme: VisualTheme) => {
      // For color blind users, we ensure sufficient color difference
      // This is a simplified implementation
      const colorBlindPalette = {
        ...theme.cssVariables,
        // Ensure text has sufficient contrast with background
        'text-color': isDarkMode ? '#ffffff' : '#000000',
        // Use blue/orange color scheme which is color blind friendly
        'primary-color': isDarkMode ? '#4299e1' : '#3182ce',
        'accent-color': isDarkMode ? '#ed8936' : '#dd6b20'
      };
      
      Object.entries(colorBlindPalette).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });
    };
    // Apply CSS variables
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    
    // Apply font pairings
    document.documentElement.style.setProperty('--font-header', theme.fontPairings.header);
    document.documentElement.style.setProperty('--font-body', theme.fontPairings.body);
    
    // Apply dark mode classes
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      if (isOledMode) {
        document.documentElement.classList.add('oled-mode');
      } else {
        document.documentElement.classList.remove('oled-mode');
      }
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.remove('oled-mode');
    }
    
    // Apply high contrast mode
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
      // Enhance contrast for all colors
      Object.entries(theme.cssVariables).forEach(([key, value]) => {
        if (key.includes('color')) {
          const enhancedValue = enhanceContrast(value);
          document.documentElement.style.setProperty(`--${key}`, enhancedValue);
        }
      });
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply color blind mode adjustments
    if (isColorBlindMode) {
      document.documentElement.classList.add('color-blind-mode');
      // Apply color blind friendly palette
      applyColorBlindPalette(theme);
    } else {
      document.documentElement.classList.remove('color-blind-mode');
    }
    
    // Apply font size
    document.documentElement.style.setProperty('--font-size-base', fontSize);
    
    // Apply animation level
    document.documentElement.style.setProperty('--animation-level', animationLevel);
    document.documentElement.classList.remove('animations-none', 'animations-reduced', 'animations-full');
    document.documentElement.classList.add(`animations-${animationLevel}`);
    
    // Save to localStorage
    localStorage.setItem('themeId', theme.id);
    localStorage.setItem('darkMode', isDarkMode.toString());
    localStorage.setItem('oledMode', isOledMode.toString());
  }, []);
  
  // Change theme
  const changeTheme = useCallback((themeId: string) => {
    const theme = DEFAULT_THEMES.find(t => t.id === themeId);
    if (theme) {
      setState(prev => ({
        ...prev,
        currentTheme: theme
      }));
      
      applyTheme(theme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel);
    }
  }, [applyTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel]);
  
  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !state.isDarkMode;
    const newOledMode = newDarkMode ? state.isOledMode : false;
    
    setState(prev => ({
      ...prev,
      isDarkMode: newDarkMode,
      isOledMode: newOledMode
    }));
    
    if (state.currentTheme) {
      applyTheme(state.currentTheme, newDarkMode, newOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel);
    }
  }, [state.currentTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel, applyTheme]);
  
  // Toggle OLED mode
  const toggleOledMode = useCallback(() => {
    if (!state.isDarkMode) return;
    
    const newOledMode = !state.isOledMode;
    
    setState(prev => ({
      ...prev,
      isOledMode: newOledMode
    }));
    
    if (state.currentTheme) {
      applyTheme(state.currentTheme, true, newOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel);
    }
  }, [state.currentTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel, applyTheme]);
  
  // Get theme by ID
  const getThemeById = useCallback((themeId: string): VisualTheme | undefined => {
    return DEFAULT_THEMES.find(t => t.id === themeId);
  }, []);
  
  // Get themes by category
  const getThemesByCategory = useCallback((category: 'light' | 'dark' = 'light') => {
    if (category === 'dark') {
      return DEFAULT_THEMES.filter(t => t.id === 'dark' || t.id === 'oled');
    }
    return DEFAULT_THEMES.filter(t => t.id !== 'dark' && t.id !== 'oled');
  }, []);
  
  // Create custom theme
  const createCustomTheme = useCallback((theme: VisualTheme) => {
    setState(prev => ({
      ...prev,
      availableThemes: [...prev.availableThemes, theme]
    }));
    
    // Save custom themes to localStorage
    const customThemes = DEFAULT_THEMES.filter(t => !['default', 'dark', 'oled', 'sunset', 'ocean'].includes(t.id));
    localStorage.setItem('customThemes', JSON.stringify([...customThemes, theme]));
  }, []);
  
  // Delete custom theme
  const deleteCustomTheme = useCallback((themeId: string) => {
    if (['default', 'dark', 'oled', 'sunset', 'ocean'].includes(themeId)) {
      console.warn('Cannot delete default themes');
      return;
    }
    
    setState(prev => ({
      ...prev,
      availableThemes: prev.availableThemes.filter(t => t.id !== themeId),
      currentTheme: prev.currentTheme?.id === themeId ? DEFAULT_THEMES[0] : prev.currentTheme
    }));
    
    // Update localStorage
    const customThemes = DEFAULT_THEMES.filter(t => !['default', 'dark', 'oled', 'sunset', 'ocean'].includes(t.id));
    const updatedCustomThemes = customThemes.filter(t => t.id !== themeId);
    localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
  }, []);
  
  // Toggle high contrast mode
  const toggleHighContrast = useCallback(() => {
    const newHighContrast = !state.isHighContrast;
    
    setState(prev => ({
      ...prev,
      isHighContrast: newHighContrast
    }));
    
    if (state.currentTheme) {
      applyTheme(state.currentTheme, state.isDarkMode, state.isOledMode, newHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel);
    }
  }, [state.currentTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel, applyTheme]);
  
  // Toggle color blind mode
  const toggleColorBlindMode = useCallback(() => {
    const newColorBlindMode = !state.isColorBlindMode;
    
    setState(prev => ({
      ...prev,
      isColorBlindMode: newColorBlindMode
    }));
    
    if (state.currentTheme) {
      applyTheme(state.currentTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, newColorBlindMode, state.fontSize, state.animationLevel);
    }
  }, [state.currentTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel, applyTheme]);
  
  // Change font size
  const changeFontSize = useCallback((size: ThemeState['fontSize']) => {
    setState(prev => ({
      ...prev,
      fontSize: size
    }));
    
    if (state.currentTheme) {
      applyTheme(state.currentTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, size, state.animationLevel);
    }
    
    // Save to localStorage
    localStorage.setItem('fontSize', size);
  }, [state.currentTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel, applyTheme]);
  
  // Change animation level
  const changeAnimationLevel = useCallback((level: ThemeState['animationLevel']) => {
    setState(prev => ({
      ...prev,
      animationLevel: level
    }));
    
    if (state.currentTheme) {
      applyTheme(state.currentTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, level);
    }
    
    // Save to localStorage
    localStorage.setItem('animationLevel', level);
  }, [state.currentTheme, state.isDarkMode, state.isOledMode, state.isHighContrast, state.isColorBlindMode, state.fontSize, state.animationLevel, applyTheme]);
  
  // Reset to default theme
  const resetToDefault = useCallback(() => {
    const defaultTheme = DEFAULT_THEMES[0];
    setState(prev => ({
      ...prev,
      currentTheme: defaultTheme,
      isDarkMode: false,
      isOledMode: false,
      isHighContrast: false,
      isColorBlindMode: false,
      fontSize: 'medium',
      animationLevel: 'full'
    }));
    
    applyTheme(defaultTheme, false, false, false, false, 'medium', 'full');
    localStorage.removeItem('themeId');
    localStorage.removeItem('darkMode');
    localStorage.removeItem('oledMode');
    localStorage.removeItem('highContrast');
    localStorage.removeItem('colorBlindMode');
    localStorage.removeItem('fontSize');
    localStorage.removeItem('animationLevel');
  }, [applyTheme]);
  
  return {
    ...state,
    changeTheme,
    toggleDarkMode,
    toggleOledMode,
    toggleHighContrast,
    toggleColorBlindMode,
    changeFontSize,
    changeAnimationLevel,
    getThemeById,
    getThemesByCategory,
    createCustomTheme,
    deleteCustomTheme,
    resetToDefault
  };
};