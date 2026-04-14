import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import "./Login.css";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateForm = () => {
    const errors = {};
    
    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", "POST", { 
        email: email.trim(), 
        password 
      });

      // Login successful
      const welcomeMessage = data.user?.fullname 
        ? `Welcome back, ${data.user.fullname}!`
        : "Login successful!";
      
      setSuccessMessage(welcomeMessage);
      
      // Store user data in localStorage
      if (data.token) {
         login(data.token, data.user); 
        
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }
      }

      // Clear form
      setEmail("");
      setPassword("");
      setRememberMe(false);

      // Trigger navbar update
      window.dispatchEvent(new Event('storage'));

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error) {
      if (error.status === 401) {
        if (error.data?.message && error.data.message.includes('No account found')) {
          setErrorMessage(`${error.data.message} <a href="/register" style="color: #4CAF50; text-decoration: underline;">Create an account</a>`);
        } else {
          setErrorMessage(error.message);
        }
      } else if (error.status === 403) {
        setErrorMessage("Account is deactivated. Please contact support.");
      } else if (error.status === 422) {
        const backendErrors = error.data?.errors || {};
        const formattedErrors = {};
        Object.keys(backendErrors).forEach(key => {
          formattedErrors[key] = backendErrors[key].msg || backendErrors[key];
        });
        setFieldErrors(formattedErrors);
        setErrorMessage(error.message || "Validation failed");
      } else if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        setErrorMessage("Network error. Please check your connection and try again.");
      } else {
        setErrorMessage(error.message || "Login failed. Please try again.");
      }
      
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter, fieldName) => (e) => {
    setter(e.target.value);
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        <p className="login-subtitle">Please enter your credentials to access your account</p>

        {/* Success Message at the TOP */}
        {successMessage && (
          <div className="alert alert-success success-top-message">
            <div className="alert-content">
              <i className="fas fa-check-circle"></i>
              <div>
                <strong>{successMessage}</strong>
                <p>Redirecting to homepage...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message at the TOP */}
        {errorMessage && (
          <div className="alert alert-error error-top-message">
            <div className="alert-content">
              <i className="fas fa-exclamation-circle"></i>
              <div>
                <strong>Login Failed!</strong>
                <p dangerouslySetInnerHTML={{ __html: errorMessage }}></p>
              </div>
            </div>
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label required">
              Email Address:
            </label>
            <input
              type="email"
              id="email"
              className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="Enter your email address"
              value={email}
              onChange={handleInputChange(setEmail, 'email')}
              required
              disabled={loading}
              autoComplete="email"
            />
            {/* Field-specific error BELOW the input */}
            {fieldErrors.email && (
              <div className="error-message field-error">
                <i className="fas fa-exclamation-circle"></i> {fieldErrors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label required">
              Password:
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handleInputChange(setPassword, 'password')}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <span className="password-toggle-btn" onClick={togglePasswordVisibility}>
                 <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
              </span>
            </div>
            {/* Field-specific error BELOW the input */}
            {fieldErrors.password && (
              <div className="error-message field-error">
                <i className="fas fa-exclamation-circle"></i> {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Remember Me */}
          <div className="form-options">
            <div className="remember-me">
              <label htmlFor="rememberMe" className="custom-checkbox-label">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="custom-checkbox"></span>
                Remember Me
              </label>
            </div>
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className={`submit-button ${loading ? 'button-loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Logging in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Login
              </>
            )}
          </button>

          {/* Divider */}
          <div className="divider">
            <span>OR</span>
          </div>

          {/* Register Link */}
          <div className="register-link">
            <p>
              New user? <Link to="/register" className="register-link-text">Create an account</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;