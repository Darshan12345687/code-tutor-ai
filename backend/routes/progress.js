import express from 'express';
import { protect } from '../middleware/auth.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';

const router = express.Router();

// Get user progress
router.get('/me', protect, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user.id || req.user._id })
      .populate('lessonId', 'title description')
      .populate('courseId', 'title')
      .sort({ lastAccessed: -1 });

    res.json({
      success: true,
      count: progress.length,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get progress for specific lesson
router.get('/lesson/:lessonId', protect, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user.id || req.user._id,
      lessonId: req.params.lessonId
    })
      .populate('lessonId')
      .populate('courseId');

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Progress not found'
      });
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update progress
router.put('/:progressId', protect, async (req, res) => {
  try {
    const { completionPercentage, isCompleted, timeSpent, conceptsMastered } = req.body;

    const progress = await Progress.findById(req.params.progressId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Progress not found'
      });
    }

    // Check ownership
    const userId = req.user.id || req.user._id;
    if (progress.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    if (completionPercentage !== undefined) {
      progress.completionPercentage = Math.max(progress.completionPercentage, completionPercentage);
    }

    if (isCompleted !== undefined) {
      progress.isCompleted = isCompleted;
      if (isCompleted && !progress.completedAt) {
        progress.completedAt = new Date();
      }
    }

    if (timeSpent !== undefined) {
      progress.timeSpent += timeSpent;
      progress.totalTimeSpent = (progress.totalTimeSpent || 0) + timeSpent;
    }

    if (conceptsMastered) {
      progress.conceptsMastered = [...new Set([...progress.conceptsMastered, ...conceptsMastered])];
    }

    progress.lastAccessed = new Date();
    await progress.save();

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save code execution to history
router.post('/save-code', protect, async (req, res) => {
  try {
    const { code, language, output, error, executionTime, lessonId } = req.body;
    const userId = req.user.id || req.user._id;

    // Find or create progress for this user and lesson
    let progress = await Progress.findOne({
      userId: userId,
      lessonId: lessonId || null
    });

    if (!progress && lessonId) {
      progress = await Progress.create({
        userId: userId,
        lessonId: lessonId,
        language: language
      });
    }

    // Add to code history
    if (progress) {
      progress.codeHistory.push({
        code,
        output: output || '',
        error: error || null,
        executedAt: new Date()
      });

      // Keep only last 50 entries
      if (progress.codeHistory.length > 50) {
        progress.codeHistory = progress.codeHistory.slice(-50);
      }

      progress.language = language;
      progress.lastAccessed = new Date();
      await progress.save();
    }

    // Also update user's learning history
    const user = await User.findById(userId);
    if (user && lessonId) {
      const existingHistory = user.learningHistory.find(h => h.lessonId.toString() === lessonId);
      if (existingHistory) {
        existingHistory.timeSpent = (existingHistory.timeSpent || 0) + (executionTime || 0);
      } else {
        user.learningHistory.push({
          lessonId,
          timeSpent: executionTime || 0
        });
      }
      await user.save();
    }

    res.json({
      success: true,
      message: 'Code history saved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const progress = await Progress.find({ userId: userId });

    const stats = {
      totalLessons: progress.length,
      completedLessons: progress.filter(p => p.isCompleted).length,
      totalTimeSpent: progress.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0),
      averageScore: progress.length > 0
        ? progress.reduce((sum, p) => sum + (p.averageScore || 0), 0) / progress.length
        : 0,
      conceptsMastered: [...new Set(progress.flatMap(p => p.conceptsMastered || []))],
      languagesUsed: [...new Set(progress.map(p => p.language).filter(Boolean))]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
