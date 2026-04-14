const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const feedbackSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
  },
  userEmail: {
    type: String,
    required: true
  },
  
  // Optional Booking Reference (for verified stays)
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  hotelName: {
    type: String
  },
  location: {
    type: String
  },
  
  // Destination Info
  destination: {
    type: String,
    required: true
  },
  visitedDatesFrom: {
    type: Date
  },
  visitedDatesTo: {
    type: Date
  },
  
  // Ratings (1-5 stars)
  overallRating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  cleanliness: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  service: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  locationRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  value: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  comfort: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  averageRating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Review Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  detailedReview: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 5000
  },
  suggestions: {
    type: String,
    maxlength: 1000
  },
  
  // Photos
  photos: [{
    type: String,
  }],
  
  // Social Features
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  voters: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isHelpful: Boolean,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Report/Moderation
  reports: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'reported', 'removed', 'pending'],
    default: 'active'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate average rating before saving - FIXED VERSION
feedbackSchema.pre('save', async function() {
  const ratings = [
    this.overallRating,
    this.cleanliness || 0,
    this.service || 0,
    this.locationRating || 0,
    this.value || 0,
    this.comfort || 0
  ].filter(rating => rating > 0);
  
  if (ratings.length > 0) {
    this.averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  } else {
    this.averageRating = this.overallRating;
  }
  
  this.updatedAt = new Date();
});

// Update booking's feedbackGiven when feedback is created
feedbackSchema.post('save', async function() {
  if (this.bookingId) {
    try {
      const Booking = mongoose.model('Booking');
      await Booking.findByIdAndUpdate(this.bookingId, { feedbackGiven: true });
    } catch (error) {
      console.error('Error updating booking feedbackGiven:', error);
      // Don't throw error, just log it
    }
  }
});

// Virtual for verified stay badge
feedbackSchema.virtual('isVerifiedStay').get(function() {
  return !!this.bookingId;
});

// Indexes
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ bookingId: 1 });
feedbackSchema.index({ averageRating: -1 });
feedbackSchema.index({ helpfulCount: -1 });
feedbackSchema.index({ status: 1 });

// PLUGIN MUST BE ADDED BEFORE CREATING MODEL
feedbackSchema.plugin(mongoosePaginate);

// CREATE MODEL AFTER PLUGIN
const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;