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

  // Generate calendar days for November 2025 with specific current date
  const currentDate = new Date(2025, 10, 21); // November 21, 2025
  const year = 2025;
  const month = 10; // November (0-indexed)
  
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
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Week headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        marginBottom: '2px'
      }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#374151',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              padding: '8px',
              border: '1px solid #4b5563'
            }}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        width: '100%',
        flex: 1
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
                backgroundColor: isToday ? '#ffd700' : (isCurrentMonth ? 'white' : '#f8f9fa'),
                color: isCurrentMonth ? '#1f2937' : '#9ca3af',
                fontWeight: isToday ? 'bold' : 'normal',
                border: '1px solid #ddd',
                minHeight: '40px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                position: 'relative'
              }}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', date.toISOString());
                console.log('Drag started from:', date);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const draggedDate = e.dataTransfer.getData('text/plain');
                console.log('Dropped on:', date, 'From:', draggedDate);
                // Handle drop logic here
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                console.log('Selected date:', date);
              }}
              onMouseEnter={(e) => {
                if (isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = isToday ? '#ffed4e' : '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isToday ? '#ffd700' : (isCurrentMonth ? 'white' : '#f8f9fa');
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