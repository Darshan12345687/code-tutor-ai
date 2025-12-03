import mongoose from 'mongoose';

const codeSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  code: {
    type: String,
    required: [true, 'Code is required']
  },
  language: {
    type: String,
    default: 'python',
    enum: ['python', 'javascript', 'java', 'cpp']
  },
  output: {
    type: String
  },
  error: {
    type: String
  },
  executionTime: {
    type: Number
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
codeSubmissionSchema.index({ userId: 1, createdAt: -1 });
codeSubmissionSchema.index({ lessonId: 1 });

const CodeSubmission = mongoose.model('CodeSubmission', codeSubmissionSchema);

export default CodeSubmission;






