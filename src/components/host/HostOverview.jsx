import React from 'react';
import '../../styles/hostoverview.css'

function HostOverview({ stats, bookings, listings }) {
  const today = new Date().toDateString();
  
  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.checkIn) > new Date()
  ).slice(0, 5);

  const todayBookingsList = bookings.filter(booking =>
    new Date(booking.checkIn).toDateString() === today
  );

  // NEW: Calculate points and rewards
  const hostLevel = stats.hostPoints >= 1000 ? 'Gold' : 
                   stats.hostPoints >= 500 ? 'Silver' : 'Bronze';

  // NEW: Calculate earnings with service fee
  const totalEarningsAfterFees = stats.totalEarnings * 0.9; // 10% service fee

  return (
    <div className="host-overview">
      {/* NEW: Host Level & Points Display */}
      <div className="host-status-card">
        <div className="host-level">
          <div className="level-badge">{hostLevel}</div>
          <div className="points-info">
            <h3>{stats.hostPoints || 0} Points</h3>
            <p>Next level: {hostLevel === 'Bronze' ? 'Silver (500 points)' : 
                          hostLevel === 'Silver' ? 'Gold (1000 points)' : 'Max Level'}</p>
          </div>
        </div>
        <div className="rewards-list">
          <span className="reward-item">⭐ Early Payout</span>
          <span className="reward-item">🏆 Featured Listings</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <h3>{stats.totalListings}</h3>
            <p>Total Listings</p>
            <small>{stats.publishedListings} Published • {stats.draftListings} Drafts</small>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>{stats.todayBookings}</h3>
            <p>Today's Bookings</p>
            <small>Check-ins & Check-outs</small>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <h3>{stats.upcomingBookings}</h3>
            <p>Upcoming</p>
            <small>Next 30 days</small>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>${totalEarningsAfterFees.toFixed(2)}</h3>
            <p>Total Earnings</p>
            <small>After 10% service fee</small>
          </div>
        </div>
      </div>

      <div className="overview-content">
        <div className="today-bookings">
          <h3>Today's Bookings ({today})</h3>
          {todayBookingsList.length === 0 ? (
            <div className="no-bookings">
              <div className="empty-icon">📅</div>
              <p>No bookings for today</p>
            </div>
          ) : (
            <div className="bookings-list">
              {todayBookingsList.map(booking => (
                <div key={booking.id} className="booking-item today">
                  <div className="booking-avatar">
                    {booking.guestName?.charAt(0) || 'G'}
                  </div>
                  <div className="booking-details">
                    <div className="booking-main">
                      <strong>{booking.propertyTitle}</strong>
                      <span className="guest-name">{booking.guestName}</span>
                    </div>
                    <div className="booking-meta">
                      <span className="booking-time">
                        {booking.checkInTime || '3:00 PM'} Check-in
                      </span>
                      <span className="booking-amount">${booking.totalPrice}</span>
                    </div>
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="upcoming-bookings">
          <h3>Upcoming Bookings</h3>
          {upcomingBookings.length === 0 ? (
            <div className="no-bookings">
              <div className="empty-icon">📋</div>
              <p>No upcoming bookings</p>
              <small>New bookings will appear here</small>
            </div>
          ) : (
            <div className="bookings-list">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-avatar">
                    {booking.guestName?.charAt(0) || 'G'}
                  </div>
                  <div className="booking-info">
                    <div className="booking-main">
                      <strong>{booking.propertyTitle}</strong>
                      <span className="guest-name">{booking.guestName}</span>
                    </div>
                    <div className="booking-dates">
                      {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                    </div>
                    <div className="booking-meta">
                      <span className="guests">{booking.guestCount} guests</span>
                      <span className="amount">${booking.totalPrice}</span>
                    </div>
                  </div>
                  <div className="booking-actions">
                    <button className="action-btn message">💬</button>
                    <button className="action-btn details">📋</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NEW: Quick Actions Panel */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="quick-action-btn">
              <span className="action-icon">📝</span>
              Create New Listing
            </button>
            <button className="quick-action-btn">
              <span className="action-icon">📅</span>
              Manage Calendar
            </button>
            <button className="quick-action-btn">
              <span className="action-icon">💬</span>
              View Messages
            </button>
            <button className="quick-action-btn">
              <span className="action-icon">💰</span>
              Payment Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HostOverview;