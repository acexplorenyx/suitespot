import "../../styles/navstyle.css";
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import logoImage from '/logo.ico';
import { FaBars, FaTimes, FaUser, FaHeart, FaCog, FaSignOutAlt, FaHome, FaMapMarkerAlt, FaConciergeBell } from "react-icons/fa";
import AuthModal from '../common/AuthModal';

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleBecomeHost = () => {
        if (user) {
            navigate('/host');
        } else {
            setAuthModalOpen(true);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        });
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.user-dropdown') && !e.target.closest('.user-menu-btn')) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUserMenuOpen(false);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };
    
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src={logoImage} alt="SuiteSpot Logo" className="logo-img" />
                <span className="logo-text">SuiteSpot</span>
            </div>

            {/* Hamburger menu for mobile */}
            <div className="menu-icon" onClick={toggleMenu}>
                {menuOpen ? <FaTimes /> : <FaBars />}
            </div>

            <div className={`navbar-center ${menuOpen ? 'mobile-menu-open' : ''}`}>
                <ul className="navbar-links">
                <li className="nav-item active">
                    <FaHome className="nav-icon animated-icon" />
                    <a href="/">Home</a>
                </li>
                <li className="nav-item">
                    <FaMapMarkerAlt className="nav-icon animated-icon" />
                    <a href="/experiences">Experiences</a>
                </li>
                <li className="nav-item">
                    <FaConciergeBell className="nav-icon animated-icon" />
                    <a href="/services">Services</a>
                </li>
                </ul>
            </div>
            
            <div className="navbar-right">
                <button className="become-host" onClick={handleBecomeHost}>
                    {user ? 'Switch to Host' : 'Become a host'}
                </button>
                
                {user ? (
                <div className="user-menu-container">
                    <button className="user-menu-btn" onClick={toggleUserMenu}>
                        <FaBars className="menu-icon-small" />
                        <FaUser className="user-icon" />
                    </button>
                    
                    {userMenuOpen && (
                    <div className="user-dropdown">
                        <div className="user-info">
                            <p>Hello, {user.displayName || user.email}</p>
                        </div>
                        <div className="dropdown-divider"></div>
                        <a href="/profile" className="dropdown-item">
                            <FaUser className="dropdown-icon" /> Profile
                        </a>
                        <a href="/favorites" className="dropdown-item">
                            <FaHeart className="dropdown-icon" /> Favorites
                        </a>
                        <a href="/settings" className="dropdown-item">
                            <FaCog className="dropdown-icon" /> Settings
                        </a>
                        <div className="dropdown-divider"></div>
                        <button className="dropdown-item logout-btn" onClick={handleLogout}>
                            <FaSignOutAlt className="dropdown-icon" /> Log Out
                        </button>
                    </div>
                    )}
                </div>
                ) : (
                <button className="loginbtn" onClick={() => setAuthModalOpen(true)}>Log In</button>
                )}
            </div>
            
            {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
        </nav>
    )
}

export default Navbar;