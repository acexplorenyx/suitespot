// PropertyListing.jsx - Fixed Design Issues
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import LeafletMapIntegration from '../common/MapIntegration';
import '../../styles/propertylistingstyle.css';

function PropertyListing({ onSave, initialData = null }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState(0);
  const [imageUrls, setImageUrls] = useState(initialData?.images || []);
  const [imageFiles, setImageFiles] = useState([]);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingImages, setUploadingImages] = useState([]);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'home',
    type: initialData?.type || 'entire-place',
    description: initialData?.description || '',
    price: initialData?.price || '',
    discount: initialData?.discount || 0,
    promoCode: initialData?.promoCode || '',
    location: initialData?.location || {
      address: '',
      city: '',
      province: '',
      country: '',
      coordinates: { lat: 0, lng: 0 }
    },
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
    experienceType: initialData?.experienceType || '',
    duration: initialData?.duration || 2,
    durationUnit: initialData?.durationUnit || 'hours',
    groupSize: initialData?.groupSize || 10,
    meetingPoint: initialData?.meetingPoint || '',
    includedItems: initialData?.includedItems || [],
    requirements: initialData?.requirements || [],
    skillLevel: initialData?.skillLevel || 'beginner',
    serviceType: initialData?.serviceType || '',
    serviceArea: initialData?.serviceArea || '',
    travelFee: initialData?.travelFee || 0,
    equipmentProvided: initialData?.equipmentProvided || [],
    serviceIncludes: initialData?.serviceIncludes || []
  });

  const steps = [
    { number: 1, title: 'Category', icon: '🏷️' },
    { number: 2, title: 'Location', icon: '📍' },
    { number: 3, title: 'Details', icon: '📝' },
    { number: 4, title: 'Amenities', icon: '⭐' },
    { number: 5, title: 'Photos', icon: '📷' },
    { number: 6, title: 'Pricing', icon: '💰' },
    { number: 7, title: 'Publish', icon: '🚀' }
  ];

  const categories = [
    { value: 'home', label: 'Home/Apartment', icon: '🏠' },
    { value: 'experience', label: 'Experience', icon: '🎪' },
    { value: 'service', label: 'Service', icon: '🔧' }
  ];

  const experienceTypes = [
    { value: 'art-design', label: 'Art and Design', icon: '🎨' },
    { value: 'fitness-wellness', label: 'Fitness and Wellness', icon: '🧘‍♀️' },
    { value: 'food-drink', label: 'Food and Drink', icon: '🍷' },
    { value: 'history-culture', label: 'History and Culture', icon: '🏛️' },
    { value: 'nature-outdoors', label: 'Nature and Outdoors', icon: '🌲' }
  ];

  const amenitiesList = [
    'WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air Conditioning', 'Heating',
    'TV', 'Hair Dryer', 'Iron', 'Pool', 'Hot Tub', 'Free Parking',
    'EV Charger', 'Gym', 'Breakfast', 'Smoking Allowed', 'Pets Allowed'
  ];

  // Cloudinary Upload Function
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'airbnb-clone');

    try {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      setUploadingImages(prev => [...prev, file.name]);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[file.name] || 0;
          if (currentProgress < 90) {
            return { ...prev, [file.name]: currentProgress + 10 };
          }
          return prev;
        });
      }, 200);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();

      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

      // Update formData with Cloudinary URL
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, data.secure_url]
      }));

      // Remove from uploading list after a delay
      setTimeout(() => {
        setUploadingImages(prev => prev.filter(name => name !== file.name));
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }, 1000);

      return data.secure_url;

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      setUploadingImages(prev => prev.filter(name => name !== file.name));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
      throw error;
    }
  };

  // Enhanced image upload handler
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Validate file sizes (max 5MB)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Some files are too large. Please select images under 5MB.');
      return;
    }

    // Create preview URLs immediately
    const newImageUrls = files.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...newImageUrls]);
    setImageFiles(prev => [...prev, ...files]);

    // Upload to Cloudinary in background
    try {
      for (const file of files) {
        await uploadToCloudinary(file);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Some images failed to upload. Please try again.');
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const removedFile = imageFiles[index];

    setImageUrls(newImages);
    setImageFiles(newFiles);

    // Remove from formData images array
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    // Clean up progress tracking
    if (removedFile) {
      setUploadingImages(prev => prev.filter(name => name !== removedFile.name));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[removedFile.name];
        return newProgress;
      });
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.category) {
          alert('Please select a category');
          return false;
        }
        return true;
      case 2:
        if (!formData.location.address || !formData.location.city) {
          alert('Please complete location details');
          return false;
        }
        return true;
      case 3:
        if (!formData.title || !formData.description) {
          alert('Please add title and description');
          return false;
        }
        return true;
      case 5:
        if (formData.images.length < 3) {
          alert('Please add at least 3 photos');
          return false;
        }
        return true;
      case 6:
        if (!formData.price || formData.price <= 0) {
          alert('Please set a valid price');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        ...locationData
      }
    }));
    setShowMap(false);
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const calculateHostPoints = () => {
    let points = 0;
    if (formData.images.length >= 3) points += 20;
    if (formData.amenities.length >= 5) points += 15;
    if (formData.description.length > 100) points += 10;
    if (formData.title.length > 10) points += 5;
    if (formData.images.length >= 5) points += 25;
    if (formData.amenities.length >= 10) points += 20;
    if (formData.description.length > 200) points += 15;
    if (points >= 50) points += 10;
    return points + 10; // Base points
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    // Check if images are still uploading
    if (uploadingImages.length > 0) {
      alert('Please wait for all images to finish uploading before publishing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;

      if (!user) {
        alert('Please log in to create a listing');
        return;
      }

      const pointsEarned = calculateHostPoints();

      const propertyData = {
        ...formData,
        hostId: user.uid,
        hostName: user.displayName || 'Anonymous Host',
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
        reviewCount: 0,
        // Ensure proper data types
        location: {
          ...formData.location,
          coordinates: {
            lat: parseFloat(formData.location.coordinates.lat) || 0,
            lng: parseFloat(formData.location.coordinates.lng) || 0
          }
        },
        price: parseFloat(formData.price) || 0,
        discount: parseFloat(formData.discount) || 0,
        maxGuests: parseInt(formData.maxGuests) || 1,
        bedrooms: parseInt(formData.bedrooms) || 1,
        beds: parseInt(formData.beds) || 1,
        bathrooms: parseFloat(formData.bathrooms) || 1,
        duration: parseInt(formData.duration) || 2,
        groupSize: parseInt(formData.groupSize) || 10,
        serviceArea: parseInt(formData.serviceArea) || 0,
        travelFee: parseFloat(formData.travelFee) || 0,
        minimumStay: parseInt(formData.minimumStay) || 1,
        maximumStay: parseInt(formData.maximumStay) || 30
      };

      console.log('Saving property data:', propertyData);

      let result;
      if (initialData?.id) {
        await updateDoc(doc(db, 'properties', initialData.id), propertyData);
        result = { id: initialData.id };
      } else {
        result = await addDoc(collection(db, 'properties'), propertyData);
      }

      // Update user points
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          totalPoints: increment(pointsEarned),
          lastPointsEarned: pointsEarned,
          lastPointsActivity: new Date()
        });
      } catch (userError) {
        console.warn('Could not update user points:', userError);
        // Continue anyway - points update is secondary
      }

      setEarnedPoints(pointsEarned);
      alert(`Listing published successfully! +${pointsEarned} Points! 🎉`);

      if (onSave) onSave(result.id);

    } catch (error) {
      console.error('Error publishing property:', error);
      alert(`Error publishing property: ${error.message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title?.trim()) errors.push('Title is required');
    if (!formData.description?.trim()) errors.push('Description is required');
    if (!formData.price || formData.price <= 0) errors.push('Valid price is required');
    if (!formData.location?.address?.trim()) errors.push('Address is required');
    if (formData.images.length === 0) errors.push('At least one image is required');

    // Validate location coordinates
    if (!formData.location.coordinates ||
      formData.location.coordinates.lat === 0 ||
      formData.location.coordinates.lng === 0) {
      errors.push('Please set a location on the map');
    }

    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return false;
    }
    return true;
  };

  const stepVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <div className="property-listing-wizard">
      <div className="progress-container">
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div key={step.number} className="step-item">
              <div className={`step-circle ${currentStep >= step.number ? 'active' : ''}`}>
                <span className="step-icon">{step.icon}</span>
                <span className="step-number">{step.number}</span>
              </div>
              <span className="step-label">{step.title}</span>
              {index < steps.length - 1 && (
                <div className={`step-connector ${currentStep > step.number ? 'active' : ''}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Status */}
      {uploadingImages.length > 0 && (
        <div className="upload-status">
          <div className="upload-status-content">
            <span className="upload-spinner">⏳</span>
            <span>Uploading {uploadingImages.length} image(s)...</span>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="form-content">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="step-content"
          >
            {currentStep === 1 && (
              <Step1
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                experienceTypes={experienceTypes}
              />
            )}
            {currentStep === 2 && (
              <Step2
                formData={formData}
                setFormData={setFormData}
                onLocationSelect={handleLocationSelect}
                showMap={showMap}
                setShowMap={setShowMap}
              />
            )}
            {currentStep === 3 && (
              <Step3
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 4 && (
              <Step4
                formData={formData}
                setFormData={setFormData}
                amenitiesList={amenitiesList}
                onAmenityToggle={handleAmenityToggle}
              />
            )}
            {currentStep === 5 && (
              <Step5
                imageUrls={imageUrls}
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveImage}
                uploadProgress={uploadProgress}
                uploadingImages={uploadingImages}
                isSubmitting={isSubmitting}
              />
            )}
            {currentStep === 6 && (
              <Step6
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 7 && (
              <Step7
                formData={formData}
                onPublish={handlePublish}
                isSubmitting={isSubmitting}
                points={calculateHostPoints()}
                earnedPoints={earnedPoints}
                uploadingImages={uploadingImages}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="navigation-buttons">
          {currentStep > 1 && (
            <button
              className="back-button"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              ← Back
            </button>
          )}
          {currentStep < steps.length ? (
            <button
              className="next-button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next →
            </button>
          ) : (
            <button
              className="publish-button"
              onClick={handlePublish}
              disabled={isSubmitting || uploadingImages.length > 0}
            >
              {isSubmitting ? 'Publishing...' :
                uploadingImages.length > 0 ? 'Uploading Images...' :
                  `Publish Listing (+${calculateHostPoints()} Points)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
const Step1 = ({ formData, setFormData, categories, experienceTypes }) => (
  <div className="step-container">
    <h2>What kind of place are you listing?</h2>
    <p className="step-description">Choose a category that best describes your offering</p>

    <div className="category-grid">
      {categories.map(cat => (
        <motion.label
          key={cat.value}
          className={`category-card ${formData.category === cat.value ? 'selected' : ''}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            type="radio"
            name="category"
            value={cat.value}
            checked={formData.category === cat.value}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          />
          <span className="category-icon">{cat.icon}</span>
          <span className="category-label">{cat.label}</span>
        </motion.label>
      ))}
    </div>

    {formData.category === 'experience' && (
      <motion.div
        className="experience-types"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3 }}
      >
        <h3>What type of experience?</h3>
        <div className="experience-grid">
          {experienceTypes.map(exp => (
            <label key={exp.value} className="experience-option">
              <input
                type="radio"
                name="experienceType"
                value={exp.value}
                checked={formData.experienceType === exp.value}
                onChange={(e) => setFormData(prev => ({ ...prev, experienceType: e.target.value }))}
              />
              <span className="experience-icon">{exp.icon}</span>
              <span>{exp.label}</span>
            </label>
          ))}
        </div>
      </motion.div>
    )}
  </div>
);

const Step2 = ({ formData, setFormData, onLocationSelect, showMap, setShowMap }) => (
  <div className="step-container">
    <h2>Where's your place located?</h2>
    <p className="step-description">Help guests find your place by adding the exact location</p>

    {!showMap ? (
      <div className="location-form">
        <div className="input-group">
          <label>Address *</label>
          <input
            type="text"
            placeholder="Enter your full address"
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
            <label>Province *</label>
            <input
              type="text"
              placeholder="Province/State"
              value={formData.location.province}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, province: e.target.value }
              }))}
            />
          </div>
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

        <button
          className="map-button"
          onClick={() => setShowMap(true)}
        >
          📍 Pick Location on Map
        </button>

        {formData.location.coordinates.lat !== 0 && (
          <div className="coordinates-display">
            <small>Coordinates: {formData.location.coordinates.lat.toFixed(6)}, {formData.location.coordinates.lng.toFixed(6)}</small>
          </div>
        )}
      </div>
    ) : (
      <LeafletMapIntegration
        onLocationSelect={onLocationSelect}
        initialLocation={formData.location}
      />
    )}
  </div>
);

const Step3 = ({ formData, setFormData }) => (
  <div className="step-container">
    <h2>Describe your place</h2>
    <p className="step-description">Share what makes your place special</p>

    <div className="input-group">
      <label>Title *</label>
      <input
        type="text"
        placeholder="Catchy title for your listing"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        maxLength="100"
      />
      <div className="char-counter">{formData.title.length}/100</div>
    </div>

    <div className="input-group">
      <label>Description *</label>
      <textarea
        placeholder="Describe your place in detail..."
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        rows="6"
        maxLength="1000"
      />
      <div className="char-counter">{formData.description.length}/1000</div>
    </div>

    {formData.category === 'home' && (
      <div className="details-grid">
        <div className="detail-item">
          <label>Guests</label>
          <CounterInput
            value={formData.maxGuests}
            onChange={(value) => setFormData(prev => ({ ...prev, maxGuests: value }))}
            min={1}
            max={20}
          />
        </div>
        <div className="detail-item">
          <label>Bedrooms</label>
          <CounterInput
            value={formData.bedrooms}
            onChange={(value) => setFormData(prev => ({ ...prev, bedrooms: value }))}
            min={0}
            max={20}
          />
        </div>
        <div className="detail-item">
          <label>Beds</label>
          <CounterInput
            value={formData.beds}
            onChange={(value) => setFormData(prev => ({ ...prev, beds: value }))}
            min={0}
            max={20}
          />
        </div>
        <div className="detail-item">
          <label>Bathrooms</label>
          <CounterInput
            value={formData.bathrooms}
            onChange={(value) => setFormData(prev => ({ ...prev, bathrooms: value }))}
            min={0}
            max={10}
            step={0.5}
          />
        </div>
      </div>
    )}
  </div>
);

