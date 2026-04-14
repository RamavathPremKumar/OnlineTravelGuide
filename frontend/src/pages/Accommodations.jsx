import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import "./Accommodations.css";

const AccommodationForm = () => {
  const { user, isAuthenticated } = useAuth();
  
  const [accommodationData, setAccommodationData] = useState({
    userName: "",
    email: "",
    phone: "",
    address: "",
    location: "",
    place: "",
    hotelName: "",
    hotelAddress: "",
    priceRange: "",
    checkin: "",
    checkout: "",
    persons: 1,
    rooms: 1,
    roomType: "",
    
    payment: "",
    
  });

  const [locations, setLocations] = useState([]);
  const [places, setPlaces] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Refs to prevent duplicate calls
  const hasFetchedLocations = useRef(false);
  const fetchTimeout = useRef(null);

  // Fetch locations only once when authenticated
  useEffect(() => {
    const loadLocations = async () => {
      if (!hasFetchedLocations.current && isAuthenticated) {
        console.log('Initial fetch of locations...');
        hasFetchedLocations.current = true;
        await fetchLocations();
      }
    };
    
    loadLocations();
    
    // Cleanup function
    return () => {
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, [isAuthenticated]);

  // Pre-fill user data when authenticated (NO location auto-set)
  useEffect(() => {
    if (user && isAuthenticated) {
      setAccommodationData(prev => ({
        ...prev,
        userName: user.fullname || user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || ""
        // ⚠️ IMPORTANT: Do NOT set location here
      }));
    }
  }, [user, isAuthenticated]);

  // Fetch all locations from API
  const fetchLocations = async () => {
    try {
      console.log('Fetching locations from API...');
      const response = await fetch('http://localhost:5000/api/hotels/locations');
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Setting locations:', data.locations);
        setLocations(data.locations);
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch places when location is selected (with validation)
  const fetchPlaces = async (location) => {
    // ⚠️ VALIDATION: Skip invalid locations
    if (!location || location === "India" || location.includes("Select")) {
      console.log('Skipping places fetch for invalid location:', location);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/hotels/${location}/places`);
      const data = await response.json();
      
      if (data.success) {
        setPlaces(data.places);
        setHotels([]);
        
        // Reset hotel info
        setAccommodationData(prev => ({
          ...prev,
          place: "",
          hotelName: "",
          hotelAddress: "",
        }));
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotels when place is selected
  const fetchHotels = async (location, place) => {
    if (!location || !place) {
      console.log('Cannot fetch hotels: missing location or place');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/hotels/${location}/${place}/hotels`);
      const data = await response.json();
      
      if (data.success && data.hotels.length > 0) {
        setHotels(data.hotels);
        
        // Auto-select first hotel
        const firstHotel = data.hotels[0];
        setAccommodationData(prev => ({
          ...prev,
          hotelName: firstHotel.name,
          hotelAddress: firstHotel.address,
        }));
      } else {
        setHotels([]);
        // Set default values if no hotels
        setAccommodationData(prev => ({
          ...prev,
          hotelName: "To be assigned",
          hotelAddress: "To be assigned",
        }));
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (!isAuthenticated) {
      alert("Please login to fill the form!");
      return;
    }
    
    const { name, value, type, checked } = e.target;
    
    // Log address changes to debug
    if (name === "address") {
      console.log('Address changed to:', value);
    }
    
    
      setAccommodationData({ ...accommodationData, [name]: value });
    
  };

  // Handle location selection WITH DEBOUNCING
  const handleLocationChange = async (e) => {
    if (!isAuthenticated) {
      alert("Please login to select location!");
      return;
    }
    
    const location = e.target.value;
    console.log('Location selected:', location);
    
    // Clear any pending timeout
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }
    
    setAccommodationData(prev => ({
      ...prev,
      location,
      place: "",
      hotelName: "",
      hotelAddress: "",
    }));
    
    // Clear places and hotels if no location selected
    if (!location || location === "--Select a Location--") {
      setPlaces([]);
      setHotels([]);
      return;
    }
    
    // ⚠️ DEBOUNCE: Wait 500ms before fetching places
    fetchTimeout.current = setTimeout(async () => {
      if (location && location !== "India") {
        await fetchPlaces(location);
      }
    }, 500);
  };

  // Handle place selection WITH DEBOUNCING
  const handlePlaceChange = async (e) => {
    if (!isAuthenticated) return;
    
    const place = e.target.value;
    
    // Clear any pending timeout
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }
    
    setAccommodationData(prev => ({
      ...prev,
      place,
      hotelName: "",
      hotelAddress: "",
    }));
    
    if (!place || place === "--Select a Place--") {
      setHotels([]);
      return;
    }
    
    // ⚠️ DEBOUNCE: Wait 500ms before fetching hotels
    fetchTimeout.current = setTimeout(async () => {
      if (place && accommodationData.location) {
        await fetchHotels(accommodationData.location, place);
      }
    }, 500);
  };

  // Handle hotel selection
  const handleHotelChange = (e) => {
    if (!isAuthenticated) return;
    
    const hotelId = e.target.value;
    const selectedHotel = hotels.find(hotel => hotel.id === hotelId);
    
    if (selectedHotel) {
      setAccommodationData(prev => ({
        ...prev,
        hotelName: selectedHotel.name,
        hotelAddress: selectedHotel.address,
        priceRange: selectedHotel.priceCategory || 'Medium',
      }));
    }
  };

  

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!isAuthenticated) {
    showCustomAlert("Please login to submit your booking!", "error");
    return;
  }

  // Validation
  if (!accommodationData.location || !accommodationData.place) {
    showCustomAlert("Please select a location and place!", "warning");
    return;
  }

  try {
    // Show loading
    setLoading(true);
    
    // 1. Send booking to backend
    const token = localStorage.getItem('token');
    const bookingData = {
      ...accommodationData,
      userId: user._id,
      userName: user.fullname || user.username,
    };
    
    const response = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookingData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Booking failed');
    }

    // 2. Show professional success modal
    showSuccessModal(result.bookingId);
    
    // 3. Reset form (but keep user info)
    setAccommodationData({
      userName: user.fullname || user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      location: "",
      place: "",
      hotelName: "",
      hotelAddress: "",
      priceRange: "",
      checkin: "",
      checkout: "",
      persons: 1,
      rooms: 1,
      roomType: "",
      payment: "",
      
    });
    setPlaces([]);
    setHotels([]);

  } catch (error) {
    console.error('Booking error:', error);
    showCustomAlert(`Error: ${error.message}`, "error");
  } finally {
    setLoading(false);
  }
};

// Custom Alert Function
const showCustomAlert = (message, type = "info") => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `custom-alert ${type}`;
  alertDiv.innerHTML = `
    <div class="alert-content">
      <span class="alert-icon">${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span class="alert-message">${message}</span>
      <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentElement) {
      alertDiv.remove();
    }
  }, 5000);
};


const getPriceRangeAmount = (range) => {
              switch(range) {
                case 'Low': return '1000-3000';
                case 'Medium': return '3000-6000';
                case 'High': return '6000-10000';
                default: return ' ';
              }
            };
            


// Success Modal Function
const showSuccessModal = (bookingId) => {
  const modal = document.createElement('div');
  modal.className = 'success-modal-overlay';
  modal.innerHTML = `
    <div class="success-modal">
      <div class="success-icon">✅</div>
      <h2>Booking Successful!</h2>
      <p>Your accommodation has been booked successfully.</p>
      <p class="booking-id">Booking ID: <strong>${bookingId}</strong></p>
      <p>A confirmation email has been sent to your registered email address.</p>
      <div class="modal-actions">
        <button class="modal-btn primary" onclick="this.closest('.success-modal-overlay').remove()">OK</button>
        <button class="modal-btn secondary" onclick="window.print()">Print Receipt</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
};

  return (
    <div className="form-wrapper">
      <form id="accommodationForm" onSubmit={handleSubmit}>
        <h2 id="formTitle">Accommodation Booking</h2>
        
        {/* Login Required Message */}
        {!isAuthenticated ? (
          <div className="login-required-message">
            <div className="message-icon">🔒</div>
            <div className="message-content">
              <h3>Login Required</h3>
              <p>You need to login to book accommodation. Please login or register to continue.</p>
              <div className="message-actions">
                <a href="/login" className="login-action-btn">Login Now</a>
                <a href="/register" className="register-action-btn">Create Account</a>
              </div>
            </div>
          </div>
        ) : (
          <div className="user-welcome-message">
            <div className="welcome-icon">👋</div>
            <div className="welcome-content">
              <h3>Welcome, {user.fullname || user.username}!</h3>
              <p>You can now book accommodation. Your booking will be linked to: {user.email}</p>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {/* Form Fields */}
        <div className={`form-section ${!isAuthenticated ? 'disabled-section' : ''}`}>
          <label className="form-label" htmlFor="userName">User Name:</label>
          <input
            type="text"
            id="userName"
            name="userName"
            placeholder="Enter your User name"
            value={accommodationData.userName}
            onChange={handleChange}
            required
            disabled={!isAuthenticated}
            title={!isAuthenticated ? "Please login to fill this field" : ""}
          />

          <label className="form-label" htmlFor="email">Email Address:</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email address"
            value={accommodationData.email}
            onChange={handleChange}
            required
            pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$" 
            title="Email must be a Gmail address"
            disabled={!isAuthenticated}
          />

          <label className="form-label" htmlFor="phone">Phone Number:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="Enter your phone number"
            value={accommodationData.phone}
            onChange={handleChange}
            required
            disabled={!isAuthenticated}
          />

          <label className="form-label" htmlFor="address">Address:</label>
          <textarea
            id="address"
            name="address"
            placeholder="Enter your address"
            value={accommodationData.address}
            onChange={handleChange}
            required
            disabled={!isAuthenticated}
          />

          <label className="form-label" htmlFor="location">Location to Visit:</label>
          <select
            id="location"
            name="location"
            value={accommodationData.location}
            onChange={handleLocationChange}
            required
            disabled={!isAuthenticated || loading}
          >
            <option value="">--Select a Location--</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location.charAt(0).toUpperCase() + location.slice(1)}
              </option>
            ))}
          </select>

          <label className="form-label" htmlFor="place">Place:</label>
          <select
            id="place"
            name="place"
            value={accommodationData.place}
            onChange={handlePlaceChange}
            required
            disabled={!accommodationData.location || !isAuthenticated || loading}
          >
            <option value="">--Select a Place--</option>
            {places.map((place) => (
              <option key={place.name} value={place.name}>
                {place.name} 
              </option>
            ))}
          </select>

          {/* Hotel Selection (if multiple hotels available) */}
          {hotels.length > 1 && (
            <>
              <label className="form-label" htmlFor="hotel">Select Hotel:</label>
              <select
                id="hotel"
                name="hotel"
                onChange={handleHotelChange}
                disabled={!isAuthenticated || loading}
              >
                <option value="">--Select a Hotel--</option>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name} - {hotel.priceDisplay || hotel.priceRange}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Hotel Information Display */}
          {accommodationData.hotelName && (
            <div className="hotel-agent-info">
              <h4>Selected Hotel Information</h4>
              <p><strong>Hotel Name:</strong> {accommodationData.hotelName}</p>
              <p><strong>Hotel Address:</strong> {accommodationData.hotelAddress}</p>
            </div>
          )}


          

          <label className="form-label" htmlFor="priceRange">Price Range:</label>
          <input
            type="text"
            id="priceRange"
            name="priceRange"
            value={accommodationData.priceRange ? `${accommodationData.priceRange} (₹${getPriceRangeAmount(accommodationData.priceRange)})`
            : "Select a hotel first"
           } 
            readOnly
            className="readonly-field"
            disabled={!isAuthenticated}
            />


            

          <label className="form-label" htmlFor="checkin">Check-in Date:</label>
          <input
            type="date"
            id="checkin"
            name="checkin"
            value={accommodationData.checkin}
            onChange={handleChange}
            required
            disabled={!isAuthenticated}
            min={new Date().toISOString().split('T')[0]}
          />

          <label className="form-label" htmlFor="checkout">Check-out Date:</label>
          <input
            type="date"
            id="checkout"
            name="checkout"
            value={accommodationData.checkout}
            onChange={handleChange}
            required
            disabled={!isAuthenticated}
            min={accommodationData.checkin || new Date().toISOString().split('T')[0]}
          />

          <label className="form-label" htmlFor="persons">Number of Persons:</label>
          <input
            type="number"
            id="persons"
            name="persons"
            min="1"
            max="10"
            value={accommodationData.persons}
            onChange={handleChange}
            required
            disabled={!isAuthenticated}
          />

          <label className="form-label" htmlFor="rooms">Number of Rooms:</label>
          <input
            type="number"
            id="rooms"
            name="rooms"
            min="1"
            max="10"
            value={accommodationData.rooms}
            onChange={handleChange}
            required
            disabled={!isAuthenticated}
          />

          <label className="form-label" htmlFor="roomType">Room Type:</label>
          <select
            id="roomType"
            name="roomType"
            value={accommodationData.roomType}
            onChange={handleChange}
            required
            disabled={!isAuthenticated}
          >
            <option value="">--Select Room Type--</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Suite">Suite</option>
            <option value="Family">Family</option>
          </select>


          <label className="form-label" htmlFor="payment">Payment Details:</label>
          <select
            id="payment"
            name="payment"
            value={accommodationData.payment}
            onChange={handleChange}
            required
            disabled={!isAuthenticated}
          >
            <option value="">--Select Payment Method--</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="PayPal">PayPal</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>

          

          
        </div>

        <button 
          type="submit" 
          id="submitBtn"
          disabled={!isAuthenticated || loading}
          className={!isAuthenticated ? "disabled-btn" : ""}
          title={!isAuthenticated ? "Please login to submit" : "Submit your booking"}
        >
          {loading ? 'Processing...' : (isAuthenticated ? 'Submit Booking' : 'Login to Book')}
        </button>
        
        {!isAuthenticated && (
          <div className="login-reminder">
            <p>Don't have an account? <a href="/register">Register here</a></p>
          </div>
        )}
      </form>
    </div>
  );
};

export default AccommodationForm;