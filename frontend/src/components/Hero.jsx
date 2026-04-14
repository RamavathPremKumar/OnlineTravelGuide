import { useState, useEffect, useRef } from "react";
import { searchLocations, getPlacesAlongRoute } from "../services/locationService";
import "./Hero.css";

const Hero = () => {
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [place, setPlace] = useState("");
  const [placesList, setPlacesList] = useState([]);
  
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [showResultsPage, setShowResultsPage] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  
  const debounceTimer = useRef(null);
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

  // Handle start location input
  const handleStartChange = async (e) => {
    const value = e.target.value;
    setStartPoint(value);
    
    if (value.length < 2) {
      setStartSuggestions([]);
      setShowStartSuggestions(false);
      return;
    }
    
    clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(async () => {
      const results = await searchLocations(value);
      setStartSuggestions(results);
      setShowStartSuggestions(results.length > 0);
    }, 300);
  };

  // Handle end location input
  const handleEndChange = async (e) => {
    const value = e.target.value;
    setEndPoint(value);
    
    if (value.length < 2) {
      setEndSuggestions([]);
      setShowEndSuggestions(false);
      return;
    }
    
    clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(async () => {
      const results = await searchLocations(value);
      setEndSuggestions(results);
      setShowEndSuggestions(results.length > 0);
    }, 300);
  };

  // Select start suggestion
  const selectStartSuggestion = (suggestion) => {
    setStartPoint(suggestion.name);
    setStartCoords({ lat: suggestion.lat, lon: suggestion.lon });
    setStartSuggestions([]);
    setShowStartSuggestions(false);
    
    if (startInputRef.current) {
      startInputRef.current.focus();
    }
  };

  // Select end suggestion
  const selectEndSuggestion = (suggestion) => {
    setEndPoint(suggestion.name);
    setEndCoords({ lat: suggestion.lat, lon: suggestion.lon });
    setEndSuggestions([]);
    setShowEndSuggestions(false);
    
    if (endInputRef.current) {
      endInputRef.current.focus();
    }
  };

  // Handle suggestion mouse down (prevents blur)
  const handleSuggestionMouseDown = (e, suggestion, type) => {
    e.preventDefault();
    if (type === 'start') {
      selectStartSuggestion(suggestion);
    } else {
      selectEndSuggestion(suggestion);
    }
  };

  // Fetch places along route
  useEffect(() => {
    const fetchPlaces = async () => {
      if (startCoords && endCoords) {
        setLoading(true);
        try {
          const places = await getPlacesAlongRoute(startCoords, endCoords);
           console.log("PLACES DATA:", places); // ADD THIS
        console.log("First place has description?", places[0]?.description);
          setPlacesList(places);
        } catch (error) {
          console.error("Error fetching places:", error);
          setPlacesList([]);
        }
        setLoading(false);
      }
    };
    
    fetchPlaces();
  }, [startCoords, endCoords]);

  // Handle place selection from dropdown
  const handlePlaceSelection = (selectedValue) => {
    setPlace(selectedValue);
    setSelectedPlaceId(selectedValue);
    
    if (placesList.length > 0) {
      setShowResultsPage(true);
    }
  };

  // Clear single input
  const clearStartInput = () => {
    setStartPoint("");
    setStartCoords(null);
    setStartSuggestions([]);
    setPlacesList([]);
    setPlace("");
  };

  const clearEndInput = () => {
    setEndPoint("");
    setEndCoords(null);
    setEndSuggestions([]);
    setPlacesList([]);
    setPlace("");
  };

  const clearPlacesDropdown = () => {
    setPlace("");
    setPlacesList([]);
  };

  const handleBackToSearch = () => {
    setShowResultsPage(false);
    setSelectedPlaceId(null);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.autocomplete-container')) {
        setShowStartSuggestions(false);
        setShowEndSuggestions(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ========== RESULTS PAGE COMPONENT ==========
  const ResultsPage = () => {
    const selectedPlace = selectedPlaceId && selectedPlaceId !== "all" 
      ? placesList.find(p => p.id.toString() === selectedPlaceId)
      : null;

    return (
      <div className="results-page">
        {/* Header with Back Button */}
        <div className="results-header">
          <button className="back-button" onClick={handleBackToSearch}>
            ← Back to Search
          </button>
          <h1 className="results-title">
            {selectedPlace 
              ? `🏞️ ${selectedPlace.name}` 
              : `🗺️ All Places Between ${startPoint} and ${endPoint} (${placesList.length})`}
          </h1>
        </div>

        {/* Single Place Details */}
        {selectedPlace && (
          <div className="single-place-details">
            <div className="place-header">
              <h2>{selectedPlace.name}</h2>
              <span className="place-category">{selectedPlace.category}</span>
            </div>

            {selectedPlace.image && (
              <div className="place-image-container">
                <img 
                  src={selectedPlace.image } alt={selectedPlace.name} />
              </div>
            )}
            
            <div className="place-info">
              {selectedPlace.description && (
                <p className="place-description">
                  <strong>📝 Description:</strong> {selectedPlace.description}
                </p>
              )}
              <p><strong>📍 Coordinates:</strong> {selectedPlace.lat}, {selectedPlace.lon}</p>
              {selectedPlace.tags && (
                <div className="place-tags">
                  {Object.entries(selectedPlace.tags).map(([key, value]) => (
                    <span key={key} className="tag">{key}: {value}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Places Grid */}
        {!selectedPlace && (
          <div className="all-places-grid">
            <h2>🏞️ Discover {placesList.length} Amazing Places</h2>
            
            {placesList.length === 0 ? (
              <div className="no-places">
                <p>No places found along this route. Try a different route!</p>
              </div>
            ) : (
              <div className="places-grid">
                {placesList.map(placeItem => (
                  <div key={placeItem.id} className="place-card">
                    <div className="card-image">
                        {placeItem.image ? (
                           <img 
                           src={placeItem.image} 
                           alt={placeItem.name}
                           className="place-image"
                           onError={(e) => {
                            e.target.style.display = 'none';
                             e.target.nextElementSibling.style.display = 'flex';
                          }}
                         />
                        ) : null}
                        <div className="image-placeholder">
                           {placeItem.category.charAt(0)}
                        </div>
                      </div>
                    <div className="card-content">
                      <h3>{placeItem.name}</h3>
                      <span className="card-category">{placeItem.category}</span>
                      
                      {/* SHOW DESCRIPTION */}
                      {placeItem.description && (
                        <p className="card-description">
                          {placeItem.description}
                        </p>
                      )}
                      
                      
                      {placeItem.tags && placeItem.tags.description && (
                        <p className="card-tags">
                          Tags: {Object.keys(placeItem.tags).slice(0, 2).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <section className="hero">
      {!showResultsPage ? (
        // SEARCH PAGE WITH VIDEO
        <>
          <video autoPlay loop muted playsInline className="hero-video">
            <source src="/video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <div className="hero-inputs-row">
            {/* Start Location */}
            <div className="input-group">
              <label>📍 Start Location</label>
              <div className="autocomplete-container">
                <input
                  ref={startInputRef}
                  type="text"
                  placeholder="e.g., Delhi, India"
                  value={startPoint}
                  onChange={handleStartChange}
                  onFocus={() => startPoint.length >= 2 && setShowStartSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
                />
                {startPoint && (
                  <button className="clear-icon" onClick={clearStartInput} title="Clear">
                    ✕
                  </button>
                )}
                {showStartSuggestions && startSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {startSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onMouseDown={(e) => handleSuggestionMouseDown(e, suggestion, 'start')}
                        onTouchStart={(e) => handleSuggestionMouseDown(e, suggestion, 'start')}
                      >
                        <div className="suggestion-name">{suggestion.name}</div>
                        {suggestion.type && (
                          <div className="suggestion-type">
                            {suggestion.type === 'city' ? 'City' : 
                             suggestion.type === 'town' ? 'Town' : 
                             suggestion.type === 'state' ? 'State' : 
                             suggestion.type === 'country' ? 'Country' : 
                             suggestion.type}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* End Location */}
            <div className="input-group">
              <label>🏁 End Location</label>
              <div className="autocomplete-container">
                <input
                  ref={endInputRef}
                  type="text"
                  placeholder="e.g., Mumbai, India"
                  value={endPoint}
                  onChange={handleEndChange}
                  onFocus={() => endPoint.length >= 2 && setShowEndSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowEndSuggestions(false), 200)}
                />
                {endPoint && (
                  <button className="clear-icon" onClick={clearEndInput} title="Clear">
                    ✕
                  </button>
                )}
                {showEndSuggestions && endSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {endSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onMouseDown={(e) => handleSuggestionMouseDown(e, suggestion, 'end')}
                        onTouchStart={(e) => handleSuggestionMouseDown(e, suggestion, 'end')}
                      >
                        <div className="suggestion-name">{suggestion.name}</div>
                        {suggestion.type && (
                          <div className="suggestion-type">
                            {suggestion.type === 'city' ? 'City' : 
                             suggestion.type === 'town' ? 'Town' : 
                             suggestion.type === 'state' ? 'State' : 
                             suggestion.type === 'country' ? 'Country' : 
                             suggestion.type}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Places Dropdown */}
            <div className="input-group">
              <label>🏞️ Places Along Route</label>
              <div className="select-container">
                <select 
                  value={place} 
                  onChange={(e) => handlePlaceSelection(e.target.value)}
                  disabled={!startCoords || !endCoords || loading}
                >
                  <option value="" disabled>
                    {loading ? "Loading places..." : 
                     startCoords && endCoords ? 
                     `Select from ${placesList.length} places` : 
                     "Enter locations first"}
                  </option>
                  
                  {placesList.map(placeItem => (
                    <option key={placeItem.id} value={placeItem.id}>
                      {placeItem.name} ({placeItem.category})
                    </option>
                  ))}
                  
                  {placesList.length > 0 && (
                    <option value="all">🗺️ Show All {placesList.length} Places</option>
                  )}
                </select>
                {place && (
                  <button className="clear-icon" onClick={clearPlacesDropdown} title="Clear">
                    ✕
                  </button>
                )}
              </div>
              
              {startCoords && endCoords && (
                <div className="places-info">
                  {loading ? (
                    <span className="loading-text">🔍 Searching places...</span>
                  ) : (
                    <span className="places-count">
                      📍 Found {placesList.length} places
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // RESULTS PAGE (NO VIDEO)
        <ResultsPage />
      )}
    </section>
  );
};

export default Hero;