const Step4 = ({ formData, setFormData, amenitiesList, onAmenityToggle }) => (
  <div className="step-container">
    <h2>What amenities do you offer?</h2>
    <p className="step-description">Select all that apply to your place</p>

    <div className="amenities-grid">
      {amenitiesList.map(amenity => (
        <motion.label
          key={amenity}
          className={`amenity-option ${formData.amenities.includes(amenity) ? 'selected' : ''}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            type="checkbox"
            checked={formData.amenities.includes(amenity)}
            onChange={() => onAmenityToggle(amenity)}
          />
          <span className="checkmark"></span>
          <span>{amenity}</span>
        </motion.label>
      ))}
    </div>
  </div>
);

const Step5 = ({ imageUrls, onImageUpload, onRemoveImage, uploadProgress, uploadingImages, isSubmitting }) => (
  <div className="step-container">
    <h2>Add photos of your place</h2>
    <p className="step-description">Upload at least 3 photos to showcase your space</p>

    <div className="image-upload-area">
      <div className="upload-box">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onImageUpload}
          className="file-input"
          id="image-upload"
          disabled={isSubmitting}
        />
        <label htmlFor="image-upload" className="upload-label">
          <span className="upload-icon">📷</span>
          <p>Click to upload images</p>
          <small>Supported: JPG, PNG, WEBP (Max 5MB each)</small>
          {uploadingImages.length > 0 && (
            <div className="uploading-count">
              Uploading {uploadingImages.length} image(s)...
            </div>
          )}
        </label>
      </div>

      <div className="image-preview-grid">
        {imageUrls.map((url, index) => (
          <motion.div
            key={index}
            className="image-preview"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <img src={url} alt={`Preview ${index + 1}`} />

            {/* Upload Progress */}
            {uploadProgress[imageFiles[index]?.name] !== undefined && (
              <div className="upload-progress">
                <div
                  className="progress-bar"
                  style={{ width: `${uploadProgress[imageFiles[index]?.name]}%` }}
                ></div>
                <span className="progress-text">{uploadProgress[imageFiles[index]?.name]}%</span>
              </div>
            )}

            <button
              type="button"
              className="remove-image"
              onClick={() => onRemoveImage(index)}
              disabled={isSubmitting}
            >
              ×
            </button>
          </motion.div>
        ))}
      </div>

      {imageUrls.length > 0 && (
        <div className={`image-stats ${imageUrls.length >= 3 ? 'success' : 'warning'}`}>
          {imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''} uploaded •
          {imageUrls.length >= 3 ? ' ✅ Ready to publish!' : ' ❌ Add more photos'}
          {uploadingImages.length > 0 && ` • ⏳ ${uploadingImages.length} uploading...`}
        </div>
      )}
    </div>
  </div>
);

const Step6 = ({ formData, setFormData }) => (
  <div className="step-container">
    <h2>Set your price</h2>
    <p className="step-description">How much will you charge per night?</p>

    <div className="pricing-section">
      <div className="input-group">
        <label>
          Base Price per {
            formData.category === 'experience' ? 'Person' :
              formData.category === 'service' ? 'Session' :
                'Night'
          } (₱) *
        </label>
        <div className="price-input">
          <span className="currency-symbol">₱</span>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
          />
        </div>
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
        {formData.discount > 0 && (
          <div className="discount-preview">
            Original: ₱{formData.price} → Discounted: ₱{(formData.price * (1 - formData.discount / 100)).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  </div>
);

const Step7 = ({ formData, onPublish, isSubmitting, points, earnedPoints, uploadingImages }) => (
  <div className="step-container">
    <motion.div
      className="publish-summary"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="summary-header">
        <h2>Ready to publish! 🎉</h2>
        <p>Review your listing details before publishing</p>
      </div>

      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Category</span>
          <span className="summary-value">{formData.category}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Title</span>
          <span className="summary-value">{formData.title}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Location</span>
          <span className="summary-value">{formData.location.address}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Price</span>
          <span className="summary-value">₱{formData.price} per night</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Photos</span>
          <span className="summary-value">{formData.images.length} uploaded</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Amenities</span>
          <span className="summary-value">{formData.amenities.length} selected</span>
        </div>
      </div>

      {uploadingImages.length > 0 && (
        <div className="upload-warning">
          ⚠️ Please wait for {uploadingImages.length} image(s) to finish uploading
        </div>
      )}

      <div className="points-reward">
        <div className="points-card">
          <span className="points-icon">⭐</span>
          <div className="points-info">
            <h4>+{points} Host Points</h4>
            <p>You'll earn points for completing your listing!</p>
            {earnedPoints > 0 && (
              <div className="points-earned-badge">
                🎉 +{earnedPoints} points earned!
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

// Counter Input Component
const CounterInput = ({ value, onChange, min, max, step = 1 }) => (
  <div className="counter-input">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - step))}
      className="counter-btn"
      disabled={value <= min}
    >-</button>
    <span className="counter-value">{value}</span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + step))}
      className="counter-btn"
      disabled={value >= max}
    >+</button>
  </div>
);

export default PropertyListing;