import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import '../../styles/bookingmodal.css';

function BookingModal({ property, onClose, onBookingSuccess }) {
  const [formData, setFormData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    specialRequests: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [numberOfNights, setNumberOfNights] = useState(0);

  // Calculate total amount and nights when dates change
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (nights > 0) {
        setNumberOfNights(nights);
        const discountedPrice = property.price * (1 - property.discount / 100);
        setTotalAmount(discountedPrice * nights);
      } else {
        setNumberOfNights(0);
        setTotalAmount(0);
      }
    }
  }, [formData.checkInDate, formData.checkOutDate, property.price, property.discount]);

  // Pre-fill user data if logged in
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.displayName || '',
        contactEmail: user.email || ''
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.checkInDate) newErrors.checkInDate = 'Check-in date is required';
    if (!formData.checkOutDate) newErrors.checkOutDate = 'Check-out date is required';
    if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
    if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
    if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Contact phone is required';

    // Date validation
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) newErrors.checkInDate = 'Check-in date cannot be in the past';
      if (checkOut <= checkIn) newErrors.checkOutDate = 'Check-out date must be after check-in date';
    }

    // Guest validation
    if (formData.guests < 1) newErrors.guests = 'At least 1 guest is required';
    if (formData.guests > property.maxGuests) newErrors.guests = `Maximum ${property.maxGuests} guests allowed`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in to make a booking');
        return;
      }

      const bookingData = {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyImage: property.images?.[0] || '',
        hostId: property.hostId,
        guestId: user.uid,
        guestName: formData.contactName,
        guestEmail: formData.contactEmail,
        guestPhone: formData.contactPhone,
        checkInDate: new Date(formData.checkInDate),
        checkOutDate: new Date(formData.checkOutDate),
        guests: parseInt(formData.guests),
        specialRequests: formData.specialRequests,
        totalAmount: totalAmount,
        numberOfNights: numberOfNights,
        pricePerNight: property.price * (1 - property.discount / 100),
        originalPrice: property.price,
        discount: property.discount,
        status: 'pending', // pending, confirmed, cancelled, completed
        paymentStatus: 'pending', // pending, paid, refunded
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Additional metadata
        propertyLocation: property.location,
        propertyCategory: property.category,
        hostName: property.hostName,
        hostEmail: property.hostEmail
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      alert(`Booking request submitted successfully! 🎉\n\nBooking ID: ${docRef.id}\nTotal: ₱${totalAmount.toFixed(2)}\n\nThe host will confirm your booking soon.`);

      if (onBookingSuccess) {
        onBookingSuccess(docRef.id);
      }

      onClose();

    } catch (error) {
      console.error('Error creating booking:', error);
      alert(`Error creating booking: ${error.message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book Your Stay</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Property Summary */}
          <div className="property-summary">
            <img
              src={property.images?.[0] || 'https://via.placeholder.com/100x80?text=No+Image'}
              alt={property.title}
              className="property-thumb"
            />
            <div className="property-info">
              <h3>{property.title}</h3>
              <p className="property-location">📍 {property.location}</p>
              <p className="property-details">
                {property.category === 'home' && `${property.maxGuests} guests • ${property.bedrooms} bedrooms`}
                {property.category === 'experience' && `${property.duration} • ${property.maxGuests} guests max`}
                {property.category === 'service' && `${property.duration} session`}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="booking-form">
            {/* Date Selection */}
            <div className="form-section">
              <h3>Select Dates</h3>
              <div className="date-inputs">
                <div className="input-group">
                  <label>Check-in Date *</label>
                  <input
                    type="date"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className={errors.checkInDate ? 'error' : ''}
                  />
                  {errors.checkInDate && <span className="error-text">{errors.checkInDate}</span>}
                </div>

                <div className="input-group">
                  <label>Check-out Date *</label>
                  <input
                    type="date"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleInputChange}
                    min={formData.checkInDate || getMinDate()}
                    max={getMaxDate()}
                    className={errors.checkOutDate ? 'error' : ''}
                  />
                  {errors.checkOutDate && <span className="error-text">{errors.checkOutDate}</span>}
                </div>
              </div>

              {numberOfNights > 0 && (
                <div className="nights-summary">
                  <span>{numberOfNights} night{numberOfNights !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Guest Count */}
            <div className="form-section">
              <h3>Guests</h3>
              <div className="input-group">
                <label>Number of Guests *</label>
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  className={errors.guests ? 'error' : ''}
                >
                  {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} guest{num !== 1 ? 's' : ''}</option>
                  ))}
                </select>
                {errors.guests && <span className="error-text">{errors.guests}</span>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="contact-inputs">
                <div className="input-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={errors.contactName ? 'error' : ''}
                  />
                  {errors.contactName && <span className="error-text">{errors.contactName}</span>}
                </div>

                <div className="input-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={errors.contactEmail ? 'error' : ''}
                  />
                  {errors.contactEmail && <span className="error-text">{errors.contactEmail}</span>}
                </div>

                <div className="input-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className={errors.contactPhone ? 'error' : ''}
                  />
                  {errors.contactPhone && <span className="error-text">{errors.contactPhone}</span>}
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="form-section">
              <h3>Special Requests (Optional)</h3>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                placeholder="Any special requests or notes for the host..."
                rows="3"
              />
            </div>

            {/* Price Summary */}
            {totalAmount > 0 && (
              <div className="price-summary">
                <h3>Price Summary</h3>
                <div className="price-breakdown">
                  <div className="price-row">
                    <span>₱{property.price * (1 - property.discount / 100)} × {numberOfNights} night{numberOfNights !== 1 ? 's' : ''}</span>
                    <span>₱{totalAmount.toFixed(2)}</span>
                  </div>
                  {property.discount > 0 && (
                    <div className="price-row discount">
                      <span>Discount ({property.discount}%)</span>
                      <span>-₱{(property.price * property.discount / 100 * numberOfNights).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="price-row total">
                    <span>Total</span>
                    <span>₱{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || totalAmount === 0}
              >
                {isSubmitting ? 'Submitting...' : `Request Booking • ₱${totalAmount.toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
