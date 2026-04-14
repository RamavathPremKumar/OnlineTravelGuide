import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import './Bookings.css';

const Bookings = () => {
  const { user, token, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (token) {
      fetchBookings();
    } else {
      setLoading(false);
      setError('Please login to view bookings');
    }
  }, [token]);

  const fetchBookings = async () => {
    if (!token) {
      showNotification('error', 'Please login to view bookings');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await apiRequest('/bookings/my-bookings', 'GET', null, token);
      
      if (result.success) {
        const bookingsData = result.bookings || [];
        const bookingsWithStatus = bookingsData.map(booking => ({
          ...booking,
          actualStatus: getCalculatedStatus(booking),
          isPastCheckout: new Date(booking.checkout) < new Date()
        }));
        
        setBookings(bookingsWithStatus);
      } else {
        throw new Error(result.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Bookings fetch error:', error);
      
      if (error.message?.includes('401') || error.message?.includes('jwt') || error.message?.includes('unauthorized')) {
        setError('Your session has expired. Please login again.');
        showNotification('error', 'Session expired. Please login again.');
        setTimeout(() => logout(), 3000);
      } else {
        setError('Failed to load bookings. Please try again.');
        showNotification('error', 'Failed to load bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCalculatedStatus = (booking) => {
    if (!booking.status) return 'Confirmed';
    
    if (booking.status === 'Confirmed') {
      const now = new Date();
      const checkoutDate = new Date(booking.checkout);
      if (checkoutDate < now) {
        return 'Completed';
      }
    }
    
    return booking.status;
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 4000);
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter !== 'all' && booking.actualStatus !== filter) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (booking.bookingId && booking.bookingId.toLowerCase().includes(searchLower)) ||
        (booking.hotelName && booking.hotelName.toLowerCase().includes(searchLower)) ||
        (booking.location && booking.location.toLowerCase().includes(searchLower)) ||
        (booking.place && booking.place.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const showCancelConfirmation = (booking) => {
    setBookingToCancel(booking);
    setShowCancelConfirm(true);
  };

  const cancelBooking = async () => {
    if (!bookingToCancel || !token) return;
    
    try {
      const result = await apiRequest(
        `/bookings/${bookingToCancel._id}/cancel`, 
        'PATCH', 
        null, 
        token
      );
      
      if (result.success) {
        setBookings(bookings.map(booking => 
          booking._id === bookingToCancel._id 
            ? { ...booking, status: 'Cancelled', actualStatus: 'Cancelled' }
            : booking
        ));
        showNotification('success', 'Booking cancelled successfully');
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        showNotification('error', 'Session expired. Please login again.');
        logout();
      } else {
        showNotification('error', 'Failed to cancel booking');
      }
    } finally {
      setShowCancelConfirm(false);
      setBookingToCancel(null);
      setShowDetailsModal(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-confirmed';
    }
  };

  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':
        return 'fa-check-circle';
      case 'cancelled':
        return 'fa-times-circle';
      case 'completed':
        return 'fa-calendar-check';
      default:
        return 'fa-check-circle';
    }
  };

  if (loading) {
    return (
      <div className="bookings-loading">
        <div className="bookings-spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          <span>{notification.message}</span>
          <button 
            className="notification-close"
            onClick={() => setNotification({ show: false, type: '', message: '' })}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="bookings-header">
        <h1 className="bookings-title">My Bookings</h1>
        <p className="bookings-subtitle">Manage and view all your travel bookings</p>
      </div>

      <div className="bookings-stats">
        <div className="stat-card">
          <div className="stat-number">{bookings.length}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {bookings.filter(b => getCalculatedStatus(b) === 'Confirmed').length}
          </div>
          <div className="stat-label">Confirmed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {bookings.filter(b => getCalculatedStatus(b) === 'Completed').length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {bookings.filter(b => getCalculatedStatus(b) === 'Cancelled').length}
          </div>
          <div className="stat-label">Cancelled</div>
        </div>
      </div>

      <div className="bookings-controls">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by booking ID, hotel, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <i className="fas fa-layer-group"></i> All
          </button>
          <button
            className={`filter-btn ${filter === 'Confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('Confirmed')}
          >
            <i className="fas fa-check-circle"></i> Confirmed
          </button>
          <button
            className={`filter-btn ${filter === 'Completed' ? 'active' : ''}`}
            onClick={() => setFilter('Completed')}
          >
            <i className="fas fa-calendar-check"></i> Completed
          </button>
          <button
            className={`filter-btn ${filter === 'Cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('Cancelled')}
          >
            <i className="fas fa-times-circle"></i> Cancelled
          </button>
        </div>
      </div>

      {error && (
        <div className="bookings-error">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button 
            className="retry-btn"
            onClick={fetchBookings}
          >
            <i className="fas fa-redo"></i> Retry
          </button>
          <button 
            className="logout-btn"
            onClick={logout}
          >
            <i className="fas fa-sign-out-alt"></i> Login Again
          </button>
        </div>
      )}

      <div className="bookings-list">
        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <div className="no-bookings-icon">
              <i className="fas fa-calendar-times"></i>
            </div>
            <h3>No bookings found</h3>
            <p>
              {searchTerm || filter !== 'all' 
                ? 'Try changing your search or filter'
                : 'You haven\'t made any bookings yet'}
            </p>
            {!searchTerm && filter === 'all' && (
              <Link to="/accommodations" className="book-now-btn">
                <i className="fas fa-hotel"></i> Explore Accommodations
              </Link>
            )}
          </div>
        ) : (
          <div className="bookings-grid">
            {filteredBookings.map((booking) => (
              <div key={booking._id || booking.bookingId} className="booking-card">
                <div className="booking-card-header">
                  <div className="booking-id">
                    <i className="fas fa-receipt"></i>
                    <span>Booking ID: {booking.bookingId || 'N/A'}</span>
                  </div>
                  <span className={`booking-status ${getStatusColor(getCalculatedStatus(booking))}`}>
                    <i className={`fas ${getStatusIcon(getCalculatedStatus(booking))}`}></i>
                     {getCalculatedStatus(booking)}
                  </span>
                </div>
                
                <div className="booking-card-body">
                  <div className="booking-info">
                    <div className="booking-hotel">
                      <h3>{booking.hotelName || 'Hotel Name'}</h3>
                      <p className="booking-location">
                        <i className="fas fa-map-marker-alt"></i>
                        {booking.location || 'Location'}, {booking.place || 'Place'}
                      </p>
                    </div>
                    
                    <div className="booking-dates">
                      <div className="date-item">
                        <span className="date-label">Check-in:</span>
                        <span className="date-value">
                          <i className="fas fa-calendar-check"></i>
                          {formatDate(booking.checkin)}
                        </span>
                      </div>
                      <div className="date-item">
                        <span className="date-label">Check-out:</span>
                        <span className="date-value">
                          <i className="fas fa-calendar-times"></i>
                          {formatDate(booking.checkout)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="booking-details">
                      <div className="detail-item">
                        <i className="fas fa-users"></i>
                        <span>{booking.persons || 1} Person{booking.persons > 1 ? 's' : ''}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-bed"></i>
                        <span>{booking.rooms || 1} {booking.roomType || 'Standard'} Room{booking.rooms > 1 ? 's' : ''}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-rupee-sign"></i>
                        <span>{booking.priceRange || '₹1000 - ₹2000'}</span>
                      </div>
                    </div>
                    
                    <div className="booking-amount">
                      <span className="amount-label">Total Amount:</span>
                      <span className="amount-value">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="booking-actions">
                    <button
                      className="btn-view-details"
                      onClick={() => viewBookingDetails(booking)}
                    >
                      <i className="fas fa-eye"></i> View Details
                    </button>
                    
                    {getCalculatedStatus(booking) === 'Confirmed' && (
                      <button
                        className="btn-cancel-booking"
                        onClick={() => showCancelConfirmation(booking)}
                      >
                        <i className="fas fa-times"></i> Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="booking-card-footer">
                  <span className="booking-date">
                    <i className="fas fa-clock"></i>
                    Booked on {formatDate(booking.bookingDate)}
                  </span>
                  <span className="payment-method">
                    <i className="fas fa-credit-card"></i>
                    {booking.payment || 'Online Payment'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCancelConfirm && bookingToCancel && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h2><i className="fas fa-exclamation-triangle warning-icon"></i> Cancel Booking</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowCancelConfirm(false);
                  setBookingToCancel(null);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="confirmation-message">
                <p>Are you sure you want to cancel this booking?</p>
                <div className="booking-details-confirm">
                  <div className="detail-item-confirm">
                    <span className="label">Booking ID:</span>
                    <span className="value">{bookingToCancel.bookingId}</span>
                  </div>
                  <div className="detail-item-confirm">
                    <span className="label">Hotel:</span>
                    <span className="value">{bookingToCancel.hotelName}</span>
                  </div>
                  <div className="detail-item-confirm">
                    <span className="label">Check-in:</span>
                    <span className="value">{formatDate(bookingToCancel.checkin)}</span>
                  </div>
                  <div className="detail-item-confirm">
                    <span className="label">Amount:</span>
                    <span className="value">{formatCurrency(bookingToCancel.totalAmount)}</span>
                  </div>
                </div>
                
                <div className="cancellation-terms">
                  <h4><i className="fas fa-info-circle"></i> Cancellation Policy</h4>
                  <ul>
                    <li>Full refund if cancelled 48 hours before check-in</li>
                    <li>50% refund if cancelled 24 hours before check-in</li>
                    <li>No refund for cancellations within 24 hours</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCancelConfirm(false);
                  setBookingToCancel(null);
                }}
              >
                <i className="fas fa-times"></i> Keep Booking
              </button>
              <button
                className="btn-danger"
                onClick={cancelBooking}
              >
                <i className="fas fa-check"></i> Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="booking-modal">
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="detail-section">
                <h3><i className="fas fa-info-circle"></i> Booking Information</h3>
                <div className="detail-grid">
                  <div className="detail-item-full">
                    <span className="detail-label">Booking ID:</span>
                    <span className="detail-value">{selectedBooking.bookingId || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value ${getStatusColor(getCalculatedStatus(selectedBooking))}`}>
                      <i className={`fas ${getStatusIcon(getCalculatedStatus(selectedBooking))}`}></i>
                      {getCalculatedStatus(selectedBooking)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Booking Date:</span>
                    <span className="detail-value">
                      <i className="fas fa-clock"></i>
                      {formatDateTime(selectedBooking.bookingDate)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3><i className="fas fa-hotel"></i> Accommodation Details</h3>
                <div className="detail-grid">
                  <div className="detail-item-full">
                    <span className="detail-label">Hotel:</span>
                    <span className="detail-value">{selectedBooking.hotelName || 'N/A'}</span>
                  </div>
                  {selectedBooking.hotelAddress && (
                    <div className="detail-item-full">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{selectedBooking.hotelAddress}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">
                      <i className="fas fa-map-marker-alt"></i>
                      {selectedBooking.location || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Place:</span>
                    <span className="detail-value">{selectedBooking.place || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3><i className="fas fa-calendar-alt"></i> Stay Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Check-in:</span>
                    <span className="detail-value">
                      <i className="fas fa-calendar-check"></i>
                      {formatDate(selectedBooking.checkin)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Check-out:</span>
                    <span className="detail-value">
                      <i className="fas fa-calendar-times"></i>
                      {formatDate(selectedBooking.checkout)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">
                      <i className="fas fa-moon"></i>
                      {selectedBooking.checkin && selectedBooking.checkout 
                        ? Math.ceil((new Date(selectedBooking.checkout) - new Date(selectedBooking.checkin)) / (1000 * 60 * 60 * 24)) + ' nights'
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Room Type:</span>
                    <span className="detail-value">
                      <i className="fas fa-bed"></i>
                      {selectedBooking.roomType || 'Standard'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rooms:</span>
                    <span className="detail-value">{selectedBooking.rooms || 1}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Persons:</span>
                    <span className="detail-value">
                      <i className="fas fa-users"></i>
                      {selectedBooking.persons || 1}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3><i className="fas fa-user"></i> Guest Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">
                      <i className="fas fa-user"></i>
                      {selectedBooking.userName || user?.name || 'Guest'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">
                      <i className="fas fa-envelope"></i>
                      {selectedBooking.email || user?.email || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">
                      <i className="fas fa-phone"></i>
                      {selectedBooking.phone || 'N/A'}
                    </span>
                  </div>
                  {selectedBooking.address && (
                    <div className="detail-item-full">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">
                        <i className="fas fa-home"></i>
                        {selectedBooking.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="detail-section">
                <h3><i className="fas fa-money-bill-wave"></i> Payment Details</h3>
                <div className="detail-grid">
                  {selectedBooking.priceRange && (
                    <div className="detail-item">
                      <span className="detail-label">Price Range:</span>
                      <span className="detail-value">{selectedBooking.priceRange}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Payment Method:</span>
                    <span className="detail-value">
                      <i className="fas fa-credit-card"></i>
                      {selectedBooking.payment || 'Online Payment'}
                    </span>
                  </div>
                  {selectedBooking.additionalServices && selectedBooking.additionalServices.length > 0 && (
                    <div className="detail-item-full">
                      <span className="detail-label">Additional Services:</span>
                      <span className="detail-value">
                        <i className="fas fa-concierge-bell"></i>
                        {Array.isArray(selectedBooking.additionalServices) 
                          ? selectedBooking.additionalServices.join(', ')
                          : selectedBooking.additionalServices}
                      </span>
                    </div>
                  )}
                  <div className="detail-item-full">
                    <span className="detail-label">Special Needs:</span>
                    <span className="detail-value">
                      <i className="fas fa-wheelchair"></i>
                      {selectedBooking.specialNeeds ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="detail-item-full amount-total">
                    <span className="detail-label">Total Amount:</span>
                    <span className="detail-value total-amount">
                      {formatCurrency(selectedBooking.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                <i className="fas fa-times"></i> Close
              </button>
              
              {getCalculatedStatus(selectedBooking) === 'Confirmed' && (
                <button
                  className="btn-danger"
                  onClick={() => {
                    setShowDetailsModal(false);
                    showCancelConfirmation(selectedBooking);
                  }}
                >
                  <i className="fas fa-times"></i> Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;