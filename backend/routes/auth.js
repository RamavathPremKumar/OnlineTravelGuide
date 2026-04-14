const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendOTPEmail, generateOTP, sendPasswordResetEmail } = require('../services/otpService');
const jwt = require('jsonwebtoken');

// 1. Send OTP for Registration
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP temporarily (in production, use Redis or DB)
    // For now, we'll send it directly
    
    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: 'OTP sent successfully',
        otp: otp, // Remove in production - only for testing
        expiresIn: '10 minutes'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// 2. Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // In production: Verify OTP from Redis/DB
    // For now, we'll accept any 6-digit OTP for testing
    
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP format' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      emailVerified: true
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// 3. Register User
// 3. Register User
router.post('/register', async (req, res) => {
  try {
    console.log("📝 Register request received:", req.body);
    
    const { fullname, username, email, phone, password } = req.body;
    
    // Validation
    if (!fullname || !username || !email || !phone || !password) {
      console.log("❌ Missing fields:", { fullname, username, email, phone, password });
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Check if user exists
    console.log("🔍 Checking for existing user...");
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log("❌ User already exists");
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    // Create new user
    console.log("🆕 Creating new user...");
    const user = new User({
      fullname,
      username,
      email,
      phone,
      password,
      emailVerified: true
    });
    
    console.log("💾 Saving user to database...");
    await user.save();
    console.log("✅ User saved successfully:", user._id);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log("🎉 Registration complete for:", email);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email
      },
      token
    });
    
  } catch (error) {
    console.error("❌ REGISTRATION ERROR:", error.message);
    console.error("Full error:", error);
    
    // More specific error messages
    let errorMessage = 'Registration failed';
    if (error.code === 11000) {
      errorMessage = 'Email or username already exists';
    } else if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(err => err.message).join(', ');
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 4. Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'No account found with this email. Please create an account.'  
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Incorrect password. Please try again.'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email
      },
      token
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// 5. Forgot Password - Send Reset Link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Email not registered
      return res.status(404).json({ 
        success: false, 
        message: 'Email not found. Please check your email or register first.' 
      });
    }
    
    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Create reset URL
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    
    // Send email with reset link
    const emailResult = await sendPasswordResetEmail(email, resetUrl);
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Password reset link has been sent to your email.',
        // For testing only - remove in production:
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset email. Please try again.' 
      });
    }
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// 6. Reset Password (You'll need this too)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token purpose
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token has expired. Please request a new one.' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;