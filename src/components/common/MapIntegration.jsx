// MapIntegration.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MapIntegration = ({ onLocationSelect, initialLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation.coordinates.lat !== 0 
      ? initialLocation.coordinates 
      : { lat: 14.5995, lng: 120.9842 } // Default to Manila
  );
  const [searchQuery, setSearchQuery] = useState(initialLocation.address || '');
  const [isLoading, setIsLoading] = useState(false);

  // Mock function for geocoding - replace with actual Google Maps API
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Mock coordinates for demonstration
      const mockCoordinates = {
        lat: 14.5995 + (Math.random() - 0.5) * 0.1,
        lng: 120.9842 + (Math.random() - 0.5) * 0.1
      };
      setSelectedLocation(mockCoordinates);
      setIsLoading(false);
    }, 1000);
  };

  const handleMapClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click position to coordinates (mock)
    const newLocation = {
      lat: selectedLocation.lat + (y - rect.height / 2) * 0.001,
      lng: selectedLocation.lng + (x - rect.width / 2) * 0.001
    };
    
    setSelectedLocation(newLocation);
  };

  const handleConfirmLocation = () => {
    onLocationSelect({
      address: searchQuery || 'Selected Location',
      coordinates: selectedLocation
    });
  };

  return (
    <div className="map-integration">
      <div className="map-search">
        <input
          type="text"
          placeholder="Search for an address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="map-container" onClick={handleMapClick}>
        {/* Mock Map Visualization */}
        <div className="mock-map">
          <div className="map-grid">
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i} className="grid-cell"></div>
            ))}
          </div>
          
          {/* Location Marker */}
          <motion.div 
            className="location-marker"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            📍
          </motion.div>

          {/* Coordinates Display */}
          <div className="coordinates-overlay">
            Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
          </div>
        </div>
      </div>

      <div className="map-actions">
        <button className="confirm-location" onClick={handleConfirmLocation}>
          Confirm Location
        </button>
      </div>

      <div className="map-instructions">
        <p>💡 Click on the map to pinpoint your exact location</p>
        <p>🔍 Search for your address to find the general area</p>
      </div>
    </div>
  );
};

export default MapIntegration;