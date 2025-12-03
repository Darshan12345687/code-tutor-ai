import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './VoiceAssistant.css';

interface VoiceAssistantProps {
  code?: string;
  explanation?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ code, explanation }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleTextToSpeech = async (text: string) => {
    if (!text) return;

    setIsSpeaking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/voice/text-to-speech',
        { text, language: 'en-US', provider: 'openai' },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        audioRef.current.onended = () => setIsSpeaking(false);
      }
    } catch (error) {
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleVoiceExplanation = async () => {
    if (explanation) {
      await handleTextToSpeech(explanation);
    } else if (code) {
      // Get explanation first
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:8000/api/ai/explain',
          { code, language: 'python' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await handleTextToSpeech(response.data.explanation);
      } catch (error) {
        console.error('Failed to get explanation:', error);
      }
    }
  };

  if (!isOpen) {
    return (
      <button 
        className="voice-assistant-toggle"
        onClick={() => setIsOpen(true)}
        title="Open Voice Assistant"
      >
        🎤 Voice
      </button>
    );
  }

  return (
    <div className="voice-assistant-compact">
      <div className="voice-header-compact">
        <span>🎤 Voice Assistant</span>
        <button 
          className="voice-close-btn"
          onClick={() => setIsOpen(false)}
          title="Close"
        >
          ✕
        </button>
      </div>
      <div className="voice-controls-compact">
        <div className="voice-buttons-compact">
          <button
            className={`voice-btn-compact ${isListening ? 'active' : ''}`}
            onClick={isListening ? stopListening : startListening}
            disabled={!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)}
            title={isListening ? 'Stop Listening' : 'Start Listening'}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>

          <button
            className={`voice-btn-compact ${isSpeaking ? 'active' : ''}`}
            onClick={isSpeaking ? stopSpeaking : () => handleVoiceExplanation()}
            disabled={!explanation && !code}
            title={isSpeaking ? 'Stop Speaking' : 'Speak Explanation'}
          >
            {isSpeaking ? '⏹️' : '🔊'}
          </button>
        </div>

        {(transcript || audioUrl) && (
          <div className="voice-content-compact">
            {transcript && (
              <div className="transcript-box-compact">
                <p><strong>You:</strong> {transcript}</p>
              </div>
            )}

            {audioUrl && (
              <audio ref={audioRef} controls className="audio-player-compact">
                Your browser does not support audio playback.
              </audio>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;


