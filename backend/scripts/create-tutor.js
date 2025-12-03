import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcryptjs from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codetutor';

const createTutor = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const accessCode = process.argv[2] || 'TUTOR2024';
    const fullName = process.argv[3] || 'Tutor User';
    let email = process.argv[4] || null;
    
    // If no email provided, generate a unique tutor email
    if (!email) {
      email = `tutor-${accessCode.toLowerCase()}@semo.edu`;
    }

    // Check if tutor with this access code already exists
    // We need to check all tutors and compare hashed codes
    const allTutors = await User.find({ 
      role: 'tutor',
      tutorAccessCode: { $exists: true, $ne: null }
    }).select('+tutorAccessCode');
    
    for (const t of allTutors) {
      const isMatch = await t.compareAccessCode(accessCode);
      if (isMatch) {
        console.log('❌ Tutor with this access code already exists');
        process.exit(1);
      }
    }

    // Hash the access code before creating (the pre-save hook will handle this)
    // But we need to set it directly so it gets hashed
    const tutor = new User({
      fullName,
      email: email || undefined,
      role: 'tutor',
      tutorAccessCode: accessCode, // Will be hashed by pre-save hook
      isActive: true,
      s0Key: undefined // Tutors don't need S0 Key
    });
    
    await tutor.save();

    console.log('✅ Tutor created successfully!');
    console.log('📋 Tutor Details:');
    console.log(`   ID: ${tutor._id}`);
    console.log(`   Name: ${tutor.fullName}`);
    console.log(`   Email: ${tutor.email || 'N/A'}`);
    console.log(`   Access Code: ${accessCode}`);
    console.log(`   Role: ${tutor.role}`);
    console.log('\n🔐 Use this access code to login as tutor');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tutor:', error);
    process.exit(1);
  }
};

createTutor();

