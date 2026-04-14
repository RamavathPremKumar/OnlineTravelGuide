const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate random OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Your OTP Code - Online Travel Guide',
      text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Online Travel Guide</h2>
          <h3>Your One-Time Password (OTP)</h3>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 5px; text-align: center;">
            <h1 style="color: #2196F3; font-size: 36px; letter-spacing: 10px; margin: 20px 0;">${otp}</h1>
            <p style="color: #666;">This code will expire in 10 minutes.</p>
          </div>
          <p style="margin-top: 20px;">
            If you didn't request this OTP, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Online Travel Guide Team<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    return { success: false, error: error.message };
  }
};

// Verify OTP (simple comparison)
const verifyOTP = (storedOTP, storedExpiry, userOTP) => {
  if (!storedOTP || !storedExpiry) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > storedExpiry) {
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (storedOTP !== userOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  return { valid: true, message: 'OTP verified successfully' };
};

// Add this function to your otpService.js
// Add this function to your otpService.js
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const transporter = createTransporter(); // Add this line
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_USER, // Use SMTP_FROM
      to: email,
      subject: 'Password Reset Request - Online Travel Guide',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Password Reset Request</h2>
          <p>You have requested to reset your password for Online Travel Guide account.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p>If you didn't request this, please ignore this email.</p>
          
          <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Online Travel Guide.<br>
            Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    return { success: false, error: error.message };
  }
};


module.exports = {
  generateOTP,
  sendOTPEmail,
  verifyOTP,
  sendPasswordResetEmail
};