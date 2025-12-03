import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  language: {
    type: String,
    enum: ['python', 'java', 'c', 'cpp', 'csharp', 'javascript', 'general'],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  questions: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer', 'code'],
      default: 'multiple-choice'
    },
    options: [{
      type: String,
      trim: true
    }],
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed, // Can be string, number, or array
      required: true
    },
    explanation: {
      type: String,
      trim: true
    },
    points: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  totalPoints: {
    type: Number,
    default: 0
  },
  timeLimit: {
    type: Number, // in minutes, 0 means no limit
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  attempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate total points before saving
quizSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  }
  next();
});

// Indexes for efficient queries
// Note: Not using text index to avoid conflicts with 'language' field
quizSchema.index({ language: 1, difficulty: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ title: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;

