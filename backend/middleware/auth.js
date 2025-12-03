import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyToken } from '../utils/generateToken.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Protect routes - require valid JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.warn(`⚠️  [SECURITY] Unauthorized access attempt: ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    try {
      // Verify token using utility function
      const decoded = verifyToken(token);
      
      // Ensure it's an access token, not refresh token
      if (decoded.type && decoded.type !== 'access') {
        console.warn(`⚠️  [SECURITY] Wrong token type used: ${decoded.type} from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Invalid token type' });
      }
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.warn(`⚠️  [SECURITY] User not found for token: ${decoded.id} from IP: ${req.ip}`);
        return res.status(401).json({ error: 'User not found' });
      }

      if (!req.user.isActive) {
        console.warn(`⚠️  [SECURITY] Inactive account access attempt: ${req.user._id} from IP: ${req.ip}`);
        return res.status(401).json({ error: 'User account is inactive' });
      }

      // Log successful authentication
      console.log(`✅ [AUTH] Authenticated user: ${req.user.email} for ${req.method} ${req.path}`);

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.warn(`⚠️  [SECURITY] Expired token used from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      } else if (error.name === 'JsonWebTokenError') {
        console.warn(`⚠️  [SECURITY] Invalid token from IP: ${req.ip} - ${error.message}`);
        // Check if it's a signature error (likely JWT_SECRET mismatch)
        if (error.message.includes('signature') || error.message.includes('invalid signature')) {
          return res.status(401).json({ 
            error: 'Token verification failed. Please log in again.', 
            code: 'INVALID_SIGNATURE' 
          });
        }
        return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      }
      console.error(`❌ [SECURITY] Token verification error: ${error.message}`);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } catch (error) {
    console.error(`❌ [SECURITY] Auth middleware error: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as admin' });
  }
};


