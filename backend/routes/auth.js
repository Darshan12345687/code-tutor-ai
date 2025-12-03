import express from 'express';
import User from '../models/User.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, registrationLimiter, securityLogger, validateEmail, validateS0Key, sanitizeString } from '../middleware/security.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Apply security logging to all auth routes
router.use(securityLogger);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  registrationLimiter,
  [
    body('email')
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .custom((value) => {
        if (!value.endsWith('@semo.edu')) {
          throw new Error('Email must be a SEMO.EDU email address');
        }
        return true;
      }),
    body('s0Key')
      .trim()
      .toUpperCase()
      .matches(/^S[O0]\d{7}$/)
      .withMessage('S0 Key must be in the format SO or S0 followed by 7 numbers (e.g., SO1234567)'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Full name cannot exceed 100 characters'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
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
    const username = req.body.username ? sanitizeString(req.body.username) : undefined;
    const email = sanitizeString(req.body.email);
    const password = req.body.password; // Don't sanitize password
    const fullName = req.body.fullName ? sanitizeString(req.body.fullName) : undefined;
    let s0Key = sanitizeString(req.body.s0Key);

    // Validation
    if (!email || !s0Key) {
      return res.status(400).json({ error: 'Email and S0 Key are required' });
    }

    // Validate SEMO.EDU email
    const emailLower = email.toLowerCase().trim();
    if (!validateEmail(emailLower)) {
      return res.status(400).json({ error: 'Email must be a valid SEMO.EDU email address' });
    }

    // Validate and normalize S0 Key format
    let s0KeyValue = s0Key.trim().toUpperCase();
    
    // Remove any dashes or spaces
    s0KeyValue = s0KeyValue.replace(/[-\s]/g, '');
    
    // Validate format
    if (!validateS0Key(s0KeyValue)) {
      return res.status(400).json({ error: 'S0 Key must be in the format SO or S0 followed by 7 numbers (e.g., SO1234567)' });
    }
    
    // Normalize: convert S0 (zero) to SO (letter O) for consistency
    s0KeyValue = s0KeyValue.replace(/^S0(\d+)/, 'SO$1');
    s0Key = s0KeyValue;

    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [{ email: emailLower }, { username }, { s0Key: s0Key.toUpperCase() }] 
    });

    if (userExists) {
      if (userExists.email === emailLower) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      if (userExists.username === username) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      if (userExists.s0Key === s0Key.toUpperCase()) {
        return res.status(400).json({ error: 'S0 Key already exists' });
      }
    }

    // Create user
    const user = await User.create({
      username,
      email: emailLower,
      password,
      fullName: fullName || '',
      s0Key: s0Key.toUpperCase()
    });

    if (user) {
      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Store refresh token (in production, use Redis or database)
      // For now, we'll include it in response
      
      console.log(`✅ [AUTH] New user registered: ${emailLower} from IP: ${req.ip}`);
      
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        token,
        refreshToken
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (auto-creates account if doesn't exist)
// @access  Public
router.post('/login',
  authLimiter,
  [
    body('email')
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .custom((value) => {
        if (!value.endsWith('@semo.edu')) {
          throw new Error('Email must be a SEMO.EDU email address');
        }
        return true;
      }),
    body('s0Key')
      .trim()
      .toUpperCase()
      .matches(/^S[O0]\d{7}$/)
      .withMessage('S0 Key must be in the format SO or S0 followed by 7 numbers (e.g., SO1234567)'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Full name cannot exceed 100 characters')
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
    const email = sanitizeString(req.body.email);
    let s0Key = sanitizeString(req.body.s0Key);
    const fullName = req.body.fullName ? sanitizeString(req.body.fullName) : undefined;

    // Validate SEMO.EDU email
    const emailLower = email.toLowerCase().trim();
    if (!validateEmail(emailLower)) {
      return res.status(400).json({ error: 'Email must be a valid SEMO.EDU email address' });
    }

    // Validate and normalize S0 Key format
    let s0KeyValue = s0Key.trim().toUpperCase();
    
    // Remove any dashes or spaces
    s0KeyValue = s0KeyValue.replace(/[-\s]/g, '');
    
    // Validate format
    if (!validateS0Key(s0KeyValue)) {
      return res.status(400).json({ error: 'S0 Key must be in the format SO or S0 followed by 7 numbers (e.g., SO1234567)' });
    }
    
    // Normalize: convert S0 (zero) to SO (letter O) for consistency
    s0KeyValue = s0KeyValue.replace(/^S0(\d+)/, 'SO$1');

    // Check if user exists by S0 Key first (S0 Key is the primary identifier)
    let user = await User.findOne({ s0Key: s0KeyValue });

    // If user exists by S0 Key, update email if different
    if (user) {
      // If email is different, update it (but don't create duplicate)
      if (user.email !== emailLower) {
        // Check if email is already used by another user
        const emailExists = await User.findOne({ email: emailLower });
        if (emailExists && emailExists._id.toString() !== user._id.toString()) {
          return res.status(400).json({ error: 'This email is already associated with another S0 Key' });
        }
        user.email = emailLower;
        await user.save();
      }
    } else {
      // User doesn't exist - check if S0 Key or email is already used
      const s0KeyExists = await User.findOne({ s0Key: s0KeyValue });
      if (s0KeyExists) {
        // S0 Key exists but query didn't find it (normalization issue) - use existing user
        user = s0KeyExists;
        if (user.email !== emailLower) {
          const emailExists = await User.findOne({ email: emailLower });
          if (emailExists && emailExists._id.toString() !== user._id.toString()) {
            return res.status(400).json({ error: 'This email is already associated with another S0 Key' });
          }
          user.email = emailLower;
          await user.save();
        }
      } else {
        // Check if email is already used
        const emailExists = await User.findOne({ email: emailLower });
        if (emailExists) {
          return res.status(400).json({ error: 'This email is already associated with another S0 Key' });
        }

        // Auto-generate username from email
        let username = emailLower.split('@')[0].replace(/[^a-z0-9]/gi, '');
        let baseUsername = username;
        let counter = 1;
        
        // Ensure username uniqueness
        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Create new user automatically
        user = await User.create({
          username,
          email: emailLower,
          s0Key: s0KeyValue,
          fullName: fullName || emailLower.split('@')[0],
          isActive: true
        });
      }
    }

    // Update fullName if provided
    if (fullName && fullName.trim() && user.fullName !== fullName.trim()) {
      user.fullName = fullName.trim();
      await user.save();
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Log successful login
    console.log(`✅ [AUTH] Successful login: ${emailLower} from IP: ${req.ip}`);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
      token,
      refreshToken
    });
  } catch (error) {
    console.error(`❌ [AUTH] Login error: ${error.message} from IP: ${req.ip}`);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(`❌ [AUTH] Error getting user: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/login-s0key
// @desc    Login with S0 Key only (no email required) - for QR code scanning
// @access  Public
router.post('/login-s0key',
  authLimiter,
  [
    body('s0Key')
      .trim()
      .toUpperCase()
      .matches(/^S[O0]\d{7}$/)
      .withMessage('S0 Key must be in the format SO or S0 followed by 7 numbers (e.g., SO1234567)'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Full name cannot exceed 100 characters')
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
    let s0Key = sanitizeString(req.body.s0Key);
    const fullName = req.body.fullName ? sanitizeString(req.body.fullName) : undefined;

    // Validate and normalize S0 Key format
    let s0KeyValue = s0Key.trim().toUpperCase();
    
    // Remove any dashes or spaces
    s0KeyValue = s0KeyValue.replace(/[-\s]/g, '');
    
    // Validate format
    if (!validateS0Key(s0KeyValue)) {
      return res.status(400).json({ error: 'S0 Key must be in the format SO or S0 followed by 7 numbers (e.g., SO1234567)' });
    }
    
    // Normalize: convert S0 (zero) to SO (letter O) for consistency
    s0KeyValue = s0KeyValue.replace(/^S0(\d+)/, 'SO$1');

    // Check if user exists by S0 Key (normalized)
    let user = await User.findOne({ s0Key: s0KeyValue });

    // If user doesn't exist, auto-create account with S0 Key only
    if (!user) {
      // Double-check: ensure no duplicate S0 Key exists (case-insensitive check)
      const existingUser = await User.findOne({ 
        $or: [
          { s0Key: s0KeyValue },
          { s0Key: s0KeyValue.replace(/^SO/, 'S0') }, // Check both SO and S0 variants
          { s0Key: s0KeyValue.replace(/^S0/, 'SO') }
        ]
      });
      
      if (existingUser) {
        // Use existing user instead of creating duplicate
        user = existingUser;
        console.log(`✅ [AUTH] Existing user found via S0 Key: ${s0KeyValue} from IP: ${req.ip}`);
      } else {
        // Generate username from S0 Key
        let username = `student${s0KeyValue.replace(/^SO/, '')}`;
        let baseUsername = username;
        let counter = 1;
        
        // Ensure username uniqueness
        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Create new user automatically (no email required)
        user = await User.create({
          username,
          s0Key: s0KeyValue,
          fullName: fullName || `Student ${s0KeyValue}`,
          isActive: true,
          email: null // No email for S0 Key-only users
        });
        
        console.log(`✅ [AUTH] New user created via S0 Key: ${s0KeyValue} from IP: ${req.ip}`);
      }
    }
    
    // Update fullName if provided (for both new and existing users)
    if (fullName && fullName.trim() && user.fullName !== fullName.trim()) {
      user.fullName = fullName.trim();
      await user.save();
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Log successful login
    console.log(`✅ [AUTH] Successful S0 Key login: ${s0KeyValue} from IP: ${req.ip}`);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email || null,
      fullName: user.fullName,
      s0Key: user.s0Key,
      isAdmin: user.isAdmin,
      token,
      refreshToken
    });
  } catch (error) {
    console.error(`❌ [AUTH] S0 Key login error: ${error.message} from IP: ${req.ip}`);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh',
  authLimiter,
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
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
      const { refreshToken } = req.body;
      const { verifyToken } = await import('../utils/generateToken.js');
      
      // Verify refresh token
      const decoded = verifyToken(refreshToken);
      
      // Ensure it's a refresh token
      if (decoded.type !== 'refresh') {
        console.warn(`⚠️  [SECURITY] Wrong token type for refresh: ${decoded.type} from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      
      // Get user
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }
      
      // Generate new access token
      const newToken = generateToken(user._id);
      
      res.json({
        token: newToken
      });
    } catch (error) {
      console.warn(`⚠️  [SECURITY] Refresh token error: ${error.message} from IP: ${req.ip}`);
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  }
);

export default router;


