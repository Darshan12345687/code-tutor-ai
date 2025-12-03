import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcryptjs from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codetutor';

const migrateAccessCodes = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all tutors with access codes
    const tutors = await User.find({ 
      role: 'tutor',
      tutorAccessCode: { $exists: true, $ne: null }
    }).select('+tutorAccessCode');

    console.log(`\n📊 Found ${tutors.length} tutors with access codes`);

    let migrated = 0;
    let alreadyHashed = 0;

    for (const tutor of tutors) {
      // Check if already hashed (bcrypt hashes start with $2a$, $2b$, etc.)
      if (tutor.tutorAccessCode.startsWith('$2')) {
        console.log(`  ✓ ${tutor.fullName || tutor.email} - Already hashed`);
        alreadyHashed++;
        continue;
      }

      // Hash the access code
      const salt = await bcryptjs.genSalt(10);
      const hashedCode = await bcryptjs.hash(tutor.tutorAccessCode, salt);
      
      // Update the tutor
      tutor.tutorAccessCode = hashedCode;
      await tutor.save();
      
      console.log(`  ✅ ${tutor.fullName || tutor.email} - Access code hashed`);
      migrated++;
    }

    console.log(`\n✅ Migration complete:`);
    console.log(`   - Migrated: ${migrated} access codes`);
    console.log(`   - Already hashed: ${alreadyHashed} access codes`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

migrateAccessCodes();





