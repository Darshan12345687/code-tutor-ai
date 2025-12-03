import express from 'express';
import Quiz from '../models/Quiz.js';
import QuizProgress from '../models/QuizProgress.js';
import { protect } from '../middleware/auth.js';
import { aiLimiter, securityLogger, sanitizeString } from '../middleware/security.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Apply security logging
router.use(securityLogger);

// @route   GET /api/quizzes
// @desc    Get all quizzes (public and user's own)
// @access  Public (with optional auth for personalized results)
router.get('/', async (req, res) => {
  try {
    const { language, difficulty, search, limit = 50, page = 1 } = req.query;
    const query = {};

    // Filter by language
    if (language && language !== 'all') {
      query.language = language;
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    // Get public quizzes or user's own quizzes
    const accessConditions = [];
    if (req.user) {
      accessConditions.push({ isPublic: true });
      accessConditions.push({ createdBy: req.user._id });
    } else {
      query.isPublic = true;
    }

    // Search functionality (using regex since we removed text index)
    if (search) {
      const searchConditions = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
      
      if (accessConditions.length > 0) {
        query.$and = [
          { $or: accessConditions },
          { $or: searchConditions }
        ];
      } else {
        query.$or = searchConditions;
      }
    } else if (accessConditions.length > 0) {
      query.$or = accessConditions;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-questions.correctAnswer'); // Don't expose answers

    const total = await Quiz.countDocuments(query);

    res.json({
      quizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get a specific quiz (without answers for taking, with answers for viewing own quiz)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'username fullName');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if user can view answers (owner or has completed quiz)
    let showAnswers = false;
    if (req.user) {
      if (quiz.createdBy._id.toString() === req.user._id.toString()) {
        showAnswers = true; // Owner can see answers
      } else {
        // Check if user has completed this quiz
        const progress = await QuizProgress.findOne({
          user: req.user._id,
          quiz: quiz._id
        });
        if (progress) {
          showAnswers = true; // Can see answers after completing
        }
      }
    }

    // Remove correct answers if user shouldn't see them
    const quizData = quiz.toObject();
    if (!showAnswers) {
      quizData.questions = quizData.questions.map(q => {
        const question = { ...q };
        delete question.correctAnswer;
        return question;
      });
    }

    res.json(quizData);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// @route   POST /api/quizzes
// @desc    Create a new quiz
// @access  Private
router.post('/',
  protect,
  aiLimiter,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('questions.*.question').trim().notEmpty().withMessage('Question text is required'),
    body('questions.*.correctAnswer').notEmpty().withMessage('Correct answer is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const quizData = {
        title: sanitizeString(req.body.title),
        description: req.body.description ? sanitizeString(req.body.description) : '',
        language: req.body.language || 'general',
        difficulty: req.body.difficulty || 'beginner',
        questions: req.body.questions.map(q => ({
          question: sanitizeString(q.question),
          type: q.type || 'multiple-choice',
          options: q.options ? q.options.map(opt => sanitizeString(opt)) : [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ? sanitizeString(q.explanation) : '',
          points: q.points || 1
        })),
        createdBy: req.user._id,
        isPublic: req.body.isPublic !== false,
        tags: req.body.tags ? req.body.tags.map(t => sanitizeString(t)) : [],
        timeLimit: req.body.timeLimit || 0
      };

      const quiz = await Quiz.create(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(500).json({ error: 'Failed to create quiz' });
    }
  }
);

// @route   POST /api/quizzes/:id/submit
// @desc    Submit quiz answers and get results
// @access  Private
router.post('/:id/submit',
  protect,
  aiLimiter,
  [
    body('answers').isArray().withMessage('Answers array is required'),
    body('timeSpent').optional().isNumeric().withMessage('Time spent must be a number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      const { answers, timeSpent = 0 } = req.body;

      // Calculate score
      let score = 0;
      let totalPoints = 0;
      const answerResults = [];

      quiz.questions.forEach((question, index) => {
        totalPoints += question.points || 1;
        const userAnswer = answers[index];
        let isCorrect = false;
        let pointsEarned = 0;

        // Check if answer is correct
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          isCorrect = String(userAnswer) === String(question.correctAnswer);
        } else if (question.type === 'short-answer') {
          // For short answer, do case-insensitive comparison
          const userAns = String(userAnswer).toLowerCase().trim();
          const correctAns = String(question.correctAnswer).toLowerCase().trim();
          isCorrect = userAns === correctAns || userAns.includes(correctAns) || correctAns.includes(userAns);
        } else {
          // For code questions, exact match
          isCorrect = String(userAnswer).trim() === String(question.correctAnswer).trim();
        }

        if (isCorrect) {
          pointsEarned = question.points || 1;
          score += pointsEarned;
        }

        answerResults.push({
          questionIndex: index,
          userAnswer,
          isCorrect,
          pointsEarned,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        });
      });

      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

      // Get attempt number
      const previousAttempts = await QuizProgress.countDocuments({
        user: req.user._id,
        quiz: quiz._id
      });

      // Save progress
      const progress = await QuizProgress.create({
        user: req.user._id,
        quiz: quiz._id,
        score,
        totalPoints,
        percentage,
        timeSpent: Math.round(timeSpent),
        answers: answerResults,
        attemptNumber: previousAttempts + 1
      });

      // Update quiz statistics
      const allProgress = await QuizProgress.find({ quiz: quiz._id });
      const avgScore = allProgress.reduce((sum, p) => sum + p.percentage, 0) / allProgress.length;
      await Quiz.findByIdAndUpdate(quiz._id, {
        attempts: allProgress.length,
        averageScore: Math.round(avgScore)
      });

      res.json({
        progress,
        results: {
          score,
          totalPoints,
          percentage,
          grade: progress.grade,
          answers: answerResults
        }
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ error: 'Failed to submit quiz' });
    }
  }
);

// @route   GET /api/quizzes/:id/progress
// @desc    Get user's progress for a specific quiz
// @access  Private
router.get('/:id/progress',
  protect,
  async (req, res) => {
    try {
      const progress = await QuizProgress.find({
        user: req.user._id,
        quiz: req.params.id
      })
        .sort({ completedAt: -1 })
        .populate('quiz', 'title');

      res.json(progress);
    } catch (error) {
      console.error('Error fetching quiz progress:', error);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  }
);

// @route   GET /api/quizzes/user/progress
// @desc    Get all quiz progress for the current user
// @access  Private
router.get('/user/progress',
  protect,
  async (req, res) => {
    try {
      const progress = await QuizProgress.find({ user: req.user._id })
        .populate('quiz', 'title language difficulty')
        .sort({ completedAt: -1 })
        .limit(100);

      // Calculate statistics
      const stats = {
        totalQuizzes: new Set(progress.map(p => p.quiz._id.toString())).size,
        totalAttempts: progress.length,
        averageScore: progress.length > 0
          ? Math.round(progress.reduce((sum, p) => sum + p.percentage, 0) / progress.length)
          : 0,
        bestScore: progress.length > 0 ? Math.max(...progress.map(p => p.percentage)) : 0,
        recentProgress: progress.slice(0, 10)
      };

      res.json({
        progress,
        stats
      });
    } catch (error) {
      console.error('Error fetching user progress:', error);
      res.status(500).json({ error: 'Failed to fetch user progress' });
    }
  }
);

// @route   DELETE /api/quizzes/:id
// @desc    Delete a quiz (only by creator)
// @access  Private
router.delete('/:id',
  protect,
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      if (quiz.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to delete this quiz' });
      }

      // Delete associated progress
      await QuizProgress.deleteMany({ quiz: quiz._id });
      await Quiz.findByIdAndDelete(req.params.id);

      res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({ error: 'Failed to delete quiz' });
    }
  }
);

export default router;

