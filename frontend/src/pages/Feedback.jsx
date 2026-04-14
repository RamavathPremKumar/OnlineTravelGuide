import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./Feedback.css";
import { useLocation } from "react-router-dom";
import { apiRequest } from "../services/api";

const Feedback = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [hasCompletedBookings, setHasCompletedBookings] = useState(false);

  const [feedbackData, setFeedbackData] = useState({
    destination: "",
    visitedDatesFrom: "",
    visitedDatesTo: "",
    overallRating: 0,
    cleanliness: 0,
    service: 0,
    locationRating: 0,
    value: 0,
    comfort: 0,
    title: "",
    detailedReview: "",
    suggestions: "",
    bookingId: "",
  });

  // Fetch user's bookings when authenticated
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (isAuthenticated && user) {
        try {
          const token = localStorage.getItem('token');
          const data = await apiRequest('/bookings/my-bookings/with-actual-status?autoUpdate=true', 'GET', null, token);
          if (data.success) {
            // Filter only completed bookings where checkout date has passed
            const now = new Date();
            const completedBookings = data.bookings.filter(booking => {
              const checkoutDate = new Date(booking.checkout);
              return booking.status === 'Completed' && checkoutDate < now;
            });
            setUserBookings(completedBookings || []);
            setHasCompletedBookings(completedBookings.length > 0);
          }
        } catch (error) {
          console.error('Error fetching bookings:', error);
          setUserBookings([]);
          setHasCompletedBookings(false);
        }
      }
    };
    
    fetchUserBookings();
  }, [isAuthenticated, user]);


  // Add this NEW useEffect to read URL parameter
