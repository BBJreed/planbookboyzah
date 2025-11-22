import React, { useState } from 'react';
import './styles/clean.css';

export const App: React.FC = () => {
  const [events, setEvents] = useState([
    '📌 Team Meeting - Nov 22',
    '🎂 Birthday Party - Nov 25',
    '📝 Project Due - Nov 30'
  ]);
  const [newEvent, setNewEvent] = useState('');

  const addEvent = () => {
    if (newEvent.trim()) {
      setEvents([...events, newEvent]);
      setNewEvent('');
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>📅 November 2025 Planner</h1>
      </header>

      {/* Main Book Layout */}
      <div className="book-wrapper">
        <div className="book">
          {/* Left Page - Events & Tasks */}
          <div className="page left-page">
            <h2>Events & Tasks</h2>
            <div className="events-section">
              {events.map((event, index) => (
                <div key={index} className="event-item">
                  {event}
                </div>
              ))}
            </div>
            <div className="add-event">
              <input 
                type="text" 
                placeholder="Add new event..." 
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEvent()}
              />
              <button onClick={addEvent}>Add</button>
            </div>
          </div>

          {/* Center Binding */}
          <div className="book-binding"></div>

          {/* Right Page - Calendar */}
          <div className="page right-page">
            <h2>November 2025</h2>
            <div className="calendar">
              <div className="calendar-header">
                <div className="day-name">Sun</div>
                <div className="day-name">Mon</div>
                <div className="day-name">Tue</div>
                <div className="day-name">Wed</div>
                <div className="day-name">Thu</div>
                <div className="day-name">Fri</div>
                <div className="day-name">Sat</div>
              </div>
              <div className="calendar-days">
                {/* Empty cells before month starts (Nov 1 is Saturday) */}
                <div className="day empty"></div>
                <div className="day empty"></div>
                <div className="day empty"></div>
                <div className="day empty"></div>
                <div className="day empty"></div>
                <div className="day empty"></div>
                {/* November days */}
                {Array.from({ length: 30 }, (_, i) => (
                  <div 
                    key={i + 1} 
                    className={`day ${i + 1 === 21 ? 'today' : ''}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <button title="Analytics">📊</button>
        <button title="Settings">⚙️</button>
      </nav>
    </div>
  );
};
