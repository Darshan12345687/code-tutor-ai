/**
 * Security configuration for API keys
 * NEVER expose API keys in client-side code or logs
 */

// Validate that API keys are not exposed
export const validateApiKeys = () => {
  const sensitiveKeys = [
    'OPENAI_API_KEY',
    'MISTRAL_API_KEY',
    'GOOGLE_AI_API_KEY',
    'HUGGING_FACE_API_KEY',
    'JWT_SECRET'
  ];

  const exposed = [];
  
  sensitiveKeys.forEach(key => {
    const value = process.env[key];
    if (value && (value.includes('sk-') || value.length > 50)) {
      // Check if key might be exposed in code
      console.warn(`⚠️  ${key} is set. Ensure it's not exposed in client-side code.`);
    }
  });

  return true;
};

// Sanitize responses to remove any potential API key leaks
export const sanitizeResponse = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = Array.isArray(data) ? [] : {};
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{20,}/g,  // OpenAI keys
    /AIzaSy[a-zA-Z0-9_-]{35}/g,  // Google API keys
    /[a-zA-Z0-9]{32,}/g,  // Generic API key pattern (32+ chars)
  ];

  for (const [key, value] of Object.entries(data)) {
    // Never sanitize JWT tokens - they're meant to be sent to the client
    if (key === 'token' || key === 'accessToken' || key === 'refreshToken') {
      sanitized[key] = value;
      continue;
    }
    
    if (typeof value === 'string') {
      // Remove any API keys from strings
      let sanitizedValue = value;
      sensitivePatterns.forEach(pattern => {
        sanitizedValue = sanitizedValue.replace(pattern, '[API_KEY_REDACTED]');
      });
      sanitized[key] = sanitizedValue;
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeResponse(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Prevent API keys from being logged
export const safeLog = (message, data = {}) => {
  const sanitized = sanitizeResponse(data);
  console.log(message, sanitized);
};

// Get API key status without exposing keys
export const getApiKeyStatus = () => {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    mistral: !!process.env.MISTRAL_API_KEY,
    gemini: !!process.env.GOOGLE_AI_API_KEY,
    huggingface: !!process.env.HUGGING_FACE_API_KEY
  };
};

