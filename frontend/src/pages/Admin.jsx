import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./Admin.css";

const Admin = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // Add loading state for auth check


  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    setErrorMessage("");
    setShowRegistrationPrompt(false);
  };

  // Function to check if JWT token is expired (client-side check)
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // If can't decode, treat as expired
    }
  };

  // Check if user is already logged in WITH VALIDATION
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("adminToken");
      const adminData = localStorage.getItem("adminData");
      
      if (!token || !adminData) {
        setCheckingAuth(false);
        return;
      }
      
      // Check if token is expired (client-side)
      if (isTokenExpired(token)) {
        console.log('Token expired, clearing storage');
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        setCheckingAuth(false);
        return;
      }
      
      try {
        // Verify token with backend
        const data = await apiRequest("/admin/profile", "GET", null, token);
        
        const admin = JSON.parse(adminData);
        setSuccessMessage(`Welcome back, ${admin.adminName}! Redirecting to dashboard...`);
        
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1500);
      } catch (error) {
        console.error("Error checking auth status:", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        if (error.status === 401) {
          setErrorMessage("Session expired. Please login again.");
        }
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuthStatus();
  }, [navigate]);

  const validateForm = () => {
    if (!formData.email.trim()) {
      return "Email is required";
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }
    
    if (!formData.password) {
      return "Password is required";
    }
    
    return "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setErrorMessage("");
    setSuccessMessage("");
    setShowRegistrationPrompt(false);
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiRequest("/admin/login", "POST", {
        email: formData.email,
        password: formData.password
      });
      
      // Login successful
      setSuccessMessage(data.message || "✅ Login successful!");
      setErrorMessage("");
      setShowRegistrationPrompt(false);
        
        // Store token and admin data in localStorage
        if (data.data && data.data.token) {
          localStorage.setItem("adminToken", data.data.token);
          localStorage.setItem("adminData", JSON.stringify({
            _id: data.data._id,
            adminName: data.data.adminName,
            email: data.data.email
          }));
          
          // Dispatch storage event to update other components if needed
          window.dispatchEvent(new Event('storage'));
          
          // Redirect to admin dashboard after 1 second
          setTimeout(() => {
            navigate("/admin/dashboard", { replace: true});
            window.location.reload();
          }, 1000);
        }
    } catch (error) {
      console.error("Login error:", error);
      
      const errorMsg = error.message || "Login failed";
      
      // Case 1: No admin account found
      if (error.status === 404 || 
          errorMsg.toLowerCase().includes("no admin") || 
          errorMsg.toLowerCase().includes("not found") ||
          errorMsg.toLowerCase().includes("register first")) {
        setErrorMessage("❌ No admin account found with this email.");
        setShowRegistrationPrompt(true);
      }
      // Case 2: Incorrect password
      else if (error.status === 401 || 
                 errorMsg.toLowerCase().includes("password") || 
                 errorMsg.toLowerCase().includes("incorrect") ||
                 errorMsg.toLowerCase().includes("wrong")) {
        setErrorMessage("❌ Incorrect password. Please try again.");
        setShowRegistrationPrompt(false);
      }
      // Default error
      else {
        setErrorMessage(`❌ ${errorMsg}`);
      }
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setErrorMessage("🌐 Network error. Please check your internet connection and make sure the server is running.");
      } else {
        setErrorMessage("⚠️ An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manual logout function (for debugging)
  const handleManualLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    window.dispatchEvent(new Event('storage'));
    setSuccessMessage("");
    setErrorMessage("Logged out successfully! Please login again.");
    setFormData({ email: "", password: "" });
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="admin-page-wrapper">
        <div id="admin-container">
          <div className="loading-auth">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Checking authentication status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper">
      <div id="admin-container">
        <h2>Admin Login</h2>
        <p className="login-subtitle">Access your Travel Guide admin dashboard</p>

        {/* Debug: Clear Session Button */}
        <div className="debug-section" style={{ marginBottom: '15px', textAlign: 'center' }}>
          <button 
            onClick={handleManualLogout}
            className="logout-button"
            style={{
              padding: '6px 12px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              opacity: 0.7
            }}
            title="Clear any existing session"
          >
            Clear Session
          </button>
          <small style={{ display: 'block', color: '#666', marginTop: '5px', fontSize: '11px' }}>
            Use if auto-redirecting without login
          </small>
        </div>

        {/* Messages Display */}
        {successMessage && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {errorMessage}
          </div>
        )}

        {/* Registration Prompt */}
        {showRegistrationPrompt && (
          <div className="registration-prompt">
            <p>
              <i className="fas fa-user-plus"></i> Don't have an admin account?{" "}
              <Link to="/AdminRegistration" className="prompt-link">
                Click here to register
              </Link>
            </p>
            <small className="prompt-note">
              Or contact your system administrator if you should have access.
            </small>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label required">
              Email Address:
            </label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="Enter your admin email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label required">
              Password:
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                <span className="toggle-text">
                  {showPassword ? "Hide" : "Show"}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            id="submitBtn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Registration and Forgot Password Links */}
        <div className="register-link">
          <p>
            New admin? <Link to="/AdminRegistration">Create an account</Link>
          </p>
          <p className="forgot-password-link">
            <Link to="/admin-forgot-password">Forgot Password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;