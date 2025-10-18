import React, { useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import PropertyListing from './PropertyListing';
import '../../styles/listingstyle.css';

function ListingsManager({ listings }) {
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [viewMode, setViewMode] = useState('published');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredListings = listings.filter(listing => {
    const matchesViewMode = viewMode === 'all' || listing.status === viewMode;
    const matchesSearch = listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesViewMode && matchesSearch;
  });

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setShowForm(true);
  };

  const handleDelete = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteDoc(doc(db, 'properties', listingId));
        alert('Listing deleted successfully!');
      } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Error deleting listing. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (listingId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await updateDoc(doc(db, 'properties', listingId), {
        status: newStatus,
        updatedAt: new Date()
      });
      alert(`Listing ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('Error updating listing. Please try again.');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingListing(null);
  };

  if (showForm) {
    return (
      <div className="listings-manager">
        <div className="form-header">
          <button 
            className="back-btn"
            onClick={handleFormClose}
          >
            ← Back to Listings
          </button>
          <h2>{editingListing ? 'Edit Listing' : 'Create New Listing'}</h2>
          {editingListing && (
            <div className="listing-status">
              Current Status: <span className={`status ${editingListing.status}`}>
                {editingListing.status}
              </span>
            </div>
          )}
        </div>
        <PropertyListing
          onSave={handleFormClose}
          initialData={editingListing}
        />
      </div>
    );
  }

  return (
    <div className="listings-manager">
      <div className="listings-header">
        <div className="header-left">
          <h2>Your Listings</h2>
          <p>Manage your properties and experiences</p>
        </div>
        <button 
          className="create-listing-btn"
          onClick={() => setShowForm(true)}
        >
          + Create New Listing
        </button>
      </div>

      {/* NEW: Search and Filter Bar */}
      <div className="listings-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search listings by title or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-tabs">
          {['published', 'drafts', 'all'].map(mode => (
            <button
              key={mode}
              className={`filter-tab ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
              <span className="count-badge">
                {mode === 'published' && listings.filter(l => l.status === 'published').length}
                {mode === 'drafts' && listings.filter(l => l.status === 'draft').length}
                {mode === 'all' && listings.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="listings-grid">
        {filteredListings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>No listings found</h3>
            <p>
              {searchTerm 
                ? "No listings match your search criteria."
                : viewMode === 'published' 
                ? "You don't have any published listings yet."
                : viewMode === 'drafts'
                ? "You don't have any drafts saved."
                : "You haven't created any listings yet."
              }
            </p>
            {viewMode !== 'drafts' && !searchTerm && (
              <button 
                className="create-first-btn"
                onClick={() => setShowForm(true)}
              >
                Create Your First Listing
              </button>
            )}
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredListings.map(listing => (
            <ListingCard 
              key={listing.id}
              listing={listing}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Enhanced Listing Card Component
function ListingCard({ listing, onEdit, onDelete, onToggleStatus }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { label: 'Published', color: '#10b981', bgColor: '#ecfdf5', icon: '✅' },
      draft: { label: 'Draft', color: '#6b7280', bgColor: '#f3f4f6', icon: '📝' },
      archived: { label: 'Archived', color: '#ef4444', bgColor: '#fef2f2', icon: '📁' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
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

  const calculateDiscountedPrice = () => {
    const basePrice = parseFloat(listing.price) || 0;
    const discount = parseFloat(listing.discount) || 0;
    return basePrice * (1 - discount / 100);
  };

  return (
    <div className="listing-card">
      <div className="listing-image">
        {listing.images && listing.images.length > 0 ? (
          <img src={listing.images[0]} alt={listing.title} />
        ) : (
          <div className="no-image">
            <span className="no-image-icon">🏠</span>
            <p>No Image</p>
          </div>
        )}
        <div className="listing-overlay">
          {getStatusBadge(listing.status)}
          <div className="listing-points">
            <span className="points-badge">⭐ {listing.hostPoints || 0} points</span>
          </div>
        </div>
      </div>
      
      <div className="listing-content">
        <h3 className="listing-title">{listing.title || 'Untitled Listing'}</h3>
        
        <div className="listing-meta">
          <span className="listing-category">
            <span className="category-icon">
              {listing.category === 'home' ? '🏠' : 
               listing.category === 'experience' ? '🎪' : '🔧'}
            </span>
            {listing.category}
          </span>
          
          <div className="listing-location">
            📍 {listing.location?.city}, {listing.location?.country}
          </div>
        </div>
        
        <div className="listing-details">
          <div className="pricing-info">
            <div className="price-main">
              <span className="current-price">${calculateDiscountedPrice().toFixed(2)}</span>
              <span className="price-period">/night</span>
            </div>
            {listing.discount > 0 && (
              <div className="discount-info">
                <span className="original-price">${listing.price}</span>
                <span className="discount-badge">-{listing.discount}%</span>
              </div>
            )}
          </div>
          
          <div className="capacity-info">
            <div className="capacity-item">
              <span className="capacity-icon">👥</span>
              {listing.maxGuests} guests
            </div>
            <div className="capacity-item">
              <span className="capacity-icon">🛏️</span>
              {listing.beds} beds
            </div>
            <div className="capacity-item">
              <span className="capacity-icon">🚿</span>
              {listing.bathrooms} baths
            </div>
          </div>
        </div>
        
        <div className="listing-stats">
          <div className="stat">
            <span className="stat-label">Views:</span>
            <span className="stat-value">{listing.views || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Bookings:</span>
            <span className="stat-value">{listing.bookingsCount || 0}</span>
          </div>
        </div>
        
        <div className="listing-actions">
          <button 
            className="action-btn edit-btn"
            onClick={() => onEdit(listing)}
          >
            ✏️ Edit
          </button>
          
          <button 
            className={`action-btn status-btn ${listing.status === 'published' ? 'unpublish' : 'publish'}`}
            onClick={() => onToggleStatus(listing.id, listing.status)}
          >
            {listing.status === 'published' ? '📁 Unpublish' : '✅ Publish'}
          </button>
          
          <button 
            className="action-btn delete-btn"
            onClick={() => onDelete(listing.id)}
          >
            🗑️ Delete
          </button>
        </div>

        {/* NEW: Quick Info Footer */}
        <div className="listing-footer">
          <div className="created-date">
            Created: {listing.createdAt ? new Date(listing.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
          </div>
          {listing.publishedAt && (
            <div className="published-date">
              Published: {new Date(listing.publishedAt.seconds * 1000).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingsManager;