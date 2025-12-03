import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  front: {
    type: String,
    required: [true, 'Flashcard front is required'],
    trim: true,
    maxlength: [500, 'Front text cannot exceed 500 characters']
  },
  back: {
    type: String,
    required: [true, 'Flashcard back is required'],
    trim: true,
    maxlength: [2000, 'Back text cannot exceed 2000 characters']
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
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
// Note: Not using text index to avoid conflicts with 'language' field
flashcardSchema.index({ language: 1, difficulty: 1 });
flashcardSchema.index({ createdBy: 1 });

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;

