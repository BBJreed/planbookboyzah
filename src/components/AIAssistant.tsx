import React, { useState, useRef, useEffect } from 'react';
import { AIScheduler } from '../services/aiScheduler';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your personal AI assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    // Process the user input
    const response = await processUserInput(inputText);

    // Add assistant response
    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      text: response,
      sender: 'assistant',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);
  };

  const processUserInput = async (input: string): Promise<string> => {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check for specific commands
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('schedule') || lowerInput.includes('meeting') || lowerInput.includes('appointment')) {
      return handleSchedulingRequest(input);
    }

    if (lowerInput.includes('task') || lowerInput.includes('to do')) {
      return handleTaskRequest(input);
    }

    if (lowerInput.includes('reminder') || lowerInput.includes('remind')) {
      return handleReminderRequest(input);
    }

    if (lowerInput.includes('help')) {
      return "I can help you schedule events, create tasks, set reminders, and answer questions about your calendar. Try saying something like 'Schedule a meeting tomorrow at 2pm' or 'Create a task to buy groceries'.";
    }

    // Default response
    return "I'm not sure how to help with that. Try asking me to schedule an event, create a task, or set a reminder. For example: 'Schedule a meeting tomorrow at 2pm' or 'Create a task to buy groceries'.";
  };

  const handleSchedulingRequest = (input: string): string => {
    const eventData = AIScheduler.parseNaturalLanguage(input);
    
    if (eventData && eventData.title && eventData.startTime) {
      // In a real application, this would actually create the event
      return `I've parsed your request to create an event titled "${eventData.title}" on ${eventData.startTime.toLocaleDateString()} at ${eventData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Would you like me to add this to your calendar?`;
    }
    
    return "I couldn't parse the scheduling details from your request. Please try again with a clearer format, such as 'Schedule a meeting tomorrow at 2pm'.";
  };

  const handleTaskRequest = (input: string): string => {
    // Extract task content (everything after "task" or "to do")
    const taskMatch = input.match(/(?:task|to do)\s+(.*)/i);
    const taskContent = taskMatch ? taskMatch[1] : input;
    
    if (taskContent) {
      // In a real application, this would actually create the task
      return `I've created a task for you: "${taskContent}". Would you like me to add this to your task list?`;
    }
    
    return "I couldn't understand the task details. Please try again with a clearer format, such as 'Create a task to buy groceries'.";
  };

  const handleReminderRequest = (input: string): string => {
    // Extract reminder content
    const reminderMatch = input.match(/(?:remind|reminder)\s+(.*)/i);
    const reminderContent = reminderMatch ? reminderMatch[1] : input;
    
    if (reminderContent) {
      // In a real application, this would actually create the reminder
      return `I've set a reminder for you: "${reminderContent}". Would you like me to configure when you should be reminded?`;
    }
    
    return "I couldn't understand the reminder details. Please try again with a clearer format, such as 'Remind me to call John tomorrow'.";
  };

  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);

    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false);
      // In a real application, this would use the Web Speech API
      const simulatedInput = "Schedule a team meeting next Monday at 10am";
      setInputText(simulatedInput);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-assistant">
      <div className="assistant-header">
        <h2>Personal AI Assistant</h2>
        <div className="status">
          <div className={`status-indicator ${isProcessing ? 'processing' : 'active'}`}></div>
          <span>{isProcessing ? 'Thinking...' : 'Active'}</span>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`message ${message.sender}`}
          >
            <div className="message-content">
              {message.text}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <div className="input-area">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (e.g., 'Schedule a meeting tomorrow at 2pm')"
            disabled={isProcessing}
          />
          <div className="input-actions">
            <button 
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
              disabled={isProcessing}
            >
              {isListening ? '⏹️' : '🎤'}
            </button>
            <button 
              onClick={handleSend}
              disabled={isProcessing || !inputText.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;