import express from 'express';
import { protect } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac.js';
import { checkAIUsageLimit, aiLimiter, securityLogger, sanitizeCode, validateLanguage, requestSizeLimiter } from '../middleware/security.js';
import { explainCode, answerQuestion, isQuestion, generateCourseContent, generateCodeFeedback, getAvailableProviders, resetProviderHealth } from '../services/aiService.js';
import { isProgrammingRelated } from '../config/codetutorPrompt.js';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Apply security logging
router.use(securityLogger);

// @route   GET /api/ai/providers
// @desc    Get available AI providers with health status
// @access  Public
router.get('/providers', async (req, res) => {
  try {
    const providers = getAvailableProviders();
    const healthyCount = providers.filter(p => p.healthy).length;
    res.json({ 
      providers,
      summary: {
        total: providers.length,
        healthy: healthyCount,
        fallbackAvailable: healthyCount > 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/ai/explain
// @desc    Get AI-powered code explanation (CodeTutor-AI trained)
// @access  Public (with optional auth for enhanced features)
router.post('/explain', 
  requestSizeLimiter('10mb'),
  aiLimiter,
  [
    body('code').optional().isString().withMessage('Code must be a string'),
    body('question').optional().isString().isLength({ max: 5000 }).withMessage('Question must be a string and cannot exceed 5000 characters'),
    body('language').optional().isIn(['python', 'java', 'c', 'cpp', 'csharp', 'javascript']).withMessage('Invalid programming language'),
    body('provider').optional().isString().withMessage('Provider must be a string'),
    body('mode').optional().isIn(['default', 'beginner', 'strict', 'engineer']).withMessage('Invalid mode')
  ],
  async (req, res) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      // Sanitize inputs
      let code = req.body.code ? sanitizeCode(req.body.code) : undefined;
      const question = req.body.question ? req.body.question.trim().substring(0, 5000) : undefined;
      const language = validateLanguage(req.body.language) ? req.body.language.toLowerCase() : 'python';
      const provider = req.body.provider ? req.body.provider.trim() : 'auto';
      const mode = req.body.mode || 'default';

      if (!code && !question) {
        return res.status(400).json({ error: 'Code or question is required' });
      }

      // Additional validation
      if (code && code.length === 0) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }
      
      if (question && question.length === 0) {
        return res.status(400).json({ error: 'Question cannot be empty' });
      }

      // Validate question is programming-related if provided
      if (question && !isProgrammingRelated(question)) {
        return res.json({
          explanation: "I can only help with programming and software-development topics. Please ask me something related to coding or computer science!",
          provider: 'codetutor-ai',
          concepts: [],
          examples: [],
          isRefusal: true
        });
      }

      // Check if user is authenticated (optional - try to get user but don't require it)
      let user = null;
      try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          const jwt = require('jsonwebtoken');
          const token = req.headers.authorization.split(' ')[1];
          const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
          const decoded = jwt.verify(token, JWT_SECRET);
          user = await User.findById(decoded.id);
        }
      } catch (authError) {
        // Continue without authentication - allow basic explanations
        console.log('Optional auth check failed, continuing without auth');
      }

      // Determine if this is a question or code to explain
      // If 'question' field is provided WITHOUT 'code', ALWAYS treat it as a question (not code)
      // If 'code' field is provided, treat it as code to explain
      let result;
      let isQuestionAnswer = false;
      
      if (question && !code) {
        // This is definitely a programming question - use answerQuestion
        console.log('✅ [AI] Treating input as a programming question:', question.substring(0, 100));
        result = await answerQuestion(question, language || 'python', provider || 'auto', mode || 'default');
        isQuestionAnswer = true;
        console.log('✅ [AI] Question answered using provider:', result.provider);
      } else if (code && !question) {
        // This is code to explain
        console.log('✅ [AI] Treating input as code to explain');
        result = await explainCode(code, language || 'python', provider || 'auto', mode || 'default');
        isQuestionAnswer = false;
      } else if (question && code) {
        // Both provided - check if question is actually a question or just a prompt
        // If question looks like a real question, answer it; otherwise explain code
        if (isQuestion(question)) {
          console.log('✅ [AI] Both provided, treating as question:', question.substring(0, 100));
          result = await answerQuestion(question, language || 'python', provider || 'auto', mode || 'default');
          isQuestionAnswer = true;
        } else {
          console.log('✅ [AI] Both provided, treating as code explanation');
          result = await explainCode(code, language || 'python', provider || 'auto', mode || 'default');
          isQuestionAnswer = false;
        }
      } else {
        // Fallback - shouldn't happen due to validation above
        throw new Error('Either code or question must be provided');
      }

      // Ensure result has required fields
      const formattedResult = {
        explanation: result.explanation || result.message || 'No explanation available',
        concepts: Array.isArray(result.concepts) ? result.concepts : [],
        examples: Array.isArray(result.examples) ? result.examples : [],
        provider: result.provider || 'ai',
        isQuestionAnswer: isQuestionAnswer, // Flag to indicate if this is a question answer
        isCodeExplanation: !isQuestionAnswer, // Flag to indicate if this is a code explanation
        ...(result.warning && { warning: result.warning }),
        ...(result.errors && { errors: result.errors })
      };

      // Increment AI usage count if authenticated
      if (user) {
        try {
          await User.findByIdAndUpdate(user._id, {
            $inc: { aiUsageCount: 1 },
            lastActive: new Date()
          });
        } catch (updateError) {
          console.log('Failed to update AI usage count:', updateError);
        }
      }

      res.json(formattedResult);
    } catch (error) {
      console.error('AI explanation error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to generate explanation',
        explanation: 'An error occurred while generating the explanation. Please try again.',
        concepts: [],
        examples: []
      });
    }
  }
);

// @route   POST /api/ai/code-feedback
// @desc    Get AI feedback on code errors and compilation issues (for terminal)
// @access  Public (with optional auth for enhanced features)
router.post('/code-feedback',
  requestSizeLimiter('10mb'),
  aiLimiter,
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string')
      .isLength({ min: 1, max: 50000 })
      .withMessage('Code must be between 1 and 50000 characters'),
    body('error')
      .optional({ nullable: true, checkFalsy: true })
      .custom((value) => {
        if (value === null || value === undefined || value === '') {
          return true; // Allow null/empty
        }
        return typeof value === 'string';
      })
      .withMessage('Error must be a string'),
    body('output')
      .optional({ nullable: true, checkFalsy: true })
      .custom((value) => {
        if (value === null || value === undefined || value === '') {
          return true; // Allow null/empty
        }
        return typeof value === 'string';
      })
      .withMessage('Output must be a string'),
    body('language')
      .optional()
      .isIn(['python', 'java', 'c', 'cpp', 'csharp', 'javascript'])
      .withMessage('Invalid programming language'),
    body('provider')
      .optional()
      .isString()
      .withMessage('Provider must be a string')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors for code-feedback:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(e => ({ param: e.param, msg: e.msg, value: e.value }))
      });
    }

    try {
      // Ensure code exists and is a string
      if (!req.body.code || typeof req.body.code !== 'string') {
        return res.status(400).json({ error: 'Code is required and must be a string' });
      }
      
      const code = sanitizeCode(req.body.code);
      const error = req.body.error && typeof req.body.error === 'string' ? req.body.error.trim() : null;
      const output = req.body.output && typeof req.body.output === 'string' ? req.body.output.trim() : null;
      const language = validateLanguage(req.body.language) ? req.body.language.toLowerCase() : 'python';
      const provider = req.body.provider && typeof req.body.provider === 'string' ? req.body.provider.trim() : 'auto';

      if (!code || code.length === 0) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }

      // Log what we're analyzing for debugging
      if (error) {
        console.log('🔍 Analyzing console error for user:', {
          errorType: error.split(':')[0], // Extract error type (NameError, TypeError, etc.)
          errorMessage: error.substring(0, 200), // First 200 chars
          codeLength: code.length,
          hasOutput: !!output
        });
      } else {
        console.log('🔍 Checking code for errors and providing suggestions (no explicit error provided):', {
          codeLength: code.length,
          hasOutput: !!output,
          language: language
        });
      }

      // Use generateCodeFeedback - this will check for errors and provide feedback
      // It detects errors even when no explicit error message is provided
      const feedback = await generateCodeFeedback(code, output, error, provider);

      res.json({
        feedback: feedback,
        provider: provider,
        type: 'code-error-feedback',
        errorAnalyzed: error || null // Include the error that was analyzed
      });
    } catch (error) {
      console.error('Code feedback error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate code feedback' });
    }
  }
);

// @route   POST /api/ai/ask
// @desc    Ask CodeTutor-AI a programming question (for teaching/learning)
// @access  Private (requires use_ai_features permission)
router.post('/ask',
  protect,
  aiLimiter,
  checkAIUsageLimit,
  hasPermission('use_ai_features'),
  async (req, res) => {
    try {
      const { question, language, provider, mode } = req.body;

      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // Validate question is programming-related
      if (!isProgrammingRelated(question)) {
        return res.json({
          answer: "I can only help with programming and software-development topics. Please ask me something related to coding or computer science!",
          provider: 'codetutor-ai',
          isRefusal: true
        });
      }

      // Use answerQuestion for conceptual questions
      const result = await answerQuestion(question, language || 'python', provider || 'auto', mode || 'default');

      // Increment AI usage count
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { aiUsageCount: 1 },
        lastActive: new Date()
      });

      res.json({
        answer: result.explanation,
        provider: result.provider,
        concepts: result.concepts,
        examples: result.examples
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/ai/generate-course
// @desc    Generate AI-powered course content (CodeTutor-AI trained)
// @access  Private (requires write_courses permission)
router.post('/generate-course',
  protect,
  aiLimiter,
  checkAIUsageLimit,
  hasPermission('write_courses'),
  async (req, res) => {
    try {
      const { topic, difficulty } = req.body;

      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      // Validate topic is programming-related
      if (!isProgrammingRelated(topic)) {
        return res.status(400).json({ 
          error: 'I can only help with programming and software-development topics. Please provide a programming-related topic.' 
        });
      }

      const courseContent = await generateCourseContent(topic, difficulty || 'beginner');

      // Increment AI usage count
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { aiUsageCount: 1 },
        lastActive: new Date()
      });

      res.json(courseContent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/ai/feedback
// @desc    Get AI feedback on code (CodeTutor-AI trained)
// @access  Private (requires use_ai_features permission)
router.post('/feedback',
  protect,
  aiLimiter,
  checkAIUsageLimit,
  hasPermission('use_ai_features'),
  async (req, res) => {
    try {
      const { code, output, error } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const feedback = await generateCodeFeedback(code, output, error);

      // Increment AI usage count
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { aiUsageCount: 1 },
        lastActive: new Date()
      });

      res.json({ feedback });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/ai/reset-health
// @desc    Reset provider health status (for recovery)
// @access  Private (Admin only)
router.post('/reset-health', 
  protect,
  async (req, res) => {
    try {
      const { provider } = req.body;
      resetProviderHealth(provider || null);
      res.json({ 
        message: provider 
          ? `Health status reset for ${provider}` 
          : 'All provider health statuses reset'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
