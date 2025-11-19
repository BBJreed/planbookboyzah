import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../stores/appStore';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

export const useCalendarCanvas = (width: number, height: number) => {
  const {
    events,
    decorations,
    handwriting,
    tasks,
    visibility,
    currentTheme,
    selectedDate,
    zoomLevel,
    viewMode
  } = useStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [cellDimensions, setCellDimensions] = useState({ width: 0, height: 0 });
  const [draggedSticker, setDraggedSticker] = useState<{ id: string; initialX: number; initialY: number } | null>(null);
  const [resizingSticker, setResizingSticker] = useState<{ id: string; handle: string } | null>(null);

  useEffect(() => {
    const baseWidth = width / 7;
    const baseHeight = viewMode === 'weekly' ? height / 4 : height / 6;
    
    setCellDimensions({
      width: baseWidth * zoomLevel,
      height: baseHeight * zoomLevel
    });
  }, [width, height, zoomLevel, viewMode]);

  const days = useMemo(() => {
    if (viewMode === 'weekly') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return eachDayOfInterval({ start, end });
    }
  }, [selectedDate, viewMode]);

  const dateToPosition = useCallback((dateString: string): { x: number, y: number } => {
    const targetDate = new Date(dateString);
    const dayIndex = days.findIndex(day => isSameDay(day, targetDate));
    
    if (dayIndex === -1) return { x: 0, y: 0 };
    
    const row = viewMode === 'weekly' ? 0 : Math.floor(dayIndex / 7);
    const col = dayIndex % 7;
    
    return {
      x: col * cellDimensions.width,
      y: row * cellDimensions.height
    };
  }, [days, cellDimensions, viewMode]);

  const handleStickerDrop = useCallback((e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    
    const stickerId = e.dataTransfer.getData('stickerId');
    if (!stickerId) return;
    
    // Calculate which day cell was dropped on
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / cellDimensions.width);
    const row = viewMode === 'weekly' ? 0 : Math.floor(y / cellDimensions.height);
    
    const dayIndex = row * 7 + col;
    if (dayIndex >= 0 && dayIndex < days.length) {
      const targetDate = days[dayIndex];
      
      // Update the sticker's position
      const { updateDecoration } = useStore.getState();
      updateDecoration(stickerId, {
        position: {
          ...useStore.getState().decorations.find(d => d.id === stickerId)?.position || { offsetY: 0, zIndex: 100 },
          dateX: targetDate.toISOString()
        }
      });
    }
  }, [cellDimensions, viewMode, days]);

  const startDraggingSticker = useCallback((e: React.MouseEvent, stickerId: string) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDraggedSticker({
      id: stickerId,
      initialX: e.clientX - rect.left,
      initialY: e.clientY - rect.top
    });
  }, []);

  const startResizingSticker = useCallback((e: React.MouseEvent, stickerId: string, handle: string) => {
    e.stopPropagation();
    setResizingSticker({ id: stickerId, handle });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (draggedSticker) {
      const { updateDecoration } = useStore.getState();
      const sticker = decorations.find(d => d.id === draggedSticker.id);
      if (sticker) {
        // Calculate new position based on mouse movement
        const newX = x - draggedSticker.initialX;
        const newY = y - draggedSticker.initialY;
        
        // Convert position back to date
        const col = Math.floor(newX / cellDimensions.width);
        const row = viewMode === 'weekly' ? 0 : Math.floor(newY / cellDimensions.height);
        
        const dayIndex = row * 7 + col;
        if (dayIndex >= 0 && dayIndex < days.length) {
          const targetDate = days[dayIndex];
          
          updateDecoration(sticker.id, {
            position: {
              ...sticker.position,
              dateX: targetDate.toISOString(),
              offsetY: newY % cellDimensions.height
            }
          });
        }
      }
    }
    
    if (resizingSticker) {
      const { updateDecoration } = useStore.getState();
      const sticker = decorations.find(d => d.id === resizingSticker.id);
      if (sticker) {
        // Calculate new size based on mouse position
        const position = dateToPosition(sticker.position.dateX);
        const stickerX = position.x + sticker.position.offsetY;
        const stickerY = position.y;
        
        let newWidth = sticker.style.width;
        let newHeight = sticker.style.height;
        
        switch (resizingSticker.handle) {
          case 'right':
            newWidth = Math.max(20, x - stickerX);
            break;
          case 'bottom':
            newHeight = Math.max(20, y - stickerY);
            break;
          case 'bottom-right':
            newWidth = Math.max(20, x - stickerX);
            newHeight = Math.max(20, y - stickerY);
            break;
        }
        
        updateDecoration(sticker.id, {
          style: {
            ...sticker.style,
            width: newWidth,
            height: newHeight
          }
        });
      }
    }
  }, [draggedSticker, resizingSticker, decorations, cellDimensions, viewMode, days, dateToPosition]);

  const handleMouseUp = useCallback(() => {
    setDraggedSticker(null);
    setResizingSticker(null);
  }, []);

  useEffect(() => {
    if (draggedSticker || resizingSticker) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedSticker, resizingSticker, handleMouseMove, handleMouseUp]);

  const applyThemeTemplate = useCallback(() => {
    if (!currentTheme) return {};
    
    const cssVars: Record<string, string> = {};
    Object.entries(currentTheme.cssVariables).forEach(([key, value]) => {
      cssVars[`--${key}`] = value;
    });
    
    return cssVars;
  }, [currentTheme]);

  // Generate time slots for weekly view
  const timeSlots = useMemo(() => {
    if (viewMode !== 'weekly') return [];
    
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`
      });
    }
    return slots;
  }, [viewMode]);

  return {
    canvasRef,
    cellDimensions,
    days,
    timeSlots,
    visibility,
    draggedSticker,
    resizingSticker,
    dateToPosition,
    handleStickerDrop,
    startDraggingSticker,
    startResizingSticker,
    applyThemeTemplate,
    events,
    decorations,
    handwriting,
    tasks
  };
};