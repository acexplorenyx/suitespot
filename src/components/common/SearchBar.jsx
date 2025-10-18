import React from 'react';
import '../../styles/searchbar.css';
import { FaMapMarkerAlt, FaCalendarAlt, FaUser, FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";

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
            if (!e.target.closest('.search-input') && !e.target.closest('.guests-box') && !e.target.closest('.calendar-popup')) {
                setDateOpen(false);
                setIsGuestOpen(false);
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
                    <FaMapMarkerAlt className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Where to?" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>

                {/* Dates */}
                <div className="search-input date" onClick={() => toggleDatePicker()}>
                    <FaCalendarAlt className="search-icon" />
                    <input type="text" readOnly placeholder="Dates"
                        value={selectedDates?.startDate && selectedDates?.endDate ? 
                            `${selectedDates.startDate.toLocaleDateString()} → ${selectedDates.endDate.toLocaleDateString()}` : "Any dates"} />
                </div>

                {/* Guests */}
                <div className="search-input guest" onClick={toggleGuestOptions}>
                    <FaUser className="search-icon" />
                    <input type="text" placeholder="Add Guests" readOnly value={totalGuests === 0 ? "Any guests" : 
                        `${totalGuests} traveler${totalGuests > 1 ? "s" : ""}`} />
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

            {/* Guest dropdown box */}
            {isGuestOpen && (
                <div className="guests-box">
                    <div className="guest-row">
                        <div className="guest-info">
                            <span className="guest-label">Adults</span>
                            <span className="guest-age">Ages 13+</span>
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
                            <span className="guest-age">Ages 2-12</span>
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