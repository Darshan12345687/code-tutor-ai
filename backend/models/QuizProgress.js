import mongoose from 'mongoose';

const quizProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  totalPoints: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  answers: [{
    questionIndex: {
      type: Number,
      required: true
    },
    userAnswer: {
      type: mongoose.Schema.Types.Mixed
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    timeSpent: {
      type: Number, // in seconds for this question
      default: 0
    }
  }],
  completedAt: {
    type: Date,
    default: Date.now
  },
  attemptNumber: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});

// Compound index for user-quiz lookups
quizProgressSchema.index({ user: 1, quiz: 1 });
quizProgressSchema.index({ user: 1, completedAt: -1 });

// Virtual for grade
quizProgressSchema.virtual('grade').get(function() {
  if (this.percentage >= 90) return 'A';
  if (this.percentage >= 80) return 'B';
  if (this.percentage >= 70) return 'C';
  if (this.percentage >= 60) return 'D';
  return 'F';
});

const QuizProgress = mongoose.model('QuizProgress', quizProgressSchema);

export default QuizProgress;





