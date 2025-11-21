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

  // Calculate which half of the calendar to show based on page position
  const totalDays = days.length;
  const daysPerPage = Math.ceil(totalDays / 2);
  const startIndex = pagePosition === 'left' ? 0 : daysPerPage;
  const endIndex = pagePosition === 'left' ? daysPerPage : totalDays;
  const pageDays = days.slice(startIndex, endIndex);

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
        width={cellDimensions.width * Math.min(7, pageDays.length)}
        height={cellDimensions.height * Math.ceil(pageDays.length / 7)}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleStickerDrop(e)}
      >
        {pageDays.map((day, index) => {
          const row = Math.floor(index / 7);
          const col = index % 7;
          
          return (
            <g key={day.toISOString()}>
              <rect
                x={col * cellDimensions.width}
                y={row * cellDimensions.height}
                width={cellDimensions.width}
                height={cellDimensions.height}
                fill="white"
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text
                x={col * cellDimensions.width + 10}
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
                    x1={col * cellDimensions.width}
                    y1={row * cellDimensions.height + 40 + slotIndex * 20}
                    x2={col * cellDimensions.width + cellDimensions.width}
                    y2={row * cellDimensions.height + 40 + slotIndex * 20}
                    stroke="#f3f4f6"
                    strokeWidth={1}
                  />
                  {col === 0 && slotIndex % 2 === 0 && (
                    <text
                      x={col * cellDimensions.width - 10}
                      y={row * cellDimensions.height + 40 + slotIndex * 20 + 5}
                      fontSize={10}
                      fill="#9ca3af"
                      textAnchor="end"
                    >
                      {slot.label}
                    </text>
                  )}
                </g>
              ))}
            </g>
          );
        })}
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