import React, { useState } from "react";
import "./AdminRegistration.css";
import { useNavigate } from "react-router-dom";

const AdminRegistration = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpValidated, setIsOtpValidated] = useState(false);
  const [otpAttempted, setOtpAttempted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear errors when user types
    if (name === "email") {
      setEmailError("");
      setErrorMessage("");
    }
    if (name === "password" || name === "confirmPassword") {
      setErrorMessage("");
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const sendOTP = async () => {
    if (!formData.email) {
      setErrorMessage("Please enter an email first.");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    
    try {
      setOtpLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      setEmailError("");
      
      console.log("Sending OTP to:", formData.email);
      
      const response = await fetch(`${API_URL}/api/admin/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });
      
      const data = await response.json();
      console.log("OTP API Response:", data);
      
      if (response.ok) {
        setIsOtpSent(true);
        setOtpAttempted(false);
        setSuccessMessage(data.message || "✅ OTP sent to your email!");
        setErrorMessage("");
        
        // For development, show OTP in console
        if (data.data && data.data.otp) {
          console.log("📧 OTP for testing:", data.data.otp);
        }
      } else {
        if (data.message.includes("already exists")) {
          setEmailError(data.message);
        } else {
          setErrorMessage(data.message || "Failed to send OTP. Please try again.");
        }
        setIsOtpSent(false);
      }
    } catch (error) {
      console.error("OTP sending error:", error);
      setErrorMessage("Network error. Please check your connection.");
      setIsOtpSent(false);
    } finally {
      setOtpLoading(false);
    }
  };

  const validateOtp = async () => {
    if (!otp.trim()) {
      setErrorMessage("Please enter OTP");
      return;
    }
    
    if (!formData.email) {
      setErrorMessage("Email is required");
      return;
    }
    
    try {
      setOtpLoading(true);
      setErrorMessage("");
      
      const response = await fetch(`${API_URL}/api/admin/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: formData.email,
          otp: otp 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsOtpValidated(true);
        setOtpAttempted(true);
        setSuccessMessage(data.message || "✅ OTP verified successfully!");
        setErrorMessage("");
        
        // Store verification token for registration
        if (data.data && data.data.verificationToken) {
          setVerificationToken(data.data.verificationToken);
        }
      } else {
        setIsOtpValidated(false);
        setOtpAttempted(true);
        setErrorMessage(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP validation error:", error);
      setErrorMessage("Network error. Please try again.");
      setIsOtpValidated(false);
      setOtpAttempted(true);
    } finally {
      setOtpLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.adminName.trim()) {
      return "Admin name is required";
    }
    if (!formData.email.trim()) {
      return "Email is required";
    }
    if (!formData.password) {
      return "Password is required";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    if (!isOtpValidated) {
      return "Please verify OTP before registration";
    }
    if (!verificationToken) {
      return "Verification token missing. Please verify OTP again.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_URL}/api/admin/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminName: formData.adminName,
          email: formData.email,
          password: formData.password,
          verificationToken: verificationToken
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "✅ Admin registration successful!");
        setErrorMessage("");
        
        // Store token in localStorage
        if (data.data && data.data.token) {
          localStorage.setItem("adminToken", data.data.token);
          localStorage.setItem("adminData", JSON.stringify(data.data));
        }
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 2000);
      } else {
        setErrorMessage(data.message || "Registration failed. Please try again.");
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Network error. Please check your connection.");
      setSuccessMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate("/admin");
  };

  const handleResetForm = () => {
    setFormData({
      adminName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setOtp("");
    setVerificationToken("");
    setIsOtpSent(false);
    setIsOtpValidated(false);
    setOtpAttempted(false);
    setErrorMessage("");
    setSuccessMessage("");
    setEmailError("");
  };

  return (
    <div className="registration-page-wrapper">
      <div className="registration-container">
        <h2 className="registration-title">Admin Registration</h2>
        <p className="registration-subtitle">Create your admin account for Travel Guide</p>

        {/* Success & Error Messages */}
        {successMessage && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}
        
        {errorMessage && !emailError && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Admin Name */}
          <div className="form-group">
            <label htmlFor="adminName" className="form-label required">
              Full Name:
            </label>
            <input
              type="text"
              id="adminName"
              name="adminName"
              className="form-input"
              placeholder="Enter your full name"
              value={formData.adminName}
              onChange={handleChange}
              required
              disabled={!isOtpValidated || isLoading}
            />
          </div>

          {/* Email + OTP */}
          <div className="form-group">
            <label htmlFor="email" className="form-label required">
              Email Address:
            </label>
            <div className="email-otp-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                className="form-input email-input"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isOtpValidated || isLoading}
              />
              {!isOtpValidated && (
                <button
                  type="button"
                  className="send-otp-button"
                  onClick={sendOTP}
                  disabled={otpLoading || !formData.email || isOtpSent || isOtpValidated}
                >
                  {otpLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Sending...
                    </>
                  ) : isOtpSent ? (
                    "OTP Sent"
                  ) : (
                    "Send OTP"
                  )}
                </button>
              )}
            </div>
            <div className="otp-hint">
              <small>We'll send a verification code to this email</small>
            </div>
            {emailError && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i> {emailError}
              </div>
            )}
          </div>

          {/* OTP Validation */}
          {isOtpSent && !isOtpValidated && (
            <div className="form-group otp-group">
              <div className="otp-input-wrapper">
                <input
                  type="text"
                  className="otp-input"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength="6"
                  required
                  disabled={otpLoading}
                />
                <button
                  type="button"
                  onClick={validateOtp}
                  className="validate-otp-button"
                  disabled={otpLoading || !otp}
                >
                  {otpLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </div>
              <div className="otp-hint">
                <small>Enter the 6-digit code sent to your email</small>
              </div>
            </div>
          )}

          {/* OTP Status Messages */}
          {isOtpValidated && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle"></i> Email Verified Successfully
            </div>
          )}
          
          {!isOtpValidated && otpAttempted && (
            <div className="alert alert-error">
              <i className="fas fa-times-circle"></i> Invalid OTP. Please try again.
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label required">
              Password:
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="form-input"
                placeholder="Create a strong password (min. 6 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                disabled={!isOtpValidated || isLoading}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                disabled={!isOtpValidated || isLoading}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                <span className="toggle-text">
                  {showPassword ? "Hide" : "Show"}
                </span>
              </button>
            </div>
            <div className="password-hint">
              <small>Must be at least 6 characters</small>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label required">
              Confirm Password:
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={!isOtpValidated || isLoading}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
                disabled={!isOtpValidated || isLoading}
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
          {formData.password && formData.confirmPassword && (
            <div className={`password-match ${formData.password === formData.confirmPassword ? 'match' : 'no-match'}`}>
              {formData.password === formData.confirmPassword ? (
                <>
                  <i className="fas fa-check-circle"></i> Passwords match
                </>
              ) : (
                <>
                  <i className="fas fa-times-circle"></i> Passwords do not match
                </>
              )}
            </div>
          )}

          {/* Button Group */}
          <div className="button-group">
            <button
              type="submit"
              className="submit-button"
              disabled={!isOtpValidated || isLoading || (formData.password !== formData.confirmPassword)}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating Account...
                </>
              ) : (
                "Create Admin Account"
              )}
            </button>
            
            <button
              type="button"
              className="reset-button"
              onClick={handleResetForm}
              disabled={isLoading}
            >
              Reset Form
            </button>
          </div>

          {/* Login Redirect */}
          <div className="login-link">
            <p>Already have an admin account?{" "}
              <button type="button" onClick={handleLoginRedirect} className="login-link-btn" disabled={isLoading}>
                Login here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegistration;