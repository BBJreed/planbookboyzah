import { CalendarEvent, TaskItem } from '../types';

export class AIScheduler {
  /**
   * Suggest optimal times for events based on user habits and preferences
   */
  static suggestEventTime(
    title: string,
    duration: number, // in minutes
    priority: 'low' | 'medium' | 'high',
    userSchedule: CalendarEvent[],
    userPreferences: {
      workStartHour: number;
      workEndHour: number;
      preferredDays: number[]; // 0 = Sunday, 1 = Monday, etc.
      lunchStartHour: number;
      lunchDuration: number;
    }
  ): Date[] {
    // Use the provided parameters to generate intelligent suggestions
    console.log(`Generating suggestions for "${title}" with ${duration}min duration, ${priority} priority`);
    
    const suggestions: Date[] = [];
    const today = new Date();
    
    // Look for the next 7 days, checking conflicts with existing schedule
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip if not a preferred day
      if (!userPreferences.preferredDays.includes(date.getDay())) {
        continue;
      }
      
      // Check for conflicts with existing schedule
      const hasConflict = (timeSlot: Date) => {
        return userSchedule.some(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          const slotEnd = new Date(timeSlot.getTime() + duration * 60 * 1000);
          
          return (timeSlot >= eventStart && timeSlot < eventEnd) ||
                 (slotEnd > eventStart && slotEnd <= eventEnd);
        });
      };
      
      // Suggest morning slot (9-11 AM) if no conflict
      const morningStart = new Date(date);
      morningStart.setHours(9, 0, 0, 0);
      if (!hasConflict(morningStart)) {
        suggestions.push(morningStart);
      }
      
