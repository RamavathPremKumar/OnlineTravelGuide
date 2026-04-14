import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminPlaceForm.css";

const AdminPlaceForm = () => {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    locationId: "",
    city: "",
    country: "",
    category: "",
    tags: [],
    rating: "",
    openingHours: "",
    entryFee: "",
    bestTimeToVisit: "",
    safetyInfo: "",
    contactInfo: "",
    website: "",
    latitude: "",
    longitude: "",
    isActive: true,
    isFeatured: false,
    source: "admin" // admin or api
  });

  const [errors, setErrors] = useState({});
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Check authentication and load data
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const storedAdminData = localStorage.getItem("adminData");
    
    if (!token || !storedAdminData) {
      navigate("/admin");
      return;
    }

    if (id) {
      setIsEditMode(true);
      fetchPlaceDetails(id);
    }

    fetchLocations();
    fetchCategories();
    setLoading(false);
  }, [id, navigate]);

  const fetchPlaceDetails = async (placeId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/places/${placeId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const place = data.data?.place;
        
        if (place) {
          setFormData({
            name: place.name || "",
            description: place.description || "",
            locationId: place.locationId || "",
            city: place.city || "",
            country: place.country || "",
            category: place.category || "",
            tags: place.tags || [],
            rating: place.rating || "",
            openingHours: place.openingHours || "",
            entryFee: place.entryFee || "",
            bestTimeToVisit: place.bestTimeToVisit || "",
            safetyInfo: place.safetyInfo || "",
            contactInfo: place.contactInfo || "",
            website: place.website || "",
            latitude: place.latitude || "",
            longitude: place.longitude || "",
            isActive: place.isActive !== false,
            isFeatured: place.isFeatured || false,
            source: place.source || "admin"
          });

          if (place.images && place.images.length > 0) {
            setImages(place.images);
            setImagePreviews(place.images.map(img => img.url || img));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/locations`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLocations(data.data?.locations || []);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/categories`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data?.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid image type. Please upload JPEG, PNG, or GIF images.`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    // Add to images array (for actual upload later)
    setImages(prev => [...prev, ...validFiles]);
  };

  const handleImageRemove = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    
    if (mainImageIndex === index) {
      setMainImageIndex(0);
    } else if (mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Place name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.locationId && !formData.city) {
      newErrors.location = "Either select a location or enter city name";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    // Validate coordinates if provided
    if (formData.latitude && !isValidCoordinate(formData.latitude, 'latitude')) {
      newErrors.latitude = "Invalid latitude value";
    }

    if (formData.longitude && !isValidCoordinate(formData.longitude, 'longitude')) {
      newErrors.longitude = "Invalid longitude value";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidCoordinate = (value, type) => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    
    if (type === 'latitude') {
      return num >= -90 && num <= 90;
    } else {
      return num >= -180 && num <= 180;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert("Please fix the errors in the form");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("adminToken");
      
      // Prepare form data with images
      const formDataToSend = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'tags') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add tags as JSON array
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      
      // Add images
      images.forEach((image, index) => {
        if (image instanceof File) {
          formDataToSend.append('images', image);
        }
      });
      
      // Add main image index
      formDataToSend.append('mainImageIndex', mainImageIndex);

      const url = isEditMode 
        ? `${API_URL}/api/admin/places/${id}`
        : `${API_URL}/api/admin/places`;
      
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        alert(isEditMode ? "Place updated successfully!" : "Place added successfully!");
        navigate("/admin/places");
      } else {
        alert(data.message || `Error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving place:", error);
      alert("An error occurred while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
      navigate("/admin/places");
    }
  };

  const getCategoryOptions = () => {
    const defaultCategories = [
      { _id: "beach", name: "Beach" },
      { _id: "monument", name: "Monument" },
      { _id: "park", name: "Park" },
      { _id: "museum", name: "Museum" },
      { _id: "temple", name: "Temple/Church" },
      { _id: "restaurant", name: "Restaurant" },
      { _id: "shopping", name: "Shopping" },
      { _id: "adventure", name: "Adventure" },
      { _id: "historical", name: "Historical" },
      { _id: "natural", name: "Natural" },
      { _id: "cultural", name: "Cultural" },
      { _id: "religious", name: "Religious" },
      { _id: "leisure", name: "Leisure" },
      { _id: "other", name: "Other" }
    ];

    return categories.length > 0 ? categories : defaultCategories;
  };

  if (loading) {
    return (
      <div className="admin-place-form-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-place-form-wrapper">
      <div className="form-header">
        <h1>
          <i className="fas fa-map-marker-alt"></i>
          {isEditMode ? "Edit Tourist Place" : "Add New Tourist Place"}
        </h1>
        <p>
          {isEditMode 
            ? "Update the details of this tourist attraction" 
            : "Add a new tourist attraction to your travel guide"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="place-form">
        <div className="form-sections">
          {/* Basic Information Section */}
          <div className="form-section">
            <h3><i className="fas fa-info-circle"></i> Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group full-width">
                <label className="required">Place Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Eiffel Tower, Taj Mahal, Great Wall"
                  className={errors.name ? "error" : ""}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
                <small className="form-help">Enter the official name of the tourist attraction</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label className="required">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe this place, its history, significance, and what visitors can expect..."
                  rows="4"
                  className={errors.description ? "error" : ""}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
                <small className="form-help">Detailed description helps visitors understand the place better</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="required">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={errors.category ? "error" : ""}
                >
                  <option value="">Select Category</option>
                  {getCategoryOptions().map(cat => (
                    <option key={cat._id || cat} value={cat._id || cat}>
                      {cat.name || cat}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label>Rating (1-5)</label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                >
                  <option value="">Select Rating</option>
                  <option value="1">★☆☆☆☆ (1)</option>
                  <option value="2">★★☆☆☆ (2)</option>
                  <option value="3">★★★☆☆ (3)</option>
                  <option value="4">★★★★☆ (4)</option>
                  <option value="5">★★★★★ (5)</option>
                </select>
                <small className="form-help">Your custom rating</small>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="form-section">
            <h3><i className="fas fa-map-pin"></i> Location Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Select Location</label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                >
                  <option value="">Choose from existing locations</option>
                  {locations.map(location => (
                    <option key={location._id} value={location._id}>
                      {location.name} ({location.country || ""})
                    </option>
                  ))}
                </select>
                <small className="form-help">Or enter city manually below</small>
              </div>

              <div className="form-group">
                <label>Or Enter City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Paris, New York"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g., France, USA"
                />
              </div>

              <div className="form-group">
                <label>Coordinates (Optional)</label>
                <div className="coordinates-group">
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="Latitude"
                    className={errors.latitude ? "error" : ""}
                  />
                  <span className="coord-separator">,</span>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="Longitude"
                    className={errors.longitude ? "error" : ""}
                  />
                </div>
                {errors.latitude && <span className="error-message">{errors.latitude}</span>}
                {errors.longitude && <span className="error-message">{errors.longitude}</span>}
                <small className="form-help">Format: 48.8584, 2.2945</small>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="form-section">
            <h3><i className="fas fa-images"></i> Images</h3>
            
            <div className="images-upload-area">
              <div className="upload-box">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Drag & drop images here or click to browse</p>
                <small>Supports JPG, PNG, GIF, WebP (Max 5MB each)</small>
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="upload-button">
                  Browse Files
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  <h4>Uploaded Images ({imagePreviews.length})</h4>
                  <div className="preview-grid">
                    {imagePreviews.map((preview, index) => (
                      <div 
                        key={index} 
                        className={`preview-item ${mainImageIndex === index ? 'main' : ''}`}
                        onClick={() => setMainImageIndex(index)}
                      >
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        {mainImageIndex === index && (
                          <div className="main-badge">Main</div>
                        )}
                        <button
                          type="button"
                          className="remove-image"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageRemove(index);
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  <small className="form-help">Click on an image to set it as the main display image</small>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-section">
            <h3><i className="fas fa-info-circle"></i> Additional Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Opening Hours</label>
                <input
                  type="text"
                  name="openingHours"
                  value={formData.openingHours}
                  onChange={handleChange}
                  placeholder="e.g., 9:00 AM - 6:00 PM, Daily"
                />
              </div>

              <div className="form-group">
                <label>Entry Fee</label>
                <input
                  type="text"
                  name="entryFee"
                  value={formData.entryFee}
                  onChange={handleChange}
                  placeholder="e.g., $20, Free, Varies"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Best Time to Visit</label>
                <input
                  type="text"
                  name="bestTimeToVisit"
                  value={formData.bestTimeToVisit}
                  onChange={handleChange}
                  placeholder="e.g., November to February, Morning hours"
                />
              </div>

              <div className="form-group">
                <label>Contact Information</label>
                <input
                  type="text"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  placeholder="Phone number, email"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Safety Information</label>
                <textarea
                  name="safetyInfo"
                  value={formData.safetyInfo}
                  onChange={handleChange}
                  placeholder="Important safety tips, warnings, precautions..."
                  rows="3"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="form-section">
            <h3><i className="fas fa-tags"></i> Tags</h3>
            
            <div className="tags-input-container">
              <div className="tags-input-group">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add tags (press Enter)"
                />
                <button type="button" onClick={handleTagAdd} className="tag-add-btn">
                  <i className="fas fa-plus"></i> Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="tags-display">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="tag-remove"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <small className="form-help">Tags help in search and categorization (e.g., family-friendly, romantic, adventure)</small>
            </div>
          </div>

          {/* Settings Section */}
          <div className="form-section">
            <h3><i className="fas fa-cog"></i> Settings</h3>
            
            <div className="form-row">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  Active (Visible to users)
                </label>
                <small className="form-help">If unchecked, this place will be hidden from search results</small>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  Featured Place
                </label>
                <small className="form-help">Featured places appear in recommendations and highlighted sections</small>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="cancel-btn">
            <i className="fas fa-times"></i> Cancel
          </button>
          <button type="submit" disabled={saving} className="submit-btn">
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> {isEditMode ? "Update Place" : "Add Place"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPlaceForm;