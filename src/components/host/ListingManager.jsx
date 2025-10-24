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
  const [selectedListings, setSelectedListings] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: [0, 1000],
    guests: 1,
    rating: 0,
    amenities: []
  });

  // Enhanced filtering with search and advanced filters
  const filteredListings = listings.filter(listing => {
    const matchesSearch = searchTerm ? 
      listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesViewMode = viewMode === 'all' || listing.status === viewMode;
    
    const matchesCategory = filters.category === 'all' || listing.category === filters.category;
    
    const price = parseFloat(listing.price) || 0;
    const discount = parseFloat(listing.discount) || 0;
    const finalPrice = price * (1 - discount / 100);
    const matchesPrice = finalPrice >= filters.priceRange[0] && finalPrice <= filters.priceRange[1];
    
    const matchesGuests = listing.maxGuests >= filters.guests;
    
    const matchesRating = listing.rating >= filters.rating;

    const matchesAmenities = filters.amenities.length === 0 || 
      filters.amenities.every(amenity => listing.amenities?.includes(amenity));

    return matchesSearch && matchesViewMode && matchesCategory && 
           matchesPrice && matchesGuests && matchesRating && matchesAmenities;
  });

  // Bulk selection functions
  const handleSelectListing = (listingId) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedListings.length === filteredListings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(filteredListings.map(listing => listing.id));
    }
  };

  // Bulk actions
  const handleBulkPublish = async () => {
    try {
      const updatePromises = selectedListings.map(listingId =>
        updateDoc(doc(db, 'properties', listingId), {
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      alert(`${selectedListings.length} listings published successfully!`);
      setSelectedListings([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk publishing:', error);
      alert('Error publishing listings');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedListings.length} listings?`)) return;
    
    try {
      const deletePromises = selectedListings.map(listingId =>
        deleteDoc(doc(db, 'properties', listingId))
      );
      
      await Promise.all(deletePromises);
      alert(`${selectedListings.length} listings deleted successfully!`);
      setSelectedListings([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Error deleting listings');
    }
  };

  const handleBulkDraft = async () => {
    try {
      const updatePromises = selectedListings.map(listingId =>
        updateDoc(doc(db, 'properties', listingId), {
          status: 'draft',
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      alert(`${selectedListings.length} listings moved to draft!`);
      setSelectedListings([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk drafting:', error);
      alert('Error moving listings to draft');
    }
  };

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
        updatedAt: new Date(),
        ...(newStatus === 'published' && { publishedAt: new Date() })
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

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      category: 'all',
      priceRange: [0, 1000],
      guests: 1,
      rating: 0,
      amenities: []
    });
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
          <h1>Your Listings</h1>
          <p>Manage your properties and experiences</p>
        </div>
        <div className="header-actions">
          <button 
            className="add-listing-btn primary"
            onClick={() => setShowForm(true)}>
            + Add New Listing
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="listings-stats">
        <div className="stat-item">
          <span className="stat-number">{listings.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{listings.filter(l => l.status === 'published').length}</span>
          <span className="stat-label">Published</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{listings.filter(l => l.status === 'draft').length}</span>
          <span className="stat-label">Drafts</span>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedListings.length}
        onBulkPublish={handleBulkPublish}
        onBulkDelete={handleBulkDelete}
        onBulkDraft={handleBulkDraft}
        onCancel={() => {
          setSelectedListings([]);
          setShowBulkActions(false);
        }}
      />

      {/* Enhanced Controls */}
      <div className="listings-controls">
        <div className="controls-left">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search listings by title, city, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="listing-search-icon">🔍</span>
          </div>

          <button 
            className="filter-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            🎛️ Filters
          </button>

          {(searchTerm || filters.category !== 'all' || filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              ❌ Clear Filters
            </button>
          )}
        </div>

        <div className="controls-right">
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

          <button 
            className="bulk-select-btn"
            onClick={() => setShowBulkActions(!showBulkActions)}
          >
            {showBulkActions ? '❌ Cancel' : '☑️ Bulk Select'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowAdvancedFilters(false)}
        />
      )}

      {/* Listings Grid */}
      <div className="listings-grid">
        {filteredListings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>No listings found</h3>
            <p>
              {searchTerm || filters.category !== 'all' 
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
            {(searchTerm || filters.category !== 'all') && (
              <button 
                className="clear-search-btn"
                onClick={clearAllFilters}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {showBulkActions && (
              <div className="bulk-select-header">
                <label className="bulk-select-all">
                  <input
                    type="checkbox"
                    checked={selectedListings.length === filteredListings.length}
                    onChange={handleSelectAll}
                  />
                  Select All ({filteredListings.length} listings)
                </label>
              </div>
            )}
            
            {filteredListings.map(listing => (
              <ListingCard 
                key={listing.id}
                listing={listing}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                isSelected={selectedListings.includes(listing.id)}
                onSelect={handleSelectListing}
                showBulkActions={showBulkActions}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Enhanced Listing Card Component
function ListingCard({ listing, onEdit, onDelete, onToggleStatus, isSelected, onSelect, showBulkActions }) {
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

  const calculateOccupancyRate = () => {
    const totalDays = 30;
    const bookedDays = listing.bookedDays || 0;
    return ((bookedDays / totalDays) * 100).toFixed(1);
  };

  return (
    <div className={`listing-card ${isSelected ? 'selected' : ''}`}>
      {showBulkActions && (
        <div className="bulk-select-checkbox">
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
            <p>No Image</p>
          </div>
        )}
        <div className="listing-overlay">
          {getStatusBadge(listing.status)}
          {listing.isFeatured && (
            <span className="featured-badge">⭐ Featured</span>
          )}
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

        {/* Performance Analytics */}
        <div className="listing-analytics">
          <div className="analytics-grid">
            <div className="analytics-item">
              <span className="analytics-value">{listing.views || 0}</span>
              <span className="analytics-label">Views</span>
            </div>
            <div className="analytics-item">
              <span className="analytics-value">{listing.bookingsCount || 0}</span>
              <span className="analytics-label">Bookings</span>
            </div>
            <div className="analytics-item">
              <span className="analytics-value">{calculateOccupancyRate()}%</span>
              <span className="analytics-label">Occupancy</span>
            </div>
            <div className="analytics-item">
              <span className="analytics-value">⭐ {listing.rating || 'New'}</span>
              <span className="analytics-label">Rating</span>
            </div>
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

// Bulk Actions Toolbar Component
function BulkActionsToolbar({ selectedCount, onBulkPublish, onBulkDelete, onBulkDraft, onCancel }) {
  if (selectedCount === 0) return null;
  
  return (
    <div className="bulk-actions-toolbar">
      <div className="bulk-info">
        <strong>{selectedCount} listing{selectedCount !== 1 ? 's' : ''} selected</strong>
      </div>
      <div className="bulk-buttons">
        <button className="bulk-btn publish" onClick={onBulkPublish}>
          📁 Publish Selected
        </button>
        <button className="bulk-btn draft" onClick={onBulkDraft}>
          📝 Move to Draft
        </button>
        <button className="bulk-btn delete" onClick={onBulkDelete}>
          🗑️ Delete Selected
        </button>
        <button className="bulk-btn cancel" onClick={onCancel}>
          ❌ Cancel
        </button>
      </div>
    </div>
  );
}

// Advanced Filters Component
function AdvancedFilters({ filters, onFiltersChange, onClose }) {
  const amenitiesList = ['WiFi', 'Kitchen', 'Pool', 'Free Parking', 'Gym', 'Air Conditioning'];

  return (
    <div className="advanced-filters">
      <div className="filters-header">
        <h3>Advanced Filters</h3>
        <button className="close-filters" onClick={onClose}>×</button>
      </div>
      
      <div className="filters-grid">
        <div className="filter-group">
          <label>Category</label>
          <select 
            value={filters.category} 
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
          >
            <option value="all">All Categories</option>
            <option value="home">🏠 Homes</option>
            <option value="experience">🎯 Experiences</option>
            <option value="service">🔧 Services</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</label>
          <div className="range-slider">
            <input
              type="range"
              min="0"
              max="1000"
              value={filters.priceRange[0]}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                priceRange: [parseInt(e.target.value), filters.priceRange[1]] 
              })}
            />
            <input
              type="range"
              min="0"
              max="1000"
              value={filters.priceRange[1]}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                priceRange: [filters.priceRange[0], parseInt(e.target.value)] 
              })}
            />
          </div>
        </div>
        
        <div className="filter-group">
          <label>Minimum Guests: {filters.guests}</label>
          <input
            type="range"
            min="1"
            max="20"
            value={filters.guests}
            onChange={(e) => onFiltersChange({ ...filters, guests: parseInt(e.target.value) })}
          />
        </div>
        
        <div className="filter-group">
          <label>Minimum Rating: {filters.rating}⭐</label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={filters.rating}
            onChange={(e) => onFiltersChange({ ...filters, rating: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>Amenities</label>
        <div className="amenities-filter">
          {amenitiesList.map(amenity => (
            <label key={amenity} className="amenity-filter-option">
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity)}
                onChange={(e) => {
                  const newAmenities = e.target.checked
                    ? [...filters.amenities, amenity]
                    : filters.amenities.filter(a => a !== amenity);
                  onFiltersChange({ ...filters, amenities: newAmenities });
                }}
              />
              {amenity}
            </label>
          ))}
        </div>
      </div>
      
      <button 
        className="apply-filters-btn"
        onClick={onClose}
      >
        Apply Filters
      </button>
    </div>
  );
}

export default ListingsManager;