import React, { useState } from 'react';
import { rbac } from '../services/rbac';

interface Resource {
  id: string;
  name: string;
  type: 'room' | 'equipment' | 'vehicle' | 'person';
  status: 'available' | 'booked' | 'maintenance' | 'unavailable';
  capacity?: number;
  location?: string;
  owner?: string;
}

interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const ResourceManager: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([
    {
      id: 'r1',
      name: 'Conference Room A',
      type: 'room',
      status: 'available',
      capacity: 10,
      location: 'Floor 2'
    },
    {
      id: 'r2',
      name: 'Projector',
      type: 'equipment',
      status: 'available',
      location: 'Storage Room'
    },
    {
      id: 'r3',
      name: 'Company Car',
      type: 'vehicle',
      status: 'booked',
      capacity: 4,
      location: 'Parking Lot'
    }
  ]);

  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'b1',
      resourceId: 'r3',
      userId: 'u1',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
      purpose: 'Client Meeting',
      status: 'confirmed'
    }
  ]);

  const [newResource, setNewResource] = useState<Omit<Resource, 'id'>>({
    name: '',
    type: 'room',
    status: 'available'
  });

  const [newBooking, setNewBooking] = useState<Omit<Booking, 'id' | 'status'>>({
    resourceId: '',
    userId: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    purpose: ''
  });



  const handleAddResource = () => {
    if (!newResource.name) return;

    const resource: Resource = {
      ...newResource,
      id: `r${Date.now()}`
    };

    setResources(prev => [...prev, resource]);
    setNewResource({
      name: '',
      type: 'room',
      status: 'available'
    });
  };

  const handleAddBooking = () => {
    if (!newBooking.resourceId || !newBooking.userId || !newBooking.purpose) return;

    const booking: Booking = {
      ...newBooking,
      id: `b${Date.now()}`,
      status: 'pending'
    };

    setBookings(prev => [...prev, booking]);
    setNewBooking({
      resourceId: '',
      userId: '',
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      purpose: ''
    });
  };

  const handleResourceStatusChange = (resourceId: string, status: Resource['status']) => {
    setResources(prev => 
      prev.map(resource => 
        resource.id === resourceId ? { ...resource, status } : resource
      )
    );
  };

  const handleBookingStatusChange = (bookingId: string, status: Booking['status']) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId ? { ...booking, status } : booking
      )
    );
  };

  const handleDeleteResource = (resourceId: string) => {
    setResources(prev => prev.filter(resource => resource.id !== resourceId));
    // Also remove any bookings for this resource
    setBookings(prev => prev.filter(booking => booking.resourceId !== resourceId));
  };

  const getAvailableResources = () => {
    return resources.filter(resource => resource.status === 'available');
  };

  const getResourceById = (resourceId: string) => {
    return resources.find(resource => resource.id === resourceId);
  };

  const getUserById = (userId: string) => {
    return rbac.getUser(userId);
  };

  return (
    <div className="resource-manager">
      <h2>Resource Manager</h2>
      
      <div className="manager-content">
        <div className="resources-section">
          <h3>Resources</h3>
          <div className="resource-form">
            <input
              type="text"
              placeholder="Resource name"
              value={newResource.name}
              onChange={(e) => setNewResource({...newResource, name: e.target.value})}
            />
            <select
              value={newResource.type}
              onChange={(e) => setNewResource({...newResource, type: e.target.value as any})}
            >
              <option value="room">Room</option>
              <option value="equipment">Equipment</option>
              <option value="vehicle">Vehicle</option>
              <option value="person">Person</option>
            </select>
            <button onClick={handleAddResource}>Add Resource</button>
          </div>
          
          <div className="resources-list">
            {resources.map(resource => (
              <div key={resource.id} className="resource-item">
                <div className="resource-info">
                  <h4>{resource.name}</h4>
                  <p>Type: {resource.type}</p>
                  <p>Status: 
                    <span className={`status ${resource.status}`}>
                      {resource.status}
                    </span>
                  </p>
                  {resource.capacity && <p>Capacity: {resource.capacity}</p>}
                  {resource.location && <p>Location: {resource.location}</p>}
                </div>
                <div className="resource-actions">
                  <select
                    value={resource.status}
                    onChange={(e) => handleResourceStatusChange(resource.id, e.target.value as any)}
                  >
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteResource(resource.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bookings-section">
          <h3>Bookings</h3>
          <div className="booking-form">
            <select
              value={newBooking.resourceId}
              onChange={(e) => setNewBooking({...newBooking, resourceId: e.target.value})}
            >
              <option value="">Select Resource</option>
              {getAvailableResources().map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="User ID"
              value={newBooking.userId}
              onChange={(e) => setNewBooking({...newBooking, userId: e.target.value})}
            />
            <input
              type="datetime-local"
              value={newBooking.startTime.toISOString().slice(0, 16)}
              onChange={(e) => setNewBooking({...newBooking, startTime: new Date(e.target.value)})}
            />
            <input
              type="datetime-local"
              value={newBooking.endTime.toISOString().slice(0, 16)}
              onChange={(e) => setNewBooking({...newBooking, endTime: new Date(e.target.value)})}
            />
            <input
              type="text"
              placeholder="Purpose"
              value={newBooking.purpose}
              onChange={(e) => setNewBooking({...newBooking, purpose: e.target.value})}
            />
            <button onClick={handleAddBooking}>Create Booking</button>
          </div>
          
          <div className="bookings-list">
            {bookings.map(booking => {
              const resource = getResourceById(booking.resourceId);
              const user = getUserById(booking.userId);
              
              return (
                <div key={booking.id} className="booking-item">
                  <div className="booking-info">
                    <h4>{resource?.name || 'Unknown Resource'}</h4>
                    <p>User: {user?.name || booking.userId}</p>
                    <p>Time: {booking.startTime.toLocaleString()} - {booking.endTime.toLocaleString()}</p>
                    <p>Purpose: {booking.purpose}</p>
                    <p>Status: 
                      <span className={`status ${booking.status}`}>
                        {booking.status}
                      </span>
                    </p>
                  </div>
                  <div className="booking-actions">
                    <select
                      value={booking.status}
                      onChange={(e) => handleBookingStatusChange(booking.id, e.target.value as any)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceManager;