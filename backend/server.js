import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import expressWs from 'express-ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import codeRoutes from './routes/code.js';
import dataStructureRoutes from './routes/dataStructures.js';
import aiRoutes from './routes/ai.js';
import voiceRoutes from './routes/voice.js';
import terminalRoutes from './routes/terminal.js';
import analyticsRoutes from './routes/analytics.js';
import quizRoutes from './routes/quizzes.js';
import flashcardRoutes from './routes/flashcards.js';
import interactiveCodeRoutes from './routes/interactiveCode.js';
import tutorRoutes from './routes/tutor.js';
import appointmentRoutes from './routes/appointments.js';
import messageRoutes from './routes/messages.js';
import codeErrorAnalysisRoutes from './routes/codeErrorAnalysis.js';

import progressRoutes from './routes/progress.js';

// Import security middleware
import { setupSecurity, securityLogger } from './middleware/security.js';
import { validateApiKeys, sanitizeResponse } from './config/security.js';
import { protectApiKeys } from './middleware/apiKeyProtection.js';

// Import role initialization
import { initializeRoles } from './models/Role.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codetutor';

// Setup WebSocket support
expressWs(app);

// Security middleware (must be first)
setupSecurity(app);

// Apply security logging globally
app.use(securityLogger);

// API Key Protection - Must be before other middleware
app.use(protectApiKeys);

// Middleware
// CORS configuration - supports localhost and Netlify deployments
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL, // Set this in your backend environment variables
  process.env.NETLIFY_URL,   // Alternative environment variable name
].filter(Boolean); // Remove undefined values

// Add Netlify preview URLs pattern if in production
if (process.env.NODE_ENV === 'production') {
  // Allow all Netlify preview deployments
  allowedOrigins.push(/^https:\/\/.*\.netlify\.app$/);
}

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true, // Fallback to allow all in development
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  // Initialize default roles
  await initializeRoles();
  console.log('✅ Roles initialized');
  // Validate API keys are secure
  validateApiKeys();
  console.log('✅ Security validation complete');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Code Tutor API is running', 
    version: '1.0.0',
      endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      lessons: '/api/lessons',
      progress: '/api/progress',
      code: '/api/code',
      dataStructures: '/api/data-structures',
      ai: '/api/ai',
      voice: '/api/voice',
      terminal: '/api/terminal',
      analytics: '/api/analytics'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/data-structures', dataStructureRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/code', interactiveCodeRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/code-error', codeErrorAnalysisRoutes);

// Error handling middleware - sanitize responses to prevent API key leaks
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  // Never expose stack traces or sensitive info in production
  const errorResponse = {
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  };
  
  // Sanitize response to remove any potential API key leaks
  const sanitized = sanitizeResponse(errorResponse);
  res.status(500).json(sanitized);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;

