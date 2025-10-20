import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import '../../styles/mapstyle.css';

// Custom marker icons
const createCustomIcon = (color = '#0ecfb8') => {
  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          color: white;
          font-size: 16px;
          font-weight: bold;
        ">📍</div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const defaultIcon = createCustomIcon('#0ecfb8');
const selectedIcon = createCustomIcon('#ef4444');

L.Marker.prototype.options.icon = defaultIcon;

// Search component with enhanced design
const SearchBox = ({ onLocationFound, currentAddress }) => {
  const [query, setQuery] = useState(currentAddress || '');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (currentAddress) {
      setQuery(currentAddress);
    }
  }, [currentAddress]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const firstResult = data[0];
        const location = {
          lat: parseFloat(firstResult.lat),
          lng: parseFloat(firstResult.lon),
          address: firstResult.display_name,
          city: firstResult.address?.city || firstResult.address?.town || firstResult.address?.village || '',
          province: firstResult.address?.state || firstResult.address?.region || '',
          country: firstResult.address?.country || ''
        };
        
        onLocationFound(location);
        setQuery(firstResult.display_name);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = async (value) => {
    setQuery(value);
    
    if (value.length > 2) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=3&addressdetails=1`
        );
        const data = await response.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Suggestions error:', error);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: suggestion.display_name,
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '',
      province: suggestion.address?.state || suggestion.address?.region || '',
      country: suggestion.address?.country || ''
    };
    
    onLocationFound(location);
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
  };

  return (
    <motion.div 
      className="leaflet-search-box"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="search-header">
        <h3>📍 Find Your Location</h3>
        <p>Search or click on the map to set your exact location</p>
      </div>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search for an address, city, or landmark..."
            className="search-input"
          />
          <button type="submit" disabled={isSearching} className="search-button">
            {isSearching ? (
              <div className="loading-spinner"></div>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div 
            className="suggestions-dropdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="suggestion-icon">📍</div>
                <div className="suggestion-text">
                  <div className="suggestion-main">{suggestion.display_name.split(',')[0]}</div>
                  <div className="suggestion-details">
                    {suggestion.display_name.split(',').slice(1).join(', ')}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Map events component with enhanced interactions
function MapEvents({ onLocationSelect, selectedPosition }) {
  const [position, setPosition] = useState(selectedPosition);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const newPosition = { lat, lng };
      setPosition(newPosition);
      
      // Reverse geocode with better error handling
      setIsReverseGeocoding(true);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
          if (data && data.display_name) {
            const addressParts = data.address;
            onLocationSelect({
              address: data.display_name,
              coordinates: { lat, lng },
              city: addressParts.city || addressParts.town || addressParts.village || '',
              province: addressParts.state || addressParts.region || '',
              country: addressParts.country || ''
            });
          } else {
            onLocationSelect({
              address: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              coordinates: { lat, lng }
            });
          }
        })
        .catch(error => {
          console.error('Geocoding error:', error);
          onLocationSelect({
            address: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            coordinates: { lat, lng }
          });
        })
        .finally(() => {
          setIsReverseGeocoding(false);
        });
    },
  });

  

  // Center map when position changes
  useEffect(() => {
    if (selectedPosition) {
      setPosition(selectedPosition);
      map.setView([selectedPosition.lat, selectedPosition.lng], Math.max(map.getZoom(), 15));
    }
  }, [selectedPosition, map]);

  if (!position) return null;

  return (
    <>
      <Marker 
        position={position} 
        icon={selectedIcon}
      >
        <Popup className="custom-popup">
          <div className="popup-content">
            <div className="popup-header">
              <span className="popup-icon">📍</span>
              <strong>Selected Location</strong>
            </div>
            <div className="popup-coordinates">
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </div>
            {isReverseGeocoding && (
              <div className="popup-loading">
                <div className="loading-spinner-small"></div>
                Finding address...
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

// Location Info Panel
const LocationInfoPanel = ({ location, onConfirm }) => {
  if (!location) return null;

  return (
    <motion.div 
      className="location-info-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="panel-header">
        <h4>📍 Selected Location</h4>
        <div className="status-badge">Ready</div>
      </div>
      
      <div className="location-details">
        <div className="detail-item">
          <span className="detail-label">Address:</span>
          <span className="detail-value">{location.address}</span>
        </div>
        
        {location.city && (
          <div className="detail-item">
            <span className="detail-label">City:</span>
            <span className="detail-value">{location.city}</span>
          </div>
        )}
        
        {location.province && (
          <div className="detail-item">
            <span className="detail-label">Province:</span>
            <span className="detail-value">{location.province}</span>
          </div>
        )}
        
        {location.country && (
          <div className="detail-item">
            <span className="detail-label">Country:</span>
            <span className="detail-value">{location.country}</span>
          </div>
        )}
        
        <div className="detail-item">
          <span className="detail-label">Coordinates:</span>
          <span className="detail-value coordinates">
            {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
          </span>
        </div>
      </div>

      <motion.button 
        className="confirm-location-btn"
        onClick={onConfirm}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="btn-icon">✅</span>
        Confirm This Location
      </motion.button>
    </motion.div>
  );
};

// Main component
const LeafletMapIntegration = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef();
  const [currentLocation, setCurrentLocation] = useState(
    initialLocation.coordinates.lat !== 0 
      ? { lat: initialLocation.coordinates.lat, lng: initialLocation.coordinates.lng }
      : { lat: 14.5995, lng: 120.9842 }
  );
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationFound = (location) => {
    setCurrentLocation({ lat: location.lat, lng: location.lng });
    setSelectedLocation({
      coordinates: { lat: location.lat, lng: location.lng },
      address: location.address,
      city: location.city,
      province: location.province,
      country: location.country
    });
  };

  const handleMapLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  return (
    <motion.div 
      className="leaflet-integration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <SearchBox 
        onLocationFound={handleLocationFound} 
        currentAddress={initialLocation.address}
      />
      
      <div className="map-container-wrapper">
        <motion.div 
          className="map-container"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MapContainer
            center={[currentLocation.lat, currentLocation.lng]}
            zoom={13}
            style={{ height: '400px', width: '100%' }}
            ref={mapRef}
            className="custom-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents 
              onLocationSelect={handleMapLocationSelect} 
              selectedPosition={selectedLocation?.coordinates}
            />
          </MapContainer>
        </motion.div>

        <LocationInfoPanel 
          location={selectedLocation} 
          onConfirm={handleConfirmLocation}
        />
      </div>

      <div className="leaflet-instructions">
        <div className="instruction-item">
          <span className="instruction-icon">📍</span>
          <div className="instruction-text">
            <strong>Click on the map</strong> to set your exact location
          </div>
        </div>
        <div className="instruction-item">
          <span className="instruction-icon">🔍</span>
          <div className="instruction-text">
            <strong>Search for addresses</strong> to find specific locations
          </div>
        </div>
        <div className="instruction-item">
          <span className="instruction-icon">🗺️</span>
          <div className="instruction-text">
            <strong>Drag to navigate</strong> and <strong>scroll to zoom</strong>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LeafletMapIntegration;