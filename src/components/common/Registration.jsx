import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import GoogleLoginBtn from './GoogleLoginBtn';
import EmailVerification from './EmailVerification';
import '../../styles/authmodalstyle.css';

function Registration({ onClose, switchToLogin }) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [userPendingVerification, setUserPendingVerification] = useState(null);

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    // Enhanced email validation
    const validateEmail = async (email) => {
        // Basic format validation
        if (!/\S+@\S+\.\S+/.test(email)) {
            return { isValid: false, message: "Please enter a valid email address" };
        }

        // Domain validation
        const domain = email.split('@')[1];
        const disposableDomains = ['tempmail.com', 'throwaway.com', 'fake.com', 'example.com'];
        const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
        
        if (disposableDomains.includes(domain)) {
            return { isValid: false, message: "Please use a permanent email address" };
        }

        // MX record check (simplified)
        try {
            // This is a simplified check - in production, you might want to use a service
            if (!commonProviders.includes(domain) && !domain.includes('.')) {
                return { isValid: false, message: "Please use a valid email provider" };
            }
        } catch (error) {
            console.log("Email validation skipped:", error);
        }

        return { isValid: true };
    };

    const validateForm = async () => {
        const newErrors = {};
        
        // Name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else {
            const emailValidation = await validateEmail(formData.email);
            if (!emailValidation.isValid) {
                newErrors.email = emailValidation.message;
            }
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        } else if (passwordStrength < 50) {
            newErrors.password = "Please choose a stronger password";
        }

        // Confirm password
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords don't match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (password.length >= 8) strength += 10;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[a-z]/.test(password)) strength += 10;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 15;
        return Math.min(strength, 100);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }

        if (field === 'password') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        const isValid = await validateForm();
        if (!isValid) {
            setIsLoading(false);
            return;
        }
        
        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            
            // Update profile with display name
            await updateProfile(user, {
                displayName: formData.fullName
            });

            // DON'T send verification email here - let EmailVerification component handle it
            console.log("User created successfully:", user.email);
            
            // Show verification screen
            setUserPendingVerification(user);
            setShowVerification(true);
            
        } catch (error) {
            console.error("Registration error:", error);
            
            document.querySelector('.auth-form')?.classList.add('shake');
            setTimeout(() => {
                document.querySelector('.auth-form')?.classList.remove('shake');
            }, 600);
            
            let errorMessage = "Registration failed. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already registered. Please log in instead.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password is too weak. Please choose a stronger password.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Please enter a valid email address.";
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = "Email/password accounts are not enabled. Please contact support.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = "Network error. Please check your connection and try again.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many attempts. Please try again later.";
            }
            
            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerificationComplete = (verifiedUser) => {
        console.log("Email verified successfully:", verifiedUser.email);
        
        // Add success animation
        document.querySelector('.auth-content')?.classList.add('success');
        
        // Close modal after success
        setTimeout(() => {
            if (onClose) onClose();
        }, 1000);
    };

    const handleBackToRegistration = () => {
        setShowVerification(false);
        setUserPendingVerification(null);
    };

    const handleGoogleSuccess = (user) => {
        console.log("Google registration successful:", user);
        
        // For Google sign-in, email is already verified
        document.querySelector('.auth-content')?.classList.add('success');
        setTimeout(() => {
            if (onClose) onClose();
        }, 800);
    };

    const handleGoogleError = (error) => {
        setErrors({ general: error.message });
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength === 0) return "";
        if (passwordStrength <= 25) return "Weak";
        if (passwordStrength <= 50) return "Fair";
        if (passwordStrength <= 75) return "Good";
        return "Strong";
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 25) return '#ef4444';
        if (passwordStrength <= 50) return '#f59e0b';
        if (passwordStrength <= 75) return '#10b981';
        return '#0ecfb8';
    };

    // Show verification screen if needed
    if (showVerification && userPendingVerification) {
        return (
            <div className={`auth-content ${isVisible ? 'visible' : ''}`}>
                <EmailVerification 
                    user={userPendingVerification}
                    onVerificationComplete={handleVerificationComplete}
                    onBack={handleBackToRegistration}
                />
            </div>
        );
    }

    return (
        <div className={`auth-content ${isVisible ? 'visible' : ''}`}>
            {/* Enhanced Google Sign Up */}
            <div className="social-login-section">
                <GoogleLoginBtn 
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    variant="enhanced"
                    text="Sign up with Google"
                />
            </div>

            <div className="divider enhanced-divider">
                <span className="divider-text">or continue with email</span>
            </div>

            {/* Enhanced Registration Form */}
            <form onSubmit={handleRegister} className="auth-form animated-form">
                <div className={`input-group ${formData.fullName ? 'has-value' : ''}`}>
                    <label htmlFor="fullName" className="floating-label">Full name</label>
                    <input
                        id="fullName"
                        type="text"
                        placeholder=" "
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={errors.fullName ? 'error' : ''}
                    />
                    {errors.fullName && (
                        <div className="error-message animated-error">
                            <span className="reg-error-icon">⚠️</span>
                            {errors.fullName}
                        </div>
                    )}
                </div>

                <div className={`input-group ${formData.email ? 'has-value' : ''}`}>
                    <label htmlFor="email" className="floating-label">Email address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder=" "
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && (
                        <div className="error-message animated-error">
                            <span className="reg-error-icon">⚠️</span>
                            {errors.email}
                        </div>
                    )}
                </div>

                <div className={`input-group ${formData.phone ? 'has-value' : ''}`}>
                    <label htmlFor="phone" className="floating-label">
                        Phone number <span className="optional">(optional)</span>
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        placeholder=" "
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                </div>

                <div className={`input-group ${formData.password ? 'has-value' : ''}`}>
                    <label htmlFor="password" className="floating-label">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder=" "
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={errors.password ? 'error' : ''}
                    />
                    
                    {formData.password && (
                        <div className="password-strength-indicator">
                            <div className="strength-labels">
                                <span>Password strength:</span>
                                <span 
                                    className="strength-text"
                                    style={{ color: getPasswordStrengthColor() }}
                                >
                                    {getPasswordStrengthText()}
                                </span>
                            </div>
                            <div className="strength-bar">
                                <div 
                                    className="strength-fill"
                                    style={{ 
                                        width: `${passwordStrength}%`,
                                        backgroundColor: getPasswordStrengthColor()
                                    }}
                                ></div>
                            </div>
                            <div className="password-requirements">
                                <span className={formData.password.length >= 6 ? 'met' : ''}>
                                    ✓ At least 6 characters
                                </span>
                                <span className={formData.password.length >= 8 ? 'met' : ''}>
                                    ✓ 8+ characters (better)
                                </span>
                                <span className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                                    ✓ Uppercase letter
                                </span>
                                <span className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                                    ✓ Lowercase letter
                                </span>
                                <span className={/[0-9]/.test(formData.password) ? 'met' : ''}>
                                    ✓ Number
                                </span>
                                <span className={/[^A-Za-z0-9]/.test(formData.password) ? 'met' : ''}>
                                    ✓ Special character
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {errors.password && (
                        <div className="error-message animated-error">
                            <span className="reg-error-icon">⚠️</span>
                            {errors.password}
                        </div>
                    )}
                </div>

                <div className={`input-group ${formData.confirmPassword ? 'has-value' : ''}`}>
                    <label htmlFor="confirmPassword" className="floating-label">Confirm password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        placeholder=" "
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && (
                        <div className="error-message animated-error">
                            <span className="reg-error-icon">⚠️</span>
                            {errors.confirmPassword}
                        </div>
                    )}
                </div>

                {errors.general && (
                    <div className="error-banner animated-error">
                        <span className="reg-error-icon">❌</span>
                        {errors.general}
                    </div>
                )}

                <button 
                    type="submit" 
                    className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <div className="btn-spinner"></div>
                            <span className="btn-text">Creating account...</span>
                        </>
                    ) : (
                        <>
                            <span className="btn-text">Create Account</span>
                        </>
                    )}
                </button>
            </form>

            <div className="auth-footer animated-footer">
                <p className="terms-text">
                    By continuing, you agree to SuiteSpot's{' '}
                    <a href="#" className="terms-link">Terms of Service</a>{' '}
                    and acknowledge our{' '}
                    <a href="#" className="terms-link">Privacy Policy</a>.
                </p>
                <p>
                    Already have an account?{' '}
                    <span className="auth-switch-link" onClick={switchToLogin}>
                        Log in
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Registration;