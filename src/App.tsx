import React, { useState, useEffect } from 'react';
import { useStore } from './stores/appStore';
import { CalendarCanvas } from './components/CalendarCanvas';
import { StickerToolbar } from './components/EnhancedStickerToolbar';
import { SearchBar } from './components/SearchBar';
import { DatePicker } from './components/DatePicker';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMobileDetection } from './hooks/useMobileDetection';
import MobileApp from './components/MobileApp';

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
          {/* Book Container with Binding */}
          <div className="planner-book">
            <div className="book-binding">
              <div className="binding-rings">
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="ring"></div>
              </div>
            </div>
            
            {/* Calendar spanning both pages */}
            <div className="dual-page-calendar">
              <div className="page-header-span">
                <h2>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
                <button 
                  className="sticker-btn"
                  onClick={() => setShowStickerToolbar(true)}
                  title="Add Stickers & Photos"
                >
                  🎨
                </button>
              </div>
              
              {/* Single calendar across both pages */}
              <div className="calendar-container">
                <CalendarCanvas
                  width={window.innerWidth * 0.75}
                  height={window.innerHeight * 0.65}
                />
              </div>
              
              {/* Notes section at bottom */}
              <div className="notes-bottom">
                <h3>Quick Notes</h3>
                <div className="ruled-lines">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="ruled-line"></div>
                  ))}
                </div>
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