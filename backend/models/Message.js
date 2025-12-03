import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    index: true
  },
  subject: {
    type: String,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  type: {
    type: String,
    enum: ['question', 'comment', 'feedback', 'general'],
    default: 'general'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ from: 1, createdAt: -1 });
messageSchema.index({ to: 1, isRead: 1, createdAt: -1 });
messageSchema.index({ appointment: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;





