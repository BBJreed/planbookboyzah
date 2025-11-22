import React, { memo } from 'react';
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

export const CalendarCanvas: React.FC<CalendarCanvasProps> = memo(({ width, height }) => {
  const {
    canvasRef,
    cellDimensions,
    visibility,
    events,
    decorations,
    handwriting,
    tasks,
    dateToPosition,
    startDraggingSticker,
    startResizingSticker
  } = useCalendarCanvas(width, height);

  // Generate calendar days for the current month
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and calculate starting point
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
  
  // Generate 42 days (6 weeks) for a complete calendar grid
  const calendarDays = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    calendarDays.push(date);
  }

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'transparent'
      }}
    >
      {/* Render calendar days as React elements instead of SVG */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        width: '100%',
        height: '100%'
      }}>
        {calendarDays.map((date) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toDateString() === currentDate.toDateString();
          const dayNumber = date.getDate();
          
          return (
            <div
              key={date.toISOString()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isToday ? '#fef3c7' : (isCurrentMonth ? 'white' : '#f8f9fa'),
                color: isCurrentMonth ? '#1f2937' : '#9ca3af',
                fontWeight: isToday ? 'bold' : 'normal',
                border: '1px solid #e5e7eb',
                minHeight: '30px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onClick={() => {
                // Handle date click
                console.log('Selected date:', date);
              }}
              onMouseEnter={(e) => {
                if (isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isToday ? '#fef3c7' : (isCurrentMonth ? 'white' : '#f8f9fa');
              }}
            >
              {dayNumber}
            </div>
          );
        })}
      </div>
      
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