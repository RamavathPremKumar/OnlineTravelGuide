const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Phone number must be 10 digits']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  // OTP Verification Fields
  emailVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date,
    generatedAt: Date
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
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
});

// FIX: Hash password before saving - SIMPLIFIED VERSION
userSchema.pre('save', async function() {
  try {
    console.log('🔐 PRE-SAVE middleware running for:', this.email);
    
    // Always update timestamp
    this.updatedAt = new Date();
    
    // Only hash password if it's modified (or new)
    if (this.isModified('password')) {
      console.log('🔄 Password needs hashing');
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      console.log('✅ Password hashed successfully');
    } else {
      console.log('⚠️ Password not modified, skipping hash');
    }
  } catch (error) {
    console.error('❌ Error in pre-save middleware:', error);
    throw error; // Let Mongoose handle the error
  }
});

// Alternative: If above doesn't work, use this WORKING version:
// userSchema.pre('save', async function() {
//   this.updatedAt = new Date();
//   
//   if (this.isModified('password')) {
//     try {
//       const salt = await bcrypt.genSalt(10);
//       this.password = await bcrypt.hash(this.password, salt);
//     } catch (error) {
//       throw error;
//     }
//   }
// });

// Generate OTP method
userSchema.methods.generateAndSaveOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  this.otp = {
    code: otp,
    expiresAt: expiresAt,
    generatedAt: new Date()
  };
  
  return this.save().then(() => otp);
};

// Verify OTP method
userSchema.methods.verifyOTP = function(inputOTP) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return { valid: false, message: 'OTP not generated' };
  }
  
  if (Date.now() > this.otp.expiresAt) {
    return { valid: false, message: 'OTP expired' };
  }
  
  if (this.otp.code !== inputOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // Clear OTP after successful verification
  this.otp = undefined;
  this.emailVerified = true;
  
  return this.save()
    .then(() => ({ valid: true, message: 'OTP verified successfully' }))
    .catch(error => ({ valid: false, message: 'Error saving verification' }));
};

// Clear OTP method (after successful verification or expiry)
userSchema.methods.clearOTP = function() {
  this.otp = undefined;
  return this.save();
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;