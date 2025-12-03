import express from 'express';
import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { securityLogger } from '../middleware/security.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Apply security logging
router.use(securityLogger);

// @route   POST /api/messages
// @desc    Send a message (Student to Tutor or Tutor to Student)
// @access  Private
router.post('/',
  protect,
  [
    body('to')
      .notEmpty()
      .withMessage('Recipient is required')
      .isMongoId()
      .withMessage('Invalid recipient ID'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 5000 })
      .withMessage('Message cannot exceed 5000 characters'),
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Subject cannot exceed 200 characters'),
    body('appointment')
      .optional()
      .isMongoId()
      .withMessage('Invalid appointment ID'),
    body('type')
      .optional()
      .isIn(['question', 'comment', 'feedback', 'general'])
      .withMessage('Invalid message type')
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
      const { to, message, subject, appointment, type = 'general' } = req.body;

      // Verify recipient exists and has opposite role
      const recipient = await User.findById(to);
      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      // Students can only message tutors, tutors can only message students
      if (req.user.role === recipient.role) {
        return res.status(400).json({ error: 'Cannot send message to user with same role' });
      }

      // If appointment is provided, verify it exists and user is part of it
      if (appointment) {
        const appointmentDoc = await Appointment.findById(appointment);
        if (!appointmentDoc) {
          return res.status(404).json({ error: 'Appointment not found' });
        }
        
        const isPartOfAppointment = 
          appointmentDoc.student.toString() === req.user._id.toString() ||
          appointmentDoc.tutor.toString() === req.user._id.toString();
        
        if (!isPartOfAppointment) {
          return res.status(403).json({ error: 'You are not part of this appointment' });
        }
      }

      // Create message
      const newMessage = await Message.create({
        from: req.user._id,
        to,
        message,
        subject,
        appointment: appointment || null,
        type
      });

      await newMessage.populate('from', 's0Key email fullName role');
      await newMessage.populate('to', 's0Key email fullName role');
      if (appointment) {
        await newMessage.populate('appointment');
      }

      res.status(201).json({
        message: 'Message sent successfully',
        messageData: newMessage
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

// @route   GET /api/messages
// @desc    Get user's messages
// @access  Private
router.get('/',
  protect,
  async (req, res) => {
    try {
      const { conversationWith, appointment, unreadOnly } = req.query;

      let query = {
        $or: [
          { from: req.user._id },
          { to: req.user._id }
        ]
      };

      if (conversationWith) {
        query = {
          $or: [
            { from: req.user._id, to: conversationWith },
            { from: conversationWith, to: req.user._id }
          ]
        };
      }

      if (appointment) {
        query.appointment = appointment;
      }

      if (unreadOnly === 'true') {
        query.isRead = false;
        query.to = req.user._id; // Only unread messages received by user
      }

      const messages = await Message.find(query)
        .populate('from', 's0Key email fullName role')
        .populate('to', 's0Key email fullName role')
        .populate('appointment')
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({ messages });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
);

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read',
  protect,
  async (req, res) => {
    try {
      const { id } = req.params;

      const message = await Message.findById(id);

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Only recipient can mark as read
      if (message.to.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      message.isRead = true;
      message.readAt = new Date();
      await message.save();

      res.json({ message: 'Message marked as read', messageData: message });
    } catch (error) {
      console.error('Mark read error:', error);
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  }
);

export default router;

