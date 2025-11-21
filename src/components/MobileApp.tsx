import React, { useState, useEffect, useRef, memo } from 'react';
import { CalendarEvent, TaskItem, DecorativeElement } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
// import RealtimeSyncService from '../services/realtimeSync'; // Disabled to prevent connection errors
import { biometricAuth } from '../services/biometricAuth';
import { voiceInputService } from '../services/voiceInput';
import { darkModeService } from '../services/darkModeService';
import { enhancedNotificationService } from '../services/enhancedNotifications';
import { geofencingService } from '../services/geofencingService';
import MultiFingerGestures from './MultiFingerGestures';
import AnalyticsDashboard from './AnalyticsDashboard';

interface MobileAppState {
  events: CalendarEvent[];
  tasks: TaskItem[];
  stickers: DecorativeElement[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  currentLocation: { latitude: number; longitude: number } | null;
  locationPermission: 'granted' | 'denied' | 'prompt';
  selectedDate: Date;
  viewMode: 'monthly' | 'weekly';
  currentTheme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
}

// Add new state for active tab
type ActiveTab = 'events' | 'tasks' | 'stickers';

// Memoize the MobileApp component for better performance
const MobileApp: React.FC = memo(() => {
  const [state, setState] = useState<MobileAppState>({
    events: [],
    tasks: [],
    stickers: [],
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    currentLocation: null,
    locationPermission: 'prompt',
    selectedDate: new Date(),
    viewMode: 'monthly',
    currentTheme: {
      primary: '#3b82f6',
      secondary: '#6c757d',
      background: '#ffffff',
      text: '#000000',
      accent: '#FF6B6B'
    }
  });

  // Add state for active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('events');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Disabled localhost connection to prevent ERR_CONNECTION_REFUSED errors
  // const [realtimeSync] = useState(new RealtimeSyncService('http://localhost:3001', 'sample-token'));
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showLocationButton] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOledMode, setIsOledMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [geofenceAlerts, setGeofenceAlerts] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Check authentication status
    setIsAuthenticated(biometricAuth.isAuthenticatedUser());
    
    // Load data from localStorage for offline mode
    loadDataFromStorage();
    
    // Set up online/offline event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up real-time sync
    setupRealtimeSync();
    
    // Check for camera support
    checkCameraSupport();
    
    // Set up dark mode listener
    darkModeService.addListener((isDark, isOled) => {
      setIsDarkMode(isDark);
      setIsOledMode(isOled);
    });
    
    // Check notification permissions
    checkNotificationPermissions();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopCamera();
    };
  }, []);

  const checkCameraSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('Camera API not supported');
      return;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/png');
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const getLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });
      
      setState(prev => ({
        ...prev,
        currentLocation: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
      }));
      
      console.log('Location obtained:', position.coords);
    } catch (error) {
      console.error('Error getting location:', error);
      
      alert('Could not get location. Please check permissions.');
    }
  };

  const loadDataFromStorage = async () => {
    try {
      const storedEvents = localStorage.getItem('events');
      const storedTasks = localStorage.getItem('tasks');
      const storedStickers = localStorage.getItem('stickers');
      
      setState(prev => ({
        ...prev,
        events: storedEvents ? JSON.parse(storedEvents) : [],
        tasks: storedTasks ? JSON.parse(storedTasks) : [],
        stickers: storedStickers ? JSON.parse(storedStickers) : []
      }));
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    }
  };

  const handleOnline = () => {
    setState(prev => ({ ...prev, isOnline: true }));
    syncWithServer();
  };

  const handleOffline = () => {
    setState(prev => ({ ...prev, isOnline: false }));
  };

  const setupRealtimeSync = () => {
    // Set up real-time synchronization
    realtimeSync.connect((operations) => {
      // In a real app, we would update the state with the new operations
      console.log('Real-time operations:', operations);
    });
  };

  const syncWithServer = async () => {
    if (!state.isOnline) return;
    
    setState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      // In a real application, this would sync with the server
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date()
      }));
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const availableMethods = biometricAuth.getAvailableMethods();
      
      if (availableMethods.includes('fingerprint')) {
        const success = await biometricAuth.authenticateWithFingerprint();
        if (success) {
          setIsAuthenticated(true);
        }
      } else if (availableMethods.includes('face')) {
        const success = await biometricAuth.authenticateWithFace();
        if (success) {
          setIsAuthenticated(true);
        }
      } else {
        alert('No biometric authentication methods available');
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      alert('Biometric authentication failed. Please try again.');
    }
  };

  const handleLogout = () => {
    biometricAuth.logout();
    setIsAuthenticated(false);
  };

  const addSticker = (sticker: DecorativeElement) => {
    const updatedStickers = [...state.stickers, sticker];
    setState(prev => ({ ...prev, stickers: updatedStickers }));
    localStorage.setItem('stickers', JSON.stringify(updatedStickers));
  };

  const checkNotificationPermissions = async () => {
    try {
      const permission = await enhancedNotificationService.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleVoiceInput = () => {
    if (!voiceInputService.isSupported()) {
      alert('Voice input is not supported on this device');
      return;
    }

    if (isListening) {
      voiceInputService.stopListening();
      setIsListening(false);
      return;
    }

    voiceInputService.startListening(
      (text: string) => {
        // Voice command recognized
        console.log('Voice command:', text);
        setIsListening(false);
        
        // Parse the voice command for event creation
        const parsedEvent = voiceInputService.parseEventCommand(text);
        if (parsedEvent) {
          alert(`Event parsed: ${parsedEvent.title}\nDate: ${parsedEvent.date}\nTime: ${parsedEvent.time}`);
        }
      },
      (error: string) => {
        console.error('Voice input error:', error);
        setIsListening(false);
        alert('Voice input failed. Please try again.');
      }
    );
    
    setIsListening(true);
  };

  const handleDarkModeToggle = () => {
    darkModeService.toggleDarkMode();
  };

  const handleOledModeToggle = () => {
    darkModeService.toggleOledMode();
  };

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      const permission = await enhancedNotificationService.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const handleAddGeofence = async () => {
    if (!state.currentLocation) {
      alert('Please get your current location first');
      return;
    }

    try {
      // Add a geofence at current location with 100m radius
      geofencingService.addGeofence(
        `geofence-${Date.now()}`,
        state.currentLocation.latitude,
        state.currentLocation.longitude,
        100, // 100 meters
        () => {
          // On enter
          enhancedNotificationService.showNotification('Location Reminder', {
            body: 'You have entered a location with a reminder',
            icon: '/icons/icon-192x192.png'
          });
        },
        () => {
          // On exit
          enhancedNotificationService.showNotification('Location Reminder', {
            body: 'You have left a location with a reminder',
            icon: '/icons/icon-192x192.png'
          });
        }
      );
      
      setGeofenceAlerts(true);
      alert('Geofence added successfully!');
    } catch (error) {
      console.error('Error adding geofence:', error);
      alert('Failed to add geofence. Please try again.');
    }
  };

  // Generate calendar days for display with Artful Agenda styling
  const generateCalendarDays = () => {
    if (state.viewMode === 'weekly') {
      const start = startOfWeek(state.selectedDate, { weekStartsOn: 0 });
      const end = endOfWeek(state.selectedDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(state.selectedDate);
      const end = endOfMonth(state.selectedDate);
      return eachDayOfInterval({ start, end });
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return state.events.filter(event => isSameDay(event.startTime, day));
  };

  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return state.tasks.filter(task => isSameDay(new Date(task.date), day));
  };

  // Get decorations for a specific day
  const getDecorationsForDay = (day: Date) => {
    return state.stickers.filter(sticker => isSameDay(new Date(sticker.position.dateX), day));
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-screen">
        <h2>Artful Agenda</h2>
        <p>Please authenticate to access your calendar</p>
        <button onClick={handleBiometricAuth}>Authenticate with Biometrics</button>
        
        <style>{`
          .auth-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            padding: 20px;
            text-align: center;
          }
          
          .auth-screen button {
            margin-top: 20px;
            padding: 12px 24px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mobile-app">
      {/* Multi-finger gesture handler */}
      <MultiFingerGestures
        onSwipe={(direction) => {
          console.log('Swipe detected:', direction);
          // Handle swipe navigation
        }}
        onPinch={(scale, rotation) => {
          console.log('Pinch detected:', scale, rotation);
          // Handle zoom gestures
        }}
        onLongPress={(x, y, duration) => {
          console.log('Long press detected:', x, y, duration);
          // Show context menu
          alert(`Long press at (${x}, ${y}) for ${duration}ms`);
        }}
        onMultiFingerTap={(touchCount) => {
          console.log('Multi-finger tap detected:', touchCount);
          // Handle multi-finger actions
          alert(`${touchCount}-finger tap detected`);
        }}
        onEdgeSwipe={(direction) => {
          console.log('Edge swipe detected:', direction);
          // Handle edge swipe navigation
          alert(`Edge swipe from ${direction}`);
        }}
      />
      
      {/* Camera overlay */}
      {showCamera && (
        <div className="camera-overlay">
          <video ref={videoRef} autoPlay playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="camera-controls">
            <button onClick={captureImage}>📸</button>
            <button onClick={stopCamera}>❌</button>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📊 Analytics Dashboard</h2>
              <button 
                className="close-button"
                onClick={() => setShowAnalytics(false)}
              >
                ❌
              </button>
            </div>
            <div className="modal-body">
              <AnalyticsDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>⚙️ Settings</h2>
              <button 
                className="close-button"
                onClick={() => setShowSettings(false)}
              >
                ❌
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-section">
                <h3>Display</h3>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={(e) => setIsDarkMode(e.target.checked)}
                    />
                    Dark Mode
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={isOledMode}
                      onChange={(e) => setIsOledMode(e.target.checked)}
                    />
                    OLED Mode
                  </label>
                </div>
              </div>
              
              <div className="settings-section">
                <h3>Notifications</h3>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    />
                    Enable Notifications
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={geofenceAlerts}
                      onChange={(e) => setGeofenceAlerts(e.target.checked)}
                    />
                    Location-based Alerts
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Captured image preview */}
      {capturedImage && (
        <div className="image-preview">
          <img src={capturedImage} alt="Captured" />
          <div className="image-actions">
            <button onClick={() => setCapturedImage(null)}>Discard</button>
            <button onClick={() => {
              // In a real app, this would save the image
              alert('Image saved to event');
              setCapturedImage(null);
            }}>Save</button>
          </div>
        </div>
      )}

      {/* Mobile-specific features */}
      <div className="mobile-header">
        <div className="header-content">
          <h1>Artful Agenda</h1>
          <div className="header-actions">
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
      
      <div className="sync-status">
        <div className={`status-indicator ${state.isOnline ? 'online' : 'offline'}`}>
          {state.isOnline ? 'Online' : 'Offline'}
        </div>
        {state.lastSync && (
          <span>Last sync: {state.lastSync.toLocaleTimeString()}</span>
        )}
        {state.currentLocation && (
          <span>📍 {state.currentLocation.latitude.toFixed(4)}, {state.currentLocation.longitude.toFixed(4)}</span>
        )}
      </div>
      
      <div className="mobile-content">
        {/* Replace the section tabs with proper tab switching */}
        <div className="section-tabs">
          <button 
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button 
            className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button 
            className={`tab ${activeTab === 'stickers' ? 'active' : ''}`}
            onClick={() => setActiveTab('stickers')}
          >
            Stickers
          </button>
        </div>
        
        <div className="content-section">
          {/* Conditionally render sections based on active tab */}
          {activeTab === 'events' && (
            <div className="events-section">
              <div className="section-header">
                <h2>Calendar</h2>
                <div className="section-actions">
                  <button 
                    className="view-toggle"
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      viewMode: prev.viewMode === 'monthly' ? 'weekly' : 'monthly' 
                    }))}
                  >
                    {state.viewMode === 'monthly' ? 'Week' : 'Month'}
                  </button>
                  <button className="add-button" onClick={startCamera}>📷</button>
                  {showLocationButton && (
                    <button 
                      className="location-button"
                      onClick={getLocation}
                      disabled={state.locationPermission === 'denied'}
                    >
                      📍
                    </button>
                  )}
                  <button className="add-button" onClick={handleVoiceInput}>
                    {isListening ? '⏹️' : '🎤'}
                  </button>
                  <button className="add-button">+</button>
                </div>
              </div>
              
              {/* Realistic Book-style Calendar */}
              <div className="book-container">
                {/* Book spine with texture */}
                <div className="book-spine">
                  <div className="spine-texture"></div>
                  <div className="spine-title">
                    {format(state.selectedDate, 'MMM yyyy')}
                  </div>
                  <div className="spine-logo">AA</div>
                </div>
                
                {/* Book pages with realistic effects */}
                <div className="book-pages">
                  {/* Left page - decorative with paper texture */}
                  <div className="book-page left-page">
                    <div className="page-texture"></div>
                    <div className="page-content">
                      <div className="page-header">
                        Artful Agenda
                      </div>
                      <div className="page-subtitle">
                        {format(state.selectedDate, 'MMMM yyyy')}
                      </div>
                      <div className="page-text">
                        Your personalized calendar experience
                      </div>
                      <div className="page-decoration">
                        <div className="corner-decoration top-left"></div>
                        <div className="corner-decoration top-right"></div>
                        <div className="corner-decoration bottom-left"></div>
                        <div className="corner-decoration bottom-right"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right page - calendar with paper texture */}
                  <div className="book-page right-page">
                    <div className="page-texture"></div>
                    <div className="page-content">
                      <div className="calendar-header-book">
                        <button 
                          className="nav-button-book"
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            selectedDate: new Date(prev.selectedDate.getFullYear(), prev.selectedDate.getMonth() - 1, 1) 
                          }))}
                        >
                          &lt;
                        </button>
                        <h3>{format(state.selectedDate, 'MMMM yyyy')}</h3>
                        <button 
                          className="nav-button-book"
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            selectedDate: new Date(prev.selectedDate.getFullYear(), prev.selectedDate.getMonth() + 1, 1) 
                          }))}
                        >
                          &gt;
                        </button>
                      </div>
                      
                      {/* Day headers */}
                      <div className="calendar-grid-header-book">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <div key={index} className="calendar-day-header-book">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar days */}
                      <div className="calendar-grid-book">
                        {generateCalendarDays().map((day, _index) => {
                          const dayEvents = getEventsForDay(day);
                          const dayTasks = getTasksForDay(day);
                          const dayDecorations = getDecorationsForDay(day);
                          const isToday = isSameDay(day, new Date());
                          const isCurrentMonth = day.getMonth() === state.selectedDate.getMonth();
                          const hasContent = dayEvents.length > 0 || dayTasks.length > 0 || dayDecorations.length > 0;
                          
                          return (
                            <div 
                              key={day.toString()} 
                              className={`calendar-day-book ${isToday ? 'today-book' : ''} ${!isCurrentMonth ? 'other-month-book' : ''} ${hasContent ? 'has-content-book' : ''}`}
                            >
                              <div className="day-number-book">
                                {format(day, 'd')}
                              </div>
                              <div className="day-indicators-book">
                                {dayDecorations.slice(0, 1).map((decoration, _idx) => (
                                  <div 
                                    key={decoration.id} 
                                    className="decoration-indicator-book"
                                    style={{ 
                                      backgroundColor: decoration.type === 'sticker' ? state.currentTheme.accent : 
                                                      decoration.type === 'shape' ? '#4ECDC4' : '#45B7D1',
                                    }}
                                  />
                                ))}
                                {dayEvents.slice(0, 1).map(event => (
                                  <div 
                                    key={event.id} 
                                    className="event-indicator-book"
                                    style={{ 
                                      backgroundColor: event.color || state.currentTheme.primary,
                                    }}
                                  />
                                ))}
                                {dayTasks.slice(0, 1).map(task => (
                                  <div 
                                    key={task.id} 
                                    className={`task-indicator-book ${task.completed ? 'completed-book' : ''}`}
                                    style={{ 
                                      borderLeft: `2px solid ${task.completed ? '#28a745' : state.currentTheme.secondary}`,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Page numbers */}
                      <div className="page-number">1</div>
                    </div>
                  </div>
                </div>
                
                {/* Book edges for 3D effect */}
                <div className="book-edge top-edge"></div>
                <div className="book-edge right-edge"></div>
                <div className="book-edge bottom-edge"></div>
              </div>
            </div>
          )}
          
          {activeTab === 'tasks' && (
            <div className="tasks-section">
              <div className="section-header">
                <h2>Tasks ({state.tasks.length})</h2>
                <div className="section-actions">
                  <button 
                    className={`toggle-button ${notificationsEnabled ? 'enabled' : ''}`}
                    onClick={handleNotificationToggle}
                  >
                    {notificationsEnabled ? '🔔' : '🔕'}
                  </button>
                  <button 
                    className={`toggle-button ${geofenceAlerts ? 'enabled' : ''}`}
                    onClick={handleAddGeofence}
                  >
                    📍
                  </button>
                  <button className="add-button">+</button>
                </div>
              </div>
              <div className="tasks-list">
                {state.tasks.map(task => (
                  <div key={task.id} className="task-item">
                    <input type="checkbox" />
                    <div className="task-info">
                      <h3>{task.content}</h3>
                      <p>Due: {new Date(task.date).toLocaleDateString()}</p>
                    </div>
                    <div className="task-actions">
                      <button>✏️</button>
                      <button>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'stickers' && (
            <div className="stickers-section">
              {/* Enhanced stickers section with custom sticker creation */}
              <div className="section-header">
                <h2>Stickers ({state.stickers.length})</h2>
                <div className="section-actions">
                  <button 
                    className={`toggle-button ${isDarkMode ? 'enabled' : ''}`}
                    onClick={handleDarkModeToggle}
                  >
                    {isDarkMode ? '🌙' : '☀️'}
                  </button>
                  {isDarkMode && (
                    <button 
                      className={`toggle-button ${isOledMode ? 'enabled' : ''}`}
                      onClick={handleOledModeToggle}
                    >
                      OLED
                    </button>
                  )}
                  <button 
                    className="add-button"
                    onClick={startCamera}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="stickers-list">
                {state.stickers.map(sticker => (
                  <div key={sticker.id} className="sticker-item">
                    {sticker.imageUrl ? (
                      <img 
                        src={sticker.imageUrl} 
                        alt={sticker.type} 
                        className="sticker-preview"
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div 
                        className="sticker-preview"
                        style={{
                          backgroundColor: 'blue',
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px'
                        }}
                      >
                        S
                      </div>
                    )}
                    <p>{sticker.type}</p>
                  </div>
                ))}
                
                {/* Add option to create custom sticker from captured image */}
                {capturedImage && (
                  <div className="custom-sticker-creation">
                    <h3>Create Custom Sticker</h3>
                    <img 
                      src={capturedImage} 
                      alt="Preview" 
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    <div className="sticker-actions">
                      <button 
                        onClick={() => {
                          // Create a new sticker from the captured image
                          const newSticker: DecorativeElement = {
                            id: `sticker-${Date.now()}`,
                            type: 'sticker',
                            position: {
                              dateX: new Date().toISOString(),
                              offsetY: 0,
                              zIndex: 0
                            },
                            imageUrl: capturedImage,
                            style: {
                              width: 50,
                              height: 50,
                              rotation: 0,
                              opacity: 1
                            }
                          };
                          addSticker(newSticker);
                          setCapturedImage(null);
                        }}
                      >
                        Save as Sticker
                      </button>
                      <button onClick={() => setCapturedImage(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom navigation with proper routing */}
      <div className="mobile-bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'events' ? 'active' : ''}`} 
          onClick={() => setActiveTab('events')}
        >
          📅
        </button>
        <button 
          className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} 
          onClick={() => setActiveTab('tasks')}
        >
          ✅
        </button>
        <button 
          className={`nav-item ${activeTab === 'stickers' ? 'active' : ''}`} 
          onClick={() => setActiveTab('stickers')}
        >
          💠
        </button>
        <button 
          className="nav-item" 
          onClick={() => setShowAnalytics(true)}
        >
          📊
        </button>
        <button 
          className="nav-item" 
          onClick={() => setShowSettings(true)}
        >
          ⚙️
        </button>
      </div>
      
      <style>{`
        .mobile-app {
          max-width: 100%;
          padding: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .camera-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
          z-index: 2000;
          display: flex;
          flex-direction: column;
        }
        
        .camera-overlay video {
          width: 100%;
          height: 80%;
          object-fit: cover;
        }
        
        .camera-controls {
          display: flex;
          justify-content: center;
          gap: 20px;
          padding: 20px;
        }
        
        .camera-controls button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: white;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .image-preview {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
          z-index: 2000;
          display: flex;
          flex-direction: column;
        }
        
        .image-preview img {
          width: 100%;
          height: 80%;
          object-fit: contain;
        }
        
        .image-actions {
          display: flex;
          justify-content: space-around;
          padding: 20px;
        }
        
        .image-actions button {
          padding: 10px 20px;
          background: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .mobile-header {
          background: #007bff;
          color: white;
          padding: 1rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .sync-indicator {
          font-size: 0.8rem;
        }
        
        .header-actions button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .sync-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          font-size: 14px;
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .status-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
        
        .status-indicator.online {
          background: #d4edda;
          color: #155724;
        }
        
        .status-indicator.offline {
          background: #f8d7da;
          color: #721c24;
        }
        
        .mobile-content {
          flex: 1;
          overflow-y: auto;
        }
        
        .section-tabs {
          display: flex;
          background: #e9ecef;
          border-bottom: 1px solid #dee2e6;
        }
        
        .tab {
          flex: 1;
          padding: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: bold;
        }
        
        .tab.active {
          background: white;
          border-bottom: 3px solid #007bff;
        }
        
        .content-section {
          padding: 1rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .section-actions {
          display: flex;
          gap: 10px;
        }
        
        .add-button, .location-button {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
        }
        
        .location-button {
          background: #28a745;
        }
        
        .location-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .toggle-button {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #6c757d;
          color: white;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .toggle-button.enabled {
          background: #28a745;
        }
        
        .events-list,
        .tasks-list,
        .stickers-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .event-item,
        .task-item,
        .sticker-item {
          padding: 15px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          background: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .task-item {
          gap: 10px;
        }
        
        .task-info {
          flex: 1;
        }
        
        .event-info h3,
        .task-info h3 {
          margin: 0 0 5px 0;
          font-size: 1rem;
        }
        
        .event-info p,
        .task-info p {
          margin: 0;
          font-size: 0.9rem;
          color: #6c757d;
        }
        
        .event-actions,
        .task-actions {
          display: flex;
          gap: 5px;
        }
        
        .event-actions button,
        .task-actions button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .sticker-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .sticker-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
        }
        
        .mobile-bottom-nav {
          display: flex;
          justify-content: space-around;
          background: #2c3e50;
          padding: 10px 0;
          position: sticky;
          bottom: 0;
          z-index: 100;
        }
        
        .nav-item {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #95a5a6;
        }
        
        .nav-item.active {
          color: #3498db;
        }
        
        @media (max-width: 768px) {
          .mobile-app {
            height: calc(100vh - var(--mobile-tab-bar-height, 56px));
          }
        }
        
        .dark-mode {
          --background-color: #1a1a1a;
          --text-color: #ffffff;
          --card-background: #2d2d2d;
        }
        
        .oled-mode {
          --background-color: #000000;
          --text-color: #ffffff;
          --card-background: #1a1a1a;
        }
        
        .custom-sticker-creation {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          background: white;
        }
        
        .sticker-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        
        .sticker-actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .book-container {
          margin: 20px auto;
          width: 90%;
          max-width: 350px;
          height: 500px;
          position: relative;
          perspective: 1500px;
          transform-style: preserve-3d;
        }
        
        /* Book spine with realistic texture */
        .book-spine {
          position: absolute;
          left: -40px;
          top: 0;
          width: 40px;
          height: 100%;
          background: linear-gradient(90deg, #5D2906, #8B4513, #5D2906);
          border-radius: 6px 0 0 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
          box-shadow: 
            -5px 0 10px rgba(0,0,0,0.5),
            inset 0 0 10px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        
        .spine-texture {
          position: absolute;
          width: 100%;
          height: 100%;
          background: 
            linear-gradient(90deg, transparent 49%, rgba(0,0,0,0.1) 50%, transparent 51%),
            linear-gradient(0deg, transparent 49%, rgba(0,0,0,0.05) 50%, transparent 51%);
          background-size: 4px 4px;
        }
        
        .spine-title {
          transform: rotate(-90deg);
          color: #F5DEB3;
          font-weight: bold;
          font-size: 0.8rem;
          letter-spacing: 1px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
          margin-top: 60px;
          white-space: nowrap;
        }
        
        .spine-logo {
          color: #F5DEB3;
          font-weight: bold;
          font-size: 1.2rem;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
          margin-bottom: 20px;
        }
        
        /* Book pages with realistic effects */
        .book-pages {
          display: flex;
          width: 100%;
          height: 100%;
          position: relative;
          box-shadow: 
            0 20px 50px rgba(0,0,0,0.5),
            10px 0 30px rgba(0,0,0,0.3);
          border-radius: 0 12px 12px 0;
          transform: translateZ(20px);
        }
        
        .book-page {
          width: 50%;
          height: 100%;
          background: #F5F5DC;
          position: relative;
          padding: 25px;
          box-sizing: border-box;
          border: 1px solid #D2B48C;
          box-shadow: 
            inset 0 0 20px rgba(0,0,0,0.1),
            0 0 5px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
        }
        
        .left-page {
          border-right: 1px dashed #D2B48C;
          border-radius: 12px 0 0 12px;
          background: linear-gradient(135deg, #F8F8E8, #F0F0D8);
        }
        
        .right-page {
          border-radius: 0 12px 12px 0;
          background: linear-gradient(135deg, #FAFAEA, #F2F2DA);
        }
        
        /* Paper texture */
        .page-texture {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(90deg, transparent 99%, rgba(0,0,0,0.02) 100%),
            linear-gradient(0deg, transparent 99%, rgba(0,0,0,0.02) 100%);
          background-size: 3px 3px;
          opacity: 0.3;
          pointer-events: none;
        }
        
        .page-content {
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 2;
        }
        
        .page-header {
          font-size: 1.8rem;
          font-weight: bold;
          color: #5D2906;
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 3px double #D2B48C;
          padding-bottom: 15px;
          font-family: 'Georgia', serif;
        }
        
        .page-subtitle {
          font-size: 1.1rem;
          color: #8B4513;
          text-align: center;
          margin-bottom: 25px;
          font-style: italic;
        }
        
        .page-text {
          color: #5D2906;
          font-style: italic;
          text-align: center;
          line-height: 1.8;
          margin-top: 30px;
          font-size: 0.9rem;
        }
        
        /* Corner decorations */
        .page-decoration {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .corner-decoration {
          position: absolute;
          width: 30px;
          height: 30px;
          border: 2px solid #D2B48C;
          opacity: 0.3;
        }
        
        .corner-decoration.top-left {
          top: 20px;
          left: 20px;
          border-right: none;
          border-bottom: none;
        }
        
        .corner-decoration.top-right {
          top: 20px;
          right: 20px;
          border-left: none;
          border-bottom: none;
        }
        
        .corner-decoration.bottom-left {
          bottom: 20px;
          left: 20px;
          border-right: none;
          border-top: none;
        }
        
        .corner-decoration.bottom-right {
          bottom: 20px;
          right: 20px;
          border-left: none;
          border-top: none;
        }
        
        /* Calendar styling */
        .calendar-header-book {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 2px solid #D2B48C;
        }
        
        .calendar-header-book h3 {
          margin: 0;
          font-size: 1.3rem;
          color: #5D2906;
          font-weight: 600;
          font-family: 'Georgia', serif;
        }
        
        .nav-button-book {
          background: #8B4513;
          color: #F5DEB3;
          border: none;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 
            0 3px 6px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.2);
          transition: all 0.2s ease;
        }
        
        .nav-button-book:hover {
          background: #A0522D;
          transform: scale(1.1);
        }
        
        .calendar-grid-header-book {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: bold;
          padding: 10px 0;
          background: #F5DEB3;
          border-radius: 6px;
          margin-bottom: 10px;
          color: #5D2906;
          font-size: 0.9rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .calendar-grid-book {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
          flex: 1;
        }
        
        .calendar-day-book {
          background: #FAF9F6;
          border: 1px solid #D2B48C;
          border-radius: 6px;
          padding: 5px;
          text-align: right;
          font-size: 0.9rem;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            inset 0 0 5px rgba(0,0,0,0.05),
            0 1px 2px rgba(0,0,0,0.05);
        }
        
        .calendar-day-book:hover {
          background: #F5DEB3;
          transform: translateY(-3px);
          box-shadow: 
            0 4px 8px rgba(0,0,0,0.15),
            inset 0 0 8px rgba(0,0,0,0.1);
          z-index: 3;
        }
        
        .calendar-day-book.today-book {
          background: #FFD700;
          border: 2px solid #FFA500;
          box-shadow: 
            0 0 8px rgba(255,165,0,0.7),
            inset 0 0 5px rgba(255,215,0,0.5);
          z-index: 2;
        }
        
        .calendar-day-book.other-month-book {
          background: #F0E6D2;
          color: #A0A0A0;
        }
        
        .calendar-day-book.has-content-book {
          background: #E6F3FF;
          border: 1px solid #ADD8E6;
        }
        
        .day-number-book {
          font-weight: 700;
          margin-bottom: 3px;
          color: #5D2906;
        }
        
        .day-indicators-book {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .decoration-indicator-book, 
        .event-indicator-book, 
        .task-indicator-book {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          align-self: flex-end;
        }
        
        .event-indicator-book {
          border-radius: 2px;
          height: 4px;
        }
        
        .task-indicator-book {
          border-radius: 0;
          width: 6px;
          height: 10px;
        }
        
        .task-indicator-book.completed-book {
          opacity: 0.5;
        }
        
        /* Page numbers */
        .page-number {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 0.8rem;
          color: #8B4513;
          font-style: italic;
        }
        
        /* Book edges for 3D effect */
        .book-edge {
          position: absolute;
          background: linear-gradient(90deg, #3D1C02, #5D2906);
          box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
        }
        
        .top-edge {
          top: -5px;
          left: 0;
          right: -5px;
          height: 5px;
          border-radius: 6px 6px 0 0;
        }
        
        .right-edge {
          right: -5px;
          top: 0;
          bottom: -5px;
          width: 5px;
          border-radius: 0 6px 6px 0;
        }
        
        .bottom-edge {
          bottom: -5px;
          left: 0;
          right: -5px;
          height: 5px;
          border-radius: 0 0 6px 6px;
        }
        
        /* Page edge effect */
        .book-page::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 15px;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.08));
          border-radius: 0 12px 12px 0;
          pointer-events: none;
        }
        
        .left-page::after {
          left: 0;
          right: auto;
          border-radius: 12px 0 0 12px;
          background: linear-gradient(270deg, transparent, rgba(0,0,0,0.08));
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 3000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
          flex: 1;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 5px;
        }

        .modal-body {
          padding: 20px;
        }

        .settings-section {
          margin-bottom: 24px;
        }

        .settings-section h3 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 16px;
        }

        .setting-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 14px;
        }

        .setting-item input[type="checkbox"] {
          margin-right: 8px;
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
});

// Memoize the component for better performance
export default memo(MobileApp);