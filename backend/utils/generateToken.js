import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'; // Reduced from 30d for better security
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

/**
 * Generate access token (short-lived)
 */
export const generateToken = (id) => {
  if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
    console.warn('⚠️  [SECURITY] Using default JWT_SECRET. Change this in production!');
  }
  
  return jwt.sign(
    { 
      id,
      type: 'access'
    }, 
    JWT_SECRET, 
    {
      expiresIn: JWT_EXPIRE,
      issuer: 'codetutor-api',
      audience: 'codetutor-client'
    }
  );
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (id) => {
  return jwt.sign(
    { 
      id,
      type: 'refresh'
    }, 
    JWT_SECRET, 
    {
      expiresIn: JWT_REFRESH_EXPIRE,
      issuer: 'codetutor-api',
      audience: 'codetutor-client'
    }
  );
};

/**
 * Verify token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'codetutor-api',
      audience: 'codetutor-client'
    });
  } catch (error) {
    // Preserve the original error for better debugging
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      // Log the specific error for debugging
      console.error(`[JWT] Verification failed: ${error.message}`);
      throw error; // Re-throw original error to preserve error name
    } else {
      throw new Error('Invalid or expired token');
    }
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};


