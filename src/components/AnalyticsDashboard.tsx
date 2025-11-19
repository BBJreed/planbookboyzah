import React, { useState } from 'react';
import { useStore } from '../stores/appStore';

export const AnalyticsDashboard: React.FC = () => {
  const { events, tasks } = useStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  // Calculate analytics data
  const calculateAnalytics = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
    
    // Filter events and tasks by date range
    const filteredEvents = events.filter(event => 
      event.startTime >= startDate
    );
    
    const filteredTasks = tasks.filter(task => 
      new Date(task.date) >= startDate
    );
    
    // Calculate productivity metrics
    const totalEvents = filteredEvents.length;
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.completed).length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate time spent in events
    let totalTimeInEvents = 0;
    filteredEvents.forEach(event => {
      const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60); // in hours
      totalTimeInEvents += duration;
    });
    
    // Busiest days of the week
    const dayCounts: Record<string, number> = {
      'Sunday': 0,
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0
    };
    
    filteredEvents.forEach(event => {
      const day = event.startTime.toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    const busiestDay = Object.entries(dayCounts).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];
    
    return {
      totalEvents,
      totalTasks,
      completedTasks,
      taskCompletionRate,
      totalTimeInEvents: Math.round(totalTimeInEvents),
      busiestDay,
      dayCounts
    };
  };
  
  const analytics = calculateAnalytics();
  
  // Simple bar chart component
  const BarChart = ({ data }: { data: Record<string, number> }) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'end', 
        height: 150, 
        gap: 10,
        marginTop: 20
      }}>
        {Object.entries(data).map(([day, count]) => (
          <div key={day} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            flex: 1
          }}>
            <div style={{ 
              width: '100%', 
              backgroundColor: '#3b82f6', 
              height: `${(count / maxValue) * 100 || 1}%`,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.3s ease'
            }}></div>
            <div style={{ 
              marginTop: 5, 
              fontSize: 12, 
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {day.substring(0, 3)}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div style={{
      padding: 20,
      backgroundColor: '#f9fafb',
      borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Analytics Dashboard</h2>
        <div>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: 'white'
            }}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 20,
        marginBottom: 30
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
            {analytics.totalEvents}
          </div>
          <div style={{ color: '#6b7280', marginTop: 5 }}>
            Events
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
            {analytics.taskCompletionRate}%
          </div>
          <div style={{ color: '#6b7280', marginTop: 5 }}>
            Task Completion
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#8b5cf6' }}>
            {analytics.totalTimeInEvents}
          </div>
          <div style={{ color: '#6b7280', marginTop: 5 }}>
            Hours in Events
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>
            {analytics.busiestDay}
          </div>
          <div style={{ color: '#6b7280', marginTop: 5 }}>
            Busiest Day
          </div>
        </div>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: 0, marginBottom: 15, color: '#1f2937' }}>
          Events by Day of Week
        </h3>
        <BarChart data={analytics.dayCounts} />
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: 20 
      }}>
        <button
          onClick={() => {
            // In a real app, this would export the data
            alert('Analytics data exported successfully!');
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Export Analytics
        </button>
      </div>
    </div>
  );
};