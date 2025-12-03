import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  codeExample: {
    type: String,
    trim: true
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
lessonSchema.index({ courseId: 1, orderIndex: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;






