import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./Register.css";

const Register = () => {
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpValidated, setIsOtpValidated] = useState(false);
  const [otpAttempted, setOtpAttempted] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const sendOTP = async () => {
    if (!email) {
      setErrorMessage("Please enter email address first");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    
    setOtpLoading(true);
    setErrorMessage("");
    
    try {
      const data = await apiRequest("/auth/send-otp", "POST", { email });
      
      setIsOtpSent(true);
      setOtpAttempted(false);
      setSuccessMessage("OTP sent to your email! Check your inbox.");
      
      // For testing - show OTP in console (remove in production)
      console.log("Test OTP:", data.otp);
      
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const validateOtp = async () => {
    if (!otp) {
      setErrorMessage("Please enter OTP");
      return;
    }
    
    if (otp.length !== 6) {
      setErrorMessage("OTP must be 6 digits");
      return;
    }
    
    setOtpLoading(true);
    setErrorMessage("");
    
    try {
      const data = await apiRequest("/auth/verify-otp", "POST", { email, otp });
      
      setIsOtpValidated(true);
      setOtpAttempted(true);
      setSuccessMessage("OTP verified successfully! You can continue.");
      
    } catch (error) {
      setErrorMessage("Invalid OTP. Please check and try again.");
      setIsOtpValidated(false);
      setOtpAttempted(true);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setErrorMessage("");
    setSuccessMessage("");
    
    // Validation checks in order
    if (!isOtpValidated) {
      setErrorMessage("Please verify OTP before proceeding");
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    
   
    
    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setErrorMessage("Phone number must be exactly 10 digits");
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        fullname,
        username,
        email,
        phone,
        password,
      };
      
      const data = await apiRequest("/auth/register", "POST", userData);
      
      // Registration successful - Update UI immediately
      setSuccessMessage("🎉 Registration successful! You are now logged in.");
      
      // Store token and user data
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Trigger Navbar update by dispatching a storage event
        window.dispatchEvent(new Event('storage'));
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
      
    } catch (error) {
      setErrorMessage(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page-wrapper ">
      <div className="registration-container">
        <h2 className="registration-title">Create Account</h2>

        {successMessage && !errorMessage && ( 
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )
        }

        {errorMessage && !isOtpValidated && !otpAttempted && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {errorMessage}
          </div>
        )}
        
        <form id="registration-form" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullname" className="form-label required">Full Name:</label>
            <input
              type="text"
              id="fullname"
              className="form-input"
              placeholder="Enter your full name"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
            />
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="username" className="form-label required">Username:</label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Email + OTP */}
          <div className="form-group">
            <label htmlFor="email" className="form-label required">Email Address:</label>
            <div className="email-otp-wrapper">
              <input
                type="email"
                id="email"
                className="form-input email-input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isOtpSent}
              />
              <button 
                type="button" 
                onClick={sendOTP} 
                className="send-otp-button"
                disabled={!email || otpLoading || isOtpSent}
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
            </div>
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
                />
                <button 
                  type="button" 
                  onClick={validateOtp} 
                  className="validate-otp-button"
                  disabled={otpLoading}
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
              <i className="fas fa-check-circle"></i> OTP Verified Successfully
            </div>
          )}
          
          {!isOtpValidated && otpAttempted && (
            <div className="alert alert-error">
              <i className="fas fa-times-circle"></i> Invalid OTP. Please try again.
            </div>
          )}

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label required">Phone Number:</label>
            <input
              type="tel"
              id="phone"
              className="form-input"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pattern="^\d{10}$"
              disabled={!isOtpValidated}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label required">Password:</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-input"
                placeholder="Enter your password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isOtpValidated}
                minLength="6"
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                disabled={!isOtpValidated}
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
            <label htmlFor="confirm-password" className="form-label required">Confirm Password:</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                className="form-input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!isOtpValidated}
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
                disabled={!isOtpValidated}
              >
                <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                <span className="toggle-text">
                  {showConfirmPassword ? "Hide" : "Show"}
                </span>
              </button>
            </div>
          </div>

          {/* Password Match Indicator */}
          {password && confirmPassword && (
            <div className={`password-match ${password === confirmPassword ? 'match' : 'no-match'}`}>
              {password === confirmPassword ? (
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

          

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-button" 
            disabled={!isOtpValidated ||  loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Registering...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Success & Error Messages */}
        
        
        

        {/* Login Link */}
        <div className="login-link">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;