const express = require('express');
const router = express.Router();
const {
  sendAdminOTP,
  verifyAdminOTP,
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  getAdminDashboard,
  forgotAdminPassword,    // Make sure this is exported
  resetAdminPassword      // Make sure this is exported
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/send-otp', sendAdminOTP);
router.post('/verify-otp', verifyAdminOTP);
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/forgot-password', forgotAdminPassword);
router.post('/reset-password/:token', resetAdminPassword); // Fixed typo

// Protected routes (require admin authentication)
router.get('/profile', protect, getAdminProfile);
router.put('/profile', protect, updateAdminProfile);
router.get('/dashboard', protect, getAdminDashboard);

module.exports = router;