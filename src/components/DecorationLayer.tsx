import React from 'react';
import { DecorativeElement } from '../types';

interface DecorationLayerProps {
  decorations: DecorativeElement[];
  cellDimensions: { width: number; height: number };
  dateToPosition: (dateString: string) => { x: number; y: number };
  visibility: { decorations: boolean };
  startDraggingSticker: (e: React.MouseEvent, stickerId: string) => void;
  startResizingSticker: (e: React.MouseEvent, stickerId: string, handle: string) => void;
}

export const DecorationLayer: React.FC<DecorationLayerProps> = ({ 
  decorations, 
  dateToPosition, 
  visibility,
  startDraggingSticker,
  startResizingSticker
}) => {
  if (!visibility.decorations) return null;
  
  return (
    <>
      {decorations.map(decoration => {
        const position = dateToPosition(decoration.position.dateX);
        
        // Only make stickers interactive
        const isSticker = decoration.type === 'sticker';
        
        return (
          <div
            key={decoration.id}
            style={{
              position: 'absolute',
              left: position.x + decoration.position.offsetY,
              top: position.y,
              width: decoration.style.width,
              height: decoration.style.height,
              transform: `rotate(${decoration.style.rotation}deg)`,
              opacity: decoration.style.opacity,
              zIndex: decoration.position.zIndex,
              pointerEvents: isSticker ? 'auto' : 'none',
              cursor: isSticker ? 'move' : 'default',
              border: isSticker ? '1px dashed transparent' : 'none'
            }}
            onMouseOver={(e) => {
              if (isSticker) {
                e.currentTarget.style.border = '1px dashed #3b82f6';
              }
            }}
            onMouseOut={(e) => {
              if (isSticker) {
                e.currentTarget.style.border = '1px dashed transparent';
              }
            }}
            onMouseDown={(e) => {
              if (isSticker) {
                startDraggingSticker(e, decoration.id);
              }
            }}
          >
            {decoration.type === 'sticker' && decoration.imageUrl && (
              <>
                <img 
                  src={decoration.imageUrl} 
                  alt="sticker"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                {/* Resize handles */}
                {isSticker && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        right: -5,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 10,
                        height: 10,
                        backgroundColor: '#3b82f6',
                        borderRadius: '50%',
                        cursor: 'ew-resize'
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        startResizingSticker(e, decoration.id, 'right');
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -5,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 10,
                        height: 10,
                        backgroundColor: '#3b82f6',
                        borderRadius: '50%',
                        cursor: 'ns-resize'
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        startResizingSticker(e, decoration.id, 'bottom');
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: -5,
                        bottom: -5,
                        width: 10,
                        height: 10,
                        backgroundColor: '#3b82f6',
                        borderRadius: '50%',
                        cursor: 'nwse-resize'
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        startResizingSticker(e, decoration.id, 'bottom-right');
                      }}
                    />
                  </>
                )}
              </>
            )}
            {decoration.type === 'text' && (
              <span style={{ fontSize: 14, fontWeight: 600 }}>{decoration.content}</span>
            )}
            {decoration.type === 'shape' && decoration.svgPath && (
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <path d={decoration.svgPath} fill="currentColor" />
              </svg>
            )}
          </div>
        );
      })}
    </>
  );
};