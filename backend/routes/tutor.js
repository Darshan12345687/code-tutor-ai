import express from 'express';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Message from '../models/Message.js';
import QuizProgress from '../models/QuizProgress.js';
import FlashcardProgress from '../models/FlashcardProgress.js';
import CodeSubmission from '../models/CodeSubmission.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, securityLogger } from '../middleware/security.js';
import { body, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';
import { generateToken } from '../utils/generateToken.js';

const router = express.Router();

// Apply security logging
router.use(securityLogger);

// Helper to check if user is tutor
const isTutor = (req, res, next) => {
  if (req.user && req.user.role === 'tutor') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Tutor role required.' });
  }
};

// @route   POST /api/tutor/login
// @desc    Login as tutor using access code
// @access  Public
router.post('/login',
  authLimiter,
  [
    body('accessCode')
      .trim()
      .notEmpty()
      .withMessage('Access code is required')
      .isLength({ min: 6, max: 20 })
      .withMessage('Access code must be between 6 and 20 characters')
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
      const { accessCode } = req.body;

      // Find all tutors (we need to compare hashed access codes)
      const tutors = await User.find({ 
        role: 'tutor',
        tutorAccessCode: { $exists: true, $ne: null }
      }).select('+tutorAccessCode');

      // Find tutor with matching access code (compare hashed)
      let tutor = null;
      for (const t of tutors) {
        const isMatch = await t.compareAccessCode(accessCode);
        if (isMatch) {
          tutor = t;
          break;
        }
      }

      if (!tutor) {
        return res.status(401).json({ error: 'Invalid access code' });
      }

      if (!tutor.isActive) {
        return res.status(403).json({ error: 'Tutor account is inactive' });
      }

      // Update last active
      tutor.lastActive = new Date();
      await tutor.save();

      // Generate token
      const token = generateToken(tutor._id);

      // Return tutor info (without sensitive data)
      const tutorData = tutor.toObject();
      delete tutorData.tutorAccessCode;
      delete tutorData.password;

      res.json({
        token,
        user: tutorData,
        message: 'Tutor login successful'
      });
    } catch (error) {
      console.error('Tutor login error:', error);
      res.status(500).json({ error: 'Server error during login' });
    }
  }
);

// @route   GET /api/tutor/dashboard
// @desc    Get tutor dashboard data (all students, progress, appointments)
// @access  Private (Tutor only)
router.get('/dashboard',
  protect,
  isTutor,
  async (req, res) => {
    try {
      // Get all students, deduplicated by S0 Key (keep the most recent one)
      const allStudents = await User.find({ role: 'student', s0Key: { $ne: null } })
        .select('s0Key email fullName lastActive preferredLanguage createdAt')
        .sort({ lastActive: -1 })
        .lean();
      
      // Deduplicate by S0 Key - keep the most recent entry for each S0 Key
      const studentsMap = new Map();
      allStudents.forEach(student => {
        const s0Key = student.s0Key;
        if (s0Key) {
          if (!studentsMap.has(s0Key)) {
            studentsMap.set(s0Key, student);
          } else {
            // If this student is more recent, replace the existing one
            const existing = studentsMap.get(s0Key);
            const existingDate = existing.lastActive ? new Date(existing.lastActive) : new Date(0);
            const currentDate = student.lastActive ? new Date(student.lastActive) : new Date(0);
            if (currentDate > existingDate) {
              studentsMap.set(s0Key, student);
            }
          }
        }
      });
      
      // Convert map back to array
      const students = Array.from(studentsMap.values());

      // Get all appointments
      const appointments = await Appointment.find({ tutor: req.user._id })
        .populate('student', 's0Key email fullName')
        .sort({ appointmentDate: 1 });

      // Get all messages
      const messages = await Message.find({ to: req.user._id })
        .populate('from', 's0Key email fullName')
        .populate('appointment')
        .sort({ createdAt: -1 })
        .limit(50);

      // Get student progress stats (aggregate across all accounts with same S0 Key)
      const studentProgress = await Promise.all(
        students.map(async (student) => {
          // Find all users with the same S0 Key (in case of duplicates)
          const allUserIds = await User.find({ s0Key: student.s0Key, role: 'student' })
            .select('_id')
            .lean();
          const userIds = allUserIds.map(u => u._id);

          // Aggregate progress from all accounts with same S0 Key
          const quizProgress = await QuizProgress.find({ user: { $in: userIds } })
            .populate('quiz', 'title language difficulty')
            .sort({ completedAt: -1 });

          const flashcardProgress = await FlashcardProgress.find({ user: { $in: userIds } })
            .populate('flashcard', 'front back language difficulty');

          const codeSubmissions = await CodeSubmission.find({ userId: { $in: userIds } })
            .sort({ createdAt: -1 })
            .limit(10);

          const studentAppointments = await Appointment.find({ student: { $in: userIds } })
            .sort({ appointmentDate: 1 });

          const unreadMessages = await Message.countDocuments({
            to: req.user._id,
            from: { $in: userIds },
            isRead: false
          });

          return {
            student: {
              _id: student._id,
              s0Key: student.s0Key,
              email: student.email,
              fullName: student.fullName,
              lastActive: student.lastActive,
              preferredLanguage: student.preferredLanguage,
              createdAt: student.createdAt
            },
            quizProgress: quizProgress.length,
            quizScores: quizProgress.map(qp => ({
              quiz: qp.quiz,
              score: qp.score,
              percentage: qp.percentage,
              completedAt: qp.completedAt
            })),
            flashcardProgress: flashcardProgress.length,
            codeSubmissions: codeSubmissions.length,
            recentSubmissions: codeSubmissions,
            appointments: studentAppointments.length,
            upcomingAppointments: studentAppointments.filter(apt => 
              apt.appointmentDate > new Date() && apt.status !== 'cancelled'
            ),
            unreadMessages
          };
        })
      );

      res.json({
        tutor: {
          _id: req.user._id,
          fullName: req.user.fullName,
          email: req.user.email
        },
        stats: {
          totalStudents: students.length,
          totalAppointments: appointments.length,
          upcomingAppointments: appointments.filter(apt => 
            apt.appointmentDate > new Date() && apt.status !== 'cancelled'
          ).length,
          unreadMessages: messages.filter(m => !m.isRead).length
        },
        students: studentProgress,
        appointments,
        messages: messages.slice(0, 20)
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard data' });
    }
  }
);

// @route   GET /api/tutor/students/:studentId
// @desc    Get detailed student information and progress
// @access  Private (Tutor only)
router.get('/students/:studentId',
  protect,
  isTutor,
  async (req, res) => {
    try {
      const { studentId } = req.params;

      const student = await User.findById(studentId).select('-password -tutorAccessCode');
      
      if (!student || student.role !== 'student') {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Get all progress data
      const quizProgress = await QuizProgress.find({ user: studentId })
        .populate('quiz', 'title language difficulty totalPoints')
        .sort({ completedAt: -1 });

      const flashcardProgress = await FlashcardProgress.find({ user: studentId })
        .populate('flashcard', 'front back language difficulty');

      const codeSubmissions = await CodeSubmission.find({ userId: studentId })
        .sort({ createdAt: -1 });

      const appointments = await Appointment.find({ student: studentId })
        .sort({ appointmentDate: -1 });

      const messages = await Message.find({
        $or: [
          { from: studentId, to: req.user._id },
          { from: req.user._id, to: studentId }
        ]
      })
        .populate('from', 's0Key email fullName')
        .populate('to', 's0Key email fullName')
        .sort({ createdAt: -1 });

      res.json({
        student,
        progress: {
          quizProgress,
          flashcardProgress,
          codeSubmissions,
          totalQuizzes: quizProgress.length,
          totalFlashcards: flashcardProgress.length,
          totalSubmissions: codeSubmissions.length
        },
        appointments,
        messages
      });
    } catch (error) {
      console.error('Student details error:', error);
      res.status(500).json({ error: 'Failed to load student details' });
    }
  }
);

// @route   POST /api/tutor/demo-user
// @desc    Create a demo user for testing
// @access  Private (Tutor only)
router.post('/demo-user',
  protect,
  isTutor,
  [
    body('s0Key')
      .trim()
      .toUpperCase()
      .matches(/^S[O0]\d{7}$/)
      .withMessage('S0 Key must be in the format SO or S0 followed by 7 numbers'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Full name cannot exceed 100 characters'),
    body('email')
      .optional()
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Please provide a valid email address')
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
      const { s0Key, fullName, email } = req.body;

      // Normalize S0 Key
      let normalizedS0Key = s0Key.toUpperCase().replace(/^S0(\d+)/, 'SO$1');

      // Check if user already exists
      const existingUser = await User.findOne({ s0Key: normalizedS0Key });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this S0 Key already exists' });
      }

      // Create demo student
      const demoUser = await User.create({
        s0Key: normalizedS0Key,
        fullName: fullName || `Demo Student ${normalizedS0Key}`,
        email: email || null,
        role: 'student',
        isActive: true
      });

      res.status(201).json({
        message: 'Demo user created successfully',
        user: {
          _id: demoUser._id,
          s0Key: demoUser.s0Key,
          fullName: demoUser.fullName,
          email: demoUser.email,
          role: demoUser.role
        }
      });
    } catch (error) {
      console.error('Demo user creation error:', error);
      res.status(500).json({ error: 'Failed to create demo user' });
    }
  }
);

export default router;

