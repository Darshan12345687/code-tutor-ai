import express from 'express';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('lessons', 'title orderIndex')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'lessons',
        match: { isPublished: true },
        options: { sort: { orderIndex: 1 } }
      });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, difficultyLevel } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    const course = await Course.create({
      title,
      description,
      category,
      difficultyLevel: difficultyLevel || 'beginner'
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const { title, description, category, difficultyLevel, isPublished } = req.body;

    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (category) course.category = category;
    if (difficultyLevel) course.difficultyLevel = difficultyLevel;
    if (isPublished !== undefined) course.isPublished = isPublished;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete associated lessons
    await Lesson.deleteMany({ courseId: course._id });

    await course.deleteOne();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;






