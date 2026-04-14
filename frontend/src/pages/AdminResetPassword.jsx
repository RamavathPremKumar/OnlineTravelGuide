import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./ResetPassword.css";

const AdminResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [token, setToken] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    // Get token from URL path parameter
    const pathSegments = location.pathname.split('/');
    const tokenFromUrl = pathSegments[pathSegments.length - 1];
    
    if (tokenFromUrl && tokenFromUrl !== 'reset-password') {
      setToken(tokenFromUrl);
    } else {
      setErrorMessage("Invalid or missing reset token");
    }
  }, [location]);

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

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
      const response = await fetch(`${API_BASE}/api/admin/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          password: newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccessMessage("Password reset successful! Redirecting to admin login...");

      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");

      window.dispatchEvent(new Event('storage'));
      
      // Redirect to admin login after 3 seconds
      setTimeout(() => {
        navigate("/admin");
      }, 3000);

    } catch (error) {
      console.error("Admin reset password error:", error);
      
      if (error.message.includes("expired") || error.message.includes("Invalid")) {
        setErrorMessage("Reset link has expired or is invalid. Please request a new reset link.");
      } else {
        setErrorMessage(error.message || "Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!newPassword) return { text: "", color: "" };
    
    const length = newPassword.length;
    if (length < 6) return { text: "Weak", color: "#e74c3c" };
    if (length < 10) return { text: "Medium", color: "#f39c12" };
    return { text: "Strong", color: "#27ae60" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="reset-password-page-wrapper">
      <div className="reset-password-container">
        <h2 className="reset-password-title">Admin Password Reset</h2>
        
        {successMessage && (
          <div className="alert alert-success">
            <div className="alert-content">
              <i className="fas fa-check-circle"></i>
              <div>
                <strong>{successMessage}</strong>
                <p>Redirecting to admin login page...</p>
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
            <Link to="/admin/forgot-password" className="request-new-link">
              Request New Reset Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label required">
                New Password:
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  className="form-input"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  minLength="6"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={toggleNewPasswordVisibility}
                  disabled={loading}
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  <i className={showNewPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  <span className="toggle-text">
                    {showNewPassword ? "Hide" : "Show"}
                  </span>
                </button>
              </div>
              
              {newPassword && (
                <div className="password-strength-indicator">
                  <span>Strength: </span>
                  <span style={{ color: passwordStrength.color, fontWeight: "bold" }}>
                    {passwordStrength.text}
                  </span>
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${Math.min((newPassword.length / 12) * 100, 100)}%`,
                        backgroundColor: passwordStrength.color 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label required">
                Confirm Password:
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={toggleConfirmPasswordVisibility}
                  disabled={loading}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  <span className="toggle-text">
                    {showConfirmPassword ? "Hide" : "Show"}
                  </span>
                </button>
              </div>
            </div>

            {/* Password Match Indicator */}
            {newPassword && confirmPassword && (
              <div className={`password-match-indicator ${newPassword === confirmPassword ? 'match' : 'no-match'}`}>
                <i className={`fas fa-${newPassword === confirmPassword ? 'check' : 'times'}-circle`}></i>
                {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}

            <div className="password-toggle-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showNewPassword && showConfirmPassword}
                  onChange={(e) => {
                    setShowNewPassword(e.target.checked);
                    setShowConfirmPassword(e.target.checked);
                  }}
                  disabled={loading}
                />
                <span className="checkbox-custom"></span>
                Show both passwords
              </label>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Resetting...
                </>
              ) : (
                <>
                  <i className="fas fa-key"></i> Reset Admin Password
                </>
              )}
            </button>
          </form>
        )}

        <div className="back-to-login">
          <p>
            Remember your password? <Link to="/admin">Back to Admin Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;