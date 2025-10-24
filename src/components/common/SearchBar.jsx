import React from 'react';
import '../../styles/searchbar.css';
import { FaMapMarkerAlt, FaCalendarAlt, FaUser, FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Map Events Component for handling clicks
function MapEventsComponent({ onLocationSelect }) {
    const [selectedPosition, setSelectedPosition] = React.useState(null);

    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setSelectedPosition([lat, lng]);

            // Reverse geocode to get address
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
                });
        },
    });

    return selectedPosition ? (
        <Marker position={selectedPosition}>
            <Popup>
                <div>
                    <strong>Selected Location</strong><br />
                    {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                </div>
            </Popup>
        </Marker>
    ) : null;
}

function SearchBar() {
    const [isDateOpen, setDateOpen] = React.useState(false);
    const [selectedDates, setSelectedDates] = React.useState(null);
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    const [selectingStartDate, setSelectingStartDate] = React.useState(true);
    const [location, setLocation] = React.useState('');

    // for guest input dropdown
    const [isGuestOpen, setIsGuestOpen] = React.useState(false);
    const [adults, setAdultCount] = React.useState(1);
    const [children, setChildCount] = React.useState(0);
    const [pets, setPets] = React.useState(false);

    // Location suggestions
    const [isLocationOpen, setIsLocationOpen] = React.useState(false);
    const [showMap, setShowMap] = React.useState(false);
    const [locationSuggestions, setLocationSuggestions] = React.useState([
        { text: 'New York, NY', subtext: 'United States', icon: 'FaMapMarkerAlt' },
        { text: 'Los Angeles, CA', subtext: 'United States', icon: 'FaMapMarkerAlt' },
        { text: 'London', subtext: 'United Kingdom', icon: 'FaMapMarkerAlt' },
        { text: 'Paris', subtext: 'France', icon: 'FaMapMarkerAlt' },
        { text: 'Tokyo', subtext: 'Japan', icon: 'FaMapMarkerAlt' },
    ]);

    const toggleDatePicker = () => {
        setDateOpen(!isDateOpen);
        if (!isDateOpen) setIsGuestOpen(false);
    };

    const toggleGuestOptions = () => {
        setIsGuestOpen(!isGuestOpen);
        if (!isGuestOpen) setDateOpen(false);
    };

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.search-input') && !e.target.closest('.guests-box') && !e.target.closest('.calendar-popup') && !e.target.closest('.location-suggestions')) {
                setDateOpen(false);
                setIsGuestOpen(false);
                setIsLocationOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const totalGuests = adults + children;

    // Calendar functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return { firstDay, daysInMonth };
    };

    const handleDateClick = (day, monthOffset) => {
        const clickedDate = new Date(
            currentMonth.getFullYear(), 
            currentMonth.getMonth() + monthOffset, 
            day
        );
        
        if (selectingStartDate || !selectedDates) {
            setSelectedDates({ startDate: clickedDate, endDate: null });
            setSelectingStartDate(false);
        } else {
            if (clickedDate > selectedDates.startDate) {
                setSelectedDates({ ...selectedDates, endDate: clickedDate });
                setDateOpen(false);
                setSelectingStartDate(true);
            } else {
                setSelectedDates({ startDate: clickedDate, endDate: null });
            }
        }
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const renderCalendar = (monthOffset = 0) => {
        const displayMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset);
        const { firstDay, daysInMonth } = getDaysInMonth(displayMonth);
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Empty slots before the first day
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
            const isPast = date < today;
            const isStart = selectedDates?.startDate && date.toDateString() === selectedDates.startDate.toDateString();
            const isEnd = selectedDates?.endDate && date.toDateString() === selectedDates.endDate.toDateString();
            const isInRange = selectedDates?.startDate && selectedDates?.endDate && 
                date > selectedDates.startDate && date < selectedDates.endDate;

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isPast ? 'disabled' : ''} ${isStart ? 'start-date' : ''} ${isEnd ? 'end-date' : ''} ${isInRange ? 'in-range' : ''}`}
                    onClick={() => !isPast && handleDateClick(day, monthOffset)}
                >
                    {day}
                </div>
            );
        }

        return days;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Searching...', { 
            location, 
            dates: selectedDates, 
            guests: { adults, children, pets } 
        });
        // In real app, this would trigger property filtering
        alert(`Searching for stays in ${location || 'any location'} for ${totalGuests} guests`);
    };

    const clearSearch = () => {
        setLocation('');
        setSelectedDates(null);
        setAdultCount(1);
        setChildCount(0);
        setPets(false);
    };

    return (
        <div className="search-container">
            <form className="search-form" onSubmit={handleSearch}>
                
                {/* Location */}
                <div className="search-input location">
                    <div className="input-wrapper">
                        <FaMapMarkerAlt className="search-icon" />
                        <input
                            type="text"
                            placeholder="Where to?"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onFocus={() => {
                                setIsLocationOpen(true);
                                setDateOpen(false);
                                setIsGuestOpen(false);
                            }}
                        />
                    </div>
                </div>

                {/* Dates */}
                <div className="search-input date" onClick={() => {
                    toggleDatePicker();
                    setIsLocationOpen(false);
                }}>
                    <div className="input-wrapper">
                        <FaCalendarAlt className="search-icon" />
                        <input type="text" readOnly placeholder="Any dates"
                            value={selectedDates?.startDate && selectedDates?.endDate ?
                                `${selectedDates.startDate.toLocaleDateString()} → ${selectedDates.endDate.toLocaleDateString()}` : ""} />
                    </div>
                </div>

                {/* Guests */}
                <div className="search-input guest" onClick={() => {
                    toggleGuestOptions();
                    setIsLocationOpen(false);
                }}>
                    <div className="input-wrapper">
                        <FaUser className="search-icon" />
                        <input type="text" placeholder="Add guests" readOnly value={totalGuests === 0 ? "" :
                            `${totalGuests} traveler${totalGuests > 1 ? "s" : ""}`} />
                    </div>
                </div>

                {/* Search Button */}
                <button type="submit" className="search-btn">
                    <FaSearch className="search-btn-icon" />
                    Search
                </button>
            </form>

            {/* Calendar Popup */}
            {isDateOpen && (
                <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
                    <div className="calendar-header">
                        <button type="button" className="calendar-nav-btn" onClick={prevMonth}>
                            <FaChevronLeft size={24} />
                        </button>
                        <div className="calendar-months">
                            <div className="month-display">
                                <h3>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                                <div className="calendar-grid">
                                    <div className="calendar-weekdays">
                                        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                                    </div>
                                    <div className="calendar-days">
                                        {renderCalendar(0)}
                                    </div>
                                </div>
                            </div>
                            <div className="month-display">
                                <h3>{new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                                <div className="calendar-grid">
                                    <div className="calendar-weekdays">
                                        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                                    </div>
                                    <div className="calendar-days">
                                        {renderCalendar(1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" className="calendar-nav-btn" onClick={nextMonth}>
                            <FaChevronRight size={24} />
                        </button>
                    </div>
                    <div className="calendar-actions">
                        <button type="button" className="clear-dates" onClick={() => setSelectedDates(null)}>
                            Clear Dates
                        </button>
                    </div>
                </div>
            )}

            {/* Location Suggestions */}
            {isLocationOpen && (
                <div className="location-suggestions">
                    <div className="location-suggestion map-option" onClick={() => setShowMap(true)}>
                        <FaMapMarkerAlt className="location-suggestion-icon" />
                        <div>
                            <div className="location-suggestion-text">Choose on map</div>
                            <div className="location-suggestion-subtext">Search by moving the map</div>
                        </div>
                    </div>
                    {locationSuggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="location-suggestion"
                            onClick={() => {
                                setLocation(suggestion.text);
                                setIsLocationOpen(false);
                            }}
                        >
                            <FaMapMarkerAlt className="location-suggestion-icon" />
                            <div>
                                <div className="location-suggestion-text">{suggestion.text}</div>
                                <div className="location-suggestion-subtext">{suggestion.subtext}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Map Modal */}
            {showMap && (
                <div className="map-modal" onClick={() => setShowMap(false)}>
                    <div className="map-content" onClick={(e) => e.stopPropagation()}>
                        <div className="map-header">
                            <h3>Choose location</h3>
                            <button onClick={() => setShowMap(false)}>×</button>
                        </div>
                        <div className="map-container">
                            <MapContainer
                                center={[14.5995, 120.9842]}
                                zoom={10}
                                style={{ height: '400px', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapEventsComponent
                                    onLocationSelect={(locationData) => {
                                        setLocation(locationData.address || locationData.city || 'Selected Location');
                                        setShowMap(false);
                                        setIsLocationOpen(false);
                                    }}
                                />
                            </MapContainer>
                        </div>
                        <div className="map-actions">
                            <button onClick={() => setShowMap(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guest dropdown box */}
            {isGuestOpen && (
                <div className="guests-box">
                    <div className="guest-row">
                        <div className="guest-info">
                            <span className="guest-label">Adults</span>
                        </div>
                        <div className="counter">
                            <button type="button" onClick={() => setAdultCount(Math.max(1, adults - 1))}>-</button>
                            <span>{adults}</span>
                            <button onClick={() => setAdultCount(adults + 1)}>+</button>
                        </div>
                    </div>

                    <div className="guest-row">
                        <div className="guest-info">
                            <span className="guest-label">Children</span>
                        </div>
                        <div className="counter">
                            <button onClick={() => setChildCount(Math.max(0, children - 1))}>-</button>
                            <span>{children}</span>
                            <button onClick={() => setChildCount(children + 1)}>+</button>
                        </div>
                    </div>

                    <div className="guest-pets">
                        <label>
                            <input type="checkbox" checked={pets} onChange={(e) => setPets(e.target.checked)}/>
                            I am traveling with pets
                        </label>
                    </div>

                    <div className="guest-actions">
                        <button type="button" className="clear-guests" onClick={() => {
                            setAdultCount(1);
                            setChildCount(0);
                            setPets(false);
                        }}>
                            Clear
                        </button>
                        <button type="button" className="guest-done" onClick={() => setIsGuestOpen(false)}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchBar;