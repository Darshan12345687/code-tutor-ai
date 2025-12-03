import express from 'express';
import { protect } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac.js';
import Progress from '../models/Progress.js';
import CodeSubmission from '../models/CodeSubmission.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

const router = express.Router();

// @route   GET /api/analytics/user-progress
// @desc    Get detailed user progress analytics
// @access  Private
router.get('/user-progress', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all progress records
    const progressRecords = await Progress.find({ userId })
      .populate('lessonId', 'title courseId')
      .populate('courseId', 'title');

    // Calculate statistics
    const totalLessons = progressRecords.length;
    const completedLessons = progressRecords.filter(p => p.isCompleted).length;
    const averageCompletion = progressRecords.reduce((sum, p) => sum + p.completionPercentage, 0) / totalLessons || 0;
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    // Get course-wise progress
    const courseProgress = {};
    progressRecords.forEach(p => {
      if (p.courseId) {
        const courseId = p.courseId._id.toString();
        if (!courseProgress[courseId]) {
          courseProgress[courseId] = {
            course: p.courseId,
            totalLessons: 0,
            completedLessons: 0,
            averageCompletion: 0
          };
        }
        courseProgress[courseId].totalLessons++;
        if (p.isCompleted) {
          courseProgress[courseId].completedLessons++;
        }
        courseProgress[courseId].averageCompletion += p.completionPercentage;
      }
    });

    // Calculate averages
    Object.keys(courseProgress).forEach(courseId => {
      const cp = courseProgress[courseId];
      cp.averageCompletion = cp.averageCompletion / cp.totalLessons;
    });

    // Get code submission statistics
    const submissions = await CodeSubmission.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);

    const successfulSubmissions = submissions.filter(s => !s.error).length;
    const averageExecutionTime = submissions.reduce((sum, s) => sum + (s.executionTime || 0), 0) / submissions.length || 0;

    // Get concepts mastered
    const allConcepts = new Set();
    progressRecords.forEach(p => {
      if (p.conceptsMastered) {
        p.conceptsMastered.forEach(c => allConcepts.add(c));
      }
    });

    res.json({
      overview: {
        totalLessons,
        completedLessons,
        inProgressLessons: totalLessons - completedLessons,
        averageCompletion: Math.round(averageCompletion),
        totalTimeSpent: Math.round(totalTimeSpent / 60), // in minutes
        conceptsMastered: Array.from(allConcepts)
      },
      courseProgress: Object.values(courseProgress),
      codeStatistics: {
        totalSubmissions: submissions.length,
        successfulSubmissions,
        successRate: submissions.length > 0 ? Math.round((successfulSubmissions / submissions.length) * 100) : 0,
        averageExecutionTime: Math.round(averageExecutionTime * 1000) / 1000
      },
      recentActivity: progressRecords
        .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
        .slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/course/:courseId
// @desc    Get analytics for a specific course
// @access  Private
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.find({
      userId,
      courseId
    }).populate('lessonId', 'title orderIndex');

    const course = await Course.findById(courseId);

    res.json({
      course,
      progress: progress.sort((a, b) => {
        const aOrder = a.lessonId?.orderIndex || 0;
        const bOrder = b.lessonId?.orderIndex || 0;
        return aOrder - bOrder;
      }),
      statistics: {
        totalLessons: progress.length,
        completedLessons: progress.filter(p => p.isCompleted).length,
        averageCompletion: progress.reduce((sum, p) => sum + p.completionPercentage, 0) / progress.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

