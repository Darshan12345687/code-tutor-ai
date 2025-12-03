import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codetutor';

const cleanupDuplicates = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all students with S0 keys
    const students = await User.find({ 
      role: 'student', 
      s0Key: { $ne: null, $exists: true } 
    }).sort({ createdAt: 1 });

    console.log(`\n📊 Found ${students.length} students with S0 keys`);

    // Group by S0 Key (normalized)
    const s0KeyGroups = {};
    students.forEach(student => {
      const key = student.s0Key?.toUpperCase().replace(/^S0(\d+)/, 'SO$1');
      if (key) {
        if (!s0KeyGroups[key]) {
          s0KeyGroups[key] = [];
        }
        s0KeyGroups[key].push(student);
      }
    });

    // Find duplicates
    const duplicates = Object.entries(s0KeyGroups).filter(([key, users]) => users.length > 1);
    
    console.log(`\n🔍 Found ${duplicates.length} S0 keys with duplicates:`);

    let totalDeleted = 0;
    let totalMerged = 0;

    for (const [s0Key, users] of duplicates) {
      console.log(`\n  S0 Key: ${s0Key} - ${users.length} users`);
      
      // Sort by creation date (keep the oldest one)
      users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const keepUser = users[0];
      const deleteUsers = users.slice(1);

      console.log(`    Keeping: ${keepUser.fullName || keepUser.username} (${keepUser._id}) - Created: ${keepUser.createdAt}`);
      
      // Merge data from duplicates into the kept user
      for (const dupUser of deleteUsers) {
        console.log(`    Deleting: ${dupUser.fullName || dupUser.username} (${dupUser._id}) - Created: ${dupUser.createdAt}`);
        
        // Update email if kept user doesn't have one
        if (!keepUser.email && dupUser.email) {
          keepUser.email = dupUser.email;
          console.log(`      → Merged email: ${dupUser.email}`);
        }
        
        // Update fullName if kept user doesn't have one
        if (!keepUser.fullName && dupUser.fullName) {
          keepUser.fullName = dupUser.fullName;
          console.log(`      → Merged fullName: ${dupUser.fullName}`);
        }
        
        // Update lastActive to most recent
        if (dupUser.lastActive && (!keepUser.lastActive || new Date(dupUser.lastActive) > new Date(keepUser.lastActive))) {
          keepUser.lastActive = dupUser.lastActive;
          console.log(`      → Updated lastActive to: ${dupUser.lastActive}`);
        }
        
        // Delete the duplicate user
        await User.deleteOne({ _id: dupUser._id });
        totalDeleted++;
      }
      
      // Save the kept user with merged data
      await keepUser.save();
      totalMerged++;
    }

    console.log(`\n✅ Cleanup complete:`);
    console.log(`   - Merged ${totalMerged} groups of duplicates`);
    console.log(`   - Deleted ${totalDeleted} duplicate users`);

    // Now create unique index
    try {
      await User.collection.dropIndex('s0Key_1');
      console.log('   - Dropped old s0Key index');
    } catch (e) {
      if (e.code !== 27) { // 27 = IndexNotFound
        console.log('   - Old index not found or already dropped');
      }
    }

    try {
      await User.collection.createIndex({ s0Key: 1 }, { unique: true, sparse: true });
      console.log('   - Created unique index on s0Key');
    } catch (e) {
      console.error('   - Error creating index:', e.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

cleanupDuplicates();





