import React, { useState } from 'react';
import '../../styles/helpstyle.css';

function HelpSupport() {
  const [activeSection, setActiveSection] = useState('faq');
  const [searchTerm, setSearchTerm] = useState('');

  const faqItems = [
    {
      id: 1,
      question: "How do I create a new listing?",
      answer: "To create a new listing, go to the Listings tab and click 'Add New Listing'. Fill in all the required information including property details, photos, pricing, and availability."
    },
    {
      id: 2,
      question: "How do I manage my bookings?",
      answer: "You can view and manage all your bookings in the Calendar tab. Here you can see upcoming check-ins, check-outs, and manage your availability."
    },
    {
      id: 3,
      question: "How do I communicate with guests?",
      answer: "Use the Messages tab to communicate with your guests. You can send messages, respond to inquiries, and manage all guest communications in one place."
    },
    {
      id: 4,
      question: "How do I update my profile?",
      answer: "Go to your user menu and select 'Account Settings' to update your profile information, payment methods, and notification preferences."
    },
    {
      id: 5,
      question: "How do I switch to guest mode?",
      answer: "Click on your user menu and select 'Switch to Guest Mode' to browse and book properties as a guest."
    }
  ];

  const contactOptions = [
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      action: 'Send Email'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      action: 'Call Now'
    }
  ];

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="help-support">
      <div className="help-header">
        <h1>Help & Support</h1>
        <p>Find answers to common questions and get the help you need</p>
      </div>

      <div className="help-content">
        <div className="help-sidebar">
          <div className="help-nav">
            <button
              className={`help-nav-item ${activeSection === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveSection('faq')}
            >
              <span className="nav-icon">❓</span>
              <span className="nav-text">FAQ</span>
            </button>
            <button
              className={`help-nav-item ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveSection('contact')}
            >
              <span className="nav-icon">📞</span>
              <span className="nav-text">Contact Us</span>
            </button>
            <button
              className={`help-nav-item ${activeSection === 'guides' ? 'active' : ''}`}
              onClick={() => setActiveSection('guides')}
            >
              <span className="nav-icon">📚</span>
              <span className="nav-text">Guides</span>
            </button>
          </div>
        </div>

        <div className="help-main">
          {activeSection === 'faq' && (
            <div className="faq-section">
              <div className="section-header">
                <h2>Frequently Asked Questions</h2>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search FAQ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>
              </div>

              <div className="faq-list">
                {filteredFaq.map(item => (
                  <div key={item.id} className="faq-item">
                    <div className="faq-question">
                      <h3>{item.question}</h3>
                    </div>
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="contact-section">
              <div className="section-header">
                <h2>Contact Support</h2>
                <p>Choose how you'd like to get in touch with our support team</p>
              </div>

              <div className="contact-options">
                {contactOptions.map((option, index) => (
                  <div key={index} className="contact-option">
                    <div className="contact-icon">{option.icon}</div>
                    <div className="contact-info">
                      <h3>{option.title}</h3>
                      <p>{option.description}</p>
                    </div>
                    <button className="contact-btn">
                      {option.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'guides' && (
            <div className="guides-section">
              <div className="section-header">
                <h2>Helpful Guides</h2>
                <p>Step-by-step guides to help you get the most out of SuiteSpot</p>
              </div>

              <div className="guides-grid">
                <div className="guide-card">
                  <div className="guide-icon">🏠</div>
                  <h3>Getting Started as a Host</h3>
                  <p>Learn how to set up your first listing and start hosting guests</p>
                  <button className="guide-btn">Read Guide</button>
                </div>
                <div className="guide-card">
                  <div className="guide-icon">📸</div>
                  <h3>Taking Great Photos</h3>
                  <p>Tips for capturing photos that attract more guests</p>
                  <button className="guide-btn">Read Guide</button>
                </div>
                <div className="guide-card">
                  <div className="guide-icon">💰</div>
                  <h3>Pricing Your Property</h3>
                  <p>How to set competitive prices and maximize your earnings</p>
                  <button className="guide-btn">Read Guide</button>
                </div>
                <div className="guide-card">
                  <div className="guide-icon">⭐</div>
                  <h3>Getting Great Reviews</h3>
                  <p>Best practices for providing excellent guest experiences</p>
                  <button className="guide-btn">Read Guide</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HelpSupport;
