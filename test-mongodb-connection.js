// Test MongoDB Atlas Connection
// Run this to verify your MongoDB connection string works
// Usage: node test-mongodb-connection.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Your MongoDB connection string
// Replace <db_username> and <db_password> with actual values
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://codetutor:CODETUTOR@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority';

console.log('🔍 Testing MongoDB Connection...');
console.log('Connection String:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
  console.log('✅ Database:', mongoose.connection.db.databaseName);
  console.log('✅ Host:', mongoose.connection.host);
  process.exit(0);
})
.catch((error) => {
  console.error('❌ ERROR: Failed to connect to MongoDB');
  console.error('Error details:', error.message);
  
  // Common error messages and solutions
  if (error.message.includes('authentication failed')) {
    console.error('\n💡 Solution: Check your username and password');
  } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
    console.error('\n💡 Solution: Check your cluster URL is correct');
  } else if (error.message.includes('IP')) {
    console.error('\n💡 Solution: Whitelist IP address 0.0.0.0/0 in MongoDB Atlas Network Access');
  } else if (error.message.includes('password')) {
    console.error('\n💡 Solution: Verify password is correct and URL encoded if it has special characters');
  }
  
  process.exit(1);
});

