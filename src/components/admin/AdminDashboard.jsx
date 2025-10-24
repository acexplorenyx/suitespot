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
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListings, setSelectedListings] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected

  useEffect(() => {
    const fetchListings = async () => {
      try {
        let queryRef = collection(db, 'properties');

        // Filter based on status
        if (filter === 'pending') {
          queryRef = query(queryRef, where('status', '==', 'pending'));
        } else if (filter === 'approved') {
          queryRef = query(queryRef, where('status', '==', 'approved'));
        } else if (filter === 'rejected') {
          queryRef = query(queryRef, where('status', '==', 'rejected'));
        }

        const snapshot = await getDocs(queryRef);
        const listingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPendingListings(listingsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching listings:', error);
        setLoading(false);
      }
    };

    fetchListings();
  }, [filter]);

  const handleApprove = async (listingId) => {
    try {
      await updateDoc(doc(db, 'properties', listingId), {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: auth.currentUser?.uid || 'admin',
        updatedAt: new Date()
      });

      // Update local state
      setPendingListings(prev => prev.filter(listing => listing.id !== listingId));
      alert('Listing approved successfully!');
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('Error approving listing. Please try again.');
    }
  };

  const handleReject = async (listingId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'properties', listingId), {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: auth.currentUser?.uid || 'admin',
        rejectionReason: reason,
        updatedAt: new Date()
      });

      // Update local state
      setPendingListings(prev => prev.filter(listing => listing.id !== listingId));
      alert('Listing rejected successfully!');
    } catch (error) {
      console.error('Error rejecting listing:', error);
      alert('Error rejecting listing. Please try again.');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedListings.length === 0) return;

    try {
      const updatePromises = selectedListings.map(listingId =>
        updateDoc(doc(db, 'properties', listingId), {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: auth.currentUser?.uid || 'admin',
          updatedAt: new Date()
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setPendingListings(prev => prev.filter(listing => !selectedListings.includes(listing.id)));
      setSelectedListings([]);
      alert(`${selectedListings.length} listings approved successfully!`);
    } catch (error) {
      console.error('Error bulk approving listings:', error);
      alert('Error approving listings. Please try again.');
    }
  };

  const handleSelectListing = (listingId) => {
    setSelectedListings(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedListings.length === pendingListings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(pendingListings.map(listing => listing.id));
    }
  };

  if (loading) {
    return (
      <div className="listings-tab">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="listings-tab">
      <div className="tab-header">
        <h2>Listing Management</h2>
        <div className="tab-actions">
          {selectedListings.length > 0 && (
            <button className="admin-btn primary" onClick={handleBulkApprove}>
              Approve Selected ({selectedListings.length})
            </button>
          )}
          <button className="admin-btn secondary">Export Listings</button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {[
          { key: 'pending', label: 'Pending Approval', count: pendingListings.filter(l => l.status === 'pending').length },
          { key: 'approved', label: 'Approved', count: pendingListings.filter(l => l.status === 'approved').length },
          { key: 'rejected', label: 'Rejected', count: pendingListings.filter(l => l.status === 'rejected').length }
        ].map(tab => (
          <button
            key={tab.key}
            className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedListings.length > 0 && (
        <div className="bulk-actions">
          <label>
            <input
              type="checkbox"
              checked={selectedListings.length === pendingListings.length}
              onChange={handleSelectAll}
            />
            Select All ({pendingListings.length})
          </label>
          <span>{selectedListings.length} selected</span>
        </div>
      )}

      {/* Listings List */}
      <div className="listings-list">
        {pendingListings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>No {filter} listings</h3>
            <p>
              {filter === 'pending'
                ? 'All listings have been reviewed.'
                : `No listings are currently ${filter}.`
              }
            </p>
          </div>
        ) : (
          pendingListings.map(listing => (
            <ListingItem
              key={listing.id}
              listing={listing}
              onApprove={handleApprove}
              onReject={handleReject}
              isSelected={selectedListings.includes(listing.id)}
              onSelect={handleSelectListing}
              showActions={filter === 'pending'}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Listing Item Component
function ListingItem({ listing, onApprove, onReject, isSelected, onSelect, showActions }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: '#f59e0b', bgColor: '#fef3c7', icon: '⏳' },
      approved: { label: 'Approved', color: '#10b981', bgColor: '#ecfdf5', icon: '✅' },
      rejected: { label: 'Rejected', color: '#ef4444', bgColor: '#fef2f2', icon: '❌' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className="status-badge"
        style={{
          color: config.color,
          backgroundColor: config.bgColor,
          border: `1px solid ${config.color}20`
        }}
      >
        <span className="status-icon">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  return (
    <div className={`listing-item ${isSelected ? 'selected' : ''}`}>
      {showActions && (
        <div className="listing-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(listing.id)}
          />
        </div>
      )}

      <div className="listing-image">
        {listing.images && listing.images.length > 0 ? (
          <img src={listing.images[0]} alt={listing.title} />
        ) : (
          <div className="no-image">
            <span className="no-image-icon">🏠</span>
          </div>
        )}
      </div>

      <div className="listing-content">
        <div className="listing-header">
          <h3>{listing.title || 'Untitled Listing'}</h3>
          {getStatusBadge(listing.status)}
        </div>

        <div className="listing-meta">
          <span className="listing-category">
            <span className="category-icon">
              {listing.category === 'home' ? '🏠' :
               listing.category === 'experience' ? '🎪' : '🔧'}
            </span>
            {listing.category}
          </span>
          <span className="listing-location">📍 {listing.location?.city}, {listing.location?.country}</span>
          <span className="listing-price">₱{listing.price}/night</span>
        </div>

        <div className="listing-details">
          <p className="listing-description">
            {listing.description?.substring(0, 150)}...
          </p>
        </div>

        <div className="listing-host">
          <span className="host-info">
            Host: {listing.hostName} ({listing.hostEmail})
          </span>
          <span className="created-date">
            Created: {listing.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
          </span>
        </div>

        {listing.status === 'rejected' && listing.rejectionReason && (
          <div className="rejection-reason">
            <strong>Rejection Reason:</strong> {listing.rejectionReason}
          </div>
        )}

        {showActions && (
          <div className="listing-actions">
            <button
              className="action-btn approve"
              onClick={() => onApprove(listing.id)}
            >
              ✅ Approve
            </button>
            <button
              className="action-btn reject"
              onClick={() => onReject(listing.id)}
            >
              ❌ Reject
            </button>
          </div>
        )}
      </div>
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
