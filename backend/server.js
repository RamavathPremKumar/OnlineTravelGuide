const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/locationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes); 
app.use('/api/search', searchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin',adminRoutes);
app.use('/api/db', databaseRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Travel Guide API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== START CRON JOBS ====================
// Start feedback email cron job (for testing, always enable)
try {
  const { feedbackCronJob } = require('./utils/feedbackCron');
  feedbackCronJob.start();
  console.log('📧 Feedback email cron job started');
  console.log('⏰ Schedule: Daily at 10:00 AM');
} catch (error) {
  console.error('❌ Failed to start feedback cron job:', error.message);
  console.log('💡 Tip: Make sure you have:');
  console.log('   1. Created backend/utils/feedbackCron.js');
  console.log('   2. Created backend/utils/feedbackEmailService.js');
  console.log('   3. Installed: npm install node-cron');
}

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🗺️ Location API: http://localhost:${PORT}/api/locations`);
  console.log(`📅 Booking API: http://localhost:${PORT}/api/bookings`);
  console.log(`👑 Admin API: http://localhost:${PORT}/api/admin`);
});