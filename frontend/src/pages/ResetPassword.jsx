import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./ResetPassword.css";

const API_BASE = "http://localhost:5000/api";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [token, setToken] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query params
    const queryParams = new URLSearchParams(location.search);
    const urlToken = queryParams.get("token");
    
    if (urlToken) {
      setToken(urlToken);
    } else {
      setErrorMessage("Invalid or missing reset token");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all fields");
      return;
    }
    
    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    
    if (!token) {
      setErrorMessage("Invalid reset token");
      return;
    }
    
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token,
          newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccessMessage("Password reset successful! Redirecting to login...");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error) {
      console.error("Reset password error:", error);
      setErrorMessage(error.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page-wrapper">
      <div className="reset-password-container">
        <h2 className="reset-password-title">Reset Password</h2>
        
        {successMessage && (
          <div className="alert alert-success">
            <div className="alert-content">
              <i className="fas fa-check-circle"></i>
              <div>
                <strong>{successMessage}</strong>
                <p>Redirecting to login page...</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <div className="alert-content">
              <i className="fas fa-exclamation-circle"></i>
              <div>
                <strong>Error!</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {!token ? (
          <div className="invalid-token-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Invalid or expired reset link. Please request a new password reset.</p>
            <Link to="/forgot-password" className="request-new-link">
              Request New Reset Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label required">
                New Password:
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                className="form-input"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                minLength="6"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label required">
                Confirm Password:
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                className="form-input"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="password-toggle">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox-custom"></span>
                Show passwords
              </label>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Resetting...
                </>
              ) : (
                <>
                  <i className="fas fa-key"></i> Reset Password
                </>
              )}
            </button>
          </form>
        )}

        <div className="back-to-login">
          <p>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;