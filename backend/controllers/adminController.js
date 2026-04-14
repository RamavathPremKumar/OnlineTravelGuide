const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, generateOTP } = require('../services/otpService');
const nodemailer = require('nodemailer');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (adminEmail, resetToken, adminName) => {
  try {
    const transporter = createTransporter();
    
    // Create reset URL (frontend route)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: `"Travel Guide Admin" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: 'Admin Password Reset Request - Travel Guide',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4a6cf7, #3a5ce5); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Travel Guide Admin</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="padding: 40px; background: #ffffff;">
            <h2 style="color: #333; margin-top: 0;">Hello ${adminName || 'Admin'},</h2>
            
            <p style="color: #555; line-height: 1.6;">
              We received a request to reset your password for the Travel Guide Admin Panel.
              Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; 
                        padding: 14px 30px; 
                        background: linear-gradient(135deg, #4a6cf7, #3a5ce5); 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold;
                        font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              Or copy and paste this link into your browser:
            </p>
            
            <div style="background: #f8f9fa; 
                       padding: 15px; 
                       border-radius: 6px; 
                       border-left: 4px solid #4a6cf7;
                       margin: 20px 0;
                       word-break: break-all;">
              <code style="color: #333;">${resetUrl}</code>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Note:</strong> This link will expire in 1 hour for security reasons.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777;">
              <p style="margin: 5px 0;">If you didn't request a password reset, please ignore this email.</p>
              <p style="margin: 5px 0;">For security reasons, please do not share this email with anyone.</p>
            </div>
            
            <p style="color: #555; margin-top: 30px;">
              Best regards,<br>
              <strong>Travel Guide Admin Team</strong>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Travel Guide. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// @desc    Send OTP to email for admin registration
// @route   POST /api/admin/send-otp
// @access  Public
const sendAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP temporarily with expiry
    otpStore.set(email, {
      otp,
      expiresAt: otpExpiry,
      attempts: 0
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'OTP sent successfully to your email',
        data: {
          email: email,
          // For development/testing, include OTP in response
          otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }
      });
    } else {
      // Remove OTP from store if email failed
      otpStore.delete(email);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify OTP for admin registration
// @route   POST /api/admin/verify-otp
// @access  Public
const verifyAdminOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Get stored OTP
    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (new Date() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check if too many attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      otpStore.set(email, storedData);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Attempts left: ' + (3 - storedData.attempts)
      });
    }

    // OTP is valid
    // Mark email as verified (store verification token)
    const verificationToken = jwt.sign(
      { email, type: 'email_verification' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30m' }
    );

    // Remove OTP from store after successful verification
    otpStore.delete(email);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email: email,
        verificationToken: verificationToken
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Register new admin (after OTP verification)
// @route   POST /api/admin/register
// @access  Public
const registerAdmin = async (req, res) => {
  try {
    const { adminName, email, password, verificationToken } = req.body;

    // Validation
    if (!adminName || !email || !password || !verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Verify the verification token
    try {
      const decoded = jwt.verify(
        verificationToken,
        process.env.JWT_SECRET || 'your-secret-key'
      );

      if (decoded.email !== email || decoded.type !== 'email_verification') {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification token'
        });
      }
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        message: 'Verification token expired or invalid. Please restart registration.'
      });
    }

    // Check if admin already exists (double-check)
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Create admin
    const admin = await Admin.create({
      adminName,
      email,
      password
    });

    if (admin) {
      // Generate authentication token
      const token = generateToken(admin._id);

      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        data: {
          _id: admin._id,
          adminName: admin.adminName,
          email: admin.email,
          token: token
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid admin data'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Authenticate admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found with this email. Please register first.'
      });
    }

    // Check password
    const isPasswordMatch = await admin.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    // Generate token
    const token = generateToken(admin._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: admin._id,
        adminName: admin.adminName,
        email: admin.email,
        token: token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/admin/forgot-password
// @access  Public
// @desc    Forgot password - send reset email
// @route   POST /api/admin/forgot-password
// @access  Public
const forgotAdminPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin found with this email address'
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: admin._id, type: 'password_reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // FIX: Use updateOne instead of save() to avoid triggering password middleware
    await Admin.updateOne(
      { _id: admin._id },
      {
        resetPasswordToken: resetToken,
        resetPasswordExpires: Date.now() + 3600000 // 1 hour
      }
    );

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, resetToken, admin.adminName);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Password reset link has been sent to your email',
        // Only include reset URL in development
        ...(process.env.NODE_ENV === 'development' && { 
          resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reset-password/${resetToken}`
        })
      });
    } else {
      // Remove reset token if email failed
      await Admin.updateOne(
        { _id: admin._id },
        {
          resetPasswordToken: undefined,
          resetPasswordExpires: undefined
        }
      );
      
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// @desc    Reset password with token
// @route   POST /api/admin/reset-password/:token
// @access  Public
const resetAdminPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      );
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check token type
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Find admin by ID and check token
    const admin = await Admin.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    admin.password = password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: admin
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private
const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update fields
    if (req.body.adminName) admin.adminName = req.body.adminName;
    if (req.body.email) admin.email = req.body.email;

    // If updating password
    if (req.body.password) {
      admin.password = req.body.password;
    }

    const updatedAdmin = await admin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedAdmin._id,
        adminName: updatedAdmin.adminName,
        email: updatedAdmin.email
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private
const getAdminDashboard = async (req, res) => {
  try {
    const totalAdmins = await Admin.countDocuments();

    res.json({
      success: true,
      message: 'Dashboard data retrieved',
      data: {
        admin: {
          _id: req.admin._id,
          name: req.admin.adminName,
          email: req.admin.email,
          createdAt: req.admin.createdAt
        },
        stats: {
          totalAdmins: totalAdmins
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  sendAdminOTP,
  verifyAdminOTP,
  registerAdmin,
  loginAdmin,
  forgotAdminPassword,
  resetAdminPassword,
  getAdminProfile,
  updateAdminProfile,
  getAdminDashboard
};