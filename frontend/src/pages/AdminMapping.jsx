import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdminMapping.css";

const AdminMapping = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mapping"); // mapping, rules, bulk
  
  // Data states
  const [hotels, setHotels] = useState([]);
  const [places, setPlaces] = useState([]);
  const [locations, setLocations] = useState([]);
  const [existingMappings, setExistingMappings] = useState([]);
  
  // Mapping state
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Rules state
  const [fallbackRules, setFallbackRules] = useState({
    enableCityFallback: true,
    maxDistance: 10, // km
    priorityOrder: ["mapped", "city", "featured", "rating"],
    showUnmappedWarning: true
  });
  
  // Bulk mapping state
  const [bulkMode, setBulkMode] = useState("hotel_to_city"); // hotel_to_city, city_to_hotels
  const [selectedBulkHotel, setSelectedBulkHotel] = useState("");
  const [selectedBulkCity, setSelectedBulkCity] = useState("");
  const [selectedBulkHotels, setSelectedBulkHotels] = useState([]);
  const [bulkDistance, setBulkDistance] = useState(5); // km

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Check authentication and load data
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const storedAdminData = localStorage.getItem("adminData");
    
    if (!token || !storedAdminData) {
      navigate("/admin");
      return;
    }

    // Check URL parameters for quick mapping
    const params = new URLSearchParams(location.search);
    const hotelId = params.get('hotel');
    const placeId = params.get('place');
    
    if (hotelId) {
      setSelectedHotel(hotelId);
    }
    if (placeId) {
      setSelectedPlaces([placeId]);
    }

    loadAllData();
  }, [navigate, location]);

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      
      // Load all data in parallel
      const [hotelsRes, placesRes, locationsRes, mappingsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/hotels`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/places`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/locations`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/mappings`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (hotelsRes.ok) {
        const data = await hotelsRes.json();
        setHotels(data.data?.hotels || []);
      }

      if (placesRes.ok) {
        const data = await placesRes.json();
        setPlaces(data.data?.places || []);
        setFilteredPlaces(data.data?.places || []);
      }

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setLocations(data.data?.locations || []);
      }

      if (mappingsRes.ok) {
        const data = await mappingsRes.json();
        setExistingMappings(data.data?.mappings || []);
      }

    } catch (error) {
      console.error("Error loading mapping data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter places based on search and location
  useEffect(() => {
    let result = [...places];

    // Search filter
    if (searchTerm) {
      result = result.filter(place =>
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (selectedLocation) {
      result = result.filter(place => 
        place.locationId === selectedLocation || place.city === selectedLocation
      );
    }

    setFilteredPlaces(result);
  }, [places, searchTerm, selectedLocation]);

  // Get hotel details
  const getHotelById = (hotelId) => {
    return hotels.find(h => h._id === hotelId);
  };

  // Get place details
  const getPlaceById = (placeId) => {
    return places.find(p => p._id === placeId);
  };

  // Get mapped places for a hotel
  const getMappedPlacesForHotel = (hotelId) => {
    return existingMappings
      .filter(mapping => mapping.hotelId === hotelId)
      .map(mapping => mapping.placeId);
  };

  // Get mapped hotels for a place
  const getMappedHotelsForPlace = (placeId) => {
    return existingMappings
      .filter(mapping => mapping.placeId === placeId)
      .map(mapping => mapping.hotelId);
  };

  // Handle place selection
  const handlePlaceSelect = (placeId) => {
    setSelectedPlaces(prev => {
      if (prev.includes(placeId)) {
        return prev.filter(id => id !== placeId);
      } else {
        return [...prev, placeId];
      }
    });
  };

  // Save mapping
  const saveMapping = async () => {
    if (!selectedHotel || selectedPlaces.length === 0) {
      alert("Please select a hotel and at least one place");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/mappings`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hotelId: selectedHotel,
          placeIds: selectedPlaces
        })
      });

      if (response.ok) {
        alert("Mapping saved successfully!");
        // Reload mappings
        const mappingsRes = await fetch(`${API_URL}/api/admin/mappings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (mappingsRes.ok) {
          const data = await mappingsRes.json();
          setExistingMappings(data.data?.mappings || []);
        }
        
        // Reset selection
        setSelectedPlaces([]);
      } else {
        alert("Error saving mapping");
      }
    } catch (error) {
      console.error("Error saving mapping:", error);
      alert("Failed to save mapping");
    }
  };

  // Remove mapping
  const removeMapping = async (hotelId, placeId) => {
    if (!window.confirm("Remove this mapping?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/mappings/${hotelId}/${placeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        // Update local state
        setExistingMappings(prev => 
          prev.filter(m => !(m.hotelId === hotelId && m.placeId === placeId))
        );
        alert("Mapping removed!");
      }
    } catch (error) {
      console.error("Error removing mapping:", error);
      alert("Failed to remove mapping");
    }
  };

  // Save fallback rules
  const saveFallbackRules = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/mappings/rules`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(fallbackRules)
      });

      if (response.ok) {
        alert("Fallback rules saved successfully!");
      }
    } catch (error) {
      console.error("Error saving rules:", error);
      alert("Failed to save rules");
    }
  };

  // Bulk map hotels to city
  const bulkMapHotelsToCity = async () => {
    if (!selectedBulkCity) {
      alert("Please select a city");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/mappings/bulk/city`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          city: selectedBulkCity,
          hotelIds: selectedBulkHotels,
          distance: bulkDistance
        })
      });

      if (response.ok) {
        alert("Bulk mapping completed!");
        // Reload data
        loadAllData();
        // Reset selection
        setSelectedBulkHotels([]);
      }
    } catch (error) {
      console.error("Error bulk mapping:", error);
      alert("Failed to bulk map");
    }
  };

  // Bulk map hotel to all places in city
  const bulkMapHotelToCityPlaces = async () => {
    if (!selectedBulkHotel || !selectedBulkCity) {
      alert("Please select a hotel and a city");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/mappings/bulk/hotel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hotelId: selectedBulkHotel,
          city: selectedBulkCity,
          distance: bulkDistance
        })
      });

      if (response.ok) {
        alert("Hotel mapped to all places in city!");
        loadAllData();
      }
    } catch (error) {
      console.error("Error bulk mapping:", error);
      alert("Failed to bulk map");
    }
  };

  // Calculate mapping statistics
  const getStats = () => {
    const totalHotels = hotels.length;
    const totalPlaces = places.length;
    const mappedHotels = [...new Set(existingMappings.map(m => m.hotelId))].length;
    const mappedPlaces = [...new Set(existingMappings.map(m => m.placeId))].length;
    const totalMappings = existingMappings.length;

    return {
      totalHotels,
      totalPlaces,
      mappedHotels,
      mappedPlaces,
      totalMappings,
      hotelCoverage: totalHotels > 0 ? ((mappedHotels / totalHotels) * 100).toFixed(1) : 0,
      placeCoverage: totalPlaces > 0 ? ((mappedPlaces / totalPlaces) * 100).toFixed(1) : 0
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="admin-mapping-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading Mapping Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-mapping-wrapper">
      {/* Header */}
      <div className="admin-mapping-header">
        <div className="header-left">
          <h1><i className="fas fa-link"></i> Hotel-Place Mapping</h1>
          <p>Link hotels to tourist places and configure search fallback rules</p>
        </div>
        <div className="header-right">
          <div className="mapping-stats">
            <div className="stat">
              <span className="stat-value">{stats.mappedHotels}/{stats.totalHotels}</span>
              <span className="stat-label">Hotels Mapped</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.mappedPlaces}/{stats.totalPlaces}</span>
              <span className="stat-label">Places Mapped</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.totalMappings}</span>
              <span className="stat-label">Total Links</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mapping-tabs">
        <button 
          className={`tab-btn ${activeTab === 'mapping' ? 'active' : ''}`}
          onClick={() => setActiveTab('mapping')}
        >
          <i className="fas fa-link"></i> Manual Mapping
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <i className="fas fa-cog"></i> Fallback Rules
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          <i className="fas fa-layer-group"></i> Bulk Operations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <i className="fas fa-chart-bar"></i> Mapping Reports
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* MANUAL MAPPING TAB */}
        {activeTab === 'mapping' && (
          <div className="mapping-tab-content">
            <div className="mapping-container">
              {/* Left Panel - Hotel Selection */}
              <div className="mapping-panel hotel-panel">
                <h3><i className="fas fa-hotel"></i> Select Hotel</h3>
                <div className="panel-content">
                  <select 
                    className="hotel-select"
                    value={selectedHotel}
                    onChange={(e) => setSelectedHotel(e.target.value)}
                  >
                    <option value="">Choose a hotel...</option>
                    {hotels.map(hotel => (
                      <option key={hotel._id} value={hotel._id}>
                        {hotel.name} - {hotel.city} ({getMappedPlacesForHotel(hotel._id).length} mapped)
                      </option>
                    ))}
                  </select>

                  {selectedHotel && (
                    <div className="selected-hotel-details">
                      <div className="hotel-card">
                        <div className="hotel-header">
                          <h4>{getHotelById(selectedHotel)?.name}</h4>
                          <span className="hotel-city">{getHotelById(selectedHotel)?.city}</span>
                        </div>
                        <div className="hotel-info">
                          <div className="info-row">
                            <span className="label">Rating:</span>
                            <span className="value">
                              {getHotelById(selectedHotel)?.starRating || 'N/A'} stars
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="label">Price:</span>
                            <span className="value">
                              {getHotelById(selectedHotel)?.priceRange?.min ? 
                                `$${getHotelById(selectedHotel)?.priceRange?.min}` : 'N/A'}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="label">Currently Mapped to:</span>
                            <span className="value mapped-count">
                              {getMappedPlacesForHotel(selectedHotel).length} places
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Panel - Place Selection */}
              <div className="mapping-panel places-panel">
                <h3><i className="fas fa-map-marker-alt"></i> Select Tourist Places</h3>
                <div className="panel-content">
                  {/* Filters */}
                  <div className="place-filters">
                    <div className="search-box">
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        placeholder="Search places..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select 
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <option value="">All Locations</option>
                      {locations.map(loc => (
                        <option key={loc._id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Places List */}
                  <div className="places-list">
                    {filteredPlaces.length === 0 ? (
                      <div className="no-places">No places found</div>
                    ) : (
                      filteredPlaces.map(place => {
                        const isSelected = selectedPlaces.includes(place._id);
                        const isMapped = getMappedHotelsForPlace(place._id).includes(selectedHotel);
                        
                        return (
                          <div 
                            key={place._id} 
                            className={`place-item ${isSelected ? 'selected' : ''} ${isMapped ? 'mapped' : ''}`}
                            onClick={() => handlePlaceSelect(place._id)}
                          >
                            <div className="place-checkbox">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                readOnly
                              />
                            </div>
                            <div className="place-details">
                              <div className="place-name">{place.name}</div>
                              <div className="place-location">
                                <i className="fas fa-map-pin"></i> {place.city}
                              </div>
                              <div className="place-type">
                                <span className="type-badge">{place.category}</span>
                                <span className="mapped-hotels">
                                  {getMappedHotelsForPlace(place._id).length} hotels mapped
                                </span>
                              </div>
                            </div>
                            {isMapped && (
                              <div className="already-mapped">
                                <i className="fas fa-check-circle"></i> Already mapped
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selected Count */}
                  <div className="selected-count">
                    <span>{selectedPlaces.length} places selected</span>
                    <button 
                      className="clear-selection"
                      onClick={() => setSelectedPlaces([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel - Actions & Preview */}
              <div className="mapping-panel actions-panel">
                <h3><i className="fas fa-play-circle"></i> Actions</h3>
                <div className="panel-content">
                  <div className="action-buttons">
                    <button 
                      className="btn-save-mapping"
                      onClick={saveMapping}
                      disabled={!selectedHotel || selectedPlaces.length === 0}
                    >
                      <i className="fas fa-save"></i> Save Mapping
                    </button>
                    
                    <button 
                      className="btn-view-existing"
                      onClick={() => {
                        if (selectedHotel) {
                          navigate(`/admin/mappings/view/${selectedHotel}`);
                        }
                      }}
                      disabled={!selectedHotel}
                    >
                      <i className="fas fa-eye"></i> View Existing Mappings
                    </button>
                    
                    <button 
                      className="btn-bulk-suggest"
                      onClick={() => setActiveTab('bulk')}
                    >
                      <i className="fas fa-magic"></i> Auto-Suggest Mappings
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="mapping-preview">
                    <h4>Preview:</h4>
                    {selectedHotel && selectedPlaces.length > 0 ? (
                      <div className="preview-content">
                        <p>
                          <strong>{getHotelById(selectedHotel)?.name}</strong> will be linked to:
                        </p>
                        <ul>
                          {selectedPlaces.slice(0, 5).map(placeId => {
                            const place = getPlaceById(placeId);
                            return place ? (
                              <li key={placeId}>
                                <i className="fas fa-map-marker-alt"></i> {place.name} ({place.city})
                              </li>
                            ) : null;
                          })}
                          {selectedPlaces.length > 5 && (
                            <li>...and {selectedPlaces.length - 5} more places</li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p className="no-preview">Select a hotel and places to see preview</p>
                    )}
                  </div>

                  {/* Quick Tips */}
                  <div className="quick-tips">
                    <h4><i className="fas fa-lightbulb"></i> Tips:</h4>
                    <ul>
                      <li>Map hotels to nearby tourist attractions</li>
                      <li>If no hotels mapped to a place, city hotels will show</li>
                      <li>Featured hotels appear first in search results</li>
                      <li>Use bulk operations for city-wide mapping</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FALLBACK RULES TAB */}
        {activeTab === 'rules' && (
          <div className="rules-tab-content">
            <div className="rules-container">
              <div className="rules-header">
                <h3><i className="fas fa-sitemap"></i> Search Fallback Rules</h3>
                <p>Configure how hotels are displayed when no direct mapping exists</p>
              </div>

              <div className="rules-form">
                {/* Rule 1: City Fallback */}
                <div className="rule-card">
                  <div className="rule-header">
                    <h4>City-Level Fallback</h4>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={fallbackRules.enableCityFallback}
                        onChange={(e) => setFallbackRules(prev => ({
                          ...prev,
                          enableCityFallback: e.target.checked
                        }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <p className="rule-description">
                    When no hotels are mapped to a specific tourist place, show hotels from the same city.
                    This ensures users always see accommodation options.
                  </p>
                  <div className="rule-example">
                    <strong>Example:</strong> If no hotels mapped to "Eiffel Tower", show hotels in "Paris".
                  </div>
                </div>

                {/* Rule 2: Distance Radius */}
                <div className="rule-card">
                  <div className="rule-header">
                    <h4>Maximum Distance Radius</h4>
                    <div className="distance-control">
                      <span className="distance-value">{fallbackRules.maxDistance} km</span>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={fallbackRules.maxDistance}
                        onChange={(e) => setFallbackRules(prev => ({
                          ...prev,
                          maxDistance: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                  </div>
                  <p className="rule-description">
                    Maximum distance between hotel and place for automatic mapping suggestions.
                  </p>
                  <div className="distance-labels">
                    <span>Nearby (1km)</span>
                    <span>City-wide (50km)</span>
                  </div>
                </div>

                {/* Rule 3: Priority Order */}
                <div className="rule-card">
                  <h4>Search Result Priority</h4>
                  <p className="rule-description">
                    Order in which hotels appear in search results:
                  </p>
                  <div className="priority-list">
                    {fallbackRules.priorityOrder.map((item, index) => (
                      <div key={item} className="priority-item">
                        <div className="priority-rank">#{index + 1}</div>
                        <div className="priority-label">
                          {item === 'mapped' && 'Directly Mapped Hotels'}
                          {item === 'city' && 'Same City Hotels (Fallback)'}
                          {item === 'featured' && 'Featured Hotels'}
                          {item === 'rating' && 'Highly Rated Hotels'}
                        </div>
                        <div className="priority-actions">
                          {index > 0 && (
                            <button
                              onClick={() => {
                                const newOrder = [...fallbackRules.priorityOrder];
                                [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                                setFallbackRules(prev => ({ ...prev, priorityOrder: newOrder }));
                              }}
                            >
                              <i className="fas fa-arrow-up"></i>
                            </button>
                          )}
                          {index < fallbackRules.priorityOrder.length - 1 && (
                            <button
                              onClick={() => {
                                const newOrder = [...fallbackRules.priorityOrder];
                                [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                                setFallbackRules(prev => ({ ...prev, priorityOrder: newOrder }));
                              }}
                            >
                              <i className="fas fa-arrow-down"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rule 4: Warnings */}
                <div className="rule-card">
                  <div className="rule-header">
                    <h4>User Interface Warnings</h4>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={fallbackRules.showUnmappedWarning}
                        onChange={(e) => setFallbackRules(prev => ({
                          ...prev,
                          showUnmappedWarning: e.target.checked
                        }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <p className="rule-description">
                    Show warning to users when they're seeing city-level fallback results instead of
                    directly mapped hotels.
                  </p>
                  <div className="warning-preview">
                    <div className="warning-message">
                      <i className="fas fa-info-circle"></i>
                      <span>Showing hotels in [City] as no hotels are specifically mapped to this attraction.</span>
                    </div>
                  </div>
                </div>

                {/* Save Rules Button */}
                <div className="rules-actions">
                  <button 
                    className="btn-save-rules"
                    onClick={saveFallbackRules}
                  >
                    <i className="fas fa-save"></i> Save Fallback Rules
                  </button>
                  <button 
                    className="btn-reset-rules"
                    onClick={() => setFallbackRules({
                      enableCityFallback: true,
                      maxDistance: 10,
                      priorityOrder: ["mapped", "city", "featured", "rating"],
                      showUnmappedWarning: true
                    })}
                  >
                    <i className="fas fa-undo"></i> Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BULK OPERATIONS TAB */}
        {activeTab === 'bulk' && (
          <div className="bulk-tab-content">
            <div className="bulk-container">
              <div className="bulk-header">
                <h3><i className="fas fa-layer-group"></i> Bulk Mapping Operations</h3>
                <p>Automatically map multiple hotels to places based on location</p>
              </div>

              <div className="bulk-options">
                <div className="bulk-mode-selector">
                  <button 
                    className={`mode-btn ${bulkMode === 'hotel_to_city' ? 'active' : ''}`}
                    onClick={() => setBulkMode('hotel_to_city')}
                  >
                    <i className="fas fa-hotel"></i>
                    <span>Map Hotel to All Places in City</span>
                  </button>
                  <button 
                    className={`mode-btn ${bulkMode === 'city_to_hotels' ? 'active' : ''}`}
                    onClick={() => setBulkMode('city_to_hotels')}
                  >
                    <i className="fas fa-city"></i>
                    <span>Map Multiple Hotels to City Places</span>
                  </button>
                </div>

                {/* Mode 1: One Hotel to All City Places */}
                {bulkMode === 'hotel_to_city' && (
                  <div className="bulk-form">
                    <div className="form-group">
                      <label>Select Hotel</label>
                      <select 
                        value={selectedBulkHotel}
                        onChange={(e) => setSelectedBulkHotel(e.target.value)}
                      >
                        <option value="">Choose hotel...</option>
                        {hotels.map(hotel => (
                          <option key={hotel._id} value={hotel._id}>
                            {hotel.name} - {hotel.city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Select City</label>
                      <select 
                        value={selectedBulkCity}
                        onChange={(e) => setSelectedBulkCity(e.target.value)}
                      >
                        <option value="">Choose city...</option>
                        {locations.map(loc => (
                          <option key={loc._id} value={loc.name}>{loc.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Maximum Distance (km)</label>
                      <div className="distance-slider">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={bulkDistance}
                          onChange={(e) => setBulkDistance(parseInt(e.target.value))}
                        />
                        <span>{bulkDistance} km</span>
                      </div>
                    </div>

                    <div className="bulk-preview">
                      <h4>Preview:</h4>
                      {selectedBulkHotel && selectedBulkCity ? (
                        <div>
                          <p>
                            <strong>{getHotelById(selectedBulkHotel)?.name}</strong> will be mapped to all tourist places in <strong>{selectedBulkCity}</strong>
                          </p>
                          <p className="place-count">
                            Affects approximately {places.filter(p => p.city === selectedBulkCity).length} places
                          </p>
                        </div>
                      ) : (
                        <p>Select hotel and city to see preview</p>
                      )}
                    </div>

                    <button 
                      className="btn-execute-bulk"
                      onClick={bulkMapHotelToCityPlaces}
                      disabled={!selectedBulkHotel || !selectedBulkCity}
                    >
                      <i className="fas fa-bolt"></i> Execute Bulk Mapping
                    </button>
                  </div>
                )}

                {/* Mode 2: Multiple Hotels to City Places */}
                {bulkMode === 'city_to_hotels' && (
                  <div className="bulk-form">
                    <div className="form-group">
                      <label>Select City</label>
                      <select 
                        value={selectedBulkCity}
                        onChange={(e) => setSelectedBulkCity(e.target.value)}
                      >
                        <option value="">Choose city...</option>
                        {locations.map(loc => (
                          <option key={loc._id} value={loc.name}>{loc.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Select Hotels in {selectedBulkCity || 'City'}</label>
                      <div className="hotels-checkbox-list">
                        {hotels
                          .filter(hotel => hotel.city === selectedBulkCity)
                          .map(hotel => (
                            <label key={hotel._id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedBulkHotels.includes(hotel._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBulkHotels([...selectedBulkHotels, hotel._id]);
                                  } else {
                                    setSelectedBulkHotels(selectedBulkHotels.filter(id => id !== hotel._id));
                                  }
                                }}
                              />
                              <span className="checkmark"></span>
                              <span className="hotel-name">{hotel.name}</span>
                              <span className="mapped-count">
                                ({getMappedPlacesForHotel(hotel._id).length} mapped)
                              </span>
                            </label>
                          ))}
                        {hotels.filter(hotel => hotel.city === selectedBulkCity).length === 0 && (
                          <p className="no-hotels">No hotels found in this city</p>
                        )}
                      </div>
                    </div>

                    <div className="bulk-preview">
                      <h4>Preview:</h4>
                      {selectedBulkCity && selectedBulkHotels.length > 0 ? (
                        <div>
                          <p>
                            <strong>{selectedBulkHotels.length} hotels</strong> will be mapped to all tourist places in <strong>{selectedBulkCity}</strong>
                          </p>
                          <p className="hotels-list">
                            Hotels: {selectedBulkHotels.slice(0, 3).map(id => getHotelById(id)?.name).join(', ')}
                            {selectedBulkHotels.length > 3 && `... and ${selectedBulkHotels.length - 3} more`}
                          </p>
                        </div>
                      ) : (
                        <p>Select city and hotels to see preview</p>
                      )}
                    </div>

                    <button 
                      className="btn-execute-bulk"
                      onClick={bulkMapHotelsToCity}
                      disabled={!selectedBulkCity || selectedBulkHotels.length === 0}
                    >
                      <i className="fas fa-bolt"></i> Execute Bulk Mapping
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk Mapping Statistics */}
              <div className="bulk-stats">
                <h4><i className="fas fa-chart-bar"></i> Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{places.length}</div>
                    <div className="stat-label">Total Places</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{hotels.length}</div>
                    <div className="stat-label">Total Hotels</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.mappedPlaces}</div>
                    <div className="stat-label">Places with Hotels</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{places.length - stats.mappedPlaces}</div>
                    <div className="stat-label">Places without Hotels</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="reports-tab-content">
            <div className="reports-container">
              <div className="reports-header">
                <h3><i className="fas fa-chart-bar"></i> Mapping Reports</h3>
                <p>Analysis of hotel-place mappings and coverage</p>
              </div>

              {/* Coverage Chart */}
              <div className="coverage-chart">
                <h4>Mapping Coverage</h4>
                <div className="chart-bars">
                  <div className="chart-bar">
                    <div className="bar-label">Hotel Coverage</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{width: `${stats.hotelCoverage}%`}}
                      >
                        <span className="bar-value">{stats.hotelCoverage}%</span>
                      </div>
                    </div>
                    <div className="bar-text">{stats.mappedHotels}/{stats.totalHotels} hotels mapped</div>
                  </div>
                  <div className="chart-bar">
                    <div className="bar-label">Place Coverage</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{width: `${stats.placeCoverage}%`}}
                      >
                        <span className="bar-value">{stats.placeCoverage}%</span>
                      </div>
                    </div>
                    <div className="bar-text">{stats.mappedPlaces}/{stats.totalPlaces} places mapped</div>
                  </div>
                </div>
              </div>

              {/* Top Cities Report */}
              <div className="cities-report">
                <h4>Mapping by City</h4>
                <div className="cities-list">
                  {locations.map(location => {
                    const cityPlaces = places.filter(p => p.city === location.name || p.locationId === location._id);
                    const cityHotels = hotels.filter(h => h.city === location.name);
                    const mappedInCity = existingMappings.filter(m => {
                      const place = places.find(p => p._id === m.placeId);
                      return place && (place.city === location.name || place.locationId === location._id);
                    }).length;
                    
                    if (cityPlaces.length === 0) return null;

                    const coverage = cityPlaces.length > 0 ? 
                      ((mappedInCity / cityPlaces.length) * 100).toFixed(1) : 0;

                    return (
                      <div key={location._id} className="city-item">
                        <div className="city-name">{location.name}</div>
                        <div className="city-stats">
                          <span className="stat">{cityPlaces.length} places</span>
                          <span className="stat">{cityHotels.length} hotels</span>
                          <span className="stat">{mappedInCity} mappings</span>
                        </div>
                        <div className="city-coverage">
                          <div className="coverage-bar">
                            <div 
                              className="coverage-fill" 
                              style={{width: `${coverage}%`}}
                            ></div>
                          </div>
                          <span className="coverage-percent">{coverage}% covered</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unmapped Places Report */}
              <div className="unmapped-report">
                <h4>Places Without Hotels</h4>
                <div className="unmapped-list">
                  {places
                    .filter(place => getMappedHotelsForPlace(place._id).length === 0)
                    .slice(0, 10)
                    .map(place => (
                      <div key={place._id} className="unmapped-item">
                        <div className="place-name">{place.name}</div>
                        <div className="place-location">{place.city}</div>
                        <button 
                          className="btn-quick-map"
                          onClick={() => {
                            navigate(`/admin/places`);
                            // You could implement quick mapping from here
                          }}
                        >
                          <i className="fas fa-link"></i> Map Now
                        </button>
                      </div>
                    ))}
                  {places.filter(place => getMappedHotelsForPlace(place._id).length === 0).length > 10 && (
                    <div className="more-places">
                      ...and {places.filter(place => getMappedHotelsForPlace(place._id).length === 0).length - 10} more places
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMapping;