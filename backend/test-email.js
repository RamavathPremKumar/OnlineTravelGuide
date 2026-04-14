require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendTestEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Sending test email...');
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Send to yourself
      subject: '✅ Travel Guide - OTP System Test',
      text: 'Your OTP system is working! This is a test email.',
      html: `
        <h3>🎉 Travel Guide OTP System Test</h3>
        <p>Your email configuration is working correctly!</p>
        <p>You can now send OTP emails to users.</p>
        <p><strong>Test OTP Code:</strong> 123456</p>
        <p><em>This email confirms your SMTP setup is ready.</em></p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('👀 Check your Gmail inbox: premkumarramavath1@gmail.com');
    
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.log('Troubleshooting:');
    console.log('1. Make sure 2-Step Verification is ON');
    console.log('2. Verify App Password is correct');
    console.log('3. Check internet connection');
  }
}

sendTestEmail();