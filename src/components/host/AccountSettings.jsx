import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import '../../styles/accountsetstyle.css';

function AccountSettings({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phone: '',
    bio: '',
    languages: [],
    responseTime: 'within an hour',
    avatar: ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: '',
    validUntil: '',
    maxUses: ''
  });

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        languages: user.languages || ['English'],
        responseTime: user.responseTime || 'within an hour',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Fetch host bookings and coupons
  useEffect(() => {
    const fetchHostData = async () => {
      if (!user) return;

      try {
        // Fetch bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('hostId', '==', user.uid)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookingsData = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBookings(bookingsData);

        // Fetch coupons
        const couponsQuery = query(
          collection(db, 'coupons'),
          where('hostId', '==', user.uid)
        );
        const couponsSnapshot = await getDocs(couponsQuery);
        const couponsData = couponsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCoupons(couponsData);

      } catch (error) {
        console.error('Error fetching host data:', error);
      }
    };

    fetchHostData();
  }, [user]);

  // Update profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      
      // Update Firebase Auth profile
      if (user.displayName !== profileData.displayName) {
        await updateProfile(user, {
          displayName: profileData.displayName
        });
      }

      if (user.email !== profileData.email) {
        await updateEmail(user, profileData.email);
      }

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        email: profileData.email,
        phone: profileData.phone,
        bio: profileData.bio,
        languages: profileData.languages,
        responseTime: profileData.responseTime,
        avatar: profileData.avatar,
        updatedAt: new Date()
      });

      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (securityData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const user = auth.currentUser;
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email, 
        securityData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, securityData.newPassword);

      alert('Password updated successfully!');
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new coupon
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    
    if (!newCoupon.code || !newCoupon.discount || !newCoupon.validUntil) {
      alert('Please fill all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const user = auth.currentUser;
      
      await addDoc(collection(db, 'coupons'), {
        code: newCoupon.code.toUpperCase(),
        discount: parseInt(newCoupon.discount),
        validUntil: new Date(newCoupon.validUntil),
        maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : null,
        hostId: user.uid,
        createdAt: new Date(),
        usedCount: 0,
        isActive: true
      });

      alert('Coupon created successfully!');
      setNewCoupon({
        code: '',
        discount: '',
        validUntil: '',
        maxUses: ''
      });

      // Refresh coupons list
      const couponsQuery = query(
        collection(db, 'coupons'),
        where('hostId', '==', user.uid)
      );
      const couponsSnapshot = await getDocs(couponsQuery);
      const couponsData = couponsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCoupons(couponsData);

    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Error creating coupon. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle coupon status
  const toggleCouponStatus = async (couponId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'coupons', couponId), {
        isActive: !currentStatus,
        updatedAt: new Date()
      });

      // Refresh coupons list
      const couponsQuery = query(
        collection(db, 'coupons'),
        where('hostId', '==', auth.currentUser.uid)
      );
      const couponsSnapshot = await getDocs(couponsQuery);
      const couponsData = couponsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCoupons(couponsData);

    } catch (error) {
      console.error('Error updating coupon:', error);
      alert('Error updating coupon status.');
    }
  };

  const languagesList = ['English', 'Filipino', 'Spanish', 'Chinese', 'Japanese', 'Korean', 'Other'];

  return (
    <div className="account-settings">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Manage your profile, security, and preferences</p>
      </div>

      <div className="settings-tabs">
        {[
          { key: 'profile', label: 'Profile', icon: '👤' },
          { key: 'security', label: 'Security', icon: '🔒' },
          { key: 'bookings', label: 'Bookings', icon: '📅' },
          { key: 'coupons', label: 'Coupons', icon: '🎫' },
          { key: 'preferences', label: 'Preferences', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="profile-settings">
            <div className="section-header">
              <h3>Profile Information</h3>
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : '✏️ Edit Profile'}
              </button>
            </div>

            <form onSubmit={handleProfileUpdate}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Display Name *</label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>

                <div className="input-group">
                  <label>Response Time</label>
                  <select
                    value={profileData.responseTime}
                    onChange={(e) => setProfileData(prev => ({ ...prev, responseTime: e.target.value }))}
                    disabled={!isEditing}
                  >
                    <option value="within an hour">Within an hour</option>
                    <option value="within a few hours">Within a few hours</option>
                    <option value="within a day">Within a day</option>
                  </select>
                </div>

                <div className="input-group full-width">
                  <label>Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Tell guests about yourself and your hosting style..."
                    rows="4"
                  />
                </div>

                <div className="input-group full-width">
                  <label>Languages Spoken</label>
                  <div className="languages-grid">
                    {languagesList.map(language => (
                      <label key={language} className="language-option">
                        <input
                          type="checkbox"
                          checked={profileData.languages.includes(language)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfileData(prev => ({
                                ...prev,
                                languages: [...prev.languages, language]
                              }));
                            } else {
                              setProfileData(prev => ({
                                ...prev,
                                languages: prev.languages.filter(lang => lang !== language)
                              }));
                            }
                          }}
                          disabled={!isEditing}
                        />
                        <span className="checkmark"></span>
                        {language}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="save-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="security-settings">
            <h3>Security Settings</h3>
            
            <form onSubmit={handlePasswordChange}>
              <div className="security-form">
                <div className="input-group">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    value={securityData.currentPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>New Password *</label>
                  <input
                    type="password"
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength="6"
                  />
                </div>

                <div className="input-group">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="change-password-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : '🔑 Change Password'}
                </button>
              </div>
            </form>

            <div className="security-features">
              <h4>Security Features</h4>
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">📧</span>
                  <div className="feature-info">
                    <strong>Email Verification</strong>
                    <p>Your email is verified</p>
                  </div>
                  <span className="feature-status verified">Verified</span>
                </div>

                <div className="feature-item">
                  <span className="feature-icon">📱</span>
                  <div className="feature-info">
                    <strong>Two-Factor Authentication</strong>
                    <p>Add an extra layer of security</p>
                  </div>
                  <button className="enable-btn">Enable</button>
                </div>

                <div className="feature-item">
                  <span className="feature-icon">👁️</span>
                  <div className="feature-info">
                    <strong>Login Activity</strong>
                    <p>View your recent sign-ins</p>
                  </div>
                  <button className="view-btn">View</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="bookings-settings">
            <h3>Booking Management</h3>
            
            <div className="booking-preferences">
              <h4>Booking Preferences</h4>
              <div className="preference-options">
                <label className="preference-option">
                  <input type="checkbox" defaultChecked />
                  <span className="checkmark"></span>
                  Instant Booking
                </label>
                <label className="preference-option">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Require guest verification
                </label>
                <label className="preference-option">
                  <input type="checkbox" defaultChecked />
                  <span className="checkmark"></span>
                  Allow same-day bookings
                </label>
              </div>
            </div>

            <div className="recent-bookings">
              <h4>Recent Bookings</h4>
              {bookings.length === 0 ? (
                <div className="empty-bookings">
                  <p>No bookings yet</p>
                </div>
              ) : (
                <div className="bookings-list">
                  {bookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="booking-item">
                      <div className="booking-info">
                        <strong>{booking.propertyTitle}</strong>
                        <span>{booking.guestName}</span>
                        <small>
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="booking-status">
                        <span className={`status ${booking.status}`}>{booking.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coupons Management */}
        {activeTab === 'coupons' && (
          <div className="coupons-settings">
            <h3>Coupon Management</h3>
            
            {/* Create New Coupon */}
            <div className="create-coupon">
              <h4>Create New Coupon</h4>
              <form onSubmit={handleCreateCoupon}>
                <div className="coupon-form">
                  <div className="input-group">
                    <label>Coupon Code *</label>
                    <input
                      type="text"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="SUMMER2024"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Discount (%) *</label>
                    <input
                      type="number"
                      value={newCoupon.discount}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, discount: e.target.value }))}
                      min="1"
                      max="100"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Valid Until *</label>
                    <input
                      type="date"
                      value={newCoupon.validUntil}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, validUntil: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Max Uses (Optional)</label>
                    <input
                      type="number"
                      value={newCoupon.maxUses}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, maxUses: e.target.value }))}
                      min="1"
                      placeholder="Unlimited"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="create-coupon-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : '🎫 Create Coupon'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Coupons */}
            <div className="existing-coupons">
              <h4>Your Coupons</h4>
              {coupons.length === 0 ? (
                <div className="empty-coupons">
                  <p>No coupons created yet</p>
                </div>
              ) : (
                <div className="coupons-list">
                  {coupons.map(coupon => (
                    <div key={coupon.id} className="coupon-item">
                      <div className="coupon-info">
                        <div className="coupon-code">{coupon.code}</div>
                        <div className="coupon-details">
                          <span className="discount">{coupon.discount}% off</span>
                          <span className="valid-until">
                            Valid until: {new Date(coupon.validUntil?.seconds * 1000).toLocaleDateString()}
                          </span>
                          <span className="usage">
                            Used: {coupon.usedCount || 0}{coupon.maxUses ? `/${coupon.maxUses}` : ''} times
                          </span>
                        </div>
                      </div>
                      <div className="coupon-actions">
                        <button 
                          className={`status-btn ${coupon.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => toggleCouponStatus(coupon.id, coupon.isActive)}
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="delete-btn">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferences */}
        {activeTab === 'preferences' && (
          <div className="preferences-settings">
            <h3>Account Preferences</h3>
            
            <div className="preference-sections">
              <div className="preference-section">
                <h4>Notification Settings</h4>
                <div className="notification-options">
                  <label className="notification-option">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Email notifications for new bookings
                  </label>
                  <label className="notification-option">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    SMS alerts for urgent messages
                  </label>
                  <label className="notification-option">
                    <input type="checkbox" />
                    <span className="checkmark"></span>
                    Marketing and promotion emails
                  </label>
                  <label className="notification-option">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Booking reminder notifications
                  </label>
                </div>
              </div>

              <div className="preference-section">
                <h4>Privacy Settings</h4>
                <div className="privacy-options">
                  <label className="privacy-option">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Show my profile to guests
                  </label>
                  <label className="privacy-option">
                    <input type="checkbox" />
                    <span className="checkmark"></span>
                    Allow reviews to be public
                  </label>
                  <label className="privacy-option">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Include in host recommendations
                  </label>
                </div>
              </div>

              <div className="preference-section">
                <h4>Payment Preferences</h4>
                <div className="payment-options">
                  <label className="payment-option">
                    <input type="radio" name="payout" defaultChecked />
                    <span className="checkmark"></span>
                    Automatic payouts
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="payout" />
                    <span className="checkmark"></span>
                    Manual payout requests
                  </label>
                  <label className="payment-option">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Receive payment receipts
                  </label>
                </div>
              </div>
            </div>

            <div className="preferences-actions">
              <button className="save-preferences-btn">
                💾 Save Preferences
              </button>
              <button className="export-data-btn">
                📤 Export Account Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountSettings;