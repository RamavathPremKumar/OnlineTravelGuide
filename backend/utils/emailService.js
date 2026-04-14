// backend/utils/emailService.js
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // For self-signed certificates
  }
});

// Test transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Helper function to calculate total amount
function calculateTotalAmount(bookingData) {
  switch(bookingData.priceRange) {
    case 'Low': return 2000;
    case 'Medium': return 4500;
    case 'High': return 7500;
    default: return 3000;
  }
}

// Email templates
const emailTemplates = {
  bookingConfirmation: (bookingData, user) => {
    const totalAmount = calculateTotalAmount(bookingData);
    
    return {
      subject: `Booking Confirmation - #${bookingData.bookingId || 'BOOK' + Date.now()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3498db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3498db; }
            .detail-row { display: flex; margin-bottom: 8px; }
            .detail-label { font-weight: bold; width: 150px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 0.9em; }
            .highlight { background: #fffacd; padding: 10px; border-radius: 5px; margin: 15px 0; }
            .total-amount { font-size: 18px; font-weight: bold; color: #2ecc71; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Online Travel Guide</h1>
              <h2>Booking Confirmation</h2>
            </div>
            
            <div class="content">
              <p>Dear <strong>${user.fullname || bookingData.userName}</strong>,</p>
              
              <p>Thank you for booking with Online Travel Guide! Your accommodation has been confirmed.</p>
              
              <div class="highlight">
                <h3>📋 Booking Summary</h3>
                <p><strong>Booking Reference:</strong> ${bookingData.bookingId || 'Pending'}</p>
                <p><strong>Booking Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="booking-details">
                <h3>🏨 Accommodation Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Hotel Name:</span>
                  <span>${bookingData.hotelName || 'To be assigned'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span>${bookingData.place}, ${bookingData.location}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Check-in:</span>
                  <span>${new Date(bookingData.checkin).toDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Check-out:</span>
                  <span>${new Date(bookingData.checkout).toDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Room Type:</span>
                  <span>${bookingData.roomType}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Guests:</span>
                  <span>${bookingData.persons} person(s)</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Number of Rooms:</span>
                  <span>${bookingData.rooms || 1} room(s)</span>
                </div>
              </div>
              
              <div class="booking-details">
                <h3>💰 Payment Information</h3>
                <div class="detail-row">
                  <span class="detail-label">Payment Method:</span>
                  <span>${bookingData.payment}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Price Range:</span>
                  <span>${bookingData.priceRange}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Amount:</span>
                  <span class="total-amount">₹${totalAmount}</span>
                </div>
              </div>
              
              <div class="booking-details">
                <h3>👤 Contact Information</h3>
                <div class="detail-row">
                  <span class="detail-label">Customer Name:</span>
                  <span>${bookingData.userName || user.fullname}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Customer Email:</span>
                  <span>${bookingData.email || user.email}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Customer Phone:</span>
                  <span>${bookingData.phone || user.phone}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Customer Address:</span>
                  <span>${bookingData.address || user.address}</span>
                </div>
              </div>
              
              <p><strong>Special Notes:</strong> ${bookingData.specialNeeds ? 'Special needs requested' : 'No special requests'}</p>
              
              <p>Please keep this email for your records. If you have any questions, contact our support team.</p>
              
              <p>Best regards,<br>
              <strong>Online Travel Guide Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Online Travel Guide. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
};

// Send email function
const sendEmail = async (to, templateName, templateData, userData) => {
  try {
    if (!to || !templateName || !emailTemplates[templateName]) {
      throw new Error('Missing required parameters');
    }

    const template = emailTemplates[templateName](templateData, userData);
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to,
      subject: template.subject,
      html: template.html,
      text: template.subject // Fallback text content
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendEmail, emailTemplates };