import express from 'express';
import Flashcard from '../models/Flashcard.js';
import FlashcardProgress from '../models/FlashcardProgress.js';
import { protect } from '../middleware/auth.js';
import { aiLimiter, securityLogger, sanitizeString } from '../middleware/security.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Apply security logging
router.use(securityLogger);

// @route   GET /api/flashcards
// @desc    Get all flashcards (public and user's own)
// @access  Public (with optional auth for personalized results)
router.get('/', async (req, res) => {
  try {
    const { language, difficulty, search, limit = 50, page = 1, review = false } = req.query;
    const query = {};

    // Filter by language
    if (language && language !== 'all') {
      query.language = language;
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    // Get public flashcards or user's own flashcards
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
        { front: { $regex: search, $options: 'i' } },
        { back: { $regex: search, $options: 'i' } },
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
    let flashcards = await Flashcard.find(query)
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // If user is authenticated and review mode, get cards due for review
    if (req.user && review === 'true') {
      const now = new Date();
      const progress = await FlashcardProgress.find({
        user: req.user._id,
        nextReview: { $lte: now },
        isMastered: false
      }).select('flashcard');

      const dueCardIds = progress.map(p => p.flashcard);
      flashcards = flashcards.filter(card => dueCardIds.includes(card._id.toString()));
    }

    const total = await Flashcard.countDocuments(query);

    res.json({
      flashcards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

// @route   GET /api/flashcards/:id
// @desc    Get a specific flashcard
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id)
      .populate('createdBy', 'username fullName');

    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    // Get user's progress if authenticated
    let progress = null;
    if (req.user) {
      progress = await FlashcardProgress.findOne({
        user: req.user._id,
        flashcard: flashcard._id
      });
    }

    res.json({
      flashcard,
      progress
    });
  } catch (error) {
    console.error('Error fetching flashcard:', error);
    res.status(500).json({ error: 'Failed to fetch flashcard' });
  }
});

// @route   POST /api/flashcards
// @desc    Create a new flashcard
// @access  Private
router.post('/',
  protect,
  aiLimiter,
  [
    body('front').trim().isLength({ min: 1, max: 500 }).withMessage('Front text is required and must be less than 500 characters'),
    body('back').trim().isLength({ min: 1, max: 2000 }).withMessage('Back text is required and must be less than 2000 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const flashcardData = {
        front: sanitizeString(req.body.front),
        back: sanitizeString(req.body.back),
        language: req.body.language || 'general',
        difficulty: req.body.difficulty || 'beginner',
        createdBy: req.user._id,
        isPublic: req.body.isPublic !== false,
        tags: req.body.tags ? req.body.tags.map(t => sanitizeString(t)) : []
      };

      const flashcard = await Flashcard.create(flashcardData);
      res.status(201).json(flashcard);
    } catch (error) {
      console.error('Error creating flashcard:', error);
      res.status(500).json({ error: 'Failed to create flashcard' });
    }
  }
);

// @route   POST /api/flashcards/:id/review
// @desc    Review a flashcard and update progress (spaced repetition)
// @access  Private
router.post('/:id/review',
  protect,
  aiLimiter,
  [
    body('quality').isInt({ min: 0, max: 5 }).withMessage('Quality must be between 0 and 5')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const flashcard = await Flashcard.findById(req.params.id);
      if (!flashcard) {
        return res.status(404).json({ error: 'Flashcard not found' });
      }

      const { quality } = req.body; // 0=forgot, 1=hard, 2=medium, 3=good, 4=easy, 5=very easy

      // Find or create progress
      let progress = await FlashcardProgress.findOne({
        user: req.user._id,
        flashcard: flashcard._id
      });

      if (!progress) {
        progress = await FlashcardProgress.create({
          user: req.user._id,
          flashcard: flashcard._id
        });
      }

      // Update progress using spaced repetition algorithm
      progress.updateProgress(quality);
      await progress.save();

      res.json({
        progress,
        message: 'Review recorded successfully',
        nextReview: progress.nextReview
      });
    } catch (error) {
      console.error('Error reviewing flashcard:', error);
      res.status(500).json({ error: 'Failed to record review' });
    }
  }
);

// @route   GET /api/flashcards/user/progress
// @desc    Get all flashcard progress for the current user
// @access  Private
router.get('/user/progress',
  protect,
  async (req, res) => {
    try {
      const progress = await FlashcardProgress.find({ user: req.user._id })
        .populate('flashcard', 'front back language difficulty')
        .sort({ nextReview: 1 });

      // Calculate statistics
      const now = new Date();
      const stats = {
        totalFlashcards: progress.length,
        mastered: progress.filter(p => p.isMastered).length,
        dueForReview: progress.filter(p => p.nextReview <= now && !p.isMastered).length,
        totalReviews: progress.reduce((sum, p) => sum + p.timesReviewed, 0),
        accuracy: progress.length > 0
          ? Math.round((progress.reduce((sum, p) => sum + p.timesCorrect, 0) /
            progress.reduce((sum, p) => sum + p.timesReviewed, 1)) * 100)
          : 0
      };

      res.json({
        progress,
        stats
      });
    } catch (error) {
      console.error('Error fetching flashcard progress:', error);
      res.status(500).json({ error: 'Failed to fetch flashcard progress' });
    }
  }
);

// @route   GET /api/flashcards/user/due
// @desc    Get flashcards due for review
// @access  Private
router.get('/user/due',
  protect,
  async (req, res) => {
    try {
      const now = new Date();
      const progress = await FlashcardProgress.find({
        user: req.user._id,
        nextReview: { $lte: now },
        isMastered: false
      })
        .populate('flashcard')
        .sort({ nextReview: 1 })
        .limit(50);

      res.json({
        flashcards: progress.map(p => ({
          flashcard: p.flashcard,
          progress: {
            easeFactor: p.easeFactor,
            interval: p.interval,
            repetitions: p.repetitions,
            timesReviewed: p.timesReviewed,
            timesCorrect: p.timesCorrect
          }
        }))
      });
    } catch (error) {
      console.error('Error fetching due flashcards:', error);
      res.status(500).json({ error: 'Failed to fetch due flashcards' });
    }
  }
);

// @route   DELETE /api/flashcards/:id
// @desc    Delete a flashcard (only by creator)
// @access  Private
router.delete('/:id',
  protect,
  async (req, res) => {
    try {
      const flashcard = await Flashcard.findById(req.params.id);
      if (!flashcard) {
        return res.status(404).json({ error: 'Flashcard not found' });
      }

      if (flashcard.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to delete this flashcard' });
      }

      // Delete associated progress
      await FlashcardProgress.deleteMany({ flashcard: flashcard._id });
      await Flashcard.findByIdAndDelete(req.params.id);

      res.json({ message: 'Flashcard deleted successfully' });
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      res.status(500).json({ error: 'Failed to delete flashcard' });
    }
  }
);

export default router;

