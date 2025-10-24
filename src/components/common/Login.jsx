import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendEmailVerification, setPersistence, browserSessionPersistence, browserLocalPersistence, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import GoogleLoginBtn from './GoogleLoginBtn';
import '../../styles/authmodalstyle.css';

function Login({ onClose, switchToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email address";
        if (!password) newErrors.password = "Password is required";
        else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            // Set persistence based on rememberMe
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                // Check if we've already sent too many verification emails
                const verificationCount = localStorage.getItem(`verification_${user.email}`) || 0;

                // Check if verification email was sent recently (prevent duplicates)
                const lastSent = localStorage.getItem(`verification_sent_${user.email}`);
                const now = Date.now();
                const recentlySent = lastSent && now - parseInt(lastSent) < 60000; // 1 minute

                if (verificationCount < 3 && !recentlySent) {
                    const resendVerification = window.confirm(
                        "Your email is not verified. Would you like us to resend the verification email?"
                    );

                    if (resendVerification) {
                        try {
                            const actionCodeSettings = {
                                url: `${window.location.origin}/verify-success?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.displayName || '')}`,
                                handleCodeInApp: true
                            };
                            await sendEmailVerification(user, actionCodeSettings);
                            localStorage.setItem(`verification_${user.email}`, parseInt(verificationCount) + 1);
                            localStorage.setItem(`verification_sent_${user.email}`, now.toString());
                            alert("Verification email sent! Please check your inbox and verify your email before logging in.");
                        } catch (error) {
                            console.error("Error sending verification email:", error);
                            if (error.code === 'auth/too-many-requests') {
                                alert("Too many verification attempts. Please try again later.");
                            } else {
                                alert("Failed to send verification email. Please try again later.");
                            }
                        }
                    }
                } else if (recentlySent) {
                    alert("Verification email already sent recently. Please check your inbox.");
                } else {
                    alert("Too many verification emails sent. Please check your inbox or wait before requesting another.");
                }

                setErrors({
                    general: "Please verify your email before logging in. Check your inbox for the verification link."
                });
                setIsLoading(false);
                return;
            }

            console.log("Login successful!");

            // Clear verification count on successful login
            localStorage.removeItem(`verification_${user.email}`);

            // Add success animation before closing
            document.querySelector('.auth-content')?.classList.add('success');
            setTimeout(() => {
                if (onClose) onClose();
            }, 600);

        } catch (error) {
            console.error("Login error:", error);
            // Shake animation for error
            document.querySelector('.auth-form')?.classList.add('shake');
            setTimeout(() => {
                document.querySelector('.auth-form')?.classList.remove('shake');
            }, 600);

            let errorMessage = "Login failed. Please try again.";
            if (error.code === 'auth/invalid-credential') {
                errorMessage = "Invalid email or password";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many attempts. Please try again later.";
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = "This account has been disabled. Please contact support.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = "Network error. Please check your connection.";
            }

            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = (user) => {
        console.log("Google login successful:", user);
        document.querySelector('.auth-content')?.classList.add('success');
        setTimeout(() => {
            if (onClose) onClose();
        }, 600);
    };

    const handleGoogleError = (error) => {
        setErrors({ general: error.message });
    };

    const handleForgotPassword = async () => {
        if (!email) {
            alert("Please enter your email address first.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent! Check your inbox.");
        } catch (error) {
            console.error("Error sending password reset email:", error);
            let errorMessage = "Failed to send password reset email. Please try again.";
            if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address.";
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email address.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many requests. Please try again later.";
            }
            alert(errorMessage);
        }
    };

    return (
        <div className={`auth-content ${isVisible ? 'visible' : ''}`}>
            {/* Enhanced Google Login */}
            <div className="social-login-section">
                <GoogleLoginBtn
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    variant="enhanced"
                    text="Sign in with Google"
                    rememberMe={rememberMe}
                />
            </div>

            <div className="divider enhanced-divider">
                <span className="divider-text">or continue with email</span>
            </div> 
            
            {/* Enhanced Email/Password Login Form */}
            <form onSubmit={handleLogin} className="auth-form animated-form">
                <div className={`input-group ${email ? 'has-value' : ''}`}>
                    <label htmlFor="email" className="floating-label">Email address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && (
                        <div className="error-message animated-error">
                            <span className="login-error-icon">⚠️</span>
                            {errors.email}
                        </div>
                    )}
                </div>

                <div className={`input-group ${password ? 'has-value' : ''}`}>
                    <label htmlFor="password" className="floating-label">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'error' : ''}
                    />
                    <div className="password-actions">
                        <span className="forgot-password" onClick={handleForgotPassword}>
                            Forgot password?
                        </span>
                    </div>
                    {errors.password && (
                        <div className="error-message animated-error">
                            <span className="login-error-icon">⚠️</span>
                            {errors.password}
                        </div>
                    )}
                </div>

                <div className="form-options">
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        <span className="checkbox-label">Remember me for 30 days</span>
                    </label>
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
                            <span className="btn-text">Signing in...</span>
                        </>
                    ) : (
                        <>
                            <span className="btn-icon">→</span>
                            <span className="btn-text">Login</span>
                        </>
                    )}
                </button>
            </form>

            <div className="auth-footer animated-footer">
                <p>
                    Don't have an account?{" "}
                    <span className="auth-switch-link" onClick={switchToRegister}>
                        Create one now
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;