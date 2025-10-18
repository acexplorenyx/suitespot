import React, { useState, useEffect } from 'react';
import "../styles/gueststyle.css";
import Navbar from '../components/common/Header';
import Searchbar from '../components/common/SearchBar';
import Footer from '../components/common/Footer';
import { FaHotel, FaHeart, FaShare, FaStar, FaMapMarkerAlt, FaFilter, FaTimes } from "react-icons/fa";

// Images
import hotel1 from '../images/pexels.jpg';
import hotel2 from '../images/hotelpic-blue.png';
import hotel3 from '../images/hotelsamplepic.jpg';
import hotel4 from '../images/picwithneon.jpg';

function GuestDashboard() {
    const [properties, setProperties] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [filteredProperties, setFilteredProperties] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [searchFilters, setSearchFilters] = useState({
        priceRange: [0, 1000],
        amenities: [],
        rating: 0,
        propertyType: 'all'
    });

    // Mock data - in real app, fetch from Firebase
    useEffect(() => {
        const mockProperties = [
            {
                id: 1,
                title: "Luxury Beachfront Villa",
                category: "home",
                type: "entire-place",
                price: 250,
                discount: 15,
                rating: 4.8,
                reviews: 124,
                location: "Bali, Indonesia",
                images: [hotel1],
                amenities: ["WiFi", "Pool", "Kitchen", "Air Conditioning"],
                maxGuests: 6,
                bedrooms: 3,
                beds: 4,
                bathrooms: 2,
                isFeatured: true,
                host: {
                    name: "Sarah Johnson",
                    isSuperhost: true
                }
            },
            {
                id: 2,
                title: "Modern City Apartment",
                category: "home",
                type: "entire-place",
                price: 120,
                discount: 0,
                rating: 4.5,
                reviews: 89,
                location: "Manila, Philippines",
                images: [hotel2],
                amenities: ["WiFi", "Kitchen", "TV", "Washer"],
                maxGuests: 4,
                bedrooms: 2,
                beds: 2,
                bathrooms: 1,
                isFeatured: false,
                host: {
                    name: "Miguel Santos",
                    isSuperhost: false
                }
            },
            {
                id: 3,
                title: "Traditional Cooking Class",
                category: "experience",
                type: "experience",
                price: 45,
                discount: 10,
                rating: 4.9,
                reviews: 67,
                location: "Tokyo, Japan",
                images: [hotel3],
                amenities: ["Meals Included", "Local Guide", "Group Activity"],
                maxGuests: 8,
                duration: "3 hours",
                host: {
                    name: "Yuki Tanaka",
                    isSuperhost: true
                }
            },
            {
                id: 4,
                title: "Professional Photography Session",
                category: "service",
                type: "service",
                price: 150,
                discount: 0,
                rating: 4.7,
                reviews: 42,
                location: "Your Location",
                images: [hotel4],
                amenities: ["Professional Equipment", "Digital Copies", "1 Hour Session"],
                maxGuests: 1,
                duration: "1 hour",
                host: {
                    name: "Alex Chen",
                    isSuperhost: true
                }
            }
        ];

        setProperties(mockProperties);
        setFilteredProperties(mockProperties);
        
        // Load favorites from localStorage
        const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        setFavorites(savedFavorites);
    }, []);

    // Toggle favorite
    const toggleFavorite = (propertyId) => {
        const updatedFavorites = favorites.includes(propertyId)
            ? favorites.filter(id => id !== propertyId)
            : [...favorites, propertyId];
        
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    };

    // Share property
    const shareProperty = (property) => {
        if (navigator.share) {
            navigator.share({
                title: property.title,
                text: `Check out this ${property.category} on SuiteSpot!`,
                url: window.location.href,
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    // Filter properties by category
    const filterByCategory = (category) => {
        setActiveCategory(category);
        if (category === 'all') {
            setFilteredProperties(properties);
        } else {
            setFilteredProperties(properties.filter(prop => prop.category === category));
        }
    };

    // Apply search filters
    const applyFilters = () => {
        let filtered = properties;

        // Category filter
        if (activeCategory !== 'all') {
            filtered = filtered.filter(prop => prop.category === activeCategory);
        }

        // Price range filter
        filtered = filtered.filter(prop =>
            prop.price >= searchFilters.priceRange[0] &&
            prop.price <= searchFilters.priceRange[1]
        );

        // Rating filter
        if (searchFilters.rating > 0) {
            filtered = filtered.filter(prop => prop.rating >= searchFilters.rating);
        }

        // Property type filter
        if (searchFilters.propertyType !== 'all') {
            filtered = filtered.filter(prop => prop.type === searchFilters.propertyType);
        }

        setFilteredProperties(filtered);
        setShowFilters(false);
    };

    // Reset filters
    const resetFilters = () => {
        setSearchFilters({
            priceRange: [0, 1000],
            amenities: [],
            rating: 0,
            propertyType: 'all'
        });
        setFilteredProperties(properties);
        setShowFilters(false);
    };

    // Get discounted price
    const getDiscountedPrice = (price, discount) => {
        return price * (1 - discount / 100);
    };

    // Categories for filtering
    const categories = [
        { key: 'all', label: 'All', icon: '🏠' },
        { key: 'home', label: 'Homes', icon: '🏠' },
        { key: 'experience', label: 'Experiences', icon: '🎪' },
        { key: 'service', label: 'Services', icon: '🔧' }
    ];

    return (
        <div className="guestdb-container">
            <Navbar />
            
            {/* Hero Section */}
            <div className="guestdb-content">
                <h1>Welcome to SuiteSpot</h1>
                <h2 className="tagline">
                    From Comfort to Experience — All in One Spot.
                </h2>

                {/* Search Bar */}
                <Searchbar />
            </div>

            {/* Main Content */}
            <div className="dashboard-section">
                {/* Category Filter */}
                <section className="category-filter">
                    <div className="filter-tabs">
                        {categories.map(category => (
                            <button
                                key={category.key}
                                className={`filter-tab ${activeCategory === category.key ? 'active' : ''}`}
                                onClick={() => filterByCategory(category.key)}
                            >
                                <span className="category-icon">{category.icon}</span>
                                {category.label}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        className="filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter /> Filters
                    </button>
                </section>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="advanced-filters">
                        <div className="filters-header">
                            <h3>Filters</h3>
                            <button
                                className="close-filters-btn"
                                onClick={() => setShowFilters(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="filter-group">
                            <label>Price Range: ${searchFilters.priceRange[0]} - ${searchFilters.priceRange[1]}</label>
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                value={searchFilters.priceRange[1]}
                                onChange={(e) => setSearchFilters({
                                    ...searchFilters,
                                    priceRange: [searchFilters.priceRange[0], parseInt(e.target.value)]
                                })}
                            />
                        </div>

                        <div className="filter-group">
                            <label>Minimum Rating</label>
                            <select
                                value={searchFilters.rating}
                                onChange={(e) => setSearchFilters({
                                    ...searchFilters,
                                    rating: parseInt(e.target.value)
                                })}
                            >
                                <option value={0}>Any Rating</option>
                                <option value={4}>4.0+</option>
                                <option value={4.5}>4.5+</option>
                                <option value={4.8}>4.8+</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Property Type</label>
                            <select
                                value={searchFilters.propertyType}
                                onChange={(e) => setSearchFilters({
                                    ...searchFilters,
                                    propertyType: e.target.value
                                })}
                            >
                                <option value="all">All Types</option>
                                <option value="entire-place">Entire Place</option>
                                <option value="private-room">Private Room</option>
                                <option value="shared-room">Shared Room</option>
                            </select>
                        </div>

                        <div className="filter-actions">
                            <button className="reset-filters-btn" onClick={resetFilters}>
                                Reset
                            </button>
                            <button className="apply-filters-btn" onClick={applyFilters}>
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Featured Properties */}
                <section className="featured-properties">
                    <h2>Featured Stays</h2>
                    <div className="properties-grid">
                        {filteredProperties
                            .filter(prop => prop.isFeatured)
                            .map(property => (
                                <PropertyCard 
                                    key={property.id}
                                    property={property}
                                    isFavorite={favorites.includes(property.id)}
                                    onToggleFavorite={toggleFavorite}
                                    onShare={shareProperty}
                                />
                            ))
                        }
                    </div>
                </section>

                {/* All Properties */}
                <section className="all-properties">
                    <h2>Explore Stays</h2>
                    <div className="properties-grid">
                        {filteredProperties.map(property => (
                            <PropertyCard 
                                key={property.id}
                                property={property}
                                isFavorite={favorites.includes(property.id)}
                                onToggleFavorite={toggleFavorite}
                                onShare={shareProperty}
                            />
                        ))}
                    </div>
                    
                    {filteredProperties.length === 0 && (
                        <div className="no-properties">
                            <div className="empty-state">
                                <div className="empty-icon">🏠</div>
                                <h3>No properties found</h3>
                                <p>Try adjusting your filters or search criteria</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Recommended Stays */}
                <section className="recommended-stays">
                    <h2><FaHotel className="section-icon" /> Recommended For You</h2>
                    <div className="properties-grid">
                        {properties
                            .filter(prop => prop.rating >= 4.5)
                            .slice(0, 4)
                            .map(property => (
                                <PropertyCard 
                                    key={property.id}
                                    property={property}
                                    isFavorite={favorites.includes(property.id)}
                                    onToggleFavorite={toggleFavorite}
                                    onShare={shareProperty}
                                />
                            ))
                        }
                    </div>
                </section>

                {/* Favorites Section */}
                {favorites.length > 0 && (
                    <section className="favorites-section">
                        <h2>❤️ Your Favorites</h2>
                        <div className="properties-grid">
                            {properties
                                .filter(prop => favorites.includes(prop.id))
                                .map(property => (
                                    <PropertyCard 
                                        key={property.id}
                                        property={property}
                                        isFavorite={true}
                                        onToggleFavorite={toggleFavorite}
                                        onShare={shareProperty}
                                    />
                                ))
                            }
                        </div>
                    </section>
                )}
            </div>
            
            <Footer />
        </div>
    );
}

// Property Card Component
function PropertyCard({ property, isFavorite, onToggleFavorite, onShare }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showShareMenu, setShowShareMenu] = useState(false);

    const discountedPrice = getDiscountedPrice(property.price, property.discount);

    const handleShareClick = () => {
        setShowShareMenu(!showShareMenu);
    };

    const shareOptions = [
        { platform: 'Copy Link', icon: '🔗', action: () => navigator.clipboard.writeText(window.location.href) },
        { platform: 'Facebook', icon: '📘', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank') },
        { platform: 'Twitter', icon: '🐦', action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=Check out this ${property.category} on SuiteSpot!`, '_blank') },
        { platform: 'Instagram', icon: '📷', action: () => alert('Share to Instagram - Copy the link and post in your story!') }
    ];

    return (
        <div className="property-card">
            {/* Image Section */}
            <div className="property-image">
                <img 
                    src={property.images[currentImageIndex]} 
                    alt={property.title}
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                />
                
                {/* Image Overlay */}
                <div className="property-overlay">
                    <button 
                        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                        onClick={() => onToggleFavorite(property.id)}
                    >
                        <FaHeart />
                    </button>
                    
                    <div className="property-badges">
                        {property.discount > 0 && (
                            <span className="discount-badge">-{property.discount}%</span>
                        )}
                        {property.isFeatured && (
                            <span className="featured-badge">Featured</span>
                        )}
                        {property.host.isSuperhost && (
                            <span className="superhost-badge">🌟 Superhost</span>
                        )}
                    </div>
                </div>

                {/* Share Menu */}
                <div className="share-container">
                    <button className="share-btn" onClick={handleShareClick}>
                        <FaShare />
                    </button>
                    
                    {showShareMenu && (
                        <div className="share-menu">
                            {shareOptions.map(option => (
                                <button
                                    key={option.platform}
                                    className="share-option"
                                    onClick={() => {
                                        option.action();
                                        setShowShareMenu(false);
                                    }}
                                >
                                    <span className="share-icon">{option.icon}</span>
                                    {option.platform}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Property Info */}
            <div className="property-info">
                <div className="property-header">
                    <h3 className="property-title">{property.title}</h3>
                    <div className="property-rating">
                        <FaStar className="star-icon" />
                        <span>{property.rating}</span>
                        <span className="review-count">({property.reviews})</span>
                    </div>
                </div>

                <div className="property-location">
                    <FaMapMarkerAlt className="location-icon" />
                    <span>{property.location}</span>
                </div>

                <div className="property-details">
                    {property.category === 'home' && (
                        <>
                            <span>{property.maxGuests} guests</span>
                            <span>•</span>
                            <span>{property.bedrooms} bedrooms</span>
                            <span>•</span>
                            <span>{property.beds} beds</span>
                            <span>•</span>
                            <span>{property.bathrooms} baths</span>
                        </>
                    )}
                    {property.category === 'experience' && (
                        <span>{property.duration} • {property.maxGuests} guests max</span>
                    )}
                    {property.category === 'service' && (
                        <span>{property.duration} session</span>
                    )}
                </div>

                <div className="property-amenities">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="amenity-tag">{amenity}</span>
                    ))}
                    {property.amenities.length > 3 && (
                        <span className="amenity-more">+{property.amenities.length - 3} more</span>
                    )}
                </div>

                <div className="property-price">
                    <div className="price-main">
                        <span className="current-price">${discountedPrice.toFixed(2)}</span>
                        {property.category === 'home' && <span className="price-period">/night</span>}
                        {property.category === 'experience' && <span className="price-period">/person</span>}
                        {property.category === 'service' && <span className="price-period">/session</span>}
                    </div>
                    
                    {property.discount > 0 && (
                        <div className="price-discount">
                            <span className="original-price">${property.price}</span>
                        </div>
                    )}
                </div>

                <button className="book-now-btn">
                    View Details
                </button>
            </div>
        </div>
    );
}

// Helper function
function getDiscountedPrice(price, discount) {
    return price * (1 - discount / 100);
}

export default GuestDashboard;