import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import Registration from './Registration';
import '../../styles/authmodalstyle.css';
import logoImage from '/logo.ico';  

function AuthModal({ onClose, initialView = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialView === 'login');
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSwitchView = async (view) => {
    if (isAnimating || isLogin === (view === 'login')) return;
    
    setIsAnimating(true);
    
    // Add slide-out animation
    const content = modalRef.current?.querySelector('.modal-content');
    if (content) {
      content.style.transform = 'translateX(-20px)';
      content.style.opacity = '0';
    }
    
    // Wait for slide-out animation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Switch view
    setIsLogin(view === 'login');
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Slide in new content
    if (content) {
      content.style.transform = 'translateX(20px)';
      content.style.opacity = '0';
      
      setTimeout(() => {
        content.style.transform = 'translateX(0)';
        content.style.opacity = '1';
        setIsAnimating(false);
      }, 50);
    }
  };

  return (
    <div
      className={`auth-modal-overlay enhanced-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleOverlayClick}
    >
      {/* Animated Background Elements */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="auth-modal enhanced-modal" ref={modalRef}>
        {/* Enhanced Close Button */}
        <button
          className="close-button enhanced-close"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <div className="close-icon">
            <div className="close-line close-line-1"></div>
            <div className="close-line close-line-2"></div>
          </div>
        </button>

        {/* Modal Header with Enhanced Tabs */}
        <div className="authmodal-header">
          <div className="logo-section">
            <div className="animated-logo">
              <img src={logoImage} alt="SuiteSpot's Logo" className='logoImg'/>
              <span className="modallogo-text">SuiteSpot</span>
            </div>
            <p className="welcome-text">
              {isLogin ? 'Welcome back!' : 'Join SuiteSpot today'}
            </p>
          </div>
          
          <div className="auth-tabs">
            <button
              className={`tab-button ${isLogin ? 'active' : ''}`}
              onClick={() => handleSwitchView('login')}
              disabled={isAnimating}
            >
              <span className="tab-label">Log In</span>
              {isLogin && <div className="active-indicator"></div>}
            </button>
            <button
              className={`tab-button ${!isLogin ? 'active' : ''}`}
              onClick={() => handleSwitchView('register')}
              disabled={isAnimating}
            >
              <span className="tab-label">Sign Up</span>
              {!isLogin && <div className="active-indicator"></div>}
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className={`modal-content ${isAnimating ? 'animating' : ''}`}>
          {isLogin ? (
            <Login
              onClose={handleClose}
              switchToRegister={() => handleSwitchView('register')}
            />
          ) : (
            <Registration
              onClose={handleClose}
              switchToLogin={() => handleSwitchView('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;