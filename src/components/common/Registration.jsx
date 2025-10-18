import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
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
    const [userPendingVerification, setUserPendingVerification] = useState(null);
    const [registrationStep, setRegistrationStep] = useState('form');

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email address";
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        return strength;
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
        if (!validateForm()) return;
        
        setIsLoading(true);
        setErrors({});

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            
            await updateProfile(user, {
                displayName: formData.fullName
            });

            // Send email verification
            await sendEmailVerification(user);

            console.log("Registration successful, verification email sent:", user);
            setUserPendingVerification(user);
            setRegistrationStep('verification');
            
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
            }
            
            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerificationComplete = (verifiedUser) => {
        console.log("Email verified successfully:", verifiedUser);
        document.querySelector('.auth-content')?.classList.add('success');
        setTimeout(() => {
            if (onClose) onClose();
        }, 800);
    };

    const handleBackToForm = () => {
        setRegistrationStep('form');
        setUserPendingVerification(null);
    };

    const handleGoogleSuccess = (user) => {
        console.log("Google registration successful:", user);
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
    if (registrationStep === 'verification' && userPendingVerification) {
        return (
            <div className={`auth-content ${isVisible ? 'visible' : ''}`}>
                <EmailVerification 
                    user={userPendingVerification}
                    onVerificationComplete={handleVerificationComplete}
                    onBack={handleBackToForm}
                />
            </div>
        );
    }

    // Original registration form
    return (
        <div className={`auth-content ${isVisible ? 'visible' : ''}`}>
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
                            <span className="error-icon">⚠️</span>
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
                            <span className="error-icon">⚠️</span>
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
                                <span className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                                    ✓ One uppercase letter
                                </span>
                                <span className={/[0-9]/.test(formData.password) ? 'met' : ''}>
                                    ✓ One number
                                </span>
                                <span className={/[^A-Za-z0-9]/.test(formData.password) ? 'met' : ''}>
                                    ✓ One special character
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {errors.password && (
                        <div className="error-message animated-error">
                            <span className="error-icon">⚠️</span>
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
                            <span className="error-icon">⚠️</span>
                            {errors.confirmPassword}
                        </div>
                    )}
                </div>

                {errors.general && (
                    <div className="error-banner animated-error">
                        <span className="error-icon">❌</span>
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
                            <span className="btn-icon">✨</span>
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