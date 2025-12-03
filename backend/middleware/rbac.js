import User from '../models/User.js';
import Role from '../models/Role.js';

/**
 * Check if user has required permission
 */
export const hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user's role
      const role = await Role.findOne({ name: req.user.role || 'student' });
      
      if (!role) {
        return res.status(403).json({ error: 'Invalid role' });
      }

      // Check if role has required permission
      if (!role.permissions.includes(requiredPermission)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredPermission,
          userRole: req.user.role
        });
      }

      // Check subscription limits for premium features
      if (requiredPermission.includes('premium') || 
          requiredPermission.includes('ai') || 
          requiredPermission.includes('voice')) {
        if (req.user.subscription === 'free' && req.user.role !== 'admin') {
          // Check usage limits
          if (req.user.aiUsageCount >= req.user.aiUsageLimit) {
            return res.status(403).json({ 
              error: 'Usage limit reached',
              message: 'Upgrade to premium for unlimited access'
            });
          }
        }
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Check if user has any of the required permissions
 */
export const hasAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const role = await Role.findOne({ name: req.user.role || 'student' });
      
      if (!role) {
        return res.status(403).json({ error: 'Invalid role' });
      }

      const hasPermission = requiredPermissions.some(permission => 
        role.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredPermissions,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Check if user has required role
 */
export const hasRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient role',
          required: roles,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};






