require('dotenv').config();
const connectDB = require('./config/db');

// Test connection
connectDB()
  .then(() => {
    console.log('✅ Connection test successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  });