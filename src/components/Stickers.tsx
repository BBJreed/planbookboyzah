import React, { useRef } from 'react';
import { useStore } from '../stores/appStore';

const Stickers: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stickers, addSticker } = useStore();

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.display = 'block';
      }
    } catch (error) {
      alert('Camera error: ' + error);
    }
  };

  const capture = () => {
    const canvas = document.createElement('canvas');
    if (videoRef.current && videoRef.current.srcObject) {
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const url = canvas.toDataURL('image/png');
        addSticker(url);
        
        // Stop the camera stream
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.style.display = 'none';
      }
    }
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={handleCamera}
          style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: '#f5f5f5' }}
        >
          Camera
        </button>
        <button 
          onClick={capture}
          style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: '#f5f5f5' }}
        >
          Capture Sticker
        </button>
      </div>
      
      <video 
        ref={videoRef} 
        autoPlay 
        style={{ display: 'none', width: '100%', maxWidth: '300px', margin: '10px 0' }} 
      />
      
      {/* Display sticker library */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
        <h4>Sticker Library:</h4>
        {stickers.map((url, i) => (
          <img 
            key={i} 
            src={url} 
            alt="Sticker" 
            style={{ width: '50px', height: '50px', objectFit: 'cover', border: '1px solid #ddd', borderRadius: '4px' }} 
          />
        ))}
      </div>
    </div>
  );
};

export default Stickers;