import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import GoogleLoginBtn from './GoogleLoginBtn';
// import '../../styles/authmodalstyle.css';

function Login({ onClose, switchToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Check if email is verified
            // In the handleLogin function, after checking email verification:
            if (!userCredential.user.emailVerified) {
                // Offer to resend verification email
                const resendVerification = window.confirm(
                    "Your email is not verified. Would you like us to resend the verification email?"
                );
                
                if (resendVerification) {
                    try {
                        await sendEmailVerification(userCredential.user);
                        alert("Verification email sent! Please check your inbox and verify your email before logging in.");
                    } catch (error) {
                        console.error("Error sending verification email:", error);
                        alert("Failed to send verification email. Please try again later.");
                    }
                }
                
                setErrors({ 
                    general: "Please verify your email before logging in. Check your inbox for the verification link." 
                });
                setIsLoading(false);
                return;
            }

            console.log("Login successful!");

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

    const handleForgotPassword = () => {
        // Implement forgot password flow
        alert("Forgot password feature coming soon!");
    };

    return (
        <div className={`auth-content ${isVisible ? 'visible' : ''}`}>
            {/* Enhanced Google Login */}
            <div className="social-login-section">
                <GoogleLoginBtn 
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError} 
                    variant="enhanced"
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
                            <span className="error-icon">⚠️</span>
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
                            <span className="error-icon">⚠️</span>
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
                            <span className="btn-text">Sign In</span>
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