import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac.js';
import { checkAIUsageLimit } from '../middleware/security.js';
import { aiLimiter } from '../middleware/security.js';
import { textToSpeech, speechToText, generateVoiceExplanation } from '../services/voiceService.js';
import { explainCode } from '../services/aiService.js';
import User from '../models/User.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/voice/text-to-speech
// @desc    Convert text to speech
// @access  Private (requires use_voice_features permission)
router.post('/text-to-speech',
  protect,
  aiLimiter,
  checkAIUsageLimit,
  hasPermission('use_voice_features'),
  async (req, res) => {
    try {
      const { text, language, voice, provider } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const result = await textToSpeech(text, {
        language: language || 'en-US',
        voice,
        provider: provider || 'openai'
      });

      if (result.format === 'text') {
        // Browser TTS fallback
        return res.json({
          text: result.text,
          format: 'text',
          provider: 'browser',
          message: 'Use browser TTS API'
        });
      }

      // Send audio buffer
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="speech.mp3"');
      res.send(result.audio);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/voice/speech-to-text
// @desc    Convert speech to text
// @access  Private (requires use_voice_features permission)
router.post('/speech-to-text',
  protect,
  upload.single('audio'),
  aiLimiter,
  checkAIUsageLimit,
  hasPermission('use_voice_features'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const { language, provider } = req.body;

      const result = await speechToText(req.file.buffer, {
        language: language || 'en-US',
        provider: provider || 'openai'
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/voice/explain-code
// @desc    Get voice explanation for code
// @access  Private (requires use_voice_features and use_ai_features permissions)
router.post('/explain-code',
  protect,
  aiLimiter,
  checkAIUsageLimit,
  hasPermission('use_voice_features'),
  async (req, res) => {
    try {
      const { code, language } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      // Get AI explanation
      const explanation = await explainCode(code, language || 'python');
      
      // Generate voice explanation
      const voiceResult = await generateVoiceExplanation(code, explanation.explanation);

      // Increment AI usage count
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { aiUsageCount: 1 },
        lastActive: new Date()
      });

      if (voiceResult.format === 'text') {
        return res.json({
          explanation: explanation,
          voice: {
            text: voiceResult.text,
            format: 'text',
            provider: 'browser'
          }
        });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="explanation.mp3"');
      res.send(voiceResult.audio);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

