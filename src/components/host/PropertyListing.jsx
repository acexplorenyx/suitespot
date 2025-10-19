import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import '../../styles/propertylistingstyle.css';

function PropertyListing({ onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'home',
    type: initialData?.type || 'entire-place',
    description: initialData?.description || '',
    price: initialData?.price || '',
    discount: initialData?.discount || 0,
    promoCode: initialData?.promoCode || '',
    location: initialData?.location || { address: '', city: '', country: '', coordinates: { lat: 0, lng: 0 } },
    amenities: initialData?.amenities || [],
    images: initialData?.images || [],
    maxGuests: initialData?.maxGuests || 1,
    bedrooms: initialData?.bedrooms || 1,
    beds: initialData?.beds || 1,
    bathrooms: initialData?.bathrooms || 1,
    status: initialData?.status || 'draft',
    hostPoints: initialData?.hostPoints || 0,
    isFeatured: initialData?.isFeatured || false,
    cancellationPolicy: initialData?.cancellationPolicy || 'flexible',
    houseRules: initialData?.houseRules || [],
    checkInTime: initialData?.checkInTime || '15:00',
    checkOutTime: initialData?.checkOutTime || '11:00',
    minimumStay: initialData?.minimumStay || 1,
    maximumStay: initialData?.maximumStay || 30,
    // Experience fields
    experienceType: initialData?.experienceType || '',
    duration: initialData?.duration || 2,
    durationUnit: initialData?.durationUnit || 'hours',
    groupSize: initialData?.groupSize || 10,
    meetingPoint: initialData?.meetingPoint || '',
    includedItems: initialData?.includedItems || [],
    requirements: initialData?.requirements || [],
    skillLevel: initialData?.skillLevel || 'beginner'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState(initialData?.images || []);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const categories = [
    { value: 'home', label: 'Home/Apartment', icon: '🏠' },
    { value: 'experience', label: 'Experience', icon: '🎪' },
    { value: 'service', label: 'Service', icon: '🔧' }
  ];

  const experienceTypes = [
    { value: 'art-design', label: 'Art and Design', icon: '🎨', description: 'Creative workshops, gallery tours, craft classes' },
    { value: 'fitness-wellness', label: 'Fitness and Wellness', icon: '🧘‍♀️', description: 'Yoga sessions, meditation, fitness classes' },
    { value: 'food-drink', label: 'Food and Drink', icon: '🍷', description: 'Cooking classes, wine tasting, food tours' },
    { value: 'history-culture', label: 'History and Culture', icon: '🏛️', description: 'Historical tours, cultural experiences, museum visits' },
    { value: 'nature-outdoors', label: 'Nature and Outdoors', icon: '🌲', description: 'Hiking, wildlife watching, outdoor adventures' },
    { value: 'music-entertainment', label: 'Music and Entertainment', icon: '🎵', description: 'Concerts, performances, entertainment events' },
    { value: 'sports-recreation', label: 'Sports and Recreation', icon: '⚽', description: 'Sports activities, recreational games, adventures' },
    { value: 'business-tech', label: 'Business and Tech', icon: '💼', description: 'Workshops, networking events, tech demos' }
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

  const includedItemsList = [
    'Equipment provided', 'Food and drinks', 'Transportation', 
    'Tickets/entry fees', 'Souvenirs', 'Photos', 'Certificates'
  ];

  const requirementsList = [
    'Physical fitness required', 'Age restriction', 'Weather dependent',
    'Special clothing needed', 'Previous experience needed', 'ID required'
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner - No experience needed' },
    { value: 'intermediate', label: 'Intermediate - Some experience helpful' },
    { value: 'advanced', label: 'Advanced - Experience required' },
    { value: 'all-levels', label: 'All Levels - Suitable for everyone' }
  ];

  // Auto-save functionality
  useEffect(() => {
    if ((formData.title || formData.description) && !initialData?.id) {
      const autoSaveTimer = setTimeout(() => {
        if (!isSubmitting) {
          handleAutoSave();
        }
      }, 30000);
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [formData.title, formData.description]);

  // Calculate points for publishing
  const calculateHostPoints = () => {
    let points = 0;
    
    // Base points for creating listing
    points += 10;
    
    // Points for completeness
    if (formData.images.length >= 3) points += 20;
    if (formData.amenities.length >= 5) points += 15;
    if (formData.description.length > 100) points += 10;
    if (formData.title.length > 10) points += 5;
    
    // Points for quality
    if (formData.images.length >= 5) points += 25;
    if (formData.amenities.length >= 10) points += 20;
    if (formData.description.length > 200) points += 15;
    
    // Bonus for featured-ready listings
    if (points >= 50) points += 10;
    
    return points;
  };

  const handleAutoSave = async () => {
    if (!formData.title && !formData.description) return;
    
    try {
      const user = auth.currentUser;
      const propertyData = {
        ...formData,
        hostId: user.uid,
        hostName: user.displayName,
        hostEmail: user.email,
        status: 'draft',
        createdAt: initialData?.id ? formData.createdAt : new Date(),
        updatedAt: new Date(),
        lastSavedAt: new Date()
      };

      if (initialData?.id) {
        await updateDoc(doc(db, 'properties', initialData.id), propertyData);
      }
      console.log('Auto-saved draft');
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImageUrls = files.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...newImageUrls]);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));
  };

  const handleRemoveImage = (index) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImages);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleHouseRuleToggle = (rule) => {
    setFormData(prev => ({
      ...prev,
      houseRules: prev.houseRules.includes(rule)
        ? prev.houseRules.filter(r => r !== rule)
        : [...prev.houseRules, rule]
    }));
  };

  const handleIncludedItemToggle = (item) => {
    setFormData(prev => ({
      ...prev,
      includedItems: prev.includedItems.includes(item)
        ? prev.includedItems.filter(i => i !== item)
        : [...prev.includedItems, item]
    }));
  };

  const handleRequirementToggle = (requirement) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.includes(requirement)
        ? prev.requirements.filter(r => r !== requirement)
        : [...prev.requirements, requirement]
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
        createdAt: initialData?.id ? formData.createdAt : new Date(),
        updatedAt: new Date(),
        lastSavedAt: new Date()
      };

      if (initialData?.id) {
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
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      const pointsEarned = calculateHostPoints();
      setEarnedPoints(pointsEarned);

      const propertyData = {
        ...formData,
        hostId: user.uid,
        hostName: user.displayName,
        hostEmail: user.email,
        status: 'published',
        publishedAt: new Date(),
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date(),
        hostPoints: (initialData?.hostPoints || 0) + pointsEarned,
        isFeatured: pointsEarned >= 50,
        views: 0,
        bookingsCount: 0,
        rating: 0,
        reviewCount: 0
      };

      let result;
      if (initialData?.id) {
        await updateDoc(doc(db, 'properties', initialData.id), propertyData);
        result = { id: initialData.id };
      } else {
        result = await addDoc(collection(db, 'properties'), propertyData);
      }

      // Update user's total points
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalPoints: increment(pointsEarned),
        lastPointsEarned: pointsEarned,
        lastPointsActivity: new Date()
      });

      alert(`Listing published successfully! +${pointsEarned} Points! 🎉`);
      if (onSave) onSave(result.id);
      
    } catch (error) {
      console.error('Error publishing property:', error);
      alert('Error publishing property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.price || formData.price <= 0) errors.push('Valid price is required');
    if (!formData.location.address.trim()) errors.push('Address is required');
    if (!formData.location.city.trim()) errors.push('City is required');
    if (!formData.location.country.trim()) errors.push('Country is required');
    if (formData.images.length === 0) errors.push('At least one image is required');

    // Experience-specific validation
    if (formData.category === 'experience') {
      if (!formData.experienceType) errors.push('Please select an experience type');
      if (!formData.meetingPoint.trim()) errors.push('Meeting point is required for experiences');
    }

    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return false;
    }
    return true;
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
      {/* Enhanced Points Display */}
      <PointsDisplay 
        points={formData.hostPoints} 
        earnedPoints={earnedPoints}
        potentialPoints={calculateHostPoints()}
      />

      <div className="form-section">
        <h3>Basic Information</h3>
        
        <div className="input-group">
          <label>Property Title *</label>
          <input
            type="text"
            placeholder={
              formData.category === 'experience' 
                ? "e.g., Traditional Cooking Class with Local Chef"
                : "e.g., Beautiful Beachfront Villa"
            }
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

        {/* Experience Type Selection - Only show when category is experience */}
        {formData.category === 'experience' && (
          <div className="input-group">
            <label>What experience will you offer guests? *</label>
            <div className="experience-type-grid">
              {experienceTypes.map(exp => (
                <label key={exp.value} className="experience-type-option">
                  <input
                    type="radio"
                    name="experienceType"
                    value={exp.value}
                    checked={formData.experienceType === exp.value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      experienceType: e.target.value 
                    }))}
                  />
                  <div className="experience-type-card">
                    <span className="experience-icon">{exp.icon}</span>
                    <div className="experience-info">
                      <div className="experience-label">{exp.label}</div>
                      <div className="experience-description">{exp.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="input-group">
          <label>Description *</label>
          <textarea
            placeholder={
              formData.category === 'experience' 
                ? "Describe your experience in detail. What will guests learn, see, or do? What makes it special? What should guests expect?"
                : "Describe your property in detail. What makes it unique? What amenities do you offer?"
            }
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows="4"
          />
          <div className="char-counter">{formData.description.length} characters</div>
        </div>
      </div>

      {/* Experience Details Section - Only show when category is experience */}
      {formData.category === 'experience' && (
        <div className="form-section">
          <h3>Experience Details</h3>
          
          <div className="form-row">
            <div className="input-group">
              <label>Duration *</label>
              <div className="duration-input">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration: parseInt(e.target.value) || 1
                  }))}
                />
                <select
                  value={formData.durationUnit}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    durationUnit: e.target.value 
                  }))}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Maximum Group Size *</label>
              <div className="counter-input">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    groupSize: Math.max(1, prev.groupSize - 1) 
                  }))}
                  className="counter-btn"
                >-</button>
                <span>{formData.groupSize} {formData.groupSize === 1 ? 'guest' : 'guests'}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    groupSize: prev.groupSize + 1 
                  }))}
                  className="counter-btn"
                >+</button>
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Meeting Point *</label>
            <input
              type="text"
              placeholder="Where will you meet your guests? (Exact address or specific location)"
              value={formData.meetingPoint}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                meetingPoint: e.target.value 
              }))}
            />
          </div>

          <div className="input-group">
            <label>Skill Level</label>
            <div className="skill-level-options">
              {skillLevels.map(level => (
                <label key={level.value} className="skill-level-option">
                  <input
                    type="radio"
                    name="skillLevel"
                    value={level.value}
                    checked={formData.skillLevel === level.value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      skillLevel: e.target.value 
                    }))}
                  />
                  <span className="checkmark"></span>
                  {level.label}
                </label>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>What's Included</label>
            <div className="included-items-grid">
              {includedItemsList.map(item => (
                <label key={item} className="included-item-option">
                  <input
                    type="checkbox"
                    checked={formData.includedItems.includes(item)}
                    onChange={(e) => handleIncludedItemToggle(item)}
                  />
                  <span className="checkmark"></span>
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Requirements & Restrictions</label>
            <div className="requirements-grid">
              {requirementsList.map(req => (
                <label key={req} className="requirement-option">
                  <input
                    type="checkbox"
                    checked={formData.requirements.includes(req)}
                    onChange={(e) => handleRequirementToggle(req)}
                  />
                  <span className="checkmark"></span>
                  {req}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

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
          {imageUrls.length > 0 && (
            <div className="image-stats">
              {imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''} uploaded • 
              {imageUrls.length >= 3 ? ' ✅' : ' ❌'} Minimum 3 images required for bonus points
            </div>
          )}
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

      {formData.category !== 'experience' && (
        <div className="form-section">
          <h3>Property Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Max Guests</label>
              <div className="counter-input">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, maxGuests: Math.max(1, prev.maxGuests - 1) }))}
                  className="counter-btn"
                >-</button>
                <span>{formData.maxGuests}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, maxGuests: prev.maxGuests + 1 }))}
                  className="counter-btn"
                >+</button>
              </div>
            </div>
            
            <div className="detail-item">
              <label>Bedrooms</label>
              <div className="counter-input">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, bedrooms: Math.max(0, prev.bedrooms - 1) }))}
                  className="counter-btn"
                >-</button>
                <span>{formData.bedrooms}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, bedrooms: prev.bedrooms + 1 }))}
                  className="counter-btn"
                >+</button>
              </div>
            </div>
            
            <div className="detail-item">
              <label>Beds</label>
              <div className="counter-input">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, beds: Math.max(0, prev.beds - 1) }))}
                  className="counter-btn"
                >-</button>
                <span>{formData.beds}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, beds: prev.beds + 1 }))}
                  className="counter-btn"
                >+</button>
              </div>
            </div>
            
            <div className="detail-item">
              <label>Bathrooms</label>
              <div className="counter-input">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, bathrooms: Math.max(0, prev.bathrooms - 0.5) }))}
                  className="counter-btn"
                >-</button>
                <span>{formData.bathrooms}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, bathrooms: prev.bathrooms + 0.5 }))}
                  className="counter-btn"
                >+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="form-section">
        <h3>Pricing & Offers</h3>
        <div className="pricing-row">
          <div className="input-group">
            <label>Base Price per {formData.category === 'experience' ? 'Person' : 'Night'} ($) *</label>
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

      {formData.category !== 'experience' && (
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
          <div className="amenities-stats">
            {formData.amenities.length} amenit{formData.amenities.length !== 1 ? 'ies' : 'y'} selected •
            {formData.amenities.length >= 5 ? ' ✅' : ' ❌'} Minimum 5 amenities for bonus points
          </div>
        </div>
      )}

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

        {formData.category !== 'experience' && (
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
        )}

        {formData.category !== 'experience' && (
          <div className="form-row">
            <div className="input-group">
              <label>Check-in Time</label>
              <select
                value={formData.checkInTime}
                onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
              >
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="17:00">5:00 PM</option>
              </select>
            </div>

            <div className="input-group">
              <label>Check-out Time</label>
              <select
                value={formData.checkOutTime}
                onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
              >
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="input-group">
            <label>Minimum Stay (nights)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.minimumStay}
              onChange={(e) => setFormData(prev => ({ ...prev, minimumStay: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label>Maximum Stay (nights)</label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.maximumStay}
              onChange={(e) => setFormData(prev => ({ ...prev, maximumStay: e.target.value }))}
            />
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Publishing...' : `Publish Listing (+${calculateHostPoints()} Points)`}
        </button>
      </div>
    </div>
  );
}

// Points Display Component
function PointsDisplay({ points, earnedPoints = 0, potentialPoints = 0 }) {
  const levels = [
    { min: 0, max: 100, name: 'Bronze', color: '#cd7f32' },
    { min: 101, max: 500, name: 'Silver', color: '#c0c0c0' },
    { min: 501, max: 1000, name: 'Gold', color: '#ffd700' },
    { min: 1001, max: Infinity, name: 'Platinum', color: '#e5e4e2' }
  ];

  const currentLevel = levels.find(level => points >= level.min && points <= level.max);
  const nextLevel = levels.find(level => points < level.max);
  const progress = nextLevel ? ((points - currentLevel.min) / (nextLevel.max - currentLevel.min)) * 100 : 100;

  return (
    <div className="points-display">
      <div className="points-card">
        <div className="points-header">
          <span className="points-icon">⭐</span>
          <div className="points-info">
            <h4>{points} Host Points</h4>
            <p>Level: <span style={{ color: currentLevel.color }}>{currentLevel.name}</span></p>
          </div>
        </div>
        
        {earnedPoints > 0 && (
          <div className="points-earned">
            +{earnedPoints} points earned! 🎉
          </div>
        )}
        
        {potentialPoints > 0 && (
          <div className="potential-points">
            Potential points from this listing: <strong>+{potentialPoints}</strong>
          </div>
        )}
        
        <div className="level-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: currentLevel.color
              }}
            ></div>
          </div>
          <div className="progress-text">
            {points} / {nextLevel ? nextLevel.max : 'Max'} points
            {nextLevel && ` to ${nextLevel.name}`}
          </div>
        </div>
        
        <div className="points-breakdown">
          <h5>How to earn more points:</h5>
          <ul>
            <li>✅ Complete listing details: +10 points</li>
            <li>📸 Add 3+ photos: +20 points</li>
            <li>🏠 List 5+ amenities: +15 points</li>
            <li>📝 Write detailed description: +10 points</li>
            <li>⭐ Get 5-star review: +50 points</li>
            <li>📅 Complete booking: +25 points</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PropertyListing;