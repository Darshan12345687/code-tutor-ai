import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false, // Username optional - auto-generated from email if not provided
    unique: true,
    sparse: true, // Allow null values
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: false, // Email optional - can login with just S0 Key
    unique: true,
    sparse: true, // Allow null values for uniqueness
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@semo\.edu$/, 'Email must be a SEMO.EDU email address'],
    default: null
  },
  s0Key: {
    type: String,
    required: function() {
      // S0 Key is required for students, optional for tutors
      return this.role === 'student';
    },
    trim: true,
    uppercase: true,
    match: [/^S[O0]\d{7}$/, 'S0 Key must be in the format SO or S0 followed by 7 numbers (e.g., SO1234567)'],
    unique: true, // Ensure S0 Key is unique across all users
    sparse: true, // Allow null values for tutors
    select: false, // Don't return S0 Key by default in queries (for security)
    set: function(v) {
      // Normalize: convert S0 (zero) to SO (letter O) before saving
      if (v) {
        return v.toUpperCase().replace(/^S0(\d+)/, 'SO$1');
      }
      return v;
    }
  },
  s0KeyHash: {
    type: String,
    select: false, // Never return hash in queries
    sparse: true
  },
  password: {
    type: String,
    required: false, // Password not required - using S0 Key authentication
    select: false // Don't return password by default
  },
  fullName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['student', 'tutor'],
    default: 'student'
  },
  tutorAccessCode: {
    type: String,
    trim: true,
    sparse: true,
    unique: true,
    select: false // Don't return access code by default
  },
  subscription: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  },
  aiUsageCount: {
    type: Number,
    default: 0
  },
  aiUsageLimit: {
    type: Number,
    default: 10 // Free tier limit
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  preferredLanguage: {
    type: String,
    enum: ['python', 'java', 'c', 'cpp', 'csharp', 'javascript'],
    default: 'python'
  },
  learningHistory: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    completedAt: Date,
    score: Number,
    timeSpent: Number
  }]
}, {
  timestamps: true
});

// Hash password before saving (only if password is provided)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

// Hash tutor access code before saving (only if access code is provided and modified)
userSchema.pre('save', async function(next) {
  if (!this.isModified('tutorAccessCode') || !this.tutorAccessCode) {
    return next();
  }
  // Only hash if it's not already hashed (hashed strings start with $2a$, $2b$, etc.)
  if (!this.tutorAccessCode.startsWith('$2')) {
    const salt = await bcryptjs.genSalt(10);
    this.tutorAccessCode = await bcryptjs.hash(this.tutorAccessCode, salt);
  }
  next();
});

// Hash S0 Key before saving (only if S0 Key is provided and modified)
// We store the normalized S0 Key for efficient lookups, but also store a hash for additional security
userSchema.pre('save', async function(next) {
  if (!this.isModified('s0Key') || !this.s0Key || this.role === 'tutor') {
    return next();
  }
  // Normalize S0 Key first (this happens in the setter, but ensure it's normalized)
  const normalized = this.s0Key.toUpperCase().replace(/^S0(\d+)/, 'SO$1');
  this.s0Key = normalized;
  
  // Generate a hash of the S0 Key for additional security/verification
  // This hash can be used for verification without exposing the actual S0 Key
  if (!this.s0KeyHash || this.isModified('s0Key')) {
    const salt = await bcryptjs.genSalt(10);
    this.s0KeyHash = await bcryptjs.hash(normalized, salt);
  }
  
  // Note: S0 Key is kept as normalized plain text for efficient database lookups
  // The hash provides an additional layer of security for verification
  // In production, consider using MongoDB field-level encryption for the s0Key field
  next();
});

// Auto-generate username from email or S0 Key if not provided
userSchema.pre('save', async function(next) {
  if (!this.username) {
    if (this.email) {
      // Extract username from email (e.g., "john.doe@semo.edu" -> "john.doe")
      this.username = this.email.split('@')[0].replace(/[^a-z0-9]/gi, '');
    } else if (this.s0Key) {
      // Generate username from S0 Key (e.g., "SO1234567" -> "student1234567")
      this.username = `student${this.s0Key.replace(/^SO/, '')}`;
    } else {
      // Fallback: generate random username
      this.username = `user${Date.now()}`;
    }
    
    // Ensure uniqueness by appending numbers if needed
    let baseUsername = this.username;
    let counter = 1;
    while (await mongoose.models.User?.findOne({ username: this.username })) {
      this.username = `${baseUsername}${counter}`;
      counter++;
    }
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

// Method to compare tutor access code
userSchema.methods.compareAccessCode = async function(candidateAccessCode) {
  if (!this.tutorAccessCode) {
    return false;
  }
  return await bcryptjs.compare(candidateAccessCode, this.tutorAccessCode);
};

// Method to verify S0 Key hash (for additional security verification)
userSchema.methods.verifyS0KeyHash = async function(candidateS0Key) {
  if (!this.s0KeyHash || !candidateS0Key) {
    return false;
  }
  const normalized = candidateS0Key.toUpperCase().replace(/^S0(\d+)/, 'SO$1');
  return await bcryptjs.compare(normalized, this.s0KeyHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.tutorAccessCode;
  delete userObject.s0KeyHash;
  // Only include s0Key if explicitly selected (for authenticated requests)
  if (!this.selected || !this.selected.includes('s0Key')) {
    delete userObject.s0Key;
  }
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;

