import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminHotels.css";

const AdminHotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedStar, setSelectedStar] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);
  const [cities, setCities] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const storedAdminData = localStorage.getItem("adminData");
    
    if (!token || !storedAdminData) {
      navigate("/admin");
      return;
    }
    
    fetchHotels();
    fetchCities();
  }, [navigate]);

  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/hotels`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHotels(data.data?.hotels || []);
        setFilteredHotels(data.data?.hotels || []);
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/locations/cities`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCities(data.data?.cities || []);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  // Filter and sort hotels
  useEffect(() => {
    let result = [...hotels];

    // Search filter
    if (searchTerm) {
      result = result.filter(hotel =>
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // City filter
    if (selectedCity !== "all") {
      result = result.filter(hotel => hotel.city === selectedCity);
    }

    // Star rating filter
    if (selectedStar !== "all") {
      result = result.filter(hotel => {
        const hotelStars = Math.floor(hotel.starRating || hotel.rating || 0);
        return hotelStars === parseInt(selectedStar);
      });
    }

    // Status filter
    if (selectedStatus !== "all") {
      result = result.filter(hotel => {
        if (selectedStatus === "active") return hotel.isActive === true;
        if (selectedStatus === "inactive") return hotel.isActive === false;
        if (selectedStatus === "featured") return hotel.isFeatured === true;
        if (selectedStatus === "mapped") return hotel.nearbyPlaces?.length > 0;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return (b.starRating || b.rating || 0) - (a.starRating || a.rating || 0);
        case "price_high":
          return (b.priceRange?.max || 0) - (a.priceRange?.max || 0);
        case "price_low":
          return (a.priceRange?.min || 0) - (b.priceRange?.min || 0);
        default:
          return 0;
      }
    });

    setFilteredHotels(result);
  }, [hotels, searchTerm, selectedCity, selectedStar, selectedStatus, sortBy]);

  const handleDeleteClick = (hotel) => {
    setHotelToDelete(hotel);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/hotels/${hotelToDelete._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setHotels(hotels.filter(h => h._id !== hotelToDelete._id));
        setShowDeleteModal(false);
        setHotelToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting hotel:", error);
    }
  };

  const toggleStatus = async (hotel) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/hotels/${hotel._id}/toggle-status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setHotels(hotels.map(h => 
          h._id === hotel._id ? { ...h, isActive: !h.isActive } : h
        ));
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const toggleFeatured = async (hotel) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/hotels/${hotel._id}/toggle-featured`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setHotels(hotels.map(h => 
          h._id === hotel._id ? { ...h, isFeatured: !h.isFeatured } : h
        ));
      }
    } catch (error) {
      console.error("Error toggling featured status:", error);
    }
  };

  const getStarRating = (rating) => {
    const stars = Math.floor(rating || 0);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  const getPriceRange = (priceRange) => {
    if (!priceRange) return "N/A";
    if (priceRange.min && priceRange.max) {
      return `$${priceRange.min} - $${priceRange.max}`;
    }
    return priceRange.min ? `From $${priceRange.min}` : `Up to $${priceRange.max}`;
  };

  const getAmenitiesCount = (amenities) => {
    if (!amenities) return 0;
    if (Array.isArray(amenities)) return amenities.length;
    if (typeof amenities === 'object') return Object.keys(amenities).length;
    return 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-hotels-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading Hotels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-hotels-wrapper">
      {/* Header */}
      <div className="admin-hotels-header">
        <div className="header-left">
          <h1><i className="fas fa-hotel"></i> Hotels Management</h1>
          <p>Manage hotels, set prices, and map to tourist places</p>
        </div>
        <div className="header-right">
          <button 
            className="btn-add-hotel"
            onClick={() => navigate("/admin/hotels/add")}
          >
            <i className="fas fa-plus-circle"></i> Add New Hotel
          </button>
          <button 
            className="btn-bulk-import"
            onClick={() => navigate("/admin/hotels/import")}
          >
            <i className="fas fa-file-import"></i> Bulk Import
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-hotel"></i>
          </div>
          <div className="stat-info">
            <h3>{hotels.length}</h3>
            <p>Total Hotels</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <i className="fas fa-eye"></i>
          </div>
          <div className="stat-info">
            <h3>{hotels.filter(h => h.isActive).length}</h3>
            <p>Active Hotels</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon featured">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-info">
            <h3>{hotels.filter(h => h.isFeatured).length}</h3>
            <p>Featured Hotels</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon mapped">
            <i className="fas fa-link"></i>
          </div>
          <div className="stat-info">
            <h3>{hotels.filter(h => h.nearbyPlaces?.length > 0).length}</h3>
            <p>Mapped to Places</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filters-left">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search hotels by name, address, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={selectedStar} 
              onChange={(e) => setSelectedStar(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">★★★★★ (5 Stars)</option>
              <option value="4">★★★★☆ (4 Stars)</option>
              <option value="3">★★★☆☆ (3 Stars)</option>
              <option value="2">★★☆☆☆ (2 Stars)</option>
              <option value="1">★☆☆☆☆ (1 Star)</option>
              <option value="0">Unrated</option>
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="featured">Featured Only</option>
              <option value="mapped">Mapped to Places</option>
            </select>
          </div>
        </div>

        <div className="filters-right">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <i className="fas fa-th-large"></i>
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>

          <div className="sort-group">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="rating">Highest Rated</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hotels Container */}
      <div className="hotels-container">
        {filteredHotels.length === 0 ? (
          <div className="no-hotels-found">
            <i className="fas fa-hotel"></i>
            <h3>No hotels found</h3>
            <p>{searchTerm ? `No results for "${searchTerm}"` : "Add your first hotel to get started"}</p>
            <button 
              className="btn-add-first"
              onClick={() => navigate("/admin/hotels/add")}
            >
              <i className="fas fa-plus"></i> Add First Hotel
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="hotels-grid">
            {filteredHotels.map(hotel => (
              <div key={hotel._id} className="hotel-card">
                {/* Hotel Header */}
                <div className="hotel-card-header">
                  <div className="hotel-status">
                    {hotel.isFeatured && (
                      <span className="featured-badge">
                        <i className="fas fa-crown"></i> Featured
                      </span>
                    )}
                    <span className={`status-badge ${hotel.isActive ? 'active' : 'inactive'}`}>
                      {hotel.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="hotel-actions">
                    <button 
                      className="btn-action edit"
                      onClick={() => navigate(`/admin/hotels/edit/${hotel._id}`)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-action map"
                      onClick={() => navigate(`/admin/mapping?hotel=${hotel._id}`)}
                      title="Map to Places"
                    >
                      <i className="fas fa-link"></i>
                    </button>
                  </div>
                </div>

                {/* Hotel Body */}
                <div className="hotel-card-body">
                  <h3 className="hotel-name">{hotel.name}</h3>
                  
                  <div className="hotel-location">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{hotel.city || "Unknown City"}</span>
                    {hotel.address && <span className="address">, {hotel.address.substring(0, 30)}...</span>}
                  </div>

                  {/* Rating & Price */}
                  <div className="hotel-rating-price">
                    <div className="star-rating">
                      <span className="stars">{getStarRating(hotel.starRating || hotel.rating)}</span>
                      <span className="rating-text">{hotel.starRating || hotel.rating || "N/A"}/5</span>
                    </div>
                    <div className="price-range">
                      <i className="fas fa-tag"></i>
                      <span>{getPriceRange(hotel.priceRange)}</span>
                    </div>
                  </div>

                  {/* Amenities Preview */}
                  {hotel.amenities && (
                    <div className="amenities-preview">
                      <div className="amenities-header">
                        <i className="fas fa-concierge-bell"></i>
                        <span>Amenities ({getAmenitiesCount(hotel.amenities)})</span>
                      </div>
                      <div className="amenities-list">
                        {Array.isArray(hotel.amenities) ? (
                          hotel.amenities.slice(0, 3).map((amenity, index) => (
                            <span key={index} className="amenity-tag">{amenity}</span>
                          ))
                        ) : (
                          Object.entries(hotel.amenities)
                            .slice(0, 3)
                            .map(([key, value]) => value && (
                              <span key={key} className="amenity-tag">{key}</span>
                            ))
                        )}
                        {getAmenitiesCount(hotel.amenities) > 3 && (
                          <span className="amenity-more">+{getAmenitiesCount(hotel.amenities) - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mapped Places */}
                  <div className="mapped-places">
                    <div className="places-header">
                      <i className="fas fa-map-marked-alt"></i>
                      <span>Mapped to {hotel.nearbyPlaces?.length || 0} places</span>
                    </div>
                    {hotel.nearbyPlaces && hotel.nearbyPlaces.length > 0 ? (
                      <div className="places-list">
                        {hotel.nearbyPlaces.slice(0, 2).map((place, index) => (
                          <span key={index} className="place-tag">{place.name}</span>
                        ))}
                        {hotel.nearbyPlaces.length > 2 && (
                          <span className="place-more">+{hotel.nearbyPlaces.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="no-places">Not mapped to any places</span>
                    )}
                  </div>
                </div>

                {/* Hotel Footer */}
                <div className="hotel-card-footer">
                  <div className="hotel-meta">
                    <span className="meta-item">
                      <i className="fas fa-calendar"></i> {formatDate(hotel.createdAt)}
                    </span>
                    {hotel.contactInfo && (
                      <span className="meta-item">
                        <i className="fas fa-phone"></i> Contact
                      </span>
                    )}
                  </div>
                  <div className="footer-actions">
                    <button 
                      className={`btn-status ${hotel.isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleStatus(hotel)}
                    >
                      <i className={`fas fa-${hotel.isActive ? 'eye' : 'eye-slash'}`}></i>
                    </button>
                    <button 
                      className={`btn-featured ${hotel.isFeatured ? 'featured' : ''}`}
                      onClick={() => toggleFeatured(hotel)}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteClick(hotel)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="hotels-table-container">
            <table className="hotels-table">
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>City</th>
                  <th>Rating</th>
                  <th>Price Range</th>
                  <th>Mapped Places</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map(hotel => (
                  <tr key={hotel._id}>
                    <td>
                      <div className="hotel-info">
                        <div className="hotel-icon">
                          <i className="fas fa-hotel"></i>
                        </div>
                        <div className="hotel-details">
                          <div className="hotel-name">{hotel.name}</div>
                          <div className="hotel-address">{hotel.address?.substring(0, 40)}...</div>
                        </div>
                      </div>
                    </td>
                    <td>{hotel.city || "N/A"}</td>
                    <td>
                      <div className="table-rating">
                        <span className="stars">{getStarRating(hotel.starRating || hotel.rating)}</span>
                        <span>({hotel.starRating || hotel.rating || "N/A"})</span>
                      </div>
                    </td>
                    <td>{getPriceRange(hotel.priceRange)}</td>
                    <td>
                      <span className={`mapped-count ${hotel.nearbyPlaces?.length > 0 ? 'has-mapping' : 'no-mapping'}`}>
                        {hotel.nearbyPlaces?.length || 0} places
                      </span>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span className={`status-badge ${hotel.isActive ? 'active' : 'inactive'}`}>
                          {hotel.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {hotel.isFeatured && (
                          <span className="featured-badge">
                            <i className="fas fa-star"></i>
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-action edit"
                          onClick={() => navigate(`/admin/hotels/edit/${hotel._id}`)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-action map"
                          onClick={() => navigate(`/admin/mapping?hotel=${hotel._id}`)}
                          title="Map to Places"
                        >
                          <i className="fas fa-link"></i>
                        </button>
                        <button 
                          className={`btn-action status ${hotel.isActive ? 'active' : 'inactive'}`}
                          onClick={() => toggleStatus(hotel)}
                          title={hotel.isActive ? "Deactivate" : "Activate"}
                        >
                          <i className={`fas fa-${hotel.isActive ? 'eye' : 'eye-slash'}`}></i>
                        </button>
                        <button 
                          className="btn-action delete"
                          onClick={() => handleDeleteClick(hotel)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && hotelToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3><i className="fas fa-exclamation-triangle"></i> Delete Hotel</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>"{hotelToDelete.name}"</strong>?</p>
              <p className="warning-text">
                <i className="fas fa-exclamation-circle"></i> This will also remove all mappings to tourist places.
              </p>
              {hotelToDelete.nearbyPlaces?.length > 0 && (
                <div className="affected-places">
                  <p><strong>Affected Places ({hotelToDelete.nearbyPlaces.length}):</strong></p>
                  <ul>
                    {hotelToDelete.nearbyPlaces.slice(0, 3).map((place, index) => (
                      <li key={index}>{place.name}</li>
                    ))}
                    {hotelToDelete.nearbyPlaces.length > 3 && (
                      <li>...and {hotelToDelete.nearbyPlaces.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn delete-confirm"
                onClick={confirmDelete}
              >
                <i className="fas fa-trash"></i> Delete Hotel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHotels;