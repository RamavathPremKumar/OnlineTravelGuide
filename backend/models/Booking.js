// backend/models/Booking.js - UPDATED
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  place: {
    type: String,
    required: true
  },
  hotelName: {
    type: String,
    required: true
  },
  hotelAddress: {
    type: String,
    required: true
  },
  priceRange: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High']
  },
  checkin: {
    type: Date,
    required: true
  },
  checkout: {
    type: Date,
    required: true
  },
  persons: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  rooms: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  roomType: {
    type: String,
    required: true,
    enum: ['Single', 'Double', 'Suite', 'Family']
  },
  payment: {
    type: String,
    required: true,
    enum: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer']
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
    default: 'Confirmed'
  },
  bookingId: {
    type: String,
    unique: true,
    default: () => 'BOOK' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  // Add this field to track if feedback was given
  feedbackGiven: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
bookingSchema.pre('save', async function() {
  if (this.isModified('priceRange') || this.isNew) {
    let basePrice = 0;
    switch(this.priceRange) {
      case 'Low': basePrice = 2000; break;
      case 'Medium': basePrice = 4500; break;
      case 'High': basePrice = 7500; break;
      default: basePrice = 3000;
    }
    this.totalAmount = basePrice;
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;