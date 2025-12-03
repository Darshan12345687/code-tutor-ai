import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: [true, 'Lesson ID is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  // Analytics
  codeSubmissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeSubmission'
  }],
  averageScore: {
    type: Number,
    default: 0
  },
  conceptsMastered: [{
    type: String
  }],
  conceptsStruggling: [{
    type: String
  }],
  language: {
    type: String,
    enum: ['python', 'java', 'c', 'cpp', 'csharp', 'javascript'],
    default: 'python'
  },
  codeHistory: [{
    code: String,
    output: String,
    error: String,
    executedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  }
}, {
  timestamps: true
});

// Compound index to ensure one progress record per user-lesson pair
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
progressSchema.index({ userId: 1, courseId: 1 });

// Method to update progress
progressSchema.methods.updateProgress = function(percentage, isCompleted = false) {
  this.completionPercentage = Math.max(this.completionPercentage, percentage);
  if (isCompleted && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  this.lastAccessed = new Date();
  return this.save();
};

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
