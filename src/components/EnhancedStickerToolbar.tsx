import React, { useState, useRef } from 'react';
import { useStore } from '../stores/appStore';
import { DecorativeElement } from '../types';
import { useCamera } from '../hooks/useCamera';

interface StickerToolbarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StickerToolbar: React.FC<StickerToolbarProps> = ({ isOpen, onClose }) => {
  const { addDecoration, selectedDate } = useStore();
  const [rotation, setRotation] = useState(0);
  const [size, setSize] = useState(40);
  const [activeTab, setActiveTab] = useState('free'); // 'free', 'camera', 'custom'
  const [cropMode, setCropMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { takePhoto, stream, startCamera, stopCamera } = useCamera();
  
  // Free sticker libraries (using emoji and free icons)
  const freeStickerCategories = {
    emotions: ['😀', '😂', '🥰', '😍', '🤩', '😊', '😎', '🤔', '😴', '🤗'],
    nature: ['🌟', '⭐', '✨', '🌙', '☀️', '🌈', '🌸', '🌺', '🍀', '🦋'],
    objects: ['🎈', '🎁', '🎂', '🎉', '🏆', '📚', '✏️', '📝', '❤️', '💡'],
    food: ['🍎', '🍕', '🍰', '🍭', '🍪', '🥤', '☕', '🍯', '🍓', '🥑'],
    activities: ['🎨', '🎵', '🎮', '📷', '✈️', '🚲', '🏃‍♀️', '💪', '🧘‍♀️', '📖']
  };
  
  // Sample premium-style sticker URLs (free resources)
  const premiumStickers = [
    'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f389.png', // party
    'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/2728.png', // sparkles
    'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f31f.png', // star
    'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f49c.png', // purple heart
    'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f308.png', // rainbow
    'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f680.png', // rocket
  ];

  const handleStickerSelect = (imageUrl: string, isEmoji: boolean = false) => {
    const newSticker: DecorativeElement = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      position: {
        dateX: selectedDate.toISOString(),
        offsetY: 0,
        zIndex: 100
      },
      imageUrl: isEmoji ? undefined : imageUrl,
      content: isEmoji ? imageUrl : undefined,
      style: {
        width: size,
        height: size,
        rotation: rotation,
        opacity: 1
      }
    };
    
    addDecoration(newSticker);
    onClose();
  };

  const handleCameraCapture = async () => {
    try {
      await startCamera();
      const photoData = takePhoto();
      if (photoData) {
        setSelectedImage(photoData);
        setCropMode(true);
      }
      stopCamera();
    } catch (error) {
      console.error('Failed to capture photo:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setCropMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = () => {
    if (selectedImage) {
      handleStickerSelect(selectedImage);
      setCropMode(false);
      setSelectedImage(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>🎨 Stickers & Photos</h2>
          <button onClick={onClose} style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '24px', 
            cursor: 'pointer' 
          }}>✕</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #eee' }}>
          <button 
            onClick={() => setActiveTab('free')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'free' ? '#4299e1' : 'transparent',
              color: activeTab === 'free' ? 'white' : '#666',
              borderRadius: '10px 10px 0 0'
            }}
          >
            Free Stickers
          </button>
          <button 
            onClick={() => setActiveTab('camera')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'camera' ? '#4299e1' : 'transparent',
              color: activeTab === 'camera' ? 'white' : '#666',
              borderRadius: '10px 10px 0 0'
            }}
          >
            📷 Camera
          </button>
          <button 
            onClick={() => setActiveTab('custom')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'custom' ? '#4299e1' : 'transparent',
              color: activeTab === 'custom' ? 'white' : '#666',
              borderRadius: '10px 10px 0 0'
            }}
          >
            Upload Photo
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label>Size: {size}px</label>
            <input 
              type="range" 
              min="20" 
              max="100" 
              value={size} 
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Rotation: {rotation}°</label>
            <input 
              type="range" 
              min="0" 
              max="360" 
              value={rotation} 
              onChange={(e) => setRotation(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'free' && (
          <div>
            {Object.entries(freeStickerCategories).map(([category, emojis]) => (
              <div key={category} style={{ marginBottom: '20px' }}>
                <h3 style={{ textTransform: 'capitalize', marginBottom: '10px' }}>{category}</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', 
                  gap: '10px' 
                }}>
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleStickerSelect(emoji, true)}
                      style={{
                        fontSize: '24px',
                        padding: '10px',
                        border: '2px solid #eee',
                        borderRadius: '10px',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f8ff';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            <div style={{ marginTop: '30px' }}>
              <h3>Premium Style</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
                gap: '10px' 
              }}>
                {premiumStickers.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => handleStickerSelect(url)}
                    style={{
                      padding: '5px',
                      border: '2px solid #eee',
                      borderRadius: '10px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <img 
                      src={url} 
                      alt="Sticker" 
                      style={{ width: '40px', height: '40px' }}
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'camera' && (
          <div style={{ textAlign: 'center' }}>
            {stream !== null ? (
              <div>
                <p style={{ marginBottom: '20px' }}>Take a photo to turn into a sticker!</p>
                <button 
                  onClick={handleCameraCapture}
                  style={{
                    padding: '15px 30px',
                    fontSize: '18px',
                    background: 'linear-gradient(145deg, #48bb78, #38a169)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer'
                  }}
                >
                  📸 Take Photo
                </button>
              </div>
            ) : (
              <p>Camera not supported on this device</p>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '20px' }}>Upload your own photo to turn into a sticker!</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                background: 'linear-gradient(145deg, #ed8936, #dd6b20)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer'
              }}
            >
              📁 Choose Photo
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Crop Modal */}
        {cropMode && selectedImage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center'
            }}>
              <h3>Preview Your Sticker</h3>
              <div style={{ 
                margin: '20px 0',
                transform: `rotate(${rotation}deg)`
              }}>
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  style={{ 
                    width: `${size}px`, 
                    height: `${size}px`,
                    borderRadius: '10px',
                    objectFit: 'cover'
                  }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={handleCropConfirm}
                  style={{
                    padding: '10px 20px',
                    background: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Add to Planner
                </button>
                <button 
                  onClick={() => { setCropMode(false); setSelectedImage(null); }}
                  style={{
                    padding: '10px 20px',
                    background: '#e53e3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};