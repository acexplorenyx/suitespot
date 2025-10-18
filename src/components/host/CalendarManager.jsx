import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import '../../styles/calendarstyle.css';

function CalendarManager({ listings, bookings }) {
  const [selectedListing, setSelectedListing] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [blockedDates, setBlockedDates] = useState({});

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar days
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Handle date blocking/unblocking
  const toggleDateAvailability = async (date, isAvailable) => {
    if (!selectedListing) return;

    try {
      const dateKey = date.toISOString().split('T')[0];
      const listingRef = doc(db, 'properties', selectedListing.id);
      
      if (isAvailable) {
        // Unblock date
        const updatedBlockedDates = { ...selectedListing.blockedDates };
        delete updatedBlockedDates[dateKey];
        
        await updateDoc(listingRef, {
          blockedDates: updatedBlockedDates,
          updatedAt: new Date()
        });
      } else {
        // Block date
        await updateDoc(listingRef, {
          blockedDates: {
            ...selectedListing.blockedDates,
            [dateKey]: true
          },
          updatedAt: new Date()
        });
      }
      
      alert(`Date ${isAvailable ? 'unblocked' : 'blocked'} successfully!`);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating date availability');
    }
  };

  // Check if date is booked
  const isDateBooked = (date) => {
    if (!selectedListing) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return bookings.some(booking => 
      booking.propertyId === selectedListing.id &&
      booking.status === 'confirmed' &&
      date >= new Date(booking.checkIn) &&
      date <= new Date(booking.checkOut)
    );
  };

  // Check if date is blocked
  const isDateBlocked = (date) => {
    if (!selectedListing) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return selectedListing.blockedDates?.[dateStr] === true;
  };

  // Check if date is available
  const isDateAvailable = (date) => {
    return !isDateBooked(date) && !isDateBlocked(date);
  };

  // Get date status class
  const getDateStatus = (date) => {
    if (isDateBooked(date)) return 'booked';
    if (isDateBlocked(date)) return 'blocked';
    return 'available';
  };

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const status = getDateStatus(date);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${status} ${isToday ? 'today' : ''}`}
          onClick={() => !isDateBooked(date) && toggleDateAvailability(date, isDateBlocked(date))}
          title={isDateBooked(date) ? 'Booked' : isDateBlocked(date) ? 'Blocked - Click to unblock' : 'Available - Click to block'}
        >
          <span className="day-number">{day}</span>
          <div className="day-status">
            {isDateBooked(date) && '📅'}
            {isDateBlocked(date) && '🚫'}
            {isDateAvailable(date) && '✅'}
          </div>
        </div>
      );
    }

    return days;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  return (
    <div className="calendar-manager">
      <div className="calendar-header">
        <h2>Calendar Management</h2>
        <p>Manage availability and bookings for your properties</p>
      </div>

      <div className="calendar-content">
        {/* Property Selection */}
        <div className="property-selector">
          <label>Select Property:</label>
          <select
            value={selectedListing?.id || ''}
            onChange={(e) => setSelectedListing(listings.find(l => l.id === e.target.value))}
          >
            <option value="">Choose a property...</option>
            {listings.filter(l => l.status === 'published').map(listing => (
              <option key={listing.id} value={listing.id}>
                {listing.title} - {listing.location?.city}
              </option>
            ))}
          </select>
        </div>

        {selectedListing ? (
          <div className="calendar-container">
            {/* Calendar Navigation */}
            <div className="calendar-navigation">
              <button onClick={goToPreviousMonth} className="nav-btn">
                ◀ Previous
              </button>
              <h3>
                {currentDate.toLocaleString('default', { month: 'long' })} {currentYear}
              </h3>
              <button onClick={goToNextMonth} className="nav-btn">
                Next ▶
              </button>
            </div>

            {/* Calendar Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-color available"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="legend-color booked"></div>
                <span>Booked</span>
              </div>
              <div className="legend-item">
                <div className="legend-color blocked"></div>
                <span>Blocked</span>
              </div>
              <div className="legend-item">
                <div className="legend-color today"></div>
                <span>Today</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {/* Weekday Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-header-day">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {renderCalendar()}
            </div>

            {/* Upcoming Bookings */}
            <div className="upcoming-bookings">
              <h4>Upcoming Bookings for {selectedListing.title}</h4>
              {bookings
                .filter(booking => 
                  booking.propertyId === selectedListing.id && 
                  new Date(booking.checkOut) >= new Date()
                )
                .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
                .map(booking => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-dates">
                      📅 {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                    </div>
                    <div className="booking-guest">
                      👤 {booking.guestName} ({booking.guestCount} guests)
                    </div>
                    <div className="booking-status">
                      Status: <span className={`status ${booking.status}`}>{booking.status}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        ) : (
          <div className="no-property-selected">
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>Select a Property</h3>
              <p>Choose a property from the dropdown to manage its calendar</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="calendar-actions">
        <button 
          className="action-btn bulk-block"
          onClick={() => {
            // Implement bulk blocking functionality
            alert('Bulk blocking feature coming soon!');
          }}
        >
          📅 Bulk Block Dates
        </button>
        <button 
          className="action-btn sync-calendar"
          onClick={() => {
            // Implement calendar sync
            alert('Calendar sync feature coming soon!');
          }}
        >
          🔄 Sync with External Calendar
        </button>
      </div>
    </div>
  );
}

export default CalendarManager;