useEffect(() => {
  // Read booking ID from URL (from email link)
  const queryParams = new URLSearchParams(location.search);
  const bookingIdFromUrl = queryParams.get('booking');
  
  if (bookingIdFromUrl) {
    console.log("📧 Booking ID from email link:", bookingIdFromUrl);
    
    // Wait for bookings to load, then pre-select this booking
    if (userBookings.length > 0) {
      // Check if this booking exists in user's bookings
      const matchingBooking = userBookings.find(
        booking => booking._id === bookingIdFromUrl || booking.bookingId === bookingIdFromUrl
      );
      
      if (matchingBooking) {
        setFeedbackData(prev => ({
          ...prev,
          bookingId: matchingBooking._id // Use _id for the dropdown
        }));
        console.log("✅ Pre-selected booking from email link");
      } else {
        console.log("⚠️ Booking from URL not found in user's bookings");
      }
    }
  }
}, [location.search, userBookings]); // Run when URL changes or bookings load

  // Fetch all reviews to display
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setFetchError(null);
        const data = await apiRequest('/feedback');
        
        console.log('Feedback API Response:', data);
        
        if (data.success) {
          let reviews = [];
          
          if (data.docs) {
            reviews = data.docs;
          } else if (data.feedback) {
            reviews = data.feedback;
          } else if (Array.isArray(data)) {
            reviews = data;
          }
          
          setAllReviews(reviews || []);
        } else {
          setAllReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setFetchError(error.message);
        setAllReviews([]);
      }
    };
    
    fetchReviews();
  }, []);

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.slice(0, 5).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setUploadedPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
  };

  // Remove photo
  const removePhoto = (index) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Star Rating Component
  const StarRating = ({ rating, setRating, label, disabled = false }) => (
    <div className="star-rating-group">
      <label className="rating-label">{label}</label>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && setRating(star)}
            title={disabled ? 'Complete a booking first' : `${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="rating-text">
        {rating === 0 ? 'Not rated' : `${rating} star${rating > 1 ? 's' : ''}`}
      </span>
    </div>
  );

  const handleChange = (e) => {
    if (!hasCompletedBookings) return;
    
    const { name, value } = e.target;
    setFeedbackData({ ...feedbackData, [name]: value });
  };

  // Set rating for different categories
  const setCategoryRating = (category, value) => {
    if (!hasCompletedBookings) return;
    setFeedbackData(prev => ({ ...prev, [category]: value }));
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showAlert("Please login to submit feedback!", "error");
      return;
    }

    if (!hasCompletedBookings) {
      showAlert("You need to complete a booking before submitting feedback!", "error");
      return;
    }

    if (feedbackData.overallRating === 0) {
      showAlert("Please provide an overall rating!", "warning");
      return;
    }

    if (feedbackData.detailedReview.length < 50) {
      showAlert("Detailed review must be at least 50 characters!", "warning");
      return;
    }

    setLoading(true);

    try {
      // Create FormData
      const formData = new FormData();
      
      // Add photos
      uploadedPhotos.forEach(photo => {
        formData.append('photos', photo.file);
      });
      
      // Prepare data to send
      const dataToSend = {
        ...feedbackData,
        cleanliness: feedbackData.cleanliness || '',
        service: feedbackData.service || '',
        locationRating: feedbackData.locationRating || '',
        value: feedbackData.value || '',
        comfort: feedbackData.comfort || '',
        bookingId: feedbackData.bookingId || ''
      };
      
      // Add form data
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] !== null && dataToSend[key] !== undefined) {
          formData.append(key, dataToSend[key]);
        }
      });

      console.log('Sending feedback data:', dataToSend);

      const token = localStorage.getItem('token');
      const data = await apiRequest('/feedback', 'POST', formData, token);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      if (data.success) {
        // Show success
        showSuccessModal();
        
        // Reset form
        setFeedbackData({
          destination: "",
          visitedDatesFrom: "",
          visitedDatesTo: "",
          overallRating: 0,
          cleanliness: 0,
          service: 0,
          locationRating: 0,
          value: 0,
          comfort: 0,
          title: "",
          detailedReview: "",
          suggestions: "",
          bookingId: "",
        });
        setUploadedPhotos([]);
        
        // Refresh reviews after submission
        const refreshData = await apiRequest('/feedback');
        
        if (refreshData.success) {
          if (refreshData.docs) {
            setAllReviews(refreshData.docs || []);
          } else if (refreshData.feedback) {
            setAllReviews(refreshData.feedback || []);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert(`Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Alert function
  const showAlert = (message, type = "info") => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  // Success Modal
  const showSuccessModal = () => {
    const modal = document.createElement('div');
    modal.className = 'success-modal-overlay';
    modal.innerHTML = `
      <div class="success-modal">
        <div class="success-icon">⭐</div>
        <h2>Thank You for Your Feedback!</h2>
        <p>Your review has been submitted successfully.</p>
        <div class="modal-actions">
          <button class="modal-btn primary" onclick="this.closest('.success-modal-overlay').remove()">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  // Helpful vote function
  const handleHelpfulVote = async (reviewId, isHelpful) => {
    if (!isAuthenticated) {
      showAlert("Please login to vote!", "warning");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = await apiRequest(`/feedback/${reviewId}/vote`, 'POST', { isHelpful }, token);
      if (data.success) {
        setAllReviews(prev => prev.map(review => 
          review._id === reviewId 
            ? { 
                ...review, 
                helpfulCount: data.helpfulCount || review.helpfulCount,
                notHelpfulCount: data.notHelpfulCount || review.notHelpfulCount
              } 
            : review
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Toggle review expand/collapse
  const toggleReviewExpand = (reviewId) => {
    setAllReviews(prev => prev.map(review => 
      review._id === reviewId 
        ? { ...review, showFull: !review.showFull }
        : review
    ));
  };

  return (
    <div className="feedback-page">
      {/* Reviews Display Section */}
      <div className="reviews-section">
        <h2>Traveler Reviews</h2>
        
        {fetchError && (
          <div className="error-message">
            <p>Error loading reviews: {fetchError}</p>
          </div>
        )}
        
        <div className="reviews-container">
          {!Array.isArray(allReviews) ? (
            <div className="loading-reviews">
              <p>Loading reviews...</p>
            </div>
          ) : allReviews.length === 0 ? (
            <div className="no-reviews">
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            allReviews.map(review => (
              <div key={review._id || review.id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="avatar">{review.bookingId ? '✓' : '👤'}</div>
                    <div>
                      <h4>{review.bookingId ? 'Verified Traveler' : 'Traveler'}</h4>
                      {review.bookingId && <span className="verified-badge">✓ Verified Stay</span>}
                    </div>
                  </div>
                  <div className="review-meta">
                    <span className="review-date">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                    <div className="review-rating">
                      {'★'.repeat(Math.round(review.averageRating || review.overallRating || 0))}
                      {'☆'.repeat(5 - Math.round(review.averageRating || review.overallRating || 0))}
                      <span className="rating-number">
                        {(review.averageRating || review.overallRating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {review.title && <h3 className="review-title">{review.title}</h3>}
                
                <div className="review-text-container">
                  <p className={`review-text ${review.showFull ? 'expanded' : ''}`}>
                    {review.detailedReview || 'No detailed review provided.'}
                  </p>
                  {review.detailedReview && review.detailedReview.length > 200 && (
                    <button 
                      className="read-more-btn"
                      onClick={() => toggleReviewExpand(review._id)}
                    >
                      {review.showFull ? 'Read Less' : 'Read More'}
                    </button>
                  )}
                </div>
                
                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="review-photos">
                    {review.photos.slice(0, 3).map((photo, index) => (
                      <img 
                        key={index} 
                        src={photo.startsWith('http') ? photo : `${API_BASE_URL.replace('/api', '')}${photo}`} 
                        alt={`Review ${index + 1}`} 
                        className="review-photo" 
                      />
                    ))}
                    {review.photos.length > 3 && (
                      <div className="more-photos">+{review.photos.length - 3} more</div>
                    )}
                  </div>
                )}
                
                {/* Helpful Votes */}
                <div className="review-actions">
                  <button 
                    className="helpful-btn"
                    onClick={() => handleHelpfulVote(review._id, true)}
                    disabled={!isAuthenticated}
                  >
                    👍 Helpful ({review.helpfulCount || 0})
                  </button>
                  <button 
                    className="not-helpful-btn"
                    onClick={() => handleHelpfulVote(review._id, false)}
                    disabled={!isAuthenticated}
                  >
                    👎 Not Helpful ({review.notHelpfulCount || 0})
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feedback Form Section */}
      <div className="form-wrapper">
        <div id="feedback-container">
          <h2 id="form-title">Share Your Experience</h2>
          
          {!isAuthenticated ? (
            <div className="login-required">
               
              
                <p>🔒 Please login to submit feedback</p>
                <a href="/login" className="login-link">Login Now</a>
              </div>
            
          ) : !hasCompletedBookings ? (
            <div className="no-booking-message">
              <div className="booking-warning-icon">🚫</div>
              <h3>No Completed Bookings Found</h3>
              <p>You need to complete a booking before you can submit feedback.</p>
              <div className="booking-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <p>Make a booking</p>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <p>Complete your stay (checkout date must pass)</p>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <p>Share your experience here</p>
                </div>
              </div>
              <div className="booking-actions">
                <a href="/accommodations" className="book-now-btn">Browse Accommodations</a>
                <a href="/bookings" className="view-bookings-btn">View My Bookings</a>
              </div>
            </div>
          ) : (
            <form id="feedback-form" onSubmit={submitFeedback}>
              {/* Link to Booking (Optional) */}
              {userBookings.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Link to your booking:</label>
                  <select
                    className="form-input"
                    name="bookingId"
                    value={feedbackData.bookingId}
                    onChange={handleChange}
                  >
                    <option value="">Select your booking (optional)</option>
                    {userBookings.map(booking => (
                      <option key={booking._id} value={booking._id}>
                        {booking.hotelName} - {new Date(booking.checkin).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <small className="form-hint">
                    Linking to a booking adds "Verified Stay" badge to your review
                  </small>
                </div>
              )}

              {/* Destination */}
              <div className="form-group">
                <label className="form-label required">Destination:</label>
                <input
                  type="text"
                  className="form-input"
                  name="destination"
                  placeholder="Where did you travel?"
                  value={feedbackData.destination}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Dates */}
              <div className="form-group">
                <label className="form-label">Visit Dates:</label>
                <div className="date-range">
                  <input
                    type="date"
                    className="form-input"
                    name="visitedDatesFrom"
                    value={feedbackData.visitedDatesFrom}
                    onChange={handleChange}
                  />
                  <span className="date-separator">to</span>
                  <input
                    type="date"
                    className="form-input"
                    name="visitedDatesTo"
                    value={feedbackData.visitedDatesTo}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Star Ratings */}
              <div className="ratings-section">
                <h4>Rate Your Experience</h4>
                
                <StarRating 
                  rating={feedbackData.overallRating}
                  setRating={(value) => setCategoryRating('overallRating', value)}
                  label="Overall Experience *"
                />
                
                <StarRating 
                  rating={feedbackData.cleanliness}
                  setRating={(value) => setCategoryRating('cleanliness', value)}
                  label="Cleanliness"
                />
                
                <StarRating 
                  rating={feedbackData.service}
                  setRating={(value) => setCategoryRating('service', value)}
                  label="Service"
                />
                
                <StarRating 
                  rating={feedbackData.locationRating}
                  setRating={(value) => setCategoryRating('locationRating', value)}
                  label="Location"
                />
                
                <StarRating 
                  rating={feedbackData.value}
                  setRating={(value) => setCategoryRating('value', value)}
                  label="Value for Money"
                />
                
                <StarRating 
                  rating={feedbackData.comfort}
                  setRating={(value) => setCategoryRating('comfort', value)}
                  label="Comfort"
                />
              </div>

              {/* Review Title */}
              <div className="form-group">
                <label className="form-label required">Review Title:</label>
                <input
                  type="text"
                  className="form-input"
                  name="title"
                  placeholder="Summarize your experience"
                  value={feedbackData.title}
                  onChange={handleChange}
                  required
                  maxLength="100"
                />
              </div>

              {/* Detailed Review */}
              <div className="form-group">
                <label className="form-label required">Detailed Review:</label>
                <textarea
                  className="form-input"
                  name="detailedReview"
                  placeholder="Share your experience in detail... (minimum 50 characters)"
                  rows="5"
                  value={feedbackData.detailedReview}
                  onChange={handleChange}
                  required
                  minLength="50"
                />
                <small className="form-hint">Minimum 50 characters. Current: {feedbackData.detailedReview.length}</small>
              </div>

              {/* Suggestions */}
              <div className="form-group">
                <label className="form-label">Suggestions for Improvement:</label>
                <textarea
                  className="form-input"
                  name="suggestions"
                  placeholder="Any suggestions for improvement..."
                  rows="3"
                  value={feedbackData.suggestions}
                  onChange={handleChange}
                />
              </div>

              {/* Photo Upload */}
              <div className="form-group">
                <label className="form-label">Upload Photos:</label>
                <div className="photo-upload-area">
                  <input
                    type="file"
                    id="photoUpload"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="photoUpload" className="upload-button">
                    📷 Add Photos (Max 5)
                  </label>
                  <small className="form-hint">Upload up to 5 photos (optional)</small>
                </div>
                
                {/* Photo Previews */}
                {uploadedPhotos.length > 0 && (
                  <div className="photo-previews">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="photo-preview">
                        <img src={photo.preview} alt={`Preview ${index + 1}`} />
                        <button 
                          type="button" 
                          className="remove-photo"
                          onClick={() => removePhoto(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading || !isAuthenticated || !hasCompletedBookings}
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
              
              {loading && (
                <div className="loading-indicator">
                  <div className="loading-spinner"></div>
                  <p>Submitting your review...</p>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;