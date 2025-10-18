import React, { useState, useEffect } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import '../../styles/authmodalstyle.css';

function EmailVerification({ user, onVerificationComplete, onBack }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        if (user && !emailSent) {
            sendVerificationEmail();
        }
    }, [user]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const sendVerificationEmail = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            // Check if user object is valid
            if (!user || !user.email) {
                setError('User information is missing. Please try registering again.');
                return;
            }

            console.log('Sending verification email to:', user.email);
            
            await sendEmailVerification(user);
            
            console.log('Verification email sent successfully');
            setEmailSent(true);
            setCountdown(30);
            
        } catch (error) {
            console.error('Error sending verification email:', error);
            
            let errorMessage = 'Failed to send verification email. Please try again.';
            
            // Handle specific Firebase errors
            if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'User account not found. Please try registering again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address. Please check your email.';
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        if (countdown > 0) return;
        await sendVerificationEmail();
    };

    const handleManualCheck = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Reload user to get latest email verification status
            await user.reload();
            const currentUser = user.auth.currentUser;
            
            console.log('Email verification status:', currentUser.emailVerified);
            
            if (currentUser.emailVerified) {
                onVerificationComplete(currentUser);
            } else {
                setError('Email not verified yet. Please check your inbox and click the verification link.');
            }
        } catch (error) {
            console.error('Verification check error:', error);
            setError('Failed to check verification status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Debug info
    console.log('EmailVerification component state:', {
        user: user?.email,
        isLoading,
        error,
        emailSent,
        countdown
    });

    return (
        <div className="verification-container">
            <div className="verification-header">
                <div className="verification-icon">📧</div>
                <h2>Verify Your Email</h2>
                <p className="verification-subtitle">
                    We've sent a verification link to <strong>{user?.email}</strong>
                </p>
            </div>

            <div className="verification-content">
                <div className="verification-steps">
                    <div className="step">
                        <span className="step-number">1</span>
                        <span className="step-text">Check your email inbox</span>
                    </div>
                    <div className="step">
                        <span className="step-number">2</span>
                        <span className="step-text">Click the verification link</span>
                    </div>
                    <div className="step">
                        <span className="step-number">3</span>
                        <span className="step-text">Return here to continue</span>
                    </div>
                </div>

                <div className="manual-check-section">
                    <button 
                        onClick={handleManualCheck}
                        disabled={isLoading}
                        className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <div className="btn-spinner"></div>
                                Checking...
                            </>
                        ) : (
                            "I've Verified My Email"
                        )}
                    </button>
                </div>

                <div className="resend-section">
                    <p>Didn't receive the email?</p>
                    <button 
                        onClick={handleResendEmail}
                        disabled={countdown > 0 || isLoading}
                        className="resend-email-btn"
                    >
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
                    </button>
                </div>

                {onBack && (
                    <div className="back-section">
                        <button 
                            onClick={onBack}
                            className="back-button"
                        >
                            ← Back to Registration
                        </button>
                    </div>
                )}

                {error && (
                    <div className="error-banner animated-error">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {/* Debug info for development */}
                {process.env.NODE_ENV === 'development' && (
                    <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', fontSize: '12px' }}>
                        <strong>Debug Info:</strong>
                        <div>User: {user?.email}</div>
                        <div>User ID: {user?.uid}</div>
                        <div>Email Sent: {emailSent ? 'Yes' : 'No'}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EmailVerification;