// import React from "react";
// import { Link } from "react-router-dom";
import "../../styles/footerstyle.css";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <h2>SuiteSpot</h2>
          <p>Find Your Perfect Stay</p>
        </div>

        {/* Socials */}
        <div className="footer-socials">
          <h4>Connect with us</h4>
          <a href="https://facebook.com" className="social-link"><FaFacebook className="social-icon" /></a>
          <a href="https://instagram.com" className="social-link"><FaInstagram className="social-icon" /></a>
          <a href="https://twitter.com" className="social-link"><FaTwitter className="social-icon" /></a>
        </div>
        
        {/* Navigation */}
        <div className="footer-links">
          <h4>Explore</h4>
          <ul>
            <li><a href="/">Home</a></li>

            <li><a href="/experiences">Experiences</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/about" className="about-link">About Us</a></li>
            <li><a href="/policy" className="policy-link">Terms and Policy</a></li>
            {/* <li><Link to="/">Home</Link></li>
            <li><Link to="/hotels">Hotels</Link></li>
            <li><Link to="/experiences">Experiences</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/about">About</Link></li> */}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} SuiteSpot. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;