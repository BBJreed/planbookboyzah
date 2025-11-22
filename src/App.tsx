import React, { useState, useEffect } from 'react';
import { useStore } from './stores/appStore';
import CalendarCanvas from './components/CalendarCanvas';
import { StickerToolbar } from './components/EnhancedStickerToolbar';
import { SearchBar } from './components/SearchBar';
import { DatePicker } from './components/DatePicker';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMobileDetection } from './hooks/useMobileDetection';
import MobileApp from './components/MobileApp';
import Controls from './components/Controls';
import Stickers from './components/Stickers';

const App: React.FC = () => {
  const { 
    selectedDate,
    zoomLevel,
    viewMode,
    currentTheme,
    undo,
    redo
  } = useStore();
  
  const { isOnline } = useOnlineStatus();
  const isMobile = useMobileDetection();
  
  // State for keyboard shortcuts
  const [activeTab, setActiveTab] = useState('calendar');
  const [showPomodoro, setShowPomodoro] = useState(false);
  
  // State for date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // State for sticker toolbar
  const [showStickerToolbar, setShowStickerToolbar] = useState(false);
  
  // Pull to refresh for mobile
  usePullToRefresh({ 
    onRefresh: () => {
      // Refresh logic here
      console.log('Refreshing data...');
    },
    threshold: 50
  });
  
  // Natural language input handler
  const handleNaturalLanguageInput = () => {
    // Implementation would go here
    console.log('Natural language input triggered');
  };
  
  // Biometric auth handler
  const handleBiometricAuth = () => {
    // Implementation would go here
    console.log('Biometric auth triggered');
  };
  
  // Focus mode toggle handler
  const handleFocusModeToggle = () => {
    // Implementation would go here
    console.log('Focus mode toggle triggered');
  };
  
  // 2FA toggle handler
  const handle2FAToggle = () => {
    // Implementation would go here
    console.log('2FA toggle triggered');
  };
   
  // Keyboard shortcuts
  useKeyboardShortcuts({
    viewMode,
    setViewMode: useStore.getState().setViewMode,
    showPomodoro,
    setShowPomodoro,
    activeTab,
    setActiveTab,
    handleNaturalLanguageInput,
    handleBiometricAuth,
    handleFocusModeToggle,
    handle2FAToggle
  });
  
  // Theme handling
  useEffect(() => {
    if (currentTheme) {
      // Apply theme to document
      document.documentElement.style.setProperty('--primary-color', currentTheme.cssVariables['primary'] || '#3b82f6');
      document.documentElement.style.setProperty('--secondary-color', currentTheme.cssVariables['secondary'] || '#6b7280');
      document.documentElement.style.setProperty('--background-color', currentTheme.cssVariables['background'] || '#ffffff');
      document.documentElement.style.setProperty('--text-color', currentTheme.cssVariables['text'] || '#1f2937');
    }
  }, [currentTheme]);
  
  if (isMobile) {
    return <MobileApp />;
  }
  
  return (
    <ErrorBoundary>
      <div className="app-container">
        <header className="app-header">
          <h1>📅 Artful Agenda v2.0</h1>
          <div className="header-controls">
            <SearchBar />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowDatePicker(!showDatePicker)}>
                {selectedDate.toLocaleDateString()}
              </button>
              {showDatePicker && (
                <DatePicker onClose={() => setShowDatePicker(false)} />
              )}
            </div>
            <button onClick={undo}>Undo</button>
            <button onClick={redo}>Redo</button>
          </div>
        </header>
        
        <main className="app-main">
          {/* Book Calendar Container */}
          <div className="calendar-container">
            <h2>📅 Calendar</h2>
            <Controls />
            <Stickers />
            <div className="book" id="book">
              <div className="left-page" id="left-page">
                <CalendarCanvas
                  width={400}
                  height={600}
                  pagePosition="left"
                />
              </div>
              
              <div className="right-page" id="right-page">
                <CalendarCanvas
                  width={400}
                  height={600}
                  pagePosition="right"
                />
              </div>
            </div>
          </div>
        </main>
        
        {showStickerToolbar && (
          <StickerToolbar 
            isOpen={showStickerToolbar} 
            onClose={() => setShowStickerToolbar(false)} 
          />
        )}
        
        <footer className="app-footer">
          <div className="status-bar">
            <span>Online: {isOnline ? 'Yes' : 'No'}</span>
            <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
            <span>View: {viewMode}</span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
