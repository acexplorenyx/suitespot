import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import '../../styles/calendarmanager.css';

function CalendarManager({ listings, bookings }) {
  const [selectedListing, setSelectedListing] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [blockedDates, setBlockedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('block'); // 'block' or 'unblock'

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
    if (!selectedListing || loading) return;

    setLoading(true);
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
      
      // Remove from selected dates if it was selected
      setSelectedDates(prev => prev.filter(d => d !== dateKey));
      
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating date availability');
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection for bulk operations
  const handleDateClick = (date) => {
    if (isDateBooked(date)) return;
    
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  // Bulk block/unblock dates
  const handleBulkAction = async () => {
    if (!selectedListing || selectedDates.length === 0 || loading) return;

    setLoading(true);
    try {
      const listingRef = doc(db, 'properties', selectedListing.id);
      const updatedBlockedDates = { ...selectedListing.blockedDates };
      
      selectedDates.forEach(dateStr => {
        if (bulkAction === 'block') {
          updatedBlockedDates[dateStr] = true;
        } else {
          delete updatedBlockedDates[dateStr];
        }
      });
      
      await updateDoc(listingRef, {
        blockedDates: updatedBlockedDates,
        updatedAt: new Date()
      });
      
      setSelectedDates([]);
      setShowBulkModal(false);
      alert(`${bulkAction === 'block' ? 'Blocked' : 'Unblocked'} ${selectedDates.length} dates successfully!`);
      
    } catch (error) {
      console.error('Error with bulk action:', error);
      alert(`Error ${bulkAction === 'block' ? 'blocking' : 'unblocking'} dates`);
    } finally {
      setLoading(false);
    }
  };

  // Calendar sync functionality
  const handleCalendarSync = async (platform) => {
    setSyncStatus('connecting');
    try {
      // Simulate API call to calendar service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would:
      // 1. Authenticate with the calendar platform (Google, Apple, etc.)
      // 2. Get authorization tokens
      // 3. Set up webhooks for real-time sync
      // 4. Import existing events
      
      setSyncStatus('connected');
      alert(`Successfully connected to ${platform} Calendar!`);
    } catch (error) {
      setSyncStatus('disconnected');
      alert(`Failed to connect to ${platform} Calendar`);
    }
  };

  // Check if date is booked
  const isDateBooked = (date) => {
    if (!selectedListing) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return bookings.some(booking => 
      booking.propertyId === selectedListing.id &&
      booking.status === 'confirmed' &&
      dateStr >= booking.checkIn &&
      dateStr <= booking.checkOut
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

  // Check if date is selected for bulk operations
  const isDateSelected = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedDates.includes(dateStr);
  };

  // Get date status class
  const getDateStatus = (date) => {
    if (isDateBooked(date)) return 'booked';
    if (isDateBlocked(date)) return 'blocked';
    if (isDateSelected(date)) return 'selected';
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
      const isClickable = !isDateBooked(date);
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${status} ${isToday ? 'today' : ''} ${isClickable ? 'clickable' : ''}`}
          onClick={() => isClickable && handleDateClick(date)}
          title={getDateTooltip(date)}
        >
          <span className="day-number">{day}</span>
          <div className="day-status">
            {isDateBooked(date) && '📅'}
            {isDateBlocked(date) && '🚫'}
            {isDateAvailable(date) && !isDateSelected(date) && '✅'}
            {isDateSelected(date) && '⭐'}
          </div>
          {isToday && <div className="today-indicator">Today</div>}
        </div>
      );
    }

    return days;
  };

  // Get tooltip text for date
  const getDateTooltip = (date) => {
    if (isDateBooked(date)) return 'Booked - Cannot modify';
    if (isDateBlocked(date)) return 'Blocked - Click to select for bulk operations';
    if (isDateSelected(date)) return 'Selected - Click to deselect';
    return 'Available - Click to select for bulk operations';
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDates([]); // Clear selection when changing months
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDates([]); // Clear selection when changing months
  };

  // Clear all selected dates
  const clearSelection = () => {
    setSelectedDates([]);
  };

  // Select all available dates in current month
  const selectAllAvailable = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const availableDates = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      if (isDateAvailable(date)) {
        availableDates.push(date.toISOString().split('T')[0]);
      }
    }
    
    setSelectedDates(availableDates);
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
            onChange={(e) => {
              setSelectedListing(listings.find(l => l.id === e.target.value));
              setSelectedDates([]); // Clear selection when changing listing
            }}
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
            {/* Bulk Actions Bar */}
            {selectedDates.length > 0 && (
              <div className="bulk-actions-bar">
                <div className="bulk-info">
                  <strong>{selectedDates.length} dates selected</strong>
                  <span>Click dates to select/deselect for bulk operations</span>
                </div>
                <div className="bulk-buttons">
                  <button 
                    className="bulk-btn block"
                    onClick={() => {
                      setBulkAction('block');
                      setShowBulkModal(true);
                    }}
                  >
                    🚫 Block Selected
                  </button>
                  <button 
                    className="bulk-btn unblock"
                    onClick={() => {
                      setBulkAction('unblock');
                      setShowBulkModal(true);
                    }}
                  >
                    ✅ Unblock Selected
                  </button>
                  <button 
                    className="bulk-btn clear"
                    onClick={clearSelection}
                  >
                    ❌ Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Calendar Navigation */}
            <div className="calendar-navigation">
              <button onClick={goToPreviousMonth} className="nav-btn">
                ◀ Previous
              </button>
              
              <div className="month-display">
                <h3>
                  {currentDate.toLocaleString('default', { month: 'long' })} {currentYear}
                </h3>
                {selectedDates.length === 0 && (
                  <button 
                    className="select-all-btn"
                    onClick={selectAllAvailable}
                  >
                    Select All Available
                  </button>
                )}
              </div>
              
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
                <div className="legend-color selected"></div>
                <span>Selected</span>
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

            {/* Sync Status */}
            <div className="sync-section">
              <h4>Calendar Sync</h4>
              <div className="sync-status">
                <span className={`status-indicator ${syncStatus}`}>
                  {syncStatus === 'connected' ? '🟢' : 
                   syncStatus === 'connecting' ? '🟡' : '🔴'}
                  {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
                </span>
                <div className="sync-buttons">
                  <button 
                    className="sync-btn"
                    onClick={() => handleCalendarSync('Google')}
                    disabled={syncStatus === 'connecting'}
                  >
                    🔗 Sync with Google Calendar
                  </button>
                  <button 
                    className="sync-btn"
                    onClick={() => handleCalendarSync('Apple')}
                    disabled={syncStatus === 'connecting'}
                  >
                    🔗 Sync with Apple Calendar
                  </button>
                </div>
              </div>
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

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Bulk Action</h3>
            <p>
              Are you sure you want to {bulkAction} {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''}?
            </p>
            <div className="modal-actions">
              <button 
                className="modal-btn confirm"
                onClick={handleBulkAction}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Yes, ${bulkAction} ${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''}`}
              </button>
              <button 
                className="modal-btn cancel"
                onClick={() => setShowBulkModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarManager;