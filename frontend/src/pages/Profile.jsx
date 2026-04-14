import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api'; // Use your api utility
import './Profile.css';

const Profile = () => {
  const { user, token, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile data state
  const [profile, setProfile] = useState({
    fullname: '',
    username: '',
    email: '',
    phone: '',
    createdAt: ''
  });
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...profile });
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Fetch user profile on mount
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
      setErrorMessage('Please login to view profile');
    }
  }, [token]);
  
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const result = await apiRequest('/users/profile', 'GET', null, token);
      
      if (result.success) {
        setProfile(result.user);
        setEditData(result.user);
      } else {
        throw new Error(result.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      if (error.message?.includes('401') || error.message?.includes('jwt') || error.message?.includes('unauthorized')) {
        setErrorMessage('Session expired. Please login again.');
        setTimeout(() => logout(), 3000);
      } else {
        setErrorMessage('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };
  
  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  // Save profile updates
  const handleSaveProfile = async () => {
    if (!editData.fullname.trim() || !editData.phone.trim()) {
      setErrorMessage('Full name and phone are required');
      return;
    }
    
    try {
      setUpdating(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      const result = await apiRequest(
        '/users/profile',
        'PUT',
        {
          fullname: editData.fullname,
          phone: editData.phone
        },
        token
      );
      
      if (result.success) {
        setProfile(result.user);
        updateUser(result.user);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setErrorMessage(
        error.message || 
        'Failed to update profile. Please try again.'
      );
    } finally {
      setUpdating(false);
    }
  };
  
  // Change password
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      return;
    }
    
    try {
      setUpdating(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      const result = await apiRequest(
        '/users/change-password',
        'PUT',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        token
      );
      
      if (result.success) {
        setSuccessMessage('Password changed successfully!');
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Change password error:', error);
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        setErrorMessage('Session expired. Please login again.');
        logout();
      } else {
        setErrorMessage(
          error.message || 
          'Failed to change password. Please try again.'
        );
      }
    } finally {
      setUpdating(false);
    }
  };
  
  // Delete account functions
  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      const result = await apiRequest(
        '/users/account',
        'DELETE',
        null,
        token
      );
      
      if (result.success) {
        setSuccessMessage('Account deleted successfully');
        setShowDeleteModal(false);
        
        // Logout after 2 seconds
        setTimeout(() => {
          logout();
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        setErrorMessage('Session expired. Please login again.');
        logout();
      } else {
        setErrorMessage('Failed to delete account');
      }
      setShowDeleteModal(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }
  
  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">Manage your account information and preferences</p>
      </div>
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="profile-alert profile-alert-success">
          <i className="fas fa-check-circle"></i> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="profile-alert profile-alert-error">
          <i className="fas fa-exclamation-circle"></i> {errorMessage}
        </div>
      )}
      
      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Personal Information</h2>
            {!isEditing && (
              <button 
                className="profile-btn-edit"
                onClick={() => setIsEditing(true)}
              >
                <i className="fas fa-edit"></i> Edit Profile
              </button>
            )}
          </div>
          
          <div className="profile-info-display">
            {isEditing ? (
              <div className="profile-edit-form">
                <div className="profile-form-group">
                  <label className="profile-form-label">Full Name *</label>
                  <input
                    type="text"
                    name="fullname"
                    value={editData.fullname}
                    onChange={handleEditChange}
                    placeholder="Enter your full name"
                    className="profile-form-input"
                  />
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-form-label">Username</label>
                  <input
                    type="text"
                    value={editData.username}
                    disabled
                    className="profile-form-input profile-disabled-input"
                  />
                  <small className="profile-form-hint">Username cannot be changed</small>
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-form-label">Email</label>
                  <input
                    type="email"
                    value={editData.email}
                    disabled
                    className="profile-form-input profile-disabled-input"
                  />
                  <small className="profile-form-hint">Email cannot be changed</small>
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-form-label">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleEditChange}
                    placeholder="Enter 10-digit phone number"
                    className="profile-form-input"
                  />
                </div>
                
                <div className="profile-form-actions">
                  <button
                    className="profile-btn-cancel"
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ ...profile });
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    className="profile-btn-save"
                    onClick={handleSaveProfile}
                    disabled={updating}
                  >
                    {updating ? <i className="fas fa-spinner fa-spin"></i> : 'Save Changes'}
                    {updating && 'Saving...'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-info-display">
                <div className="profile-info-row">
                  <span className="profile-info-label">Full Name:</span>
                  <span className="profile-info-value">{profile.fullname}</span>
                </div>
                
                <div className="profile-info-row">
                  <span className="profile-info-label">Username:</span>
                  <span className="profile-info-value">@{profile.username}</span>
                </div>
                
                <div className="profile-info-row">
                  <span className="profile-info-label">Email:</span>
                  <span className="profile-info-value">{profile.email}</span>
                  {profile.emailVerified && (
                    <span className="profile-verified-badge">
                      <i className="fas fa-check"></i> Verified
                    </span>
                  )}
                </div>
                
                <div className="profile-info-row">
                  <span className="profile-info-label">Phone:</span>
                  <span className="profile-info-value">{profile.phone}</span>
                </div>
                
                <div className="profile-info-row">
                  <span className="profile-info-label">Member Since:</span>
                  <span className="profile-info-value">{formatDate(profile.createdAt)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Password Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Password & Security</h2>
            {!showPasswordForm && (
              <button
                className="profile-btn-password"
                onClick={() => setShowPasswordForm(true)}
              >
                <i className="fas fa-lock"></i> Change Password
              </button>
            )}
          </div>
          
          {showPasswordForm ? (
            <div className="profile-password-form">
              <div className="profile-form-group">
                <label className="profile-form-label">Current Password *</label>
                <div className="profile-password-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="profile-form-input"
                  />
                  <button 
                    type="button" 
                    className="profile-password-toggle-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={!passwordData.currentPassword}
                  >
                    <i className={showCurrentPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                    <span className="profile-toggle-text">
                      
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="profile-form-group">
                <label className="profile-form-label">New Password *</label>
                <div className="profile-password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="At least 6 characters"
                    className="profile-form-input"
                  />
                  <button 
                    type="button" 
                    className="profile-password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={!passwordData.newPassword}
                  >
                    <i className={showNewPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                    <span className="profile-toggle-text">
                     
                    </span>
                  </button>
                </div>
                <div className="profile-password-hint">
                  <small>Must be at least 6 characters</small>
                </div>
              </div>
              
              <div className="profile-form-group">
                <label className="profile-form-label">Confirm New Password *</label>
                <div className="profile-password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Re-enter new password"
                    className="profile-form-input"
                  />
                  <button 
                    type="button" 
                    className="profile-password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={!passwordData.confirmPassword}
                  >
                    <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                    <span className="profile-toggle-text">
                      
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Password Match Indicator */}
              {passwordData.newPassword && passwordData.confirmPassword && (
                <div className={`profile-password-match ${passwordData.newPassword === passwordData.confirmPassword ? 'match' : 'no-match'}`}>
                  <i className={passwordData.newPassword === passwordData.confirmPassword ? "fas fa-check-circle" : "fas fa-times-circle"}></i>
                  {passwordData.newPassword === passwordData.confirmPassword ? 
                    "Passwords match" : 
                    "Passwords do not match"
                  }
                </div>
              )}
              
              <div className="profile-form-actions">
                <button
                  className="profile-btn-cancel"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                    setErrorMessage('');
                  }}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  className="profile-btn-save"
                  onClick={handleChangePassword}
                  disabled={updating || passwordData.newPassword !== passwordData.confirmPassword}
                >
                  {updating ? <i className="fas fa-spinner fa-spin"></i> : 'Update Password'}
                  {updating && 'Updating...'}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-security-info">
              <p><i className="fas fa-calendar-alt"></i> Last updated: {formatDate(profile.updatedAt || profile.createdAt)}</p>
              <p className="profile-security-tip">
                <i className="fas fa-lightbulb"></i> Tip: Use a strong password with letters, numbers, and symbols
              </p>
            </div>
          )}
        </div>
        
        {/* Danger Zone Card */}
        <div className="profile-card profile-danger-zone">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Danger Zone</h2>
          </div>
          
          <div className="profile-danger-content">
            <p><i className="fas fa-exclamation-triangle"></i> Once you delete your account, there is no going back. Please be certain.</p>
            <button
              className="profile-btn-delete"
              onClick={handleDeleteAccount}
            >
              <i className="fas fa-trash-alt"></i> Delete My Account
            </button>
          </div>
        </div>
      </div>
      
      {/* Professional Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="profile-delete-modal-overlay">
          <div className="profile-delete-modal">
            <div className="profile-delete-modal-header">
              <div className="profile-delete-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3>Delete Your Account</h3>
            </div>
            
            <div className="profile-delete-modal-body">
              <p>Are you sure you want to delete your account?</p>
              <div className="profile-delete-warnings">
                <div className="profile-delete-warning-item">
                  <span className="profile-warning-icon"><i className="fas fa-times"></i></span>
                  <span>All your bookings will be permanently deleted</span>
                </div>
                <div className="profile-delete-warning-item">
                  <span className="profile-warning-icon"><i className="fas fa-times"></i></span>
                  <span>Your reviews and feedback will be removed</span>
                </div>
                <div className="profile-delete-warning-item">
                  <span className="profile-warning-icon"><i className="fas fa-times"></i></span>
                  <span>This action cannot be undone</span>
                </div>
              </div>
              
              <div className="profile-delete-confirm-input">
                <label>
                  Type <strong>"DELETE"</strong> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type DELETE here"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="profile-delete-confirm-input-field"
                />
              </div>
            </div>
            
            <div className="profile-delete-modal-actions">
              <button
                className="profile-delete-cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
              <button
                className="profile-delete-confirm-btn"
                onClick={confirmDeleteAccount}
                disabled={deleteConfirmText !== "DELETE"}
              >
                <i className="fas fa-trash-alt"></i> Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;