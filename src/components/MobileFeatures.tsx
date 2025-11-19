import React, { useState, useEffect, useRef } from 'react';

interface MobileFeaturesProps {
  isOnline: boolean;
  isMobile: boolean;
  onRefresh: () => void;
}

const MobileFeatures: React.FC<MobileFeaturesProps> = ({ isOnline, isMobile }) => {

  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [pullToRefreshActive] = useState(false);

  const [isListening, setIsListening] = useState(false);

  const [showVoiceButton, setShowVoiceButton] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
      setTimeout(() => setShowOfflineBanner(false), 5000);
    }
  }, [isOnline]);

  // Initialize speech recognition
  useEffect(() => {
    if (isMobile && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setShowVoiceButton(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isMobile]);

  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // In a real app, this would process the voice command
    // For demo, we'll just show an alert
    alert(`Voice command: ${command}`);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  if (!isMobile) return null;

  return (
    <>
      {/* Offline indicator */}
      {showOfflineBanner && (
        <div className="mobile-offline-banner">
          <div className="offline-content">
            <span>⚠️ Offline mode</span>
            <button onClick={() => setShowOfflineBanner(false)}>×</button>
          </div>
        </div>
      )}

      {/* Voice input button */}
      {showVoiceButton && (
        <div className="voice-input-button">
          <button 
            className={`mic-button ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? '🛑' : '🎤'}
          </button>
        </div>
      )}

      {/* Pull to refresh indicator */}
      {pullToRefreshActive && (
        <div className="pull-to-refresh-indicator">
          <div className="spinner"></div>
          <span>Release to refresh</span>
        </div>
      )}

      <style>{`
        .mobile-offline-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #f8d7da;
          color: #721c24;
          padding: 0.5rem 1rem;
          text-align: center;
          z-index: 1001;
          display: flex;
          justify-content: center;
        }

        .offline-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .offline-content button {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #721c24;
        }

        .voice-input-button {
          position: fixed;
          bottom: 80px;
          right: 20px;
          z-index: 1000;
        }

        .mic-button {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }

        .mic-button.listening {
          background: #dc3545;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .pull-to-refresh-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #3498db;
          color: white;
          padding: 1rem;
          text-align: center;
          z-index: 1002;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .mobile-offline-banner {
            display: block;
          }
        }
      `}</style>
    </>
  );
};

export default MobileFeatures;