// backend/utils/feedbackEmailService.js
const nodemailer = require('nodemailer');

// Create reusable transporter (reuse from existing emailService)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Feedback Request Email Template
const feedbackRequestTemplate = (bookingData, user) => {
  const feedbackUrl = `http://localhost:5173/feedback?booking=${bookingData.bookingId}`;
  
  return {
    subject: `🌟 How was your stay at ${bookingData.hotelName}?`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Share Your Experience</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 25px;
            color: #2c3e50;
          }
          .highlight {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .booking-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: bold;
            width: 120px;
            color: #555;
          }
          .info-value {
            flex: 1;
            color: #2c3e50;
          }
          .cta-section {
            text-align: center;
            margin: 30px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2ecc71, #27ae60);
            color: white;
            padding: 15px 35px;
            text-decoration: none;
            border-radius: 30px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
            transition: all 0.3s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
          }
          .review-benefits {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .benefit-list {
            margin: 15px 0 0 20px;
          }
          .benefit-list li {
            margin-bottom: 8px;
            color: #2c3e50;
          }
          .stars {
            color: #f39c12;
            font-size: 24px;
            text-align: center;
            margin: 15px 0;
            letter-spacing: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #7f8c8d;
            font-size: 14px;
          }
          .footer a {
            color: #3498db;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .content {
              padding: 20px;
            }
            .info-row {
              flex-direction: column;
            }
            .info-label {
              width: 100%;
              margin-bottom: 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Online Travel Guide</h1>
            <p>Share Your Travel Experience</p>
            <div class="stars">★★★★★</div>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear <strong>${user.fullname || bookingData.userName}</strong>,
            </div>
            
            <p>We hope you had a wonderful stay at <strong>${bookingData.hotelName}</strong> in ${bookingData.location}!</p>
            
            <div class="booking-info">
              <h3 style="margin-top: 0; color: #2c3e50;">Your Stay Details:</h3>
              <div class="info-row">
                <span class="info-label">Hotel:</span>
                <span class="info-value">${bookingData.hotelName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-value">${bookingData.place}, ${bookingData.location}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-in:</span>
                <span class="info-value">${new Date(bookingData.checkin).toLocaleDateString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-out:</span>
                <span class="info-value">${new Date(bookingData.checkout).toLocaleDateString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Room Type:</span>
                <span class="info-value">${bookingData.roomType}</span>
              </div>
            </div>
            
            <div class="review-benefits">
              <h3 style="color: #2c3e50; margin-top: 0;">Why Share Your Experience?</h3>
              <ul class="benefit-list">
                <li><strong>Help fellow travelers</strong> make better decisions</li>
                <li><strong>Improve our services</strong> with your valuable feedback</li>
                <li><strong>Earn recognition</strong> as a verified traveler</li>
                <li><strong>Get personalized</strong> recommendations for future trips</li>
              </ul>
            </div>
            
            <div class="cta-section">
              <p>Your feedback is invaluable to us and other travelers!</p>
              <a href="${feedbackUrl}" class="cta-button">
                ✍️ Share Your Experience Now
              </a>
              <p style="margin-top: 10px; font-size: 14px; color: #7f8c8d;">
                (Link valid for 30 days)
              </p>
            </div>
            
            <p style="color: #7f8c8d; font-size: 14px; text-align: center;">
              It will only take 2-3 minutes to complete your review.
            </p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Online Travel Guide. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>
              <a href="http://localhost:5173/unsubscribe">Unsubscribe</a> | 
              <a href="http://localhost:5173/privacy">Privacy Policy</a> | 
              <a href="http://localhost:5173/contact">Contact Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Send Feedback Request Email
const sendFeedbackRequestEmail = async (to, bookingData, userData) => {
  try {
    if (!to || !bookingData) {
      throw new Error('Missing required parameters for feedback email');
    }

    const template = feedbackRequestTemplate(bookingData, userData);
    
    const mailOptions = {
      from: `"Online Travel Guide" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: template.subject,
      html: template.html,
      text: `How was your stay at ${bookingData.hotelName}? Share your experience: http://localhost:5173/feedback?booking=${bookingData.bookingId}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Feedback request email sent to ${to} for booking ${bookingData.bookingId}: ${info.messageId}`);
    return { 
      success: true, 
      messageId: info.messageId,
      bookingId: bookingData.bookingId,
      sentAt: new Date()
    };
  } catch (error) {
    console.error('❌ Error sending feedback request email:', error);
    throw new Error(`Failed to send feedback request email: ${error.message}`);
  }
};

// Send Feedback Confirmation Email (after user submits feedback)
const sendFeedbackConfirmationEmail = async (to, feedbackData) => {
  try {
    const template = {
      subject: '✅ Thank You for Your Feedback!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2ecc71; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .content { background: #f9f9fa; padding: 25px; border-radius: 8px; margin-top: 20px; }
            .thank-you { font-size: 20px; color: #27ae60; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Feedback!</h1>
            </div>
            <div class="content">
              <div class="thank-you">
                <strong>🌟 Your review has been published successfully! 🌟</strong>
              </div>
              <p>Dear Traveler,</p>
              <p>Thank you for taking the time to share your experience at <strong>${feedbackData.hotelName}</strong>.</p>
              <p>Your feedback helps other travelers make informed decisions and improves our services.</p>
              <p>You can view your review and others at: <a href="http://localhost:5173/feedback">Traveler Reviews</a></p>
              <p>We look forward to serving you on your next journey!</p>
              <p>Best regards,<br><strong>The Online Travel Guide Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Online Travel Guide</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const mailOptions = {
      from: `"Online Travel Guide" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: template.subject,
      html: template.html,
      text: 'Thank you for your feedback! Your review helps other travelers.'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Feedback confirmation email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending feedback confirmation email:', error);
    throw error;
  }
};

module.exports = {
  sendFeedbackRequestEmail,
  sendFeedbackConfirmationEmail,
  feedbackRequestTemplate
};