import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import '../../styles/propertylistingstyle.css';

function PropertyListing({ onSave, initialData = {} }) {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    category: initialData.category || 'home',
    type: initialData.type || 'entire-place',
    description: initialData.description || '',
    price: initialData.price || '',
    discount: initialData.discount || 0,
    promoCode: initialData.promoCode || '',
    location: initialData.location || { address: '', city: '', country: '', coordinates: { lat: 0, lng: 0 } },
    amenities: initialData.amenities || [],
    images: initialData.images || [],
    maxGuests: initialData.maxGuests || 1,
    bedrooms: initialData.bedrooms || 1,
    beds: initialData.beds || 1,
    bathrooms: initialData.bathrooms || 1,
    status: initialData.status || 'draft',
    // NEW: Added for points & rewards
    hostPoints: initialData.hostPoints || 0,
    isFeatured: initialData.isFeatured || false,
    // NEW: Added for policy compliance
    cancellationPolicy: initialData.cancellationPolicy || 'flexible',
    houseRules: initialData.houseRules || []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState(initialData.images || []);

  const categories = [
    { value: 'home', label: 'Home/Apartment', icon: '🏠' },
    { value: 'experience', label: 'Experience', icon: '🎪' },
    { value: 'service', label: 'Service', icon: '🔧' }
  ];

  const amenitiesList = [
    'WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air Conditioning', 'Heating',
    'TV', 'Hair Dryer', 'Iron', 'Pool', 'Hot Tub', 'Free Parking',
    'EV Charger', 'Gym', 'Breakfast', 'Smoking Allowed', 'Pets Allowed'
  ];

  const cancellationPolicies = [
    { value: 'flexible', label: 'Flexible: Full refund 1 day before arrival' },
    { value: 'moderate', label: 'Moderate: Full refund 5 days before arrival' },
    { value: 'strict', label: 'Strict: 50% refund up to 1 week before arrival' }
  ];

  const houseRulesList = [
    'No smoking', 'No parties/events', 'Pets allowed', 'Not suitable for children',
    'Check-in after 3 PM', 'Check-out before 11 AM', 'No loud noise after 10 PM'
  ];

  // NEW: Image upload handler
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // Simulate image upload - in real app, upload to Firebase Storage
    const newImageUrls = files.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...newImageUrls]);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));
  };

  // NEW: Remove image
  const handleRemoveImage = (index) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImages);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // NEW: Handle house rules toggle
  const handleHouseRuleToggle = (rule) => {
    setFormData(prev => ({
      ...prev,
      houseRules: prev.houseRules.includes(rule)
        ? prev.houseRules.filter(r => r !== rule)
        : [...prev.houseRules, rule]
    }));
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      const propertyData = {
        ...formData,
        hostId: user.uid,
        hostName: user.displayName,
        hostEmail: user.email,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        // NEW: Points system
        hostPoints: initialData.hostPoints || 0
      };

      if (initialData.id) {
        await updateDoc(doc(db, 'properties', initialData.id), propertyData);
      } else {
        await addDoc(collection(db, 'properties'), propertyData);
      }
      
      alert('Draft saved successfully!');
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title || !formData.description || !formData.price || !formData.location.address) {
      alert('Please fill all required fields: Title, Description, Price, and Address');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      const propertyData = {
        ...formData,
        hostId: user.uid,
        hostName: user.displayName,
        hostEmail: user.email,
        status: 'published',
        publishedAt: new Date(),
        createdAt: initialData.createdAt || new Date(),
        updatedAt: new Date(),
        // NEW: Award points for publishing
        hostPoints: (initialData.hostPoints || 0) + 50
      };

      if (initialData.id) {
        await updateDoc(doc(db, 'properties', initialData.id), propertyData);
      } else {
        await addDoc(collection(db, 'properties'), propertyData);
      }
      
      alert('Property published successfully! +50 Host Points! 🎉');
      if (onSave) onSave();
    } catch (error) {
      console.error('Error publishing property:', error);
      alert('Error publishing property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <div className="property-form">
      {/* NEW: Points Display */}
      <div className="points-display">
        <div className="points-card">
          <span className="points-icon">⭐</span>
          <div className="points-info">
            <h4>Host Points: {formData.hostPoints}</h4>
            <p>Publish listings to earn rewards!</p>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Basic Information</h3>
        
        <div className="input-group">
          <label>Property Title *</label>
          <input
            type="text"
            placeholder="e.g., Beautiful Beachfront Villa"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div className="input-group">
          <label>Category *</label>
          <div className="category-options">
            {categories.map(cat => (
              <label key={cat.value} className="category-option">
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={formData.category === cat.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                />
                <span className="category-icon">{cat.icon}</span>
                {cat.label}
              </label>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>Description *</label>
          <textarea
            placeholder="Describe your property in detail..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows="4"
          />
        </div>
      </div>

      {/* NEW: Image Upload Section */}
      <div className="form-section">
        <h3>Property Images</h3>
        <div className="image-upload-area">
          <div className="upload-box">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="upload-label">
              <span className="upload-icon">📷</span>
              <p>Click to upload images</p>
              <small>Supported: JPG, PNG, WEBP (Max 5MB each)</small>
            </label>
          </div>
          <div className="image-preview-grid">
            {imageUrls.map((url, index) => (
              <div key={index} className="image-preview">
                <img src={url} alt={`Preview ${index + 1}`} />
                <button 
                  type="button" 
                  className="remove-image"
                  onClick={() => handleRemoveImage(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Location</h3>
        <div className="input-group">
          <label>Address *</label>
          <input
            type="text"
            placeholder="Full address"
            value={formData.location.address}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              location: { ...prev.location, address: e.target.value }
            }))}
          />
        </div>
        
        <div className="location-row">
          <div className="input-group">
            <label>City *</label>
            <input
              type="text"
              placeholder="City"
              value={formData.location.city}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, city: e.target.value }
              }))}
            />
          </div>
          
          <div className="input-group">
            <label>Country *</label>
            <input
              type="text"
              placeholder="Country"
              value={formData.location.country}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, country: e.target.value }
              }))}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Pricing & Offers</h3>
        <div className="pricing-row">
          <div className="input-group">
            <label>Base Price per Night ($) *</label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            />
          </div>
          
          <div className="input-group">
            <label>Discount (%)</label>
            <input
              type="number"
              placeholder="0"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="input-group">
          <label>Promo Code (Optional)</label>
          <input
            type="text"
            placeholder="e.g., SUMMER2024"
            value={formData.promoCode}
            onChange={(e) => setFormData(prev => ({ ...prev, promoCode: e.target.value }))}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Amenities</h3>
        <div className="amenities-grid">
          {amenitiesList.map(amenity => (
            <label key={amenity} className="amenity-option">
              <input
                type="checkbox"
                checked={formData.amenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
              />
              <span className="checkmark"></span>
              {amenity}
            </label>
          ))}
        </div>
      </div>

      {/* NEW: Policy & Rules Section */}
      <div className="form-section">
        <h3>Policies & Rules</h3>
        
        <div className="input-group">
          <label>Cancellation Policy *</label>
          <select
            value={formData.cancellationPolicy}
            onChange={(e) => setFormData(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
          >
            {cancellationPolicies.map(policy => (
              <option key={policy.value} value={policy.value}>
                {policy.label}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>House Rules</label>
          <div className="rules-grid">
            {houseRulesList.map(rule => (
              <label key={rule} className="rule-option">
                <input
                  type="checkbox"
                  checked={formData.houseRules.includes(rule)}
                  onChange={() => handleHouseRuleToggle(rule)}
                />
                <span className="checkmark"></span>
                {rule}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="save-draft-btn"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </button>
        
        <button 
          type="button" 
          className="publish-btn"
          onClick={handlePublish}
          disabled={isSubmitting || !formData.title || !formData.description || !formData.price || !formData.location.address}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Listing (+50 Points)'}
        </button>
      </div>
    </div>
  );
}

export default PropertyListing;