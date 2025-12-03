import axios from 'axios';

/**
 * Text-to-Speech using Google Cloud TTS or OpenAI TTS
 */
export const textToSpeech = async (text, options = {}) => {
  const {
    language = 'en-US',
    voice = 'en-US-Neural2-D',
    provider = 'google'
  } = options;

  try {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      // Use OpenAI TTS
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          input: text,
          voice: voice || 'alloy'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      return {
        audio: Buffer.from(response.data),
        format: 'mp3',
        provider: 'openai'
      };
    } else if (provider === 'google' && process.env.GOOGLE_TTS_API_KEY) {
      // Use Google Cloud TTS
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`;
      
      const response = await axios.post(url, {
        input: { text },
        voice: {
          languageCode: language,
          name: voice,
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      });

      return {
        audio: Buffer.from(response.data.audioContent, 'base64'),
        format: 'mp3',
        provider: 'google'
      };
    } else {
      // Fallback: Return text for browser TTS
      return {
        text,
        format: 'text',
        provider: 'browser'
      };
    }
  } catch (error) {
    console.error('TTS error:', error);
    // Fallback to browser TTS
    return {
      text,
      format: 'text',
      provider: 'browser'
    };
  }
};

/**
 * Speech-to-Text using Google Cloud Speech-to-Text or OpenAI Whisper
 */
export const speechToText = async (audioBuffer, options = {}) => {
  const {
    language = 'en-US',
    provider = 'openai'
  } = options;

  try {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      // Use OpenAI Whisper
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm'
      });
      formData.append('model', 'whisper-1');
      formData.append('language', language.split('-')[0]);

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders()
          }
        }
      );

      return {
        text: response.data.text,
        provider: 'openai'
      };
    } else if (provider === 'google' && process.env.GOOGLE_STT_API_KEY) {
      // Use Google Cloud Speech-to-Text
      const url = `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_STT_API_KEY}`;
      
      const response = await axios.post(url, {
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: language
        },
        audio: {
          content: audioBuffer.toString('base64')
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        return {
          text: response.data.results[0].alternatives[0].transcript,
          provider: 'google'
        };
      }

      return {
        text: '',
        provider: 'google'
      };
    } else {
      throw new Error('No speech-to-text provider configured');
    }
  } catch (error) {
    console.error('STT error:', error);
    throw error;
  }
};

/**
 * Generate voice explanation for code
 */
export const generateVoiceExplanation = async (code, explanation) => {
  const voiceText = `Here's an explanation of your code. ${explanation}`;
  return await textToSpeech(voiceText, {
    language: 'en-US',
    provider: 'openai'
  });
};






