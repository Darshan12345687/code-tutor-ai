/**
 * API Configuration Utility
 * Centralizes API base URL configuration for the frontend
 */

// Get API URL from environment variable or default to localhost for development
export const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  process.env.REACT_APP_BACKEND_URL || 
  'http://localhost:8000';

// Helper function to construct full API endpoint URLs
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // Ensure API_BASE_URL doesn't have trailing slash
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGIN_S0KEY: '/api/auth/login-s0key',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
  },
  // Users
  USERS: {
    PREFERENCES: '/api/users/preferences',
  },
  // AI
  AI: {
    EXPLAIN: '/api/ai/explain',
    CODE_FEEDBACK: '/api/ai/code-feedback',
  },
  // Code
  CODE: {
    EXECUTE_INTERACTIVE: '/api/code/execute-interactive',
  },
  // Progress
  PROGRESS: {
    SAVE_CODE: '/api/progress/save-code',
  },
  // Voice
  VOICE: {
    TEXT_TO_SPEECH: '/api/voice/text-to-speech',
  },
  // Quizzes
  QUIZZES: {
    LIST: '/api/quizzes',
    USER_PROGRESS: '/api/quizzes/user/progress',
    SUBMIT: (quizId: string) => `/api/quizzes/${quizId}/submit`,
  },
  // Flashcards
  FLASHCARDS: {
    LIST: '/api/flashcards',
    USER_PROGRESS: '/api/flashcards/user/progress',
    REVIEW: (flashcardId: string) => `/api/flashcards/${flashcardId}/review`,
  },
  // Data Structures
  DATA_STRUCTURES: {
    LIST: '/api/data-structures',
    DETAIL: (dsId: string) => `/api/data-structures/${dsId}`,
  },
  // Tutor
  TUTOR: {
    LOGIN: '/api/tutor/login',
    DASHBOARD: '/api/tutor/dashboard',
  },
  // Appointments
  APPOINTMENTS: {
    LIST: '/api/appointments',
    CREATE: '/api/appointments',
  },
};

