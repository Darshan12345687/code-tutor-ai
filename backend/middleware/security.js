import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import validator from 'validator';
import { body, validationResult } from 'express-validator';

/**
 * Rate limiting for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/';
  }
});

/**
 * Stricter rate limiting for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Log security event
    console.warn(`⚠️  [SECURITY] Too many auth attempts from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again after 15 minutes',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Rate limiting for code execution
 */
export const codeExecutionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 code executions per minute (increased for development)
  message: 'Too many code executions, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️  [SECURITY] Code execution rate limit exceeded from IP: ${req.ip}`);
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    res.status(429).json({
      error: 'Too many code executions',
      message: `Please wait ${retryAfter} seconds before executing more code`,
      retryAfter: retryAfter
    });
  }
});

/**
 * Rate limiting for AI features
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 AI requests per minute
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  handler: (req, res) => {
    console.warn(`⚠️  [SECURITY] AI rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many AI requests',
      message: 'Please wait before making more AI requests',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Rate limiting for registration
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  handler: (req, res) => {
    console.warn(`⚠️  [SECURITY] Registration rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many registration attempts',
      message: 'Please try again after 1 hour',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Security middleware setup
 */
export const setupSecurity = (app) => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  }));

  // Data sanitization against NoSQL injection
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`⚠️  [SECURITY] NoSQL injection attempt detected: ${key} from IP: ${req.ip}`);
    }
  }));

  // Data sanitization against XSS
  app.use(xss());

  // Apply general API rate limiting
  app.use('/api/', apiLimiter);
};

/**
 * Input validation middleware
 */
export const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      console.warn(`⚠️  [SECURITY] Validation error from IP: ${req.ip}`, error.details);
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
};

/**
 * Express-validator middleware wrapper
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    console.warn(`⚠️  [SECURITY] Validation errors from IP: ${req.ip}`, errors.array());
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  };
};

/**
 * Sanitize string input
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return validator.escape(validator.trim(str));
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  return validator.isEmail(email) && email.toLowerCase().endsWith('@semo.edu');
};

/**
 * Validate S0 Key format
 */
export const validateS0Key = (s0Key) => {
  const pattern = /^S[O0]\d{7}$/i;
  return pattern.test(s0Key);
};

/**
 * Check AI usage limits
 */
export const checkAIUsageLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins and premium users have unlimited access
    if (req.user.role === 'admin' || req.user.subscription === 'premium') {
      return next();
    }

    // Check usage limits
    if (req.user.aiUsageCount >= req.user.aiUsageLimit) {
      console.warn(`⚠️  [SECURITY] AI usage limit reached for user: ${req.user._id}`);
      return res.status(403).json({
        error: 'AI usage limit reached',
        message: 'You have reached your AI feature usage limit. Upgrade to premium for unlimited access.',
        currentUsage: req.user.aiUsageCount,
        limit: req.user.aiUsageLimit
      });
    }

    next();
  } catch (error) {
    console.error('❌ [SECURITY] Error checking AI usage limit:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Security logging middleware
 */
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log security-relevant events
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log failed authentication attempts
    if (req.path.includes('/auth') && res.statusCode === 401) {
      console.warn(`⚠️  [SECURITY] Failed auth attempt: ${req.method} ${req.path} from IP: ${req.ip} - Status: ${res.statusCode}`);
    }
    
    // Log rate limit hits
    if (res.statusCode === 429) {
      console.warn(`⚠️  [SECURITY] Rate limit hit: ${req.method} ${req.path} from IP: ${req.ip}`);
    }
    
    // Log 4xx and 5xx errors
    if (res.statusCode >= 400) {
      console.warn(`⚠️  [SECURITY] Error: ${req.method} ${req.path} from IP: ${req.ip} - Status: ${res.statusCode} - Duration: ${duration}ms`);
    }
  });
  
  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseFloat(maxSize);
      
      if (sizeInMB > maxSizeInMB) {
        console.warn(`⚠️  [SECURITY] Request too large: ${sizeInMB.toFixed(2)}MB from IP: ${req.ip}`);
        return res.status(413).json({
          error: 'Request too large',
          message: `Request size exceeds maximum allowed size of ${maxSize}`
        });
      }
    }
    next();
  };
};

/**
 * IP whitelist/blacklist middleware (optional)
 */
export const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [] } = options;
  
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Check blacklist
    if (blacklist.length > 0 && blacklist.includes(clientIp)) {
      console.warn(`⚠️  [SECURITY] Blocked IP: ${clientIp}`);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check whitelist (if whitelist is provided, only allow those IPs)
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
      console.warn(`⚠️  [SECURITY] IP not whitelisted: ${clientIp}`);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  };
};

/**
 * Validate and sanitize code input
 */
export const sanitizeCode = (code) => {
  if (typeof code !== 'string') return '';
  
  // Remove null bytes and other dangerous characters
  let sanitized = code.replace(/\0/g, '');
  
  // Limit code length (prevent DoS)
  const MAX_CODE_LENGTH = 100000; // 100KB
  if (sanitized.length > MAX_CODE_LENGTH) {
    throw new Error('Code exceeds maximum length');
  }
  
  return sanitized;
};

/**
 * Validate programming language
 */
export const validateLanguage = (language) => {
  const allowedLanguages = ['python', 'java', 'c', 'cpp', 'csharp', 'javascript'];
  return allowedLanguages.includes(language?.toLowerCase());
};
