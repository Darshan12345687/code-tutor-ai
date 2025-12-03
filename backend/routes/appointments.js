import express from 'express';
import Appointment from '../models/Appointment.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { securityLogger } from '../middleware/security.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Apply security logging
router.use(securityLogger);

// Helper to check if user is student
const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Student role required.' });
  }
};

// Helper to check if user is tutor
const isTutor = (req, res, next) => {
  if (req.user && req.user.role === 'tutor') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Tutor role required.' });
  }
};

// @route   POST /api/appointments
// @desc    Book an appointment with a tutor (Student only)
// @access  Private (Student only)
router.post('/',
  protect,
  isStudent,
  [
    body('appointmentDate')
      .notEmpty()
      .withMessage('Appointment date is required')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        const appointmentDate = new Date(value);
        const now = new Date();
        if (appointmentDate <= now) {
          throw new Error('Appointment date must be in the future');
        }
        return true;
      }),
    body('duration')
      .optional()
      .isInt({ min: 15, max: 120 })
      .withMessage('Duration must be between 15 and 120 minutes'),
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Subject cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('questions')
      .optional()
      .isArray()
      .withMessage('Questions must be an array')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      const { appointmentDate, duration = 30, subject, description, questions = [] } = req.body;

      // Find a tutor (for now, get the first available tutor)
      // In production, you might want to let students choose a tutor
      const tutor = await User.findOne({ role: 'tutor', isActive: true });

      if (!tutor) {
        return res.status(404).json({ error: 'No tutor available at this time' });
      }

      // Check for conflicting appointments
      const conflictingAppointment = await Appointment.findOne({
        tutor: tutor._id,
        appointmentDate: new Date(appointmentDate),
        status: { $in: ['pending', 'confirmed'] }
      });

      if (conflictingAppointment) {
        return res.status(400).json({ 
          error: 'Tutor already has an appointment at this time. Please choose a different time.' 
        });
      }

      // Create appointment
      const appointment = await Appointment.create({
        student: req.user._id,
        tutor: tutor._id,
        appointmentDate: new Date(appointmentDate),
        duration,
        subject,
        description,
        questions,
        status: 'pending'
      });

      // Populate appointment with user details
      await appointment.populate('student', 's0Key email fullName');
      await appointment.populate('tutor', 'fullName email');

      res.status(201).json({
        message: 'Appointment booked successfully',
        appointment
      });
    } catch (error) {
      console.error('Appointment booking error:', error);
      res.status(500).json({ error: 'Failed to book appointment' });
    }
  }
);

// @route   GET /api/appointments
// @desc    Get user's appointments
// @access  Private
router.get('/',
  protect,
  async (req, res) => {
    try {
      let appointments;

      if (req.user.role === 'student') {
        appointments = await Appointment.find({ student: req.user._id })
          .populate('tutor', 'fullName email')
          .sort({ appointmentDate: 1 });
      } else if (req.user.role === 'tutor') {
        appointments = await Appointment.find({ tutor: req.user._id })
          .populate('student', 's0Key email fullName')
          .sort({ appointmentDate: 1 });
      } else {
        return res.status(403).json({ error: 'Invalid role' });
      }

      // Serialize appointments to ensure dates are properly formatted
      // Use JSON.parse(JSON.stringify()) to force proper date serialization
      const formattedAppointments = appointments.map(apt => {
        // Convert to plain object first
        const aptObj = apt.toJSON ? apt.toJSON() : (apt.toObject ? apt.toObject() : apt);
        
        // Force date conversion to ISO string
        if (aptObj.appointmentDate) {
          try {
            // Convert to Date object if not already
            const date = aptObj.appointmentDate instanceof Date 
              ? aptObj.appointmentDate 
              : new Date(aptObj.appointmentDate);
            
            // Check if valid and convert to ISO string
            if (!isNaN(date.getTime())) {
              aptObj.appointmentDate = date.toISOString();
            } else {
              console.warn('Invalid appointmentDate:', aptObj._id, aptObj.appointmentDate);
              aptObj.appointmentDate = null;
            }
          } catch (error) {
            console.error('Error converting appointmentDate:', error, aptObj._id);
            aptObj.appointmentDate = null;
          }
        }
        
        return aptObj;
      });

      res.json({ appointments: formattedAppointments });
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  }
);

// @route   PUT /api/appointments/:id
// @desc    Update appointment (confirm, cancel, add notes)
// @access  Private (Tutor or Student who owns it)
router.put('/:id',
  protect,
  [
    body('status')
      .optional()
      .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('tutorNotes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Tutor notes cannot exceed 2000 characters'),
    body('meetingLink')
      .optional()
      .trim()
      .isURL()
      .withMessage('Meeting link must be a valid URL')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      const { id } = req.params;
      const { status, tutorNotes, meetingLink } = req.body;

      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Check permissions
      const isOwner = appointment.student.toString() === req.user._id.toString() || 
                      appointment.tutor.toString() === req.user._id.toString();
      
      if (!isOwner) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Only tutors can add notes
      if (tutorNotes && req.user.role !== 'tutor') {
        return res.status(403).json({ error: 'Only tutors can add notes' });
      }

      // Update appointment
      if (status) appointment.status = status;
      if (tutorNotes) appointment.tutorNotes = tutorNotes;
      if (meetingLink) appointment.meetingLink = meetingLink;
      
      appointment.updatedAt = new Date();
      await appointment.save();

      await appointment.populate('student', 's0Key email fullName');
      await appointment.populate('tutor', 'fullName email');

      res.json({
        message: 'Appointment updated successfully',
        appointment
      });
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  }
);

// @route   DELETE /api/appointments
// @desc    Delete all appointments (Admin only - for testing/cleanup)
// @access  Private (Admin only)
router.delete('/',
  protect,
  async (req, res) => {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    try {
      const count = await Appointment.countDocuments();
      
      if (count === 0) {
        return res.json({ 
          message: 'No appointments to delete',
          deletedCount: 0
        });
      }

      const result = await Appointment.deleteMany({});
      
      console.log(`✅ Admin ${req.user.email} deleted ${result.deletedCount} appointment(s)`);
      
      res.json({
        message: `Successfully deleted ${result.deletedCount} appointment(s)`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Delete all appointments error:', error);
      res.status(500).json({ error: 'Failed to delete appointments' });
    }
  }
);

// @route   DELETE /api/appointments/:id
// @desc    Cancel an appointment
// @access  Private (Student or Tutor)
router.delete('/:id',
  protect,
  async (req, res) => {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Check permissions
      const isOwner = appointment.student.toString() === req.user._id.toString() || 
                      appointment.tutor.toString() === req.user._id.toString();
      
      if (!isOwner) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update status to cancelled instead of deleting
      appointment.status = 'cancelled';
      appointment.updatedAt = new Date();
      await appointment.save();

      res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  }
);

export default router;


