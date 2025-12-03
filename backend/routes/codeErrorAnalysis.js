import express from 'express';
import { body, validationResult } from 'express-validator';
import { 
  analyzeCodeForIssues, 
  generateIssueFeedback, 
  parseErrorMessage,
  generateFallbackFeedback 
} from '../services/codeErrorAnalyzer.js';
import { generateCodeFeedback } from '../services/aiService.js';
import { sanitizeCode, validateLanguage } from '../middleware/security.js';

const router = express.Router();

/**
 * @route   POST /api/code-error/analyze
 * @desc    Analyze code for errors and provide suggestions (standalone analysis without AI)
 * @access  Public
 */
router.post('/analyze',
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string')
      .isLength({ max: 50000 })
      .withMessage('Code cannot exceed 50KB'),
    body('language')
      .optional()
      .isIn(['python', 'javascript', 'java', 'c', 'cpp'])
      .withMessage('Invalid language. Supported: python, javascript, java, c, cpp')
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
      const code = sanitizeCode(req.body.code);
      const language = validateLanguage(req.body.language) 
        ? req.body.language.toLowerCase() 
        : 'python';

      if (!code || code.length === 0) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }

      // Analyze code for issues
      const { issues, suggestions } = analyzeCodeForIssues(code, language);
      
      // Generate feedback from detected issues
      const feedback = generateIssueFeedback(issues, suggestions);

      res.json({
        success: true,
        issues: issues,
        suggestions: suggestions,
        feedback: feedback || 'No issues detected in the code.',
        issueCount: issues.length,
        language: language
      });
    } catch (error) {
      console.error('Code analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze code',
        message: error.message 
      });
    }
  }
);

/**
 * @route   POST /api/code-error/suggestions
 * @desc    Get AI-powered suggestions for code errors (with fallback to pattern matching)
 * @access  Public
 */
router.post('/suggestions',
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string')
      .isLength({ max: 50000 })
      .withMessage('Code cannot exceed 50KB'),
    body('error')
      .optional()
      .isString()
      .withMessage('Error must be a string'),
    body('output')
      .optional()
      .isString()
      .withMessage('Output must be a string'),
    body('language')
      .optional()
      .isIn(['python', 'javascript', 'java', 'c', 'cpp'])
      .withMessage('Invalid language'),
    body('provider')
      .optional()
      .isIn(['auto', 'openai', 'gemini', 'mistral', 'huggingface'])
      .withMessage('Invalid provider')
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
      const code = sanitizeCode(req.body.code);
      const error = req.body.error && typeof req.body.error === 'string' 
        ? req.body.error.trim() 
        : null;
      const output = req.body.output && typeof req.body.output === 'string' 
        ? req.body.output.trim() 
        : null;
      const language = validateLanguage(req.body.language) 
        ? req.body.language.toLowerCase() 
        : 'python';
      const provider = req.body.provider && typeof req.body.provider === 'string' 
        ? req.body.provider.trim() 
        : 'auto';

      if (!code || code.length === 0) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }

      // First, do a quick pattern-based analysis
      const { issues, suggestions } = analyzeCodeForIssues(code, language);
      
      // Log what we're analyzing
      if (error) {
        const errorInfo = parseErrorMessage(error);
        console.log('🔍 Analyzing code error:', {
          errorType: errorInfo?.type || 'Unknown',
          variable: errorInfo?.variable || null,
          line: errorInfo?.line || null,
          codeLength: code.length,
          hasOutput: !!output,
          patternIssues: issues.length
        });
      } else {
        console.log('🔍 Analyzing code for issues:', {
          codeLength: code.length,
          patternIssues: issues.length,
          hasOutput: !!output,
          language: language
        });
      }

      // Try to get AI-powered feedback
      let aiFeedback = null;
      let aiProvider = null;
      
      try {
        aiFeedback = await generateCodeFeedback(code, output, error, provider);
        aiProvider = 'ai-service';
      } catch (aiError) {
        console.warn('AI feedback failed, using fallback:', aiError.message);
        // Will use fallback below
      }

      // Use AI feedback if available, otherwise use pattern-based fallback
      const feedback = aiFeedback || generateFallbackFeedback(code, error, []);

      // Combine pattern analysis with AI feedback
      res.json({
        success: true,
        feedback: feedback,
        patternAnalysis: {
          issues: issues,
          suggestions: suggestions,
          issueCount: issues.length
        },
        errorInfo: error ? parseErrorMessage(error) : null,
        provider: aiProvider || 'pattern-analysis',
        language: language,
        hasError: !!error,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Code error analysis error:', error);
      
      // Try fallback
      try {
        const code = sanitizeCode(req.body.code);
        const errorMsg = req.body.error || null;
        const fallbackFeedback = generateFallbackFeedback(code, errorMsg, []);
        
        res.json({
          success: true,
          feedback: fallbackFeedback,
          provider: 'fallback',
          error: 'AI service unavailable, using pattern analysis'
        });
      } catch (fallbackError) {
        res.status(500).json({ 
          error: 'Failed to analyze code',
          message: error.message 
        });
      }
    }
  }
);

/**
 * @route   POST /api/code-error/parse-error
 * @desc    Parse an error message and extract structured information
 * @access  Public
 */
router.post('/parse-error',
  [
    body('error')
      .notEmpty()
      .withMessage('Error message is required')
      .isString()
      .withMessage('Error must be a string')
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
      const error = req.body.error.trim();
      const errorInfo = parseErrorMessage(error);

      res.json({
        success: true,
        errorInfo: errorInfo,
        original: error
      });
    } catch (error) {
      console.error('Error parsing error message:', error);
      res.status(500).json({ 
        error: 'Failed to parse error message',
        message: error.message 
      });
    }
  }
);

export default router;




