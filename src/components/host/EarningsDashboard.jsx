import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import '../../styles/earningsdashboard.css';

function EarningsDashboard({ stats, bookings }) {
  const [timeRange, setTimeRange] = useState('monthly'); // daily, weekly, monthly, yearly
  const [earningsData, setEarningsData] = useState([]);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState('');

  // Calculate earnings based on time range
  useEffect(() => {
    const calculateEarnings = () => {
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const now = new Date();
      
      let filteredBookings = [];

      switch (timeRange) {
        case 'daily':
          filteredBookings = completedBookings.filter(booking => 
            new Date(booking.checkIn).toDateString() === now.toDateString()
          );
          break;
        case 'weekly':
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredBookings = completedBookings.filter(booking => 
            new Date(booking.checkIn) >= oneWeekAgo
          );
          break;
        case 'monthly':
          const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          filteredBookings = completedBookings.filter(booking => 
            new Date(booking.checkIn) >= oneMonthAgo
          );
          break;
        case 'yearly':
          const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          filteredBookings = completedBookings.filter(booking => 
            new Date(booking.checkIn) >= oneYearAgo
          );
          break;
        default:
          filteredBookings = completedBookings;
      }

      return filteredBookings;
    };

    const filteredBookings = calculateEarnings();
    setEarningsData(filteredBookings);
  }, [bookings, timeRange]);

  // Calculate totals
  const totalEarnings = earningsData.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  const serviceFees = totalEarnings * 0.10; // 10% service fee
  const netEarnings = totalEarnings - serviceFees;
  const averageBookingValue = earningsData.length > 0 ? totalEarnings / earningsData.length : 0;

  // Mock payout methods - in real app, fetch from payment service
  const mockPayoutMethods = [
    { id: '1', type: 'bank', name: 'BDO Savings', last4: '1234', primary: true },
    { id: '2', type: 'ewallet', name: 'GCash', last4: '5678', primary: false },
    { id: '3', type: 'ewallet', name: 'PayMaya', last4: '9012', primary: false }
  ];

  // Request payout
  const requestPayout = async () => {
    if (!selectedPayoutMethod) {
      alert('Please select a payout method');
      return;
    }

    if (netEarnings < 10) {
      alert('Minimum payout amount is $10');
      return;
    }

    try {
      // In real app, integrate with payment processor
      alert(`Payout request of $${netEarnings.toFixed(2)} submitted successfully!`);
      
      // Reset earnings data after payout
      setEarningsData([]);
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Error processing payout request');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="earnings-dashboard">
      <div className="earnings-header">
        <h2>Earnings Dashboard</h2>
        <p>Track your income and manage payouts</p>
      </div>

      {/* Time Range Selector */}
      <div className="time-range-selector">
        {['daily', 'weekly', 'monthly', 'yearly'].map(range => (
          <button
            key={range}
            className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
            onClick={() => setTimeRange(range)}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Earnings Overview */}
      <div className="earnings-overview">
        <div className="earnings-card total">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>{formatCurrency(totalEarnings)}</h3>
            <p>Total Gross Earnings</p>
            <small>{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}</small>
          </div>
        </div>

        <div className="earnings-card net">
          <div className="card-icon">💳</div>
          <div className="card-content">
            <h3>{formatCurrency(netEarnings)}</h3>
            <p>Net Earnings</p>
            <small>After 10% service fee</small>
          </div>
        </div>

        <div className="earnings-card bookings">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>{earningsData.length}</h3>
            <p>Completed Bookings</p>
            <small>{timeRange} total</small>
          </div>
        </div>

        <div className="earnings-card average">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>{formatCurrency(averageBookingValue)}</h3>
            <p>Average Booking</p>
            <small>Per reservation</small>
          </div>
        </div>
      </div>

      <div className="earnings-content">
        {/* Earnings Breakdown */}
        <div className="earnings-breakdown">
          <h3>Earnings Breakdown</h3>
          <div className="breakdown-list">
            <div className="breakdown-item">
              <span className="breakdown-label">Gross Earnings:</span>
              <span className="breakdown-value">{formatCurrency(totalEarnings)}</span>
            </div>
            <div className="breakdown-item fee">
              <span className="breakdown-label">Service Fee (10%):</span>
              <span className="breakdown-value">-{formatCurrency(serviceFees)}</span>
            </div>
            <div className="breakdown-item net-total">
              <span className="breakdown-label">Net Earnings:</span>
              <span className="breakdown-value">{formatCurrency(netEarnings)}</span>
            </div>
          </div>

          {/* Payout Section */}
          <div className="payout-section">
            <h4>Request Payout</h4>
            
            <div className="payout-methods">
              <label>Select Payout Method:</label>
              <div className="method-options">
                {mockPayoutMethods.map(method => (
                  <label key={method.id} className="method-option">
                    <input
                      type="radio"
                      name="payoutMethod"
                      value={method.id}
                      checked={selectedPayoutMethod === method.id}
                      onChange={(e) => setSelectedPayoutMethod(e.target.value)}
                    />
                    <div className="method-info">
                      <span className="method-name">
                        {method.type === 'bank' ? '🏦' : '📱'} {method.name}
                      </span>
                      <span className="method-details">
                        ****{method.last4} {method.primary && '(Primary)'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button 
              className="payout-btn"
              onClick={requestPayout}
              disabled={netEarnings < 10}
            >
              💸 Request Payout of {formatCurrency(netEarnings)}
            </button>

            {netEarnings < 10 && (
              <p className="payout-notice">
                Minimum payout amount is $10. Current available: {formatCurrency(netEarnings)}
              </p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="recent-transactions">
          <h3>Recent Transactions</h3>
          {earningsData.length === 0 ? (
            <div className="empty-transactions">
              <div className="empty-icon">💵</div>
              <p>No transactions found</p>
              <small>Your earnings will appear here after completed bookings</small>
            </div>
          ) : (
            <div className="transactions-list">
              {earningsData
                .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
                .slice(0, 10)
                .map((booking, index) => (
                  <div key={booking.id || index} className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-main">
                        <strong>{booking.propertyTitle}</strong>
                        <span className="guest-name">{booking.guestName}</span>
                      </div>
                      <div className="transaction-dates">
                        {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="transaction-amount">
                      <div className="amount-total">{formatCurrency(booking.totalPrice)}</div>
                      <div className="amount-fee">-{formatCurrency(booking.totalPrice * 0.10)} fee</div>
                      <div className="amount-net">+{formatCurrency(booking.totalPrice * 0.90)}</div>
                    </div>
                    <div className="transaction-status">
                      <span className={`status ${booking.status}`}>{booking.status}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* E-wallet Integration */}
      <div className="ewallet-integration">
        <h3>E-wallet Integration</h3>
        <div className="ewallet-options">
          <button className="ewallet-btn gcash">
            <span className="ewallet-icon">📱</span>
            Connect GCash
          </button>
          <button className="ewallet-btn paymaya">
            <span className="ewallet-icon">💜</span>
            Connect PayMaya
          </button>
          <button className="ewallet-btn bank">
            <span className="ewallet-icon">🏦</span>
            Add Bank Account
          </button>
        </div>
        <p className="integration-note">
          Connect your e-wallet for faster payouts and real-time earnings tracking
        </p>
      </div>
    </div>
  );
}

export default EarningsDashboard;