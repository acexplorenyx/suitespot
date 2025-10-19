import React, { useState, useEffect } from 'react';
import '../../styles/adminstyle.css';

import { 
  collection, query, onSnapshot, doc, updateDoc, deleteDoc,
  serverTimestamp, getDocs, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeHosts: 0,
    pendingApprovals: 0
  });

  // Fetch admin statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users count
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        // Fetch listings count
        const listingsSnapshot = await getDocs(collection(db, 'listings'));
        const totalListings = listingsSnapshot.size;

        // Fetch bookings count
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        const totalBookings = bookingsSnapshot.size;

        // Calculate revenue (sum of all booking amounts)
        let totalRevenue = 0;
        bookingsSnapshot.forEach(doc => {
          const booking = doc.data();
          totalRevenue += booking.totalAmount || 0;
        });

        // Count active hosts (users with listings)
        const activeHosts = listingsSnapshot.docs.reduce((acc, doc) => {
          const listing = doc.data();
          return acc + (listing.hostId ? 1 : 0);
        }, 0);

        // Count pending approvals (listings with status 'pending')
        const pendingApprovals = listingsSnapshot.docs.filter(doc => {
          const listing = doc.data();
          return listing.status === 'pending';
        }).length;

        setStats({
          totalUsers,
          totalListings,
          totalBookings,
          totalRevenue,
          activeHosts,
          pendingApprovals
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'listings', label: 'Listings', icon: '🏠' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Admin Dashboard</h1>
            <p>Manage your SuiteSpot platform</p>
          </div>
          <div className="header-actions">
            <button className="admin-btn primary">
              Export Data
            </button>
            <button className="admin-btn secondary">
              System Settings
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        {/* Navigation Tabs */}
        <div className="admin-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'listings' && <ListingsTab />}
          {activeTab === 'bookings' && <BookingsTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ stats }) {
  return (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalListings}</div>
            <div className="stat-label">Total Listings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalBookings}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏡</div>
          <div className="stat-info">
            <div className="stat-value">{stats.activeHosts}</div>
            <div className="stat-label">Active Hosts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingApprovals}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </div>
      </div>

      <div className="overview-sections">
        <div className="section-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">👤</span>
              <div className="activity-content">
                <p>New user registered</p>
                <small>2 minutes ago</small>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🏠</span>
              <div className="activity-content">
                <p>New listing submitted</p>
                <small>15 minutes ago</small>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📅</span>
              <div className="activity-content">
                <p>New booking created</p>
                <small>1 hour ago</small>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button className="action-btn">
              <span className="action-icon">✅</span>
              Approve Listings
            </button>
            <button className="action-btn">
              <span className="action-icon">👥</span>
              Manage Users
            </button>
            <button className="action-btn">
              <span className="action-icon">📊</span>
              View Reports
            </button>
            <button className="action-btn">
              <span className="action-icon">⚙️</span>
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-state">Loading users...</div>;
  }

  return (
    <div className="users-tab">
      <div className="tab-header">
        <h2>User Management</h2>
        <div className="tab-actions">
          <button className="admin-btn primary">Add User</button>
          <button className="admin-btn secondary">Export Users</button>
        </div>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="user-name">{user.displayName || 'Unknown'}</div>
                      <div className="user-id">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role || 'user'}`}>
                    {user.role || 'User'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status || 'active'}`}>
                    {user.status || 'Active'}
                  </span>
                </td>
                <td>{user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn small">Edit</button>
                    <button className="action-btn small danger">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Listings Tab Component
function ListingsTab() {
  return (
    <div className="listings-tab">
      <div className="tab-header">
        <h2>Listing Management</h2>
        <div className="tab-actions">
          <button className="admin-btn primary">Approve All</button>
          <button className="admin-btn secondary">Export Listings</button>
        </div>
      </div>
      <p>Listing management content will be implemented here...</p>
    </div>
  );
}

// Bookings Tab Component
function BookingsTab() {
  return (
    <div className="bookings-tab">
      <div className="tab-header">
        <h2>Booking Management</h2>
        <div className="tab-actions">
          <button className="admin-btn primary">View All</button>
          <button className="admin-btn secondary">Export Bookings</button>
        </div>
      </div>
      <p>Booking management content will be implemented here...</p>
    </div>
  );
}

// Reports Tab Component
function ReportsTab() {
  return (
    <div className="reports-tab">
      <div className="tab-header">
        <h2>Reports & Analytics</h2>
        <div className="tab-actions">
          <button className="admin-btn primary">Generate Report</button>
          <button className="admin-btn secondary">Export Data</button>
        </div>
      </div>
      <p>Reports and analytics content will be implemented here...</p>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  return (
    <div className="settings-tab">
      <div className="tab-header">
        <h2>System Settings</h2>
        <div className="tab-actions">
          <button className="admin-btn primary">Save Changes</button>
          <button className="admin-btn secondary">Reset to Default</button>
        </div>
      </div>
      <p>System settings content will be implemented here...</p>
    </div>
  );
}

export default AdminDashboard;
