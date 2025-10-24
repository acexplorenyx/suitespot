import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, applyActionCode } from 'firebase/auth';
import logoImage from '/logo.ico';
import '../../styles/authmodalstyle.css';

function VerificationSuccess() {
    const [status, setStatus] = useState('verifying');
    const [error, setError] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        
        if (email) {
            setUserEmail(decodeURIComponent(email));
        }
        if (name) {
            setUserName(decodeURIComponent(name));
        }

        const verifyEmail = async () => {
            try {
                const oobCode = searchParams.get('oobCode');
                const mode = searchParams.get('mode');
                
                // Check if this is actually an email verification request
                if (mode === 'verifyEmail' && oobCode) {
                    const auth = getAuth();
                    await applyActionCode(auth, oobCode);
                    setStatus('success');
                    
                    // Force refresh the user
                    const user = auth.currentUser;
                    if (user) {
                        await user.reload();
                        console.log('Email verification status:', user.emailVerified);
                    }
                } else {
                    // If no oobCode but we have email params, consider it success
                    // (user might have clicked the link and it opened in a different browser)
                    const email = searchParams.get('email');
                    if (email) {
                        setStatus('success');
                    } else {
                        setStatus('no-code');
                    }
                }
            } catch (error) {
                console.error('Email verification error:', error);
                setStatus('error');
                if (error.code === 'auth/invalid-action-code') {
                    setError('Invalid or expired verification link. Please request a new verification email.');
                } else if (error.code === 'auth/user-disabled') {
                    setError('This account has been disabled.');
                } else if (error.code === 'auth/user-not-found') {
                    setError('User account not found.');
                } else {
                    setError('Failed to verify email. Please try again.');
                }
            }
        };

        verifyEmail();
    }, [navigate, searchParams]);

    const handleContinue = () => {
        navigate('/', { 
            state: { 
                message: 'Email verified successfully! You can now log in.',
                verified: true 
            }
        });
    };

    const handleResendVerification = () => {
        navigate('/', { 
            state: { 
                message: 'Please register again to receive a new verification email.',
                email: userEmail 
            }
        });
    };

    // Loading state while verifying
    if (status === 'verifying') {
        return (
            <div className="verification-success-page">
                <div className="success-container">
                    <div className="verifying-state">
                        <div className="loading-spinner large"></div>
                        <h2>Verifying your email...</h2>
                        <p>Please wait while we verify your email address.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="verification-success-page">
                <div className="success-container success-design">
                    {/* Header */}
                    <div className="success-header">
                        <div className="logo-section">
                            <div className="animated-logo">
                                <img src={logoImage} alt="SuiteSpot Logo" className="logo-img" />
                                <span className="logo-text">SuiteSpot</span>
                            </div>
                        </div>
                    </div>

                    {/* Success Content */}
                    <div className="success-content-centered">
                        <div className="success-icon-large">✓</div>
                        <h1 className="success-title">Your email has been verified</h1>
                        <p className="success-message">
                            You can now sign in with your new account
                        </p>
                        
                        <div className="success-actions-centered">
                            <button 
                                className="continue-btn"
                                onClick={handleContinue}
                            >
                                CONTINUE
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="success-footer-minimal">
                        <p>Get in touch: support@suitespot.com</p>
                        <p className="copyright">Copyrights © SuiteSpot All Rights Reserved</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    return (
        <div className="verification-success-page">
            <div className="success-container">
                <div className="error-state">
                    <div className="error-icon">❌</div>
                    <h2>Verification Failed</h2>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button 
                            className="auth-submit-btn"
                            onClick={handleResendVerification}
                        >
                            Register Again
                        </button>
                        <button 
                            className="auth-submit-btn secondary"
                            onClick={() => navigate('/')}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerificationSuccess;