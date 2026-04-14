// backend/utils/feedbackCron.js
const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendFeedbackRequestEmail } = require('./feedbackEmailService');
const User = require('../models/User');

// Schedule: Run every day at 9:00 AM
const feedbackCronJob = cron.schedule('0 10 * * *', async () => {
  console.log('🕒 Running feedback email cron job...');
  
  try {
    // Find bookings where:
    // 1. Checkout was yesterday (completed stay)
    // 2. feedbackGiven is false
    // 3. feedbackRequestSent is not true (if you add this field)
    // 4. Status is 'Completed'
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate()-1);
    
    const eligibleBookings = await Booking.find({
      checkout: { 
        $gte: yesterday,
        $lte: today
      },
      feedbackGiven: false,
      status: 'Completed'
    }).populate('userId', 'email fullname username');
    
    console.log(`📊 Found ${eligibleBookings.length} eligible bookings for feedback requests`);
    
    let sentCount = 0;
    let errorCount = 0;
    
    for (const booking of eligibleBookings) {
      try {
        // Get user data
        const user = await User.findById(booking.userId);
        
        if (!user || !user.email) {
          console.log(`⚠️ No user/email found for booking ${booking.bookingId}`);
          continue;
        }
        
        // Send feedback request email
        await sendFeedbackRequestEmail(
          user.email,
          booking.toObject(),
          {
            fullname: user.fullname,
            email: user.email
          }
        );
        
        // Update booking to mark feedback request sent
        // You can add a field like feedbackRequestSent: true
        booking.feedbackRequestSent = true;
        booking.feedbackRequestSentAt = new Date();
        await booking.save();
        
        sentCount++;
        console.log(`📧 Sent feedback request for booking ${booking.bookingId} to ${user.email}`);
        
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to send feedback email for booking ${booking.bookingId}:`, error.message);
      }
    }
    
    console.log(`✅ Feedback cron job completed. Sent: ${sentCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata" // Change to your timezone
});

// Manual trigger for testing
// Manual trigger for testing
const sendFeedbackEmailsManually = async () => {
  console.log('🚀 MANUAL TRIGGER: Sending feedback emails NOW...');
  
  try {
    // For testing: Find ALL bookings without feedback (not just yesterday)
    const now = new Date();
    
    const eligibleBookings = await Booking.find({
      checkout: { $lt: now }, // Any past checkout
      feedbackGiven: false,
      status: 'Completed'
    }).populate('userId', 'email fullname');
    
    console.log(`📊 TEST: Found ${eligibleBookings.length} eligible bookings`);
    
    if (eligibleBookings.length === 0) {
      console.log('ℹ️ No eligible bookings found. Create a test booking first!');
      return { sentCount: 0, errorCount: 0, message: 'No eligible bookings' };
    }
    
    let sentCount = 0;
    let errorCount = 0;
    
    for (const booking of eligibleBookings) {
      try {
        if (!booking.userId || !booking.userId.email) {
          console.log(`⚠️ No user/email for booking ${booking.bookingId}`);
          continue;
        }
        
        console.log(`📧 TEST: Sending to ${booking.userId.email} for ${booking.hotelName}`);
        
        // Send email
        await sendFeedbackRequestEmail(
          booking.userId.email,
          {
            bookingId: booking.bookingId,
            hotelName: booking.hotelName,
            location: booking.location,
            place: booking.place,
            checkin: booking.checkin,
            checkout: booking.checkout,
            roomType: booking.roomType,
            persons: booking.persons,
            userName: booking.userName
          },
          {
            fullname: booking.userId.fullname,
            email: booking.userId.email
          }
        );
        
        // Update booking
        booking.feedbackRequestSent = true;
        booking.feedbackRequestSentAt = new Date();
        await booking.save();
        
        sentCount++;
        console.log(`✅ TEST: Sent to ${booking.userId.email}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ TEST: Failed for ${booking.bookingId}:`, error.message);
      }
    }
    
    console.log(`🎉 TEST COMPLETE! Sent: ${sentCount}, Errors: ${errorCount}`);
    return { sentCount, errorCount };
    
  } catch (error) {
    console.error('❌ Manual trigger error:', error);
    throw error;
  }
};

module.exports = {
  feedbackCronJob,
  sendFeedbackEmailsManually
};