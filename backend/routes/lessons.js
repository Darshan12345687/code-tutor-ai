import express from 'express';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/lessons
// @desc    Get all lessons (optionally filtered by courseId)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = { isPublished: true };
    
    if (courseId) {
      query.courseId = courseId;
    }

    const lessons = await Lesson.find(query)
      .populate('courseId', 'title')
      .sort({ orderIndex: 1 });
    
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/lessons/:id
// @desc    Get lesson by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('courseId', 'title description');

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/lessons
// @desc    Create a new lesson
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { courseId, title, content, codeExample, orderIndex } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ error: 'Course ID and title are required' });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const lesson = await Lesson.create({
      courseId,
      title,
      content,
      codeExample,
      orderIndex: orderIndex || 0
    });

    // Add lesson to course
    course.lessons.push(lesson._id);
    await course.save();

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/lessons/:id
// @desc    Update lesson
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const { title, content, codeExample, orderIndex, isPublished } = req.body;

    if (title) lesson.title = title;
    if (content !== undefined) lesson.content = content;
    if (codeExample !== undefined) lesson.codeExample = codeExample;
    if (orderIndex !== undefined) lesson.orderIndex = orderIndex;
    if (isPublished !== undefined) lesson.isPublished = isPublished;

    const updatedLesson = await lesson.save();
    res.json(updatedLesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete lesson
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Remove lesson from course
    await Course.updateOne(
      { _id: lesson.courseId },
      { $pull: { lessons: lesson._id } }
    );

    await lesson.deleteOne();
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;






