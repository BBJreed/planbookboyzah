import React from 'react';
import { HandwritingStroke } from '../types';

interface HandwritingLayerProps {
  handwriting: HandwritingStroke[];
  cellDimensions: { width: number; height: number };
  dateToPosition: (dateString: string) => { x: number; y: number };
  visibility: { handwriting: boolean };
}

export const HandwritingLayer: React.FC<HandwritingLayerProps> = ({ 
  handwriting, 
  dateToPosition, 
  visibility 
}) => {
  if (!visibility.handwriting) return null;
  
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        pointerEvents: 'none'
      }}
    >
      {handwriting.map(stroke => {
        const position = dateToPosition(stroke.position.dateX);
        
        return (
          <g key={stroke.id} transform={`translate(${position.x}, ${position.y})`}>
            {stroke.bezierCurves.map((curve, index) => (
              <path
                key={index}
                d={`M ${curve.startX} ${curve.startY} C ${curve.controlPoint1X} ${curve.controlPoint1Y}, ${curve.controlPoint2X} ${curve.controlPoint2Y}, ${curve.endX} ${curve.endY}`}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};