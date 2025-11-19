import { useCallback, useEffect, useRef } from 'react';
import { ViewMode } from '../types';
import { accessibilityService } from '../services/accessibilityService';

interface UseKeyboardShortcutsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showPomodoro: boolean;
  setShowPomodoro: (show: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleNaturalLanguageInput: () => void;
  handleBiometricAuth: () => void;
  handleFocusModeToggle: () => void;
  handle2FAToggle: () => void;
  // New props for enhanced shortcuts
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  isSearchOpen?: boolean;
  setIsSearchOpen?: (open: boolean) => void;
  theme?: string;
  toggleTheme?: () => void;
  isMenuOpen?: boolean;
  setIsMenuOpen?: (open: boolean) => void;
  handleExport?: () => void;
  handleImport?: () => void;
  handlePrint?: () => void;
  handleHelp?: () => void;
}

interface ShortcutCategory {
  name: string;
  shortcuts: Shortcut[];
}

interface Shortcut {
  keys: string;
  description: string;
  category: string;
  action: () => void;
}

export const useKeyboardShortcuts = ({
  viewMode,
  setViewMode,
  showPomodoro,
  setShowPomodoro,
  activeTab,
  setActiveTab,
  handleNaturalLanguageInput,
  handleBiometricAuth,
  handleFocusModeToggle,
  handle2FAToggle,
  isSearchOpen,
  setIsSearchOpen,
  toggleTheme,
  isMenuOpen,
  setIsMenuOpen,
  handleExport,
  handleImport,
  handlePrint,
  handleHelp
}: UseKeyboardShortcutsProps) => {
  // Ref to store the shortcuts for help display
  const shortcutsRef = useRef<ShortcutCategory[]>([
    {
      name: "Navigation",
      shortcuts: [
        { keys: "Ctrl/Cmd + 1-9", description: "Switch to tab", category: "Navigation", action: () => {} },
        { keys: "Ctrl/Cmd + M", description: "Toggle view mode", category: "Navigation", action: () => {} },
        { keys: "Ctrl/Cmd + B", description: "Open menu", category: "Navigation", action: () => {} },
        { keys: "Ctrl/Cmd + /", description: "Open search", category: "Navigation", action: () => {} },
      ]
    },
    {
      name: "Actions",
      shortcuts: [
        { keys: "Ctrl/Cmd + N", description: "Natural language input", category: "Actions", action: () => {} },
        { keys: "Ctrl/Cmd + Shift + F", description: "Toggle focus mode", category: "Actions", action: () => {} },
        { keys: "Ctrl/Cmd + Shift + T", description: "Toggle 2FA", category: "Actions", action: () => {} },
        { keys: "Ctrl/Cmd + Shift + P", description: "Toggle Pomodoro", category: "Actions", action: () => {} },
        { keys: "Ctrl/Cmd + Shift + B", description: "Biometric auth", category: "Actions", action: () => {} },
        { keys: "Ctrl/Cmd + Shift + E", description: "Export data", category: "Actions", action: () => {} },
        { keys: "Ctrl/Cmd + Shift + I", description: "Import data", category: "Actions", action: () => {} },
        { keys: "Ctrl/Cmd + Shift + D", description: "Toggle dark mode", category: "Actions", action: () => {} },
      ]
    },
    {
      name: "Editing",
      shortcuts: [
        { keys: "Ctrl/Cmd + Z", description: "Undo", category: "Editing", action: () => {} },
        { keys: "Ctrl/Cmd + Shift + Z", description: "Redo", category: "Editing", action: () => {} },
        { keys: "Ctrl/Cmd + S", description: "Save", category: "Editing", action: () => {} },
        { keys: "Delete", description: "Delete selected", category: "Editing", action: () => {} },
      ]
    },
    {
      name: "System",
      shortcuts: [
        { keys: "Ctrl/Cmd + ,", description: "Preferences", category: "System", action: () => {} },
        { keys: "Ctrl/Cmd + ?", description: "Show shortcuts", category: "System", action: () => {} },
        { keys: "Ctrl/Cmd + P", description: "Print", category: "System", action: () => {} },
        { keys: "F1", description: "Help", category: "System", action: () => {} },
        { keys: "Escape", description: "Close modal/menu", category: "System", action: () => {} },
      ]
    }
  ]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Handle accessibility shortcuts
    if (accessibilityService.handleKeyboardShortcut(e)) {
      return;
    }

    // Handle Escape key for closing modals/menus
    if (e.key === 'Escape') {
      if (isMenuOpen && setIsMenuOpen) {
        setIsMenuOpen(false);
      }
      if (isSearchOpen && setIsSearchOpen) {
        setIsSearchOpen(false);
      }
      return;
    }

    // Handle F1 for help
    if (e.key === 'F1') {
      e.preventDefault();
      if (handleHelp) handleHelp();
      return;
    }

    // Handle Ctrl/Cmd + P for print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) {
      e.preventDefault();
      if (handlePrint) handlePrint();
      return;
    }

    // Handle Ctrl/Cmd + ? for showing shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      if (handleHelp) handleHelp();
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          if (e.shiftKey) {
            // In a real app, we would implement redo
            alert('Redo functionality would be implemented here');
          } else {
            // In a real app, we would implement undo
            alert('Undo functionality would be implemented here');
          }
          break;
        case 'm':
          setViewMode(viewMode === 'monthly' ? 'weekly' : 'monthly');
          break;
        case 'n':
          handleNaturalLanguageInput();
          break;
        case 'b':
          if (e.shiftKey) {
            handleBiometricAuth();
          } else if (setIsMenuOpen) {
            setIsMenuOpen(!isMenuOpen);
          }
          break;
        case 'f':
          if (e.shiftKey) {
            handleFocusModeToggle();
          }
          break;
        case 't':
          if (e.shiftKey) {
            handle2FAToggle();
          } else if (toggleTheme) {
            toggleTheme();
          }
          break;
        case 'd':
          if (e.shiftKey && toggleTheme) {
            toggleTheme();
          }
          break;
        case 'e':
          if (e.shiftKey && handleExport) {
            handleExport();
          }
          break;
        case 'i':
          if (e.shiftKey && handleImport) {
            handleImport();
          }
          break;
        case 'p':
          if (e.shiftKey) {
            setShowPomodoro(!showPomodoro);
          }
          break;
        case 's':
          // Save functionality would be implemented here
          alert('Save functionality would be implemented here');
          break;
        case ',':
          // Preferences would be implemented here
          alert('Preferences would be implemented here');
          break;
        case '1':
          setActiveTab('calendar');
          break;
        case '2':
          setActiveTab('analytics');
          break;
        case '3':
          setActiveTab('heatmap');
          break;
        case '4':
          setActiveTab('gantt');
          break;
        case '5':
          setActiveTab('time');
          break;
        case '6':
          setActiveTab('habits');
          break;
        case '7':
          setActiveTab('goals');
          break;
        case '8':
          setActiveTab('privacy');
          break;
        case '9':
          setActiveTab('mobile');
          break;
        default:
          break;
      }
    }

    // Handle search shortcut (Ctrl/Cmd + K or /)
    if (((e.ctrlKey || e.metaKey) && e.key === 'k') || e.key === '/') {
      if (setIsSearchOpen && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }
  }, [viewMode, showPomodoro, activeTab, setViewMode, setShowPomodoro, setActiveTab, 
      handleNaturalLanguageInput, handleBiometricAuth, handleFocusModeToggle, handle2FAToggle,
      isMenuOpen, setIsMenuOpen, isSearchOpen, setIsSearchOpen, toggleTheme, handleExport, handleImport,
      handlePrint, handleHelp]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Return shortcuts for help display
  const getShortcuts = useCallback(() => {
    return shortcutsRef.current;
  }, []);

  // Return a formatted string of shortcuts for a specific category
  const getShortcutsForCategory = useCallback((category: string) => {
    const categoryGroup = shortcutsRef.current.find(cat => cat.name === category);
    return categoryGroup ? categoryGroup.shortcuts : [];
  }, []);

  return {
    getShortcuts,
    getShortcutsForCategory
  };
};