import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 30,
    min: 15,
    max: 120
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  subject: {
    type: String,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  questions: [{
    type: String,
    trim: true
  }],
  tutorNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  meetingLink: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
appointmentSchema.index({ student: 1, appointmentDate: 1 });
appointmentSchema.index({ tutor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

// Transform to ensure dates are properly serialized
appointmentSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Ensure appointmentDate is properly formatted as ISO string
    if (ret.appointmentDate) {
      try {
        const date = ret.appointmentDate instanceof Date 
          ? ret.appointmentDate 
          : new Date(ret.appointmentDate);
        
        if (!isNaN(date.getTime())) {
          ret.appointmentDate = date.toISOString();
        } else {
          console.warn('Invalid appointmentDate in toJSON transform:', ret._id, ret.appointmentDate);
          ret.appointmentDate = null;
        }
      } catch (error) {
        console.error('Error in toJSON date transform:', error, ret._id);
        ret.appointmentDate = null;
      }
    }
    
    // Ensure createdAt is properly formatted
    if (ret.createdAt) {
      try {
        const date = ret.createdAt instanceof Date 
          ? ret.createdAt 
          : new Date(ret.createdAt);
        if (!isNaN(date.getTime())) {
          ret.createdAt = date.toISOString();
        }
      } catch (error) {
        // Ignore createdAt errors
      }
    }
    
    // Ensure updatedAt is properly formatted
    if (ret.updatedAt) {
      try {
        const date = ret.updatedAt instanceof Date 
          ? ret.updatedAt 
          : new Date(ret.updatedAt);
        if (!isNaN(date.getTime())) {
          ret.updatedAt = date.toISOString();
        }
      } catch (error) {
        // Ignore updatedAt errors
      }
    }
    
    return ret;
  }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

