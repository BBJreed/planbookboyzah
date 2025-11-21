import React, { memo } from 'react';
import { format } from 'date-fns';
import { useCalendarCanvas } from './useCalendarCanvas';
import { EventLayer } from './EventLayer';
import { TaskLayer } from './TaskLayer';
import { DecorationLayer } from './DecorationLayer';
import { HandwritingLayer } from './HandwritingLayer';

interface CalendarCanvasProps {
  width: number;
  height: number;
  pagePosition?: 'left' | 'right';
}

// Memoize the CalendarCanvas component for better performance
export const CalendarCanvas: React.FC<CalendarCanvasProps> = memo(({ width, height, pagePosition = 'left' }) => {
  const {
    canvasRef,
    cellDimensions,
    days,
    timeSlots,
    visibility,
    events,
    decorations,
    handwriting,
    tasks,
    dateToPosition,
    handleStickerDrop,
    startDraggingSticker,
    startResizingSticker,
    applyThemeTemplate
  } = useCalendarCanvas(width, height);

  // Calculate which columns to show based on page position
  const totalColumns = 7; // Days of the week
  const leftPageColumns = 4; // Show 4 columns on left page (Sun, Mon, Tue, Wed)
  
  const startColumn = pagePosition === 'left' ? 0 : leftPageColumns;
  const endColumn = pagePosition === 'left' ? leftPageColumns : totalColumns;
  const pageColumns = endColumn - startColumn;

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'auto',
        backgroundColor: '#ffffff',
        ...applyThemeTemplate()
      }}
    >
      <svg
        width={cellDimensions.width * pageColumns}
        height={cellDimensions.height * Math.ceil(days.length / 7)}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleStickerDrop(e)}
      >
        {days.map((day, index) => {
          const row = Math.floor(index / 7);
          const col = index % 7;
          
          // Only render if this column is on the current page
          if (col < startColumn || col >= endColumn) {
            return null;
          }
          
          // Adjust column position for the page
          const pageCol = col - startColumn;
          
          return (
            <g key={day.toISOString()}>
              <rect
                x={pageCol * cellDimensions.width}
                y={row * cellDimensions.height}
                width={cellDimensions.width}
                height={cellDimensions.height}
                fill="white"
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text
                x={pageCol * cellDimensions.width + 10}
                y={row * cellDimensions.height + 20}
                fontSize={14}
                fontWeight="600"
                fill="#374151"
              >
                {format(day, 'd')}
              </text>
              
              {/* Time slots for weekly view */}
              {timeSlots.map((slot, slotIndex) => (
                <g key={slotIndex}>
                  <line
                    x1={pageCol * cellDimensions.width}
                    y1={row * cellDimensions.height + 40 + slotIndex * 20}
                    x2={(pageCol + 1) * cellDimensions.width}
                    y2={row * cellDimensions.height + 40 + slotIndex * 20}
                    stroke="#f3f4f6"
                    strokeWidth={0.5}
                  />
                  <text
                    x={pageCol * cellDimensions.width + 5}
                    y={row * cellDimensions.height + 35 + slotIndex * 20}
                    fontSize={10}
                    fill="#9ca3af"
                  >
                    {typeof slot === 'string' ? slot : slot.label}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
        
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          .slice(startColumn, endColumn)
          .map((dayName, index) => (
            <text
              key={dayName}
              x={index * cellDimensions.width + cellDimensions.width / 2}
              y={15}
              fontSize={12}
              fontWeight="bold"
              fill="#6b7280"
              textAnchor="middle"
            >
              {dayName}
            </text>
          ))}
      </svg>
      
      <EventLayer 
        events={events} 
        cellDimensions={cellDimensions} 
        dateToPosition={dateToPosition} 
        visibility={visibility} 
      />
      
      <TaskLayer 
        tasks={tasks} 
        cellDimensions={cellDimensions} 
        dateToPosition={dateToPosition} 
        visibility={visibility} 
      />
      
      <DecorationLayer 
        decorations={decorations} 
        cellDimensions={cellDimensions} 
        dateToPosition={dateToPosition} 
        visibility={visibility} 
        startDraggingSticker={startDraggingSticker}
        startResizingSticker={startResizingSticker}
      />
      
      <HandwritingLayer 
        handwriting={handwriting} 
        cellDimensions={cellDimensions} 
        dateToPosition={dateToPosition} 
        visibility={visibility} 
      />
    </div>
  );
});

// Add display name for debugging
CalendarCanvas.displayName = 'CalendarCanvas';