import React, { useState, useEffect } from 'react';
import { sendEmailVerification, getAuth } from 'firebase/auth';
import '../../styles/authmodalstyle.css';

function EmailVerification({ user, onVerificationComplete, onBack }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [emailSent, setEmailSent] = useState(false);
    const [checkingCount, setCheckingCount] = useState(0);
    const [lastSentTime, setLastSentTime] = useState(0);

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

    // Auto-check verification status every 5 seconds
    useEffect(() => {
        if (emailSent && checkingCount < 12) { // Check for up to 1 minute
            const interval = setInterval(() => {
                checkVerificationStatus();
            }, 5000);
            
            return () => clearInterval(interval);
        }
    }, [emailSent, checkingCount]);

    const sendVerificationEmail = async () => {
        try {
            setIsLoading(true);
            setError('');

            if (!user || !user.email) {
                setError('User information is missing. Please try registering again.');
                setIsLoading(false);
                return;
            }

            // Check if verification email was sent recently for this email (prevent duplicates)
            const lastSent = localStorage.getItem(`verification_sent_${user.email}`);
            const now = Date.now();
            if (lastSent && now - parseInt(lastSent) < 60000) { // 1 minute
                setError('Verification email already sent recently. Please check your inbox.');
                setIsLoading(false);
                return;
            }

            // rate limiting - 60 seconds
            if (lastSentTime && now - lastSentTime < 60000) {
                setError('Please wait 60 seconds before requesting another verification email.');
                setIsLoading(false);
                return;
            }

            const auth = getAuth();
            const actionCodeSettings = {
                url: `${window.location.origin}/verify-success?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.displayName || '')}`,
                handleCodeInApp: true
            };

            await sendEmailVerification(user, actionCodeSettings);

            setEmailSent(true);
            setCountdown(60);
            setCheckingCount(0);
            setLastSentTime(now);
            localStorage.setItem(`verification_sent_${user.email}`, now.toString());

            // Increment verification count to track total sends
            const currentCount = parseInt(localStorage.getItem(`verification_${user.email}`) || 0);
            localStorage.setItem(`verification_${user.email}`, (currentCount + 1).toString());

        } catch (error) {
            console.error('Error sending verification email:', error);

            let errorMessage = 'Failed to send verification email. Please try again.';

            if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again in 60 seconds.';
                setCountdown(60);
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

    const checkVerificationStatus = async () => {
        try {
            const auth = getAuth();
            await user.reload();
            const currentUser = auth.currentUser;
            
            if (currentUser && currentUser.emailVerified) {
                console.log('Email verified successfully!');
                onVerificationComplete(currentUser);
            } else {
                setCheckingCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Auto-check error:', error);
        }
    };

    const handleManualCheck = async () => {
        setIsLoading(true);
        setError('');
        try {
            const auth = getAuth();
            await user.reload();
            const currentUser = auth.currentUser;
            
            if (currentUser && currentUser.emailVerified) {
                console.log('Email verified successfully!');
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

    const handleResendEmail = async () => {
        if (countdown > 0) return;
        await sendVerificationEmail();
    };

    return (
        <div className="verification-container">
            <div className="verification-header">
                <div className="verification-icon">📧</div>
                <h2>Verify Your Email</h2>
                <p className="verification-subtitle">
                    We've sent a verification link to <strong>{user?.email}</strong>
                </p>
                <p className="verification-instruction">
                    Please check your inbox and click the verification link to activate your account.
                    Don't forget to check your spam folder!
                </p>
            </div>

            <div className="verification-content">
                <div className="verification-steps">
                    <div className="step">
                        <span className="step-number">1</span>
                        <span className="step-text">Check your email inbox (and spam folder)</span>
                    </div>
                    <div className="step">
                        <span className="step-number">2</span>
                        <span className="step-text">Click the "Continue" button in the email</span>
                    </div>
                    <div className="step">
                        <span className="step-number">3</span>
                        <span className="step-text">Return here to continue (we'll auto-detect verification)</span>
                    </div>
                </div>

                {emailSent && (
                    <div className="auto-check-info">
                        <p>⏰ Auto-checking verification status... ({checkingCount}/12 attempts)</p>
                    </div>
                )}

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
            </div>
        </div>
    );
}

export default EmailVerification;