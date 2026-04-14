// backend/routes/bookingRoutes.js - UPDATED
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/emailService');
const auth = require('../middleware/auth');

// Create a new booking (Protected) - REMOVE /bookings
router.post('/', auth, async (req, res) => {
  try {
    const {
      userName, email, phone, address, location, place,
      hotelName, hotelAddress, agentName, agentId,
      accommodationType, priceRange, checkin, checkout,
      persons,rooms, roomType, specialNeeds, payment, additionalServices
    } = req.body;

    // Create new booking
    const booking = new Booking({
      userId: req.user.id,
      userName,
      email,
      phone,
      address,
      location,
      place,
      hotelName,
      hotelAddress,
      agentName,
      agentId,
      accommodationType,
      priceRange,
      checkin: new Date(checkin),
      checkout: new Date(checkout),
      persons,
      rooms,
      roomType,
      specialNeeds,
      payment,
      additionalServices: additionalServices || []
    });

    // Save booking
    await booking.save();

    // Send confirmation email
    try {
      await sendEmail(
        email,
        'bookingConfirmation',
        {
          bookingId: booking.bookingId,
          ...booking.toObject()
        },
        {
          fullname: userName,
          email: email
        }
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking,
      emailSent: true
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
});

// Get all bookings for current user (Protected) - REMOVE /bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ bookingDate: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// Get single booking by ID (Protected - only owner) - REMOVE /bookings
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
});

// Update booking (Protected - only owner) - REMOVE /bookings
router.put('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
});

// Cancel booking (Protected - only owner) - REMOVE /bookings
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'Cancelled' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

// Admin: Get all bookings (Protected - admin only)
router.get('/admin/bookings', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const bookings = await Booking.find()
      .populate('userId', 'fullname email')
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// Add this after your existing routes but before module.exports

// ==================== AUTO STATUS UPDATE ====================

// Update booking status automatically (Confirmed → Completed after checkout)
router.patch('/update-statuses', auth, async (req, res) => {
  try {
    const now = new Date();
    
    // Update bookings where checkout date has passed
    const result = await Booking.updateMany(
      {
        userId: req.user.id, // Only user's bookings
        status: 'Confirmed',
        checkout: { $lt: now } // Checkout date has passed
      },
      {
        $set: { 
          status: 'Completed',
          updatedAt: new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Booking statuses updated',
      modifiedCount: result.modifiedCount,
      now: now.toISOString()
    });
  } catch (error) {
    console.error('Error updating booking statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating statuses',
      error: error.message
    });
  }
});

// Get bookings with actual status (auto-calculated)
router.get('/my-bookings/with-actual-status', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ bookingDate: -1 })
      .select('-__v');

    const now = new Date();
    
    // Add actual status to each booking
    const bookingsWithActualStatus = bookings.map(booking => {
      const bookingObj = booking.toObject();
      const checkoutDate = new Date(booking.checkout);
      
      // Auto-complete if checkout date passed
      let actualStatus = booking.status;
      if (booking.status === 'Confirmed' && checkoutDate < now) {
        actualStatus = 'Completed';
        
        // Optional: Auto-update in database
        if (req.query.autoUpdate === 'true') {
          booking.status = 'Completed';
          booking.save(); // Async, but we don't wait
        }
      }
      
      return {
        ...bookingObj,
        actualStatus,
        isPastCheckout: checkoutDate < now
      };
    });

    res.status(200).json({
      success: true,
      count: bookingsWithActualStatus.length,
      bookings: bookingsWithActualStatus
    });
  } catch (error) {
    console.error('Error fetching bookings with actual status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// Cron job endpoint to update all user bookings (Admin/System)
router.post('/system/update-all-statuses', async (req, res) => {
  try {
    // Add a secret key for security
    const systemKey = req.headers['x-system-key'];
    if (systemKey !== process.env.SYSTEM_CRON_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Find all bookings that need status update
    const bookingsToUpdate = await Booking.find({
      status: 'Confirmed',
      checkout: { 
        $lt: yesterday, // Checked out at least 1 day ago
        $gt: new Date('2020-01-01') // Valid date
      }
    });

    let updatedCount = 0;
    let errors = [];

    for (const booking of bookingsToUpdate) {
      try {
        booking.status = 'Completed';
        booking.updatedAt = new Date();
        await booking.save();
        updatedCount++;
      } catch (error) {
        errors.push({
          bookingId: booking.bookingId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'All booking statuses updated',
      updatedCount,
      totalFound: bookingsToUpdate.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('System status update error:', error);
    res.status(500).json({
      success: false,
      message: 'System update failed',
      error: error.message
    });
  }
});

module.exports = router;