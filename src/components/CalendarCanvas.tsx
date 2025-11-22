import React, { useRef, useEffect } from 'react';
import { useStore } from '../stores/appStore';

interface CalendarCanvasProps {
  width: number;
  height: number;
  pagePosition?: 'left' | 'right';
}

const CalendarCanvas: React.FC<CalendarCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    viewMode, 
    selectedDate, 
    events, 
    tasks, 
    cover, 
    font, 
    color,
    stickers
  } = useStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and resize (responsive)
    canvas.width = width;
    canvas.height = height;

    // Set font and color
    ctx.font = `16px ${font}`;
    ctx.fillStyle = color;

    // Draw left page: events/tasks list
    if (pagePosition === 'left') {
      ctx.font = `20px ${font}`;
      ctx.fillStyle = color;
      ctx.fillText('Events & Tasks', 20, 30);
      
      // Draw events
      events.forEach((event, i) => {
        ctx.fillStyle = event.color || '#3b82f6';
        ctx.fillText(event.title, 20, 60 + i * 25);
      });
      
      // Draw tasks
      tasks.forEach((task, i) => {
        ctx.fillStyle = task.completed ? '#9ca3af' : color;
        ctx.fillText(`${task.completed ? '✓' : '○'} ${task.content}`, 20, 60 + events.length * 25 + i * 25);
      });
    }
    
    // Draw right page: calendar grid
    else if (pagePosition === 'right') {
      ctx.font = `20px ${font}`;
      ctx.fillStyle = color;
      ctx.fillText(`${selectedDate.toLocaleString('default', { month: 'long' })} ${selectedDate.getFullYear()}`, 20, 30);
      
      if (viewMode === 'monthly') {
        drawMonthlyGrid(ctx, selectedDate, 20, 60);
      } else if (viewMode === 'weekly') {
        drawWeeklyGrid(ctx, selectedDate, 20, 60);
      } else if (viewMode === 'daily') {
        drawDailyView(ctx, selectedDate, 20, 60);
      }
      
      // Draw personalized message
      ctx.font = `14px ${font}`;
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Your personalized calendar experience', 20, height - 30);
    }
    
    // Draw stickers
    stickers.forEach((stickerUrl, i) => {
      const img = new Image();
      img.src = stickerUrl;
      img.onload = () => {
        ctx.drawImage(img, 50 + i * 60, height - 100, 50, 50);
      };
    });
  }, [viewMode, selectedDate, events, tasks, cover, font, color, stickers, width, height, pagePosition]);

  const drawMonthlyGrid = (ctx: CanvasRenderingContext2D, date: Date, startX: number, startY: number) => {
    const cellSize = Math.min((height - startY - 100) / 6, 40); // Fit 6 weeks
    const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Draw headers
    ctx.font = `bold 14px ${font}`;
    ctx.fillStyle = '#374151';
    headers.forEach((h, i) => {
      ctx.fillText(h, startX + i * cellSize + cellSize/2 - 5, startY + 20);
    });

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let row = 0;
    // Draw blanks
    for (let i = 0; i < firstDay; i++) { 
      ctx.strokeRect(startX + i * cellSize, startY + 30 + row * cellSize, cellSize, cellSize);
    }
    
    // Draw days
    for (let day = 1; day <= daysInMonth; day++) {
      const col = (firstDay + day - 1) % 7;
      if (col === 0 && day > 1) row++;
      
      // Highlight today
      if (day === date.getDate()) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(startX + col * cellSize, startY + 30 + row * cellSize, cellSize, cellSize);
        ctx.fillStyle = '#000';
      } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(startX + col * cellSize, startY + 30 + row * cellSize, cellSize, cellSize);
        ctx.fillStyle = '#000';
      }
      
      ctx.strokeRect(startX + col * cellSize, startY + 30 + row * cellSize, cellSize, cellSize);
      ctx.fillText(day.toString(), startX + col * cellSize + cellSize/2 - 5, startY + 30 + row * cellSize + cellSize/2 + 5);
    }
  };

  const drawWeeklyGrid = (ctx: CanvasRenderingContext2D, date: Date, startX: number, startY: number) => {
    const cellSize = Math.min((height - startY - 100) / 6, 40);
    const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Draw headers
    ctx.font = `bold 14px ${font}`;
    ctx.fillStyle = '#374151';
    headers.forEach((h, i) => {
      ctx.fillText(h, startX + i * cellSize + cellSize/2 - 5, startY + 20);
    });
    
    // Draw current week (simplified)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      // Highlight today
      if (day.getDate() === date.getDate()) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(startX + i * cellSize, startY + 30, cellSize, cellSize);
        ctx.fillStyle = '#000';
      } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(startX + i * cellSize, startY + 30, cellSize, cellSize);
        ctx.fillStyle = '#000';
      }
      
      ctx.strokeRect(startX + i * cellSize, startY + 30, cellSize, cellSize);
      ctx.fillText(day.getDate().toString(), startX + i * cellSize + cellSize/2 - 5, startY + 30 + cellSize/2 + 5);
    }
  };

  const drawDailyView = (ctx: CanvasRenderingContext2D, date: Date, startX: number, startY: number) => {
    // Simplified daily view
    ctx.font = `16px ${font}`;
    ctx.fillStyle = color;
    ctx.fillText(date.toLocaleDateString(), startX, startY + 30);
    
    // Draw time slots (simplified)
    for (let hour = 0; hour < 24; hour++) {
      ctx.fillText(`${hour}:00`, startX, startY + 60 + hour * 20);
    }
  };

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
};

export default CalendarCanvas;