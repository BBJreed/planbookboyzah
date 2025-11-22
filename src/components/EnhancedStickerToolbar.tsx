import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../stores/appStore';
import { DecorativeElement } from '../types';

interface StickerToolbarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StickerToolbar: React.FC<StickerToolbarProps> = ({ isOpen, onClose }) => {
  const { addDecoration, selectedDate } = useStore();
  const [rotation, setRotation] = useState(0);
  const [size, setSize] = useState(40);
  const [activeTab, setActiveTab] = useState('stickers'); // 'stickers', 'camera', 'upload'
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [stickerLibrary, setStickerLibrary] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Initialize sticker library with example stickers and emoji
  useEffect(() => {
    const initialStickers = [
      'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f389.png', // party
      'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/2728.png', // sparkles
      'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f31f.png', // star
      'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f49c.png', // purple heart
      'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f308.png', // rainbow
      'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f680.png', // rocket
    ];
    setStickerLibrary(initialStickers);
  }, []);

  // Free sticker categories (emoji)
  const freeStickerCategories = {
    emotions: ['😀', '😂', '🥰', '😍', '🤩', '😊', '😎', '🤔', '😴', '🤗'],
    nature: ['🌟', '⭐', '✨', '🌙', '☀️', '🌈', '🌸', '🌺', '🍀', '🦋'],
    objects: ['🎈', '🎁', '🎂', '🎉', '🏆', '📚', '✏️', '📝', '❤️', '💡'],
    food: ['🍎', '🍕', '🍰', '🍭', '🍪', '🥤', '☕', '🍯', '🍓', '🥑'],
    activities: ['🎨', '🎵', '🎮', '📷', '✈️', '🚲', '🏃‍♀️', '💪', '🧘‍♀️', '📖']
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCameraPreview(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access denied or error:', error);
      alert('Allow camera permission in browser settings.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const newStickerUrl = canvas.toDataURL('image/png');
      
      // Add to sticker library
      setStickerLibrary(prev => [...prev, newStickerUrl]);
      
      // Stop camera and close preview
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraPreview(false);
  };

  // File upload functionality
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStickerLibrary(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Place sticker function
  const placeSticker = (stickerUrl: string, isEmoji: boolean = false) => {
    const newSticker: DecorativeElement = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      position: {
        dateX: selectedDate.toISOString(),
        offsetY: Math.random() * 100, // Random position
        zIndex: 100
      },
      imageUrl: isEmoji ? undefined : stickerUrl,
      content: isEmoji ? stickerUrl : undefined,
      style: {
        width: size,
        height: size,
        rotation: rotation,
        opacity: 1
      }
    };

    addDecoration(newSticker);
    
    // Add visual feedback
    console.log('Sticker added to calendar:', newSticker);
  };

  if (!isOpen) return null;

  return (
    <div className="sticker-toolbar-overlay">
      <div className="sticker-toolbar">
        <div className="sticker-header">
          <h2>🎨 Stickers & Photos</h2>
          <button onClick={onClose} className="close-btn">❌</button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab ${activeTab === 'stickers' ? 'active' : ''}`}
            onClick={() => setActiveTab('stickers')}
          >
            🏷️ Stickers
          </button>
          <button 
            className={`tab ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={() => setActiveTab('camera')}
          >
            📷 Camera
          </button>
          <button 
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📁 Upload
          </button>
        </div>

        {/* Stickers Tab */}
        {activeTab === 'stickers' && (
          <div className="stickers-content">
            {/* Emoji Categories */}
            <div className="emoji-categories">
              <h3>Free Emoji Stickers</h3>
              {Object.entries(freeStickerCategories).map(([category, emojis]) => (
                <div key={category} className="emoji-category">
                  <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                  <div className="emoji-grid">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        className="emoji-sticker"
                        onClick={() => placeSticker(emoji, true)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Premium Stickers */}
            <div className="premium-stickers">
              <h3>Premium Stickers</h3>
              <div className="sticker-grid">
                {stickerLibrary.map((stickerUrl, index) => (
                  <img
                    key={index}
                    src={stickerUrl}
                    alt="Sticker"
                    className="sticker-preview"
                    onClick={() => placeSticker(stickerUrl)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="camera-content">
            <h3>📷 Take Photo</h3>
            {!showCameraPreview ? (
              <button onClick={startCamera} className="camera-btn">
                Start Camera
              </button>
            ) : (
              <div className="camera-preview">
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '300px' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="camera-controls">
                  <button onClick={capturePhoto} className="capture-btn">
                    📸 Capture
                  </button>
                  <button onClick={stopCamera} className="stop-camera-btn">
                    ❌ Stop
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="upload-content">
            <h3>📁 Upload Image</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
            >
              Choose Image
            </button>
            <p>Upload your own images to use as stickers!</p>
          </div>
        )}

        {/* Controls */}
        <div className="sticker-controls">
          <div className="control-group">
            <label>Size: {size}px</label>
            <input
              type="range"
              min="20"
              max="100"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </div>
          <div className="control-group">
            <label>Rotation: {rotation}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <style>{`
        .sticker-toolbar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .sticker-toolbar {
          background: white;
          border-radius: 12px;
          padding: 20px;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .sticker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 15px;
        }

        .sticker-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
        }

        .tab-navigation {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab {
          background: none;
          border: none;
          padding: 10px 15px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .tab.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
          font-weight: 600;
        }

        .emoji-category {
          margin-bottom: 20px;
        }

        .emoji-category h4 {
          margin: 0 0 10px 0;
          color: #4a5568;
          font-size: 0.9rem;
          text-transform: capitalize;
        }

        .emoji-grid, .sticker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
          gap: 8px;
          margin-bottom: 15px;
        }

        .emoji-sticker {
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .emoji-sticker:hover {
          background: #f3f4f6;
          transform: scale(1.1);
        }

        .sticker-preview {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid #e5e7eb;
          transition: transform 0.2s ease;
        }

        .sticker-preview:hover {
          transform: scale(1.1);
        }

        .camera-btn, .capture-btn, .stop-camera-btn, .upload-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          margin: 5px;
          transition: background 0.2s ease;
        }

        .camera-btn:hover, .capture-btn:hover, .upload-btn:hover {
          background: #2563eb;
        }

        .stop-camera-btn {
          background: #ef4444;
        }

        .stop-camera-btn:hover {
          background: #dc2626;
        }

        .camera-controls {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
        }

        .sticker-controls {
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
          margin-top: 20px;
        }

        .control-group {
          margin-bottom: 15px;
        }

        .control-group label {
          display: block;
          margin-bottom: 5px;
          font-size: 0.9rem;
          color: #4a5568;
        }

        .control-group input[type="range"] {
          width: 100%;
        }
      `}</style>
    </div>
  );
};