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
            await sendEmailVerification(user);
            setEmailSent(true);
            setCountdown(30);
        } catch (error) {
            setError('Failed to send verification email. Please try again.');
            console.error('Error sending verification email:', error);
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
            await user.reload();
            const currentUser = user.auth.currentUser;
            
            if (currentUser.emailVerified) {
                onVerificationComplete(currentUser);
            } else {
                setError('Email not verified yet. Please check your inbox and click the verification link.');
            }
        } catch (error) {
            setError('Failed to check verification status. Please try again.');
            console.error('Verification check error:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
                        className="auth-submit-btn"
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