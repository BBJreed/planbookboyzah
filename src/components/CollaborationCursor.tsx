import React, { useEffect, useState } from 'react';

interface CollaborationCursorProps {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
}

export const CollaborationCursor: React.FC<CollaborationCursorProps> = ({ 
  username, 
  x, 
  y, 
  color 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Hide cursor after 3 seconds of inactivity
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [x, y]);
  
  if (!isVisible) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 10000,
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease-out'
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path
          d="M1.5 1.5L18.5 10L1.5 18.5Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: -25,
          left: 10,
          backgroundColor: color,
          color: 'white',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {username}
      </div>
    </div>
  );
};