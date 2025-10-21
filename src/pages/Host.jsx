import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import HostOverview from '../components/host/HostOverview';
import ListingManager from '../components/host/ListingManager';
import CalendarManager from '../components/host/CalendarManager';
import MessagesManager from '../components/host/MessagesManager';
import EarningsDashboard from '../components/host/EarningsDashboard';
import AccountSettings from '../components/host/AccountSettings';
import HelpSupport from '../components/host/HelpSupport';
import logoImage from '/logo.ico';
import '../styles/hoststyle.css';

function HostDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  
  const [stats, setStats] = useState({
    totalListings: 0,
    publishedListings: 0,
    draftListings: 0,
    todayBookings: 0,
    upcomingBookings: 0,
    totalEarnings: 0,
    hostPoints: 0,
    responseRate: 0,
    monthlyEarnings: 0
  });

  const navigate = useNavigate();

  // Close user menu and notifications on outside click and on ESC
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Switch to guest mode
  const switchToGuestMode = () => {
    navigate('/');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Fetch user profile
      const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
      const unsubscribeUser = onSnapshot(userQuery, (snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setUserProfile(userData);
          setStats(prev => ({ ...prev, hostPoints: userData.points || 0 }));
        }
      });

      // Fetch host listings
      const listingsQuery = query(
        collection(db, 'properties'),
        where('hostId', '==', user.uid)
      );

      const unsubscribeListings = onSnapshot(listingsQuery, (snapshot) => {
        const listingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setListings(listingsData);

        const publishedListings = listingsData.filter(l => l.status === 'published').length;
        const draftListings = listingsData.filter(l => l.status === 'draft').length;
        
        // Calculate total host points from listings
        const totalPoints = listingsData.reduce((sum, listing) => sum + (listing.hostPoints || 0), 0);

        setStats(prev => ({
          ...prev,
          totalListings: listingsData.length,
          publishedListings,
          draftListings,
          hostPoints: totalPoints
        }));
      });

      // Fetch host bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('hostId', '==', user.uid),
        where('status', 'in', ['confirmed', 'completed', 'pending'])
      );

      const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBookings(bookingsData);

        // Calculate today's and upcoming bookings
        const today = new Date().toDateString();
        const todayBookings = bookingsData.filter(booking =>
          new Date(booking.checkIn).toDateString() === today
        ).length;

        const upcomingBookings = bookingsData.filter(booking =>
          new Date(booking.checkIn) > new Date()
        ).length;

        const totalEarnings = bookingsData
          .filter(booking => booking.status === 'completed')
          .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

        const monthlyEarnings = bookingsData
          .filter(booking => {
            const bookingDate = new Date(booking.checkIn);
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            return bookingDate.getMonth() === currentMonth && 
                   bookingDate.getFullYear() === currentYear &&
                   booking.status === 'completed';
          })
          .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

        setStats(prev => ({
          ...prev,
          todayBookings,
          upcomingBookings,
          totalEarnings,
          monthlyEarnings
        }));
      });

      // Fetch messages
      const messagesQuery = query(
        collection(db, 'messages'),
        where('hostId', '==', user.uid),
        where('isRead', '==', false)
      );

      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesData);
      });

      return () => {
        unsubscribeUser();
        unsubscribeListings();
        unsubscribeBookings();
        unsubscribeMessages();
      };
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HostOverview stats={stats} bookings={bookings} listings={listings} />;
      case 'listings':
        return <ListingManager listings={listings} />;
      case 'calendar':
        return <CalendarManager listings={listings} bookings={bookings} />;
      case 'messages':
        return <MessagesManager messages={messages} />;
      case 'earnings':
        return <EarningsDashboard stats={stats} bookings={bookings} />;
      case 'settings':
        return <AccountSettings user={userProfile} />;
      case 'help':
        return <HelpSupport />;
      default:
        return <HostOverview stats={stats} bookings={bookings} listings={listings} />;
    }
  };

  // Calculate unread messages count
  const unreadMessagesCount = messages.filter(msg => !msg.isRead).length;

  // Mock notifications data (replace with real data from Firestore)
  const notifications = [
    {
      id: 1,
      icon: '📅',
      title: 'New Booking',
      message: 'John Doe booked your property for 3 nights',
      time: '5 minutes ago',
      unread: true
    },
    {
      id: 2,
      icon: '💬',
      title: 'New Message',
      message: 'Sarah asked about check-in time',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      icon: '⭐',
      title: 'New Review',
      message: 'You received a 5-star review!',
      time: '2 hours ago',
      unread: false
    },
    {
      id: 4,
      icon: '💰',
      title: 'Payment Received',
      message: '$450 has been deposited to your account',
      time: '1 day ago',
      unread: false
    }
  ];

  const unreadNotificationsCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    // Implement mark all as read logic
    console.log('Mark all notifications as read');
  };

  return (
    <div className="host-dashboard">
      {/* Enhanced Navigation Bar */}
      <nav className="host-navbar">
        <div className="nav-container">
          {/* Logo */}
          <div className="nav-logo" onClick={() => navigate('/host')}>
            <span className="logo-icon"><img src={logoImage} alt="SuiteSpot Logo" className="logo-img" /></span>
            <span className="logo-text">SuiteSpot</span>
            <span className="logo-badge">Host</span>
          </div>

          {/* Navigation Tabs */}
          <div className="nav-tabs">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: '📊' },
              { key: 'listings', label: 'Listings', icon: '🏠' },
              { key: 'calendar', label: 'Calendar', icon: '📅' },
              { key: 'messages', label: 'Messages', icon: '💬', badge: unreadMessagesCount },
              { key: 'earnings', label: 'Earnings', icon: '💰' },
            ].map(tab => (
              <button
                key={tab.key}
                className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                title={tab.label}
                aria-label={tab.label}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {tab.badge > 0 && <span className="nav-badge">{tab.badge > 9 ? '9+' : tab.badge}</span>}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="nav-user-menu">
            {/* Notifications Dropdown */}
            <div className="notifications-container" ref={notificationsRef}>
              <button 
                className="notifications-trigger"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                aria-label="Notifications"
                aria-haspopup="menu"
                aria-expanded={showNotifications}
              >
                <span className="switch-icon">🔔</span>
                {unreadNotificationsCount > 0 && (
                  <span className="nav-badge" style={{ position: 'absolute', top: '-6px', right: '-6px' }}>
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown" role="menu">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <button className="mark-all-read" onClick={handleMarkAllRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`notification-item ${notification.unread ? 'unread' : ''}`}
                          onClick={() => {
                            // Handle notification click
                            setShowNotifications(false);
                          }}
                        >
                          <span className="notification-icon">{notification.icon}</span>
                          <div className="notification-content">
                            <div className="notification-title">{notification.title}</div>
                            <div className="notification-message">{notification.message}</div>
                            <div className="notification-time">{notification.time}</div>
                          </div>
                          {notification.unread && <div className="notification-dot"></div>}
                        </div>
                      ))
                    ) : (
                      <div className="notifications-empty">
                        <div className="notifications-empty-icon">🔔</div>
                        <p>No notifications yet</p>
                      </div>
                    )}
                  </div>

                  <div className="notifications-footer">
                    <button 
                      className="view-all-notifications"
                      onClick={() => {
                        setShowNotifications(false);
                        setActiveTab('messages');
                      }}
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="user-menu-container" ref={userMenuRef}>
              <button 
                className="user-menu-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowUserMenu((s) => !s); } }}
              >
                <div className="user-avatar">
                  <img 
                    src={userProfile?.photoURL || '/api/placeholder/32/32'} 
                    alt={userProfile?.displayName || 'User'} 
                  />
                </div>
                <span className="user-name">{userProfile?.displayName || 'User'}</span>
                <span className={`menu-arrow ${showUserMenu ? 'open' : ''}`}>▼</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown" role="menu" aria-label="User menu">
                  {/* User Info Section */}
                  <div className="dropdown-section user-info-section">
                    <div className="user-info">
                      <div className="user-avatar large">
                        {userProfile?.photoURL ? (
                          <img 
                            src={userProfile.photoURL} 
                            alt={userProfile?.displayName || 'User'} 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="avatar-fallback" style={{ display: userProfile?.photoURL ? 'none' : 'flex' }}>
                          {userProfile?.displayName?.charAt(0) || 'U'}
                        </div>
                      </div>
                      <div className="user-details">
                        <div className="user-name">{userProfile?.displayName || 'User'}</div>
                        <div className="user-email">{userProfile?.email || 'user@example.com'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="dropdown-section">
                    <button 
                      className="dropdown-item" 
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('settings');
                      }}
                    >
                      <span className="item-icon profile-icon">👤</span>
                      <span className="item-text">Profile</span>
                    </button>
                    <button 
                      className="dropdown-item" 
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('settings');
                      }}
                    >
                      <span className="item-icon settings-icon">⚙️</span>
                      <span className="item-text">Account Settings</span>
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('earnings');
                      }}
                    >
                      <span className="item-icon rewards-icon">⭐</span>
                      <span className="item-text">Points & Rewards ({stats.hostPoints || 0})</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="dropdown-divider"></div>

                  {/* Switch Mode */}
                  <div className="dropdown-section">
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        switchToGuestMode();
                      }}
                    >
                      <span className="item-icon guest-icon">👤</span>
                      <span className="item-text">Switch to Guest Mode</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="dropdown-divider"></div>

                  {/* Help & Support */}
                  <div className="dropdown-section">
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('help');
                      }}
                    >
                      <span className="item-icon help-icon">🔧</span>
                      <span className="item-text">Help & Support</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="dropdown-section">
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <span className="item-icon logout-icon">🚪</span>
                      <span className="item-text">Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="host-content">
        {/* Stats Overview */}
        <div className="stats-overview">
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
                <h3>${stats.monthlyEarnings}</h3>
                <p>This Month</p>
                <small>After service fees</small>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}

export default HostDashboard;