      // Suggest afternoon slot (2-4 PM) if no conflict
      const afternoonStart = new Date(date);
      afternoonStart.setHours(14, 0, 0, 0);
      if (!hasConflict(afternoonStart)) {
        suggestions.push(afternoonStart);
      }
    }
    
    return suggestions;
  }
  
  /**
   * Automatically prioritize tasks based on deadlines, importance, and user behavior
   */
  static prioritizeTasks(tasks: TaskItem[]): TaskItem[] {
    // This is a simplified implementation
    // In a real application, this would use machine learning models
    
    return tasks.sort((a, b) => {
      // Higher priority tasks first
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      
      // Tasks with earlier deadlines first
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      // If same priority, sort by date
      if (priorityOrder[a.priority] === priorityOrder[b.priority]) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // Otherwise, sort by priority
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Parse natural language input and create events
   */
  static parseNaturalLanguage(input: string): Partial<CalendarEvent> | null {
    // This is a simplified implementation
    // In a real application, this would use NLP models
    
    const lowerInput = input.toLowerCase();
    
    // Extract title (everything before "on" or "at")
    const titleMatch = input.match(/^(.*?)(?=\s+(on|at)\s+)/i);
    const title = titleMatch ? titleMatch[1].trim() : input;
    
    // Extract date and time
    let startTime: Date | undefined = undefined;
    let endTime: Date | undefined = undefined;
    
    // Simple pattern matching for demonstration
    if (lowerInput.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      startTime = tomorrow;
    } else if (lowerInput.includes('next week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      startTime = nextWeek;
    } else if (lowerInput.includes('next monday')) {
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);
      startTime = nextMonday;
    }
    
    if (startTime) {
      // Set default time to 10 AM
      startTime.setHours(10, 0, 0, 0);
      endTime = new Date(startTime);
      endTime.setHours(11, 0, 0, 0); // Default 1-hour duration
    }
    
    if (!startTime) {
      return null;
    }
    
    return {
      title,
      startTime,
      endTime,
      description: `Created from natural language: "${input}"`
    };
  }
  
  /**
   * Predict optimal scheduling based on historical data
   */
  static predictOptimalSchedule(
    eventType: string,
    userHistory: CalendarEvent[],
    userPreferences: any
  ): { 
    recommendedTime: Date; 
    confidence: number;
    alternativeTimes: Date[];
  } {
    // Use provided parameters to predict optimal scheduling
    console.log(`Predicting schedule for ${eventType} based on ${userHistory.length} historical events`);
    console.log('User preferences:', userPreferences);
    
    // Analyze historical data to find patterns
    const eventTypeEvents = userHistory.filter(event => 
      event.title.toLowerCase().includes(eventType.toLowerCase())
    );
    
    // Calculate average start time for this event type
    let totalHours = 0;
    let totalCount = 0;
    
    eventTypeEvents.forEach(event => {
      totalHours += event.startTime.getHours();
      totalCount++;
    });
    
    const avgHour = totalCount > 0 ? Math.round(totalHours / totalCount) : 10;
    
    // Create recommendation
    const recommendedTime = new Date();
    recommendedTime.setHours(avgHour, 0, 0, 0);
    
    // Calculate confidence based on data availability
    const confidence = Math.min(100, Math.round((eventTypeEvents.length / 10) * 100));
    
    // Generate alternative times
    const alternativeTimes = [
      new Date(recommendedTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours earlier
      new Date(recommendedTime.getTime() + 2 * 60 * 60 * 1000)  // 2 hours later
    ];
    
    return {
      recommendedTime,
      confidence,
      alternativeTimes
    };
  }
  
  /**
   * Generate smart notifications based on user behavior
   */
  static generateSmartNotifications(
    events: CalendarEvent[],
    tasks: TaskItem[],
    userBehavior: {
      typicalResponseTime: number; // in minutes
      preferredNotificationTime: number; // hours before event
      notificationFrequency: 'low' | 'medium' | 'high';
    }
  ): Array<{ 
    id: string; 
    message: string; 
    time: Date; 
    type: 'event' | 'task' | 'reminder';
    priority: 'low' | 'medium' | 'high';
  }> {
    const notifications: Array<{ 
      id: string; 
      message: string; 
      time: Date; 
      type: 'event' | 'task' | 'reminder';
      priority: 'low' | 'medium' | 'high';
    }> = [];
    const now = new Date();
    
    // Generate event reminders
    events.forEach(event => {
      const timeUntilEvent = (event.startTime.getTime() - now.getTime()) / (1000 * 60); // in minutes
      
      // Send reminder based on user preferences
      if (timeUntilEvent > 0 && timeUntilEvent <= (userBehavior.preferredNotificationTime * 60)) {
        notifications.push({
          id: `event-${event.id}`,
          message: `Upcoming: ${event.title} at ${event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          time: new Date(event.startTime.getTime() - userBehavior.preferredNotificationTime * 60 * 60 * 1000),
          type: 'event',
          priority: event.sourceCalendar === 'native' ? 'high' : 'medium'
        });
      }
    });
    
    // Generate task reminders
    tasks.forEach(task => {
      if (!task.completed) {
        const taskDate = new Date(task.date);
        const timeUntilTask = (taskDate.getTime() - now.getTime()) / (1000 * 60); // in minutes
        
        // Send reminder for upcoming tasks
        if (timeUntilTask > 0 && timeUntilTask <= (24 * 60)) { // 24 hours
          notifications.push({
            id: `task-${task.id}`,
            message: `Task due: ${task.content}`,
            time: new Date(taskDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            type: 'task',
            priority: task.priority
          });
        }
      }
    });
    
    return notifications;
  }
  
  /**
   * Automatically categorize events and tasks using ML
   */
  static categorizeItems(
    items: Array<CalendarEvent | TaskItem>
  ): Array<{ item: CalendarEvent | TaskItem; category: string; confidence: number }> {
    // This is a simplified implementation
    // In a real application, this would use machine learning models
    
    const categorizedItems: Array<{ item: CalendarEvent | TaskItem; category: string; confidence: number }> = [];
    
    const categoryKeywords = {
      work: ['meeting', 'conference', 'call', 'project', 'client', 'work'],
      personal: ['birthday', 'anniversary', 'family', 'friend', 'personal'],
      health: ['doctor', 'dentist', 'gym', 'exercise', 'workout', 'meditation'],
      learning: ['course', 'study', 'learn', 'education', 'class', 'tutorial'],
      entertainment: ['movie', 'concert', 'show', 'party', 'fun', 'game']
    };
    
    items.forEach(item => {
      let bestCategory = 'other';
      let highestScore = 0;
      
      // Check each category
      Object.entries(categoryKeywords).forEach(([category, keywords]) => {
        let score = 0;
        const text = 'title' in item ? item.title.toLowerCase() : item.content.toLowerCase();
        
        // Count keyword matches
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            score++;
          }
        });
        
        // Update best category if this one has a higher score
        if (score > highestScore) {
          highestScore = score;
          bestCategory = category;
        }
      });
      
      // Calculate confidence (0-100)
      const confidence = Math.min(100, highestScore * 20);
      
      categorizedItems.push({
        item,
        category: bestCategory,
        confidence
      });
    });
    
    return categorizedItems;
  }
}