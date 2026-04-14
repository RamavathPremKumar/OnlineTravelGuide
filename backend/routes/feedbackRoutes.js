const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const fs = require('fs');
const path = require('path');

// ✅ NEW: Get eligible bookings for feedback (completed & checkout passed)
// @route   GET /api/feedback/eligible-bookings
// @desc    Get user's bookings eligible for feedback
// @access  Private
router.get('/eligible-bookings', auth, async (req, res) => {
  try {
    const now = new Date();
    
    const eligibleBookings = await Booking.find({
      userId: req.user.id,
      status: 'Completed',
      checkout: { $lt: now }, // Checkout date passed
      feedbackGiven: false // No feedback given yet
    }).sort('-checkout');

    res.status(200).json({
      success: true,
      count: eligibleBookings.length,
      bookings: eligibleBookings
    });

  } catch (error) {
    console.error('Error fetching eligible bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching eligible bookings',
      error: error.message
    });
  }
});

// @route   POST /api/feedback
// @desc    Create new feedback (REQUIRES booking & checkout date passed)
// @access  Private
router.post('/', auth, upload.array('photos', 5), async (req, res) => {
  try {
    console.log('📝 Creating new feedback...');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    console.log('Files count:', req.files ? req.files.length : 0);

    const {
      destination, visitedDatesFrom, visitedDatesTo,
      overallRating, cleanliness, service, locationRating, value, comfort,
      title, detailedReview, suggestions, bookingId
    } = req.body;

    // ⚠️ REQUIRE BOOKING ID
    if (!bookingId || bookingId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'You must link to a booking to submit feedback'
      });
    }

    // Validate required fields
    if (!destination || !overallRating || !title || !detailedReview) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: destination, overallRating, title, detailedReview'
      });
    }

    // Validate detailed review length
    if (detailedReview.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Detailed review must be at least 50 characters'
      });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id
    });
    
    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Booking not found or does not belong to you'
      });
    }

    // ⚠️ CHECK IF CHECKOUT DATE HAS PASSED
    const today = new Date();
    const checkoutDate = new Date(booking.checkout);
    
    if (checkoutDate > today) {
      return res.status(400).json({
        success: false,
        message: `You can only give feedback after your checkout date (${checkoutDate.toLocaleDateString()})`
      });
    }

    // Check if feedback already exists for this booking
    const existingFeedback = await Feedback.findOne({ bookingId });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this booking'
      });
    }

    // Handle uploaded photos
    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const photoUrl = `/uploads/feedback-photos/${file.filename}`;
        photos.push(photoUrl);
      });
    }

    // Parse ratings
    const parsedRatings = {
      overallRating: parseInt(overallRating) || 0,
      cleanliness: parseInt(cleanliness) || 0,
      service: parseInt(service) || 0,
      locationRating: parseInt(locationRating) || 0,
      value: parseInt(value) || 0,
      comfort: parseInt(comfort) || 0,
    };

    // Create feedback
    const feedback = new Feedback({
      userId: req.user.id,
      userEmail: req.user.email,
      bookingId: bookingId,
      hotelName: booking.hotelName,
      location: booking.location,
      destination,
      visitedDatesFrom: visitedDatesFrom || null,
      visitedDatesTo: visitedDatesTo || null,
      ...parsedRatings,
      title,
      detailedReview,
      suggestions: suggestions || '',
      photos
    });

    console.log('📋 Feedback to save:', feedback);

    await feedback.save();
    
    // Update booking to mark feedback given
    booking.feedbackGiven = true;
    await booking.save();
    
    console.log('✅ Feedback saved successfully:', feedback._id);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        _id: feedback._id,
        title: feedback.title,
        destination: feedback.destination,
        averageRating: feedback.averageRating,
        photos: feedback.photos,
        isVerifiedStay: true
      }
    });

  } catch (error) {
    console.error('❌ Error creating feedback:', error);
    
    // Clean up uploaded files if error occurs
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback
// @desc    Get all feedback (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      minRating,
      destination,
      verifiedOnly
    } = req.query;

    const query = { status: 'active' };
    
    // Apply filters
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    
    if (destination) {
      query.destination = new RegExp(destination, 'i');
    }
    
    if (verifiedOnly === 'true') {
      query.bookingId = { $ne: null };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: {
        path: 'userId',
        select: 'fullname username emailVerified'
      }
    };

    const feedback = await Feedback.paginate(query, options);

    res.status(200).json({
      success: true,
      ...feedback
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/user
// @desc    Get feedback for logged-in user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ userId: req.user.id })
      .sort('-createdAt')
      .populate('bookingId', 'hotelName checkin checkout');

    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback
    });

  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/:id
// @desc    Get single feedback by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('userId', 'fullname username emailVerified')
      .populate('bookingId', 'hotelName checkin checkout roomType');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// @route   PUT /api/feedback/:id
// @desc    Update feedback (owner only)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or unauthorized'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'overallRating', 'cleanliness', 'service', 'locationRating',
      'value', 'comfort', 'title', 'detailedReview', 'suggestions',
      'destination', 'visitedDatesFrom', 'visitedDatesTo'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        feedback[field] = req.body[field];
      }
    });

    await feedback.save();

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: error.message
    });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback (owner only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or unauthorized'
      });
    }

    // Delete associated photos from filesystem
    if (feedback.photos && feedback.photos.length > 0) {
      feedback.photos.forEach(photoUrl => {
        const filename = path.basename(photoUrl);
        const filePath = path.join('uploads/feedback-photos', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await feedback.deleteOne();

    // Update booking's feedbackGiven status
    if (feedback.bookingId) {
      await Booking.findByIdAndUpdate(feedback.bookingId, { feedbackGiven: false });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting feedback',
      error: error.message
    });
  }
});

// @route   POST /api/feedback/:id/vote
// @desc    Vote helpful/not helpful
// @access  Private
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { isHelpful } = req.body;
    
    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isHelpful must be true or false'
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user already voted
    const existingVoteIndex = feedback.voters.findIndex(
      vote => vote.userId.toString() === req.user.id
    );

    if (existingVoteIndex > -1) {
      // Update existing vote
      const oldVote = feedback.voters[existingVoteIndex].isHelpful;
      
      if (oldVote && !isHelpful) {
        // Changed from helpful to not helpful
        feedback.helpfulCount--;
        feedback.notHelpfulCount++;
      } else if (!oldVote && isHelpful) {
        // Changed from not helpful to helpful
        feedback.notHelpfulCount--;
        feedback.helpfulCount++;
      }
      // If same vote, do nothing
      
      feedback.voters[existingVoteIndex].isHelpful = isHelpful;
      feedback.voters[existingVoteIndex].votedAt = new Date();
    } else {
      // Add new vote
      feedback.voters.push({
        userId: req.user.id,
        isHelpful,
        votedAt: new Date()
      });
      
      if (isHelpful) {
        feedback.helpfulCount++;
      } else {
        feedback.notHelpfulCount++;
      }
    }

    await feedback.save();

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      helpfulCount: feedback.helpfulCount,
      notHelpfulCount: feedback.notHelpfulCount
    });

  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording vote',
      error: error.message
    });
  }
});

// @route   POST /api/feedback/:id/report
// @desc    Report inappropriate feedback
// @access  Private
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user already reported
    const existingReport = feedback.reports.find(
      report => report.userId.toString() === req.user.id
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this feedback'
      });
    }

    // Add report
    feedback.reports.push({
      userId: req.user.id,
      reason: reason || 'Inappropriate content',
      reportedAt: new Date()
    });
    
    feedback.reportCount++;
    
    // Auto-flag if multiple reports
    if (feedback.reportCount >= 3) {
      feedback.status = 'reported';
    }

    await feedback.save();

    res.status(200).json({
      success: true,
      message: 'Feedback reported successfully'
    });

  } catch (error) {
    console.error('Error reporting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/bookings/without-feedback
// @desc    Get user's bookings without feedback
// @access  Private
router.get('/bookings/without-feedback', auth, async (req, res) => {
  try {
    const now = new Date();
    const bookings = await Booking.find({
      userId: req.user.id,
      status: 'Completed',
      checkout: { $lt: now }, // Checkout date passed
      feedbackGiven: false
    }).sort('-checkout');

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

// @route   POST /api/feedback/test-send-emails
// @desc    TEST: Manually trigger feedback emails
// @access  Private
router.post('/test-send-emails', auth, async (req, res) => {
  try {
    console.log('🚀 TEST: Manual email trigger requested by user:', req.user.email);
    
    // For testing, allow any authenticated user
    // In production, restrict to admin only
    
    const { sendFeedbackEmailsManually } = require('../utils/feedbackCron');
    
    // Call the manual function
    await sendFeedbackEmailsManually();
    
    res.status(200).json({
      success: true,
      message: 'Feedback emails sent manually for testing'
    });
    
  } catch (error) {
    console.error('❌ Error in manual email test:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test emails',
      error: error.message
    });
  }
});

module.exports = router;