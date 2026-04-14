import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ======== ALL HOOKS MUST COME FIRST ========
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(0);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const suggestionsRef = useRef(null);
  const recognitionRef = useRef(null);

  // ======== NOW CHECK IF WE SHOULD HIDE NAVBAR ========
  const hideNavbarRoutes = [
    '/admin/dashboard',
  ];
  
  const shouldHideNavbar = hideNavbarRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );
  
  if (shouldHideNavbar) {
    return null; // Don't render navbar on admin pages
  }
  // ========================================================

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        
        // Focus on input after setting text
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        // Show appropriate error message
        if (event.error === 'not-allowed') {
          alert("Microphone access was denied. Please allow microphone access to use voice search.");
        } else if (event.error === 'audio-capture') {
          alert("No microphone was found. Please connect a microphone to use voice search.");
        } else {
          alert("Voice search failed. Please try again.");
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch search suggestions when typing - GLOBAL
  useEffect(() => {
    const fetchSuggestions = async () => {
      const query = searchQuery.trim();
      
      if (query.length < 2) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const now = Date.now();
      if (now - lastSearchTime < 200) {
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/search/suggestions?q=${encodeURIComponent(query)}`,
          { timeout: 2000 }
        );
        
        if (response.data.success) {
          setSearchSuggestions(response.data.suggestions || []);
          setShowSuggestions(true);
        } else {
          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
        setLastSearchTime(Date.now());
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, lastSearchTime]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}&type=all`);
      setShowSuggestions(false);
    }
  };

  // FIXED: Proper suggestion click handler
  const handleSuggestionClick = (suggestion) => {
    // Set query in input
    setSearchQuery(suggestion.name);
    
    // Hide dropdown IMMEDIATELY (like real websites)
    setShowSuggestions(false);
    setSearchSuggestions([]);
    
    // Navigate after a tiny delay to ensure dropdown closes first
    setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(suggestion.name)}&type=${suggestion.type}`);
    },0);
    
    // Focus back on input
    if (searchInputRef.current) {
      searchInputRef.current.blur();
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 0);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim().length >= 2) {
      // Suggestions will be fetched by useEffect
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length >= 2 && searchSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
    
    if (e.key === 'Enter') {
      handleSearch(e);
      setShowSuggestions(false);
    }
  };

  const startVoiceInput = () => {
    // Check if browser supports speech recognition
    if (!recognitionRef.current) {
      alert("Voice search is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    
    try {
      setIsListening(true);
      recognitionRef.current.start();
      
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        setSearchQuery(""); // Clear input when starting to listen
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setIsListening(false);
      alert("Unable to start voice search. Please check your microphone permissions.");
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/");
  };

  const getInitial = () => {
    if (user && user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  const formatType = (type) => {
    const typeMap = {
      'city': 'City',
      'town': 'Town',
      'village': 'Village',
      'beach': 'Beach',
      'hotel': 'Hotel',
      'restaurant': 'Restaurant',
      'attraction': 'Attraction',
      'museum': 'Museum',
      'park': 'Park',
      'airport': 'Airport',
      'monument': 'Monument',
      'historic': 'Historic Site',
      'natural': 'Natural Site',
      'leisure': 'Leisure',
      'tourism': 'Tourist Spot'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getLocationText = (suggestion) => {
    if (!suggestion.fullName) return '';
    
    const parts = suggestion.fullName.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return '';
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <Link to="/">
            <span className="logo-green">OnlineTravel</span>Guide
          </Link>
        </div>

        <button
          className="hamburger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <div className={`nav-wrapper ${isOpen ? "open" : ""}`}>
          <nav className="nav-links">
            {[
              { name: "Home", path: "/" },
              { name: "Accommodations", path: "/accommodations" },
              { name: "Gallery", path: "/gallery" },
              { name: "Feedback", path: "/feedback" },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={location.pathname === link.path ? "active" : ""}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="search-wrapper" ref={suggestionsRef}>
            <form className="navbar-search" onSubmit={handleSearch}>
              <div className="search-container">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search destinations, hotels, flights..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyDown={handleInputKeyDown}
                  className="search-input"
                  autoComplete="off"
                />
                <div className="search-controls">
                  <button type="submit" className="search-btn" title="Search">
                    <svg className="search-icon" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                    </svg>
                  </button>
                  <button 
                    type="button" 
                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleVoiceInput}
                    title={isListening ? "Stop listening" : "Search by voice"}
                  >
                    {isListening ? (
                      <svg className="voice-icon stop-icon" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
                      </svg>
                    ) : (
                      <svg className="voice-icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {isListening && (
                <div className="voice-status">
                  <div className="pulse-dot"></div>
                  Listening... Speak now
                </div>
              )}
            </form>

            {/* Search Suggestions */}
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="search-suggestions">
                {isLoadingSuggestions ? (
                  <div className="suggestion-loading">
                    <div className="loading-spinner"></div>
                    <span>Searching...</span>
                  </div>
                ) : searchSuggestions.length > 0 ? (
                  <>
                    <div className="suggestions-header">
                      <div className="suggestions-count">
                        {searchSuggestions.length} results
                      </div>
                    </div>
                    {searchSuggestions.slice(0, 8).map((suggestion, index) => (
                      <div
                        key={`${suggestion.id}-${index}`}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="suggestion-text">
                          <div className="suggestion-name">{suggestion.name}</div>
                          <div className="suggestion-details">
                            <span className="suggestion-type">{formatType(suggestion.type)}</span>
                            {getLocationText(suggestion) && (
                              <span className="suggestion-location">
                                • {getLocationText(suggestion)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="no-suggestions">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {user ? (
            <div className="profile-container" ref={dropdownRef}>
              <button 
                className="profile-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="User profile"
              >
                <div className="profile-initial">
                  {getInitial()}
                </div>
              </button>
              
              {showDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-initial">{getInitial()}</div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-username">{user.username}</div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <Link 
                    to="/profile" 
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <i className="fas fa-user"></i>
                    <span>My Profile</span>
                  </Link>
                  
                  <Link 
                    to="/bookings" 
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <i className="fas fa-suitcase"></i>
                    <span>My Bookings</span>
                  </Link>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button 
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="login-btn"
            >
              Login / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;