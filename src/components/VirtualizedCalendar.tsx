import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../stores/appStore';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

interface VirtualizedCalendarProps {
  width: number;
  height: number;
}

export const VirtualizedCalendar: React.FC<VirtualizedCalendarProps> = ({ width, height }) => {
  const {
    events,
    decorations,
    handwriting,
    tasks,
    visibility,
    selectedDate,
    zoomLevel,
    viewMode
  } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Calculate container dimensions
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerDimensions({ width, height });
    }
  }, [width, height]);

  // Calculate visible range based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollTop = containerRef.current.scrollTop;
      const containerHeight = containerDimensions.height;
      
      // Calculate visible range (simplified for demo)
      const start = Math.floor(scrollTop / 100);
      const end = start + Math.ceil(containerHeight / 100) + 5; // Add buffer
      
      setVisibleRange({ start, end });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial calculation
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [containerDimensions]);

  const generateCalendarDays = () => {
    if (viewMode === 'weekly') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const days = generateCalendarDays();

  // Only render visible days


  const dateToPosition = (dateString: string): { x: number, y: number } => {
    const targetDate = new Date(dateString);
    const dayIndex = days.findIndex(day => isSameDay(day, targetDate));
    
    if (dayIndex === -1) return { x: 0, y: 0 };
    
    const row = viewMode === 'weekly' ? 0 : Math.floor(dayIndex / 7);
    const col = dayIndex % 7;
    
    const cellWidth = containerDimensions.width / 7;
    const cellHeight = viewMode === 'weekly' ? containerDimensions.height / 4 : containerDimensions.height / 6;
    
    return {
      x: col * cellWidth * zoomLevel,
      y: row * cellHeight * zoomLevel
    };
  };

  const renderVisibleEvents = () => {
    if (!visibility.events) return null;
    
    // Filter events to only those in visible range
    const visibleEvents = events.filter(event => {
      const eventDayIndex = days.findIndex(day => isSameDay(day, event.startTime));
      return eventDayIndex >= visibleRange.start && eventDayIndex <= visibleRange.end;
    });

    return visibleEvents.map(event => {
      const position = dateToPosition(event.startTime.toISOString());
      const eventHeight = 40;
      
      return (
        <div
          key={event.id}
          style={{
            position: 'absolute',
            left: position.x + 5,
            top: position.y + 25,
            width: (containerDimensions.width / 7) * zoomLevel - 10,
            height: eventHeight,
            backgroundColor: event.color || '#3b82f6',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 12,
            color: 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
          }}
        >
          {event.title}
        </div>
      );
    });
  };

  const renderVisibleDecorations = () => {
    if (!visibility.decorations) return null;
    
    // Filter decorations to only those in visible range
    const visibleDecorations = decorations.filter(decoration => {
      const decorationDayIndex = days.findIndex(day => isSameDay(day, new Date(decoration.position.dateX)));
      return decorationDayIndex >= visibleRange.start && decorationDayIndex <= visibleRange.end;
    });

    return visibleDecorations.map(decoration => {
      const position = dateToPosition(decoration.position.dateX);
      
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
            zIndex: decoration.position.zIndex
          }}
        >
          {decoration.type === 'sticker' && decoration.imageUrl && (
            <img 
              src={decoration.imageUrl} 
              alt="sticker"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
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
    });
  };

  const renderVisibleHandwriting = () => {
    if (!visibility.handwriting) return null;
    
    // Filter handwriting to only those in visible range
    const visibleStrokes = handwriting.filter(stroke => {
      const strokeDayIndex = days.findIndex(day => isSameDay(day, new Date(stroke.position.dateX)));
      return strokeDayIndex >= visibleRange.start && strokeDayIndex <= visibleRange.end;
    });

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
        {visibleStrokes.map(stroke => {
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

  const renderVisibleTasks = () => {
    if (!visibility.tasks) return null;
    
    // Filter tasks to only those in visible range
    const visibleTasks = tasks.filter(task => {
      const taskDayIndex = days.findIndex(day => isSameDay(day, new Date(task.date)));
      return taskDayIndex >= visibleRange.start && taskDayIndex <= visibleRange.end;
    });

    return visibleTasks.map(task => {
      const position = dateToPosition(task.date);
      
      return (
        <div
          key={task.id}
          style={{
            position: 'absolute',
            left: position.x + 5,
            top: position.y + 70,
            width: (containerDimensions.width / 7) * zoomLevel - 10,
            fontSize: 11,
            color: task.completed ? '#9ca3af' : '#1f2937',
            textDecoration: task.completed ? 'line-through' : 'none',
            zIndex: 20
          }}
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => {}}
            style={{ marginRight: 4 }}
          />
          {task.content}
        </div>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        backgroundColor: '#ffffff'
      }}
    >
      <div
        style={{
          width: containerDimensions.width,
          height: viewMode === 'weekly' 
            ? (containerDimensions.height / 4) * 4 
            : (containerDimensions.height / 6) * 6,
          position: 'relative'
        }}
      >
        {renderVisibleEvents()}
        {renderVisibleTasks()}
        {renderVisibleDecorations()}
        {renderVisibleHandwriting()}
      </div>
    </div>
  );
};