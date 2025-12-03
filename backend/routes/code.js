import express from 'express';
import CodeSubmission from '../models/CodeSubmission.js';
import { protect } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac.js';
import { codeExecutionLimiter, securityLogger, sanitizeCode, validateLanguage, requestSizeLimiter } from '../middleware/security.js';
import { executeCodeInSandbox, executeCodeLocally } from '../services/sandboxService.js';
import { generateCodeFeedback } from '../services/aiService.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Apply security logging
router.use(securityLogger);

// Legacy explanation generator (fallback)
const generateExplanation = (code) => {
  const explanationParts = [];
  const concepts = [];
  const codeLower = code.toLowerCase();

  // Detect data structures and concepts
  if (codeLower.includes('list') || code.includes('[]') || codeLower.includes('append')) {
    concepts.push('Lists');
    explanationParts.push('This code uses Python lists, which are ordered, mutable collections.');
  }

  if (codeLower.includes('dict') || code.includes('{}') || codeLower.includes('keys')) {
    concepts.push('Dictionaries');
    explanationParts.push('This code uses dictionaries, which store key-value pairs.');
  }

  if (codeLower.includes('set') || (code.includes('{') && code.includes('}') && !codeLower.includes('dict'))) {
    concepts.push('Sets');
    explanationParts.push('This code uses sets, which are unordered collections of unique elements.');
  }

  if (codeLower.includes('tuple') || code.includes('()')) {
    concepts.push('Tuples');
    explanationParts.push('This code uses tuples, which are immutable ordered collections.');
  }

  if (codeLower.includes('class')) {
    concepts.push('Object-Oriented Programming');
    explanationParts.push('This code defines a class, demonstrating object-oriented programming concepts.');
  }

  if (codeLower.includes('def') || codeLower.includes('lambda')) {
    concepts.push('Functions');
    explanationParts.push('This code defines functions, which are reusable blocks of code.');
  }

  if (codeLower.includes('for') || codeLower.includes('while')) {
    concepts.push('Loops');
    explanationParts.push('This code uses loops for iteration.');
  }

  if (codeLower.includes('if') || codeLower.includes('else') || codeLower.includes('elif')) {
    concepts.push('Conditional Statements');
    explanationParts.push('This code uses conditional statements for decision-making.');
  }

  let explanation = 'Code Explanation:\n\n';
  explanation += code + '\n\n';

  if (explanationParts.length > 0) {
    explanation += 'Key Concepts:\n';
    explanationParts.forEach(part => {
      explanation += `- ${part}\n`;
    });
  } else {
    explanation += 'This code demonstrates fundamental programming concepts.';
  }

  const examples = [];
  if (concepts.includes('Lists')) {
    examples.push('my_list = [1, 2, 3]\nmy_list.append(4)  # Adds 4 to the list');
  }
  if (concepts.includes('Dictionaries')) {
    examples.push("my_dict = {'name': 'Alice', 'age': 30}\nprint(my_dict['name'])  # Outputs: Alice");
  }
  if (concepts.includes('Sets')) {
    examples.push('my_set = {1, 2, 3}\nmy_set.add(4)  # Adds 4 to the set');
  }

  return {
    explanation,
    concepts: [...new Set(concepts)] || ['General Programming'],
    examples: examples.length > 0 ? examples : ['Run the code to see how it works!']
  };
};

// @route   POST /api/code/execute
// @desc    Execute code in sandbox
// @access  Public (but rate limited)
router.post('/execute', 
  requestSizeLimiter('10mb'),
  codeExecutionLimiter,
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string')
      .isLength({ max: 100000 })
      .withMessage('Code cannot exceed 100KB'),
    body('language')
      .optional()
      .isIn(['python', 'java', 'c', 'cpp', 'csharp', 'javascript'])
      .withMessage('Invalid programming language'),
    body('useSandbox')
      .optional()
      .isBoolean()
      .withMessage('useSandbox must be a boolean')
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
      // Sanitize and validate inputs
      let code;
      try {
        code = sanitizeCode(req.body.code);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }

      const selectedLanguage = validateLanguage(req.body.language) 
        ? req.body.language.toLowerCase() 
        : 'python';
      const useSandbox = req.body.useSandbox === true;

      if (!code || code.length === 0) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }

      // Use sandbox if available and requested
      const result = useSandbox 
        ? await executeCodeInSandbox(code, selectedLanguage)
        : await executeCodeLocally(code, selectedLanguage);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/code/execute-save
// @desc    Execute code and save submission (if authenticated)
// @access  Private (requires save_code permission)
router.post('/execute-save', 
  requestSizeLimiter('10mb'),
  protect,
  codeExecutionLimiter,
  hasPermission('save_code'),
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string')
      .isLength({ max: 100000 })
      .withMessage('Code cannot exceed 100KB'),
    body('language')
      .optional()
      .isIn(['python', 'java', 'c', 'cpp', 'csharp', 'javascript'])
      .withMessage('Invalid programming language'),
    body('lessonId')
      .optional()
      .isMongoId()
      .withMessage('Invalid lesson ID format')
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
    // Sanitize and validate inputs
    let code;
    try {
      code = sanitizeCode(req.body.code);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const language = validateLanguage(req.body.language) 
      ? req.body.language.toLowerCase() 
      : 'python';
    const lessonId = req.body.lessonId;

    if (!code || code.length === 0) {
      return res.status(400).json({ error: 'Code cannot be empty' });
    }

    if (language !== 'python') {
      return res.status(400).json({ error: 'Currently only Python is supported for saved submissions' });
    }

    const { useSandbox, generateFeedback } = req.body;

    // Execute code
    const result = useSandbox
      ? await executeCodeInSandbox(code, language)
      : await executeCodeLocally(code, language);

    // Generate AI feedback if requested and user has permission
    let feedback = null;
    if (generateFeedback && req.user.role !== 'student' || req.user.subscription === 'premium') {
      try {
        feedback = await generateCodeFeedback(code, result.output, result.error);
      } catch (error) {
        console.error('Feedback generation error:', error);
      }
    }

    // Save submission
    const submission = await CodeSubmission.create({
      userId: req.user._id,
      lessonId: lessonId || null,
      code,
      language,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      feedback
    });

    res.json({
      ...result,
      feedback,
      submissionId: submission._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/code/explain
// @desc    Get code explanation
// @access  Public
router.post('/explain', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const result = generateExplanation(code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/code/submissions
// @desc    Get user's code submissions
// @access  Private
router.get('/submissions', protect, async (req, res) => {
  try {
    const { lessonId } = req.query;
    const query = { userId: req.user._id };
    
    if (lessonId) {
      query.lessonId = lessonId;
    }

    const submissions = await CodeSubmission.find(query)
      .populate('lessonId', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

