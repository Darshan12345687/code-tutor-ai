/**
 * Middleware to prevent API key exposure
 * Ensures API keys are never sent to client
 */

export const protectApiKeys = (req, res, next) => {
  // Remove any API keys from request body before processing
  if (req.body) {
    const sensitiveKeys = ['apiKey', 'api_key', 'openai_key', 'mistral_key', 'gemini_key'];
    sensitiveKeys.forEach(key => {
      if (req.body[key]) {
        delete req.body[key];
        console.warn(`⚠️  Attempted to send API key in request body: ${key}`);
      }
    });
  }

  // Sanitize response to remove any API keys
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const sanitized = sanitizeResponse(data);
    return originalJson(sanitized);
  };

  next();
};

// Helper function to sanitize responses
const sanitizeResponse = (data, visited = new WeakSet()) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // Prevent circular references
  if (visited.has(data)) {
    return '[Circular Reference]';
  }
  visited.add(data);

  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{20,}/g,
    /AIzaSy[a-zA-Z0-9_-]{35}/g,
    /[a-zA-Z0-9]{32,}/g,  // Generic API key pattern (32+ chars)
  ];

  // Handle Mongoose documents - convert to plain object
  if (data.toObject && typeof data.toObject === 'function') {
    try {
      data = data.toObject();
    } catch (e) {
      // If toObject fails, return as is
      return data;
    }
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item, visited));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip internal Mongoose properties
    if (key.startsWith('_') && (key === '_id' || key === '__v')) {
      sanitized[key] = value;
      continue;
    }
    if (key.startsWith('$')) {
      continue; // Skip Mongoose internal properties
    }

    // Never sanitize JWT tokens - they're meant to be sent to the client
    if (key === 'token' || key === 'accessToken' || key === 'refreshToken') {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      let sanitizedValue = value;
      sensitivePatterns.forEach(pattern => {
        sanitizedValue = sanitizedValue.replace(pattern, '[API_KEY_REDACTED]');
      });
      sanitized[key] = sanitizedValue;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeResponse(value, visited);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

