/**
 * Delete All Appointments Script
 * 
 * This script deletes all appointments from the database.
 * Use with caution - this action cannot be undone!
 * 
 * Run with: node backend/scripts/delete-all-appointments.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from '../models/Appointment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codetutor';

const deleteAllAppointments = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get count of appointments before deletion
    const appointmentCount = await Appointment.countDocuments();
    console.log(`\n📊 Found ${appointmentCount} appointment(s) in database`);

    if (appointmentCount === 0) {
      console.log('✅ No appointments to delete. Database is already clean.');
      await mongoose.disconnect();
      return;
    }

    // List appointments before deletion
    const appointments = await Appointment.find()
      .populate('student', 'fullName email')
      .populate('tutor', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(10); // Show first 10
    
    console.log('\n📋 Sample appointments to be deleted (showing first 10):');
    appointments.forEach((apt, index) => {
      console.log(`\n  ${index + 1}. Appointment ID: ${apt._id}`);
      console.log(`     Student: ${apt.student?.fullName || apt.student?.email || 'N/A'}`);
      console.log(`     Tutor: ${apt.tutor?.fullName || apt.tutor?.email || 'N/A'}`);
      console.log(`     Date: ${apt.appointmentDate || 'Invalid date'}`);
      console.log(`     Status: ${apt.status}`);
      console.log(`     Subject: ${apt.subject || 'N/A'}`);
    });
    
    if (appointmentCount > 10) {
      console.log(`\n     ... and ${appointmentCount - 10} more appointment(s)`);
    }

    // Delete all appointments
    console.log('\n🗑️  Deleting all appointments...');
    const result = await Appointment.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} appointment(s)`);
    console.log('\n✅ All appointments have been removed from the database.');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error deleting appointments:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.error('\n💡 Tip: Make sure MongoDB is running.');
      console.error('   You can also use the API endpoint: DELETE /api/appointments (requires admin)');
    }
    
    process.exit(1);
  }
};

// Run the script
deleteAllAppointments();

