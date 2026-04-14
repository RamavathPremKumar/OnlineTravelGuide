import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./AdminPlaces.css";

const AdminPlaces = () => {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState(null);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("newest");


  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const storedAdminData = localStorage.getItem("adminData");
    
    if (!token || !storedAdminData) {
      navigate("/admin");
      return;
    }
    
    fetchPlaces();
    fetchLocations();
    fetchCategories();
  }, [navigate]);

  const fetchPlaces = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const data = await apiRequest("/admin/places", "GET", null, token);

      setPlaces(data.data?.places || []);
      setFilteredPlaces(data.data?.places || []);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const data = await apiRequest("/admin/locations", "GET", null, token);

      setLocations(data.data?.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const data = await apiRequest("/admin/categories", "GET", null, token);

      setCategories(data.data?.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Filter and sort places
  useEffect(() => {
    let result = [...places];

    // Search filter
    if (searchTerm) {
      result = result.filter(place =>
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      result = result.filter(place => place.locationId === selectedLocation || place.city === selectedLocation);
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(place => place.category === selectedCategory);
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
        case "popular":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    setFilteredPlaces(result);
  }, [places, searchTerm, selectedLocation, selectedCategory, sortBy]);

  const handleDeleteClick = (place) => {
    setPlaceToDelete(place);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      await apiRequest(`/admin/places/${placeToDelete._id}`, "DELETE", null, token);

      // Remove from state
      setPlaces(places.filter(p => p._id !== placeToDelete._id));
      setShowDeleteModal(false);
      setPlaceToDelete(null);
    } catch (error) {
      console.error("Error deleting place:", error);
    }
  };

  const toggleStatus = async (place) => {
    try {
      const token = localStorage.getItem("adminToken");
      await apiRequest(`/admin/places/${place._id}/toggle-status`, "PUT", null, token);

      // Update local state
      setPlaces(places.map(p => 
        p._id === place._id ? { ...p, isActive: !p.isActive } : p
      ));
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l._id === locationId);
    return location ? location.name : "Unknown";
  };

  const getCategoryIcon = (category) => {
    const icons = {
      beach: "fas fa-umbrella-beach",
      monument: "fas fa-landmark",
      park: "fas fa-tree",
      museum: "fas fa-university",
      temple: "fas fa-place-of-worship",
      restaurant: "fas fa-utensils",
      shopping: "fas fa-shopping-bag",
      adventure: "fas fa-hiking",
      historical: "fas fa-history",
      natural: "fas fa-mountain",
      cultural: "fas fa-theater-masks",
      religious: "fas fa-pray",
      leisure: "fas fa-gamepad",
      other: "fas fa-map-marker-alt"
    };
    return icons[category] || "fas fa-map-marker-alt";
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
      <div className="admin-places-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading Places...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-places-wrapper">
      {/* Header */}
      <div className="admin-places-header">
        <div className="header-left">
          <h1><i className="fas fa-map-marker-alt"></i> Tourist Places Management</h1>
          <p>Manage all tourist attractions, landmarks, and destinations</p>
        </div>
        <div className="header-right">
          <button 
            className="btn-add-place"
            onClick={() => navigate("/admin/places/add")}
          >
            <i className="fas fa-plus-circle"></i> Add New Place
          </button>
          <button 
            className="btn-import-api"
            onClick={() => navigate("/admin/import")}
          >
            <i className="fas fa-download"></i> Import from API
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search places by name, description, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label><i className="fas fa-map-pin"></i> Location:</label>
          <select 
            value={selectedLocation} 
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label><i className="fas fa-tag"></i> Category:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category._id || category} value={category._id || category}>
                {category.name || category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label><i className="fas fa-sort"></i> Sort By:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        <div className="stats-summary">
          <span className="stat-item">
            <i className="fas fa-layer-group"></i> Total: {places.length}
          </span>
          <span className="stat-item">
            <i className="fas fa-eye"></i> Active: {places.filter(p => p.isActive).length}
          </span>
          <span className="stat-item">
            <i className="fas fa-eye-slash"></i> Hidden: {places.filter(p => !p.isActive).length}
          </span>
        </div>
      </div>

      {/* Places Grid */}
      <div className="places-container">
        {filteredPlaces.length === 0 ? (
          <div className="no-places-found">
            <i className="fas fa-map"></i>
            <h3>No places found</h3>
            <p>{searchTerm ? `No results for "${searchTerm}"` : "Add your first tourist place to get started"}</p>
            <button 
              className="btn-add-first"
              onClick={() => navigate("/admin/places/add")}
            >
              <i className="fas fa-plus"></i> Add First Place
            </button>
          </div>
        ) : (
          <div className="places-grid">
            {filteredPlaces.map(place => (
              <div key={place._id} className="place-card">
                <div className="place-card-header">
                  <div className="place-category">
                    <i className={getCategoryIcon(place.category)}></i>
                    <span>{place.category || "Attraction"}</span>
                  </div>
                  <div className="place-actions">
                    <button 
                      className="btn-action edit"
                      onClick={() => navigate(`/admin/places/edit/${place._id}`)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className={`btn-action status ${place.isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleStatus(place)}
                      title={place.isActive ? "Deactivate" : "Activate"}
                    >
                      <i className={place.isActive ? "fas fa-eye" : "fas fa-eye-slash"}></i>
                    </button>
                    <button 
                      className="btn-action delete"
                      onClick={() => handleDeleteClick(place)}
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="place-card-body">
                  <h3 className="place-name">{place.name}</h3>
                  
                  <div className="place-location">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{place.city || getLocationName(place.locationId)}</span>
                    {place.country && <span className="country">, {place.country}</span>}
                  </div>

                  <p className="place-description">
                    {place.description || "No description available"}
                  </p>

                  <div className="place-meta">
                    <div className="meta-item">
                      <i className="fas fa-star"></i>
                      <span>Rating: {place.rating || "N/A"}</span>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-hotel"></i>
                      <span>Hotels: {place.nearbyHotels || 0}</span>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-calendar"></i>
                      <span>Added: {formatDate(place.createdAt)}</span>
                    </div>
                  </div>

                  {place.tags && place.tags.length > 0 && (
                    <div className="place-tags">
                      {place.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                      {place.tags.length > 3 && (
                        <span className="tag-more">+{place.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="place-card-footer">
                  <button 
                    className="btn-view-details"
                    onClick={() => navigate(`/admin/places/view/${place._id}`)}
                  >
                    <i className="fas fa-info-circle"></i> View Details
                  </button>
                  <button 
                    className="btn-map-hotels"
                    onClick={() => navigate(`/admin/mapping?place=${place._id}`)}
                  >
                    <i className="fas fa-link"></i> Map Hotels
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && placeToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3><i className="fas fa-exclamation-triangle"></i> Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>"{placeToDelete.name}"</strong>?</p>
              <p className="warning-text">
                <i className="fas fa-exclamation-circle"></i> This action cannot be undone. All associated data (images, ratings, hotel mappings) will also be removed.
              </p>
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
                <i className="fas fa-trash"></i> Delete Place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlaces;