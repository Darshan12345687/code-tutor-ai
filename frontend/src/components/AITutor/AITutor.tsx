import React, { useState } from 'react';
import axios from 'axios';
import VoiceAssistant from '../Voice/VoiceAssistant';
import MarkdownMessage from '../MarkdownMessage';
import { ExplanationResult } from '../../App';
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';
import './AITutor.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  code?: string;
  language?: string;
  explanation?: ExplanationResult;
}

interface AITutorProps {
  user?: any;
  onLanguageChange?: (language: string) => void;
}

const AITutor: React.FC<AITutorProps> = ({ user, onLanguageChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [isLoading, setIsLoading] = useState(false);

  // Removed auto-scroll - let users control their own scrolling
  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      // Use /api/ai/explain for questions - this is public and prioritizes free tier APIs
      // This avoids usage limit issues and uses free APIs (HuggingFace, Gemini) first
      const response = await axios.post(
        getApiUrl(API_ENDPOINTS.AI.EXPLAIN),
        {
          question: userMessage.content,
          language: selectedLanguage,
          provider: 'auto', // Auto mode prioritizes free tier APIs
          mode: 'default'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 15000, // 15 second timeout to allow AI providers to respond
        }
      );

      // Check if this is a refusal (non-programming question)
      const answerText = response.data.explanation || response.data.answer || 'I can only help with programming and software-development topics. Please ask me something related to coding or computer science!';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answerText, // Show the answer directly in the message
        timestamp: new Date(),
        explanation: {
          explanation: answerText,
          concepts: Array.isArray(response.data.concepts) ? response.data.concepts : [],
          examples: Array.isArray(response.data.examples) ? response.data.examples : [],
          provider: response.data.provider,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI request error:', error);
      
      // Provide more specific error messages
      let errorContent = 'Sorry, I encountered an error. Please try again or rephrase your question.';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorContent = 'The request took too long. Please try again with a simpler question.';
      } else if (error.response?.data?.error) {
        errorContent = error.response.data.error;
      } else if (error.message) {
        errorContent = `Error: ${error.message}`;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ai-tutor-page">
      <div className="ai-tutor-header">
        <div className="header-content">
          <h1>🎓 AI Programming Tutor</h1>
          <p>Your friendly coding companion - Ask me anything about programming concepts, coding questions, and software development</p>
        </div>
      </div>

      <div className="ai-tutor-container">
        <div className="chat-section-unified">
          <div className="chat-messages" id="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? '👤 You' : '🤖 CodeTutor-AI'}
                  </span>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.role === 'assistant' ? (
                      <MarkdownMessage content={message.content} language={selectedLanguage} />
                    ) : (
                      message.content.split('\n').map((line, idx) => (
                        <React.Fragment key={idx}>
                          {line}
                          {idx < message.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))
                    )}
                  </div>
                  {/* Only show provider tag for questions, not full explanation panel */}
                  {message.explanation?.provider && message.role === 'assistant' && !message.code && (
                    <div className="message-provider-tag">
                      <span className="provider-indicator">Powered by {message.explanation.provider}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>


          <div className="chat-input-container">
            <div className="text-input-section">
              <textarea
                className="chat-input"
                placeholder="Type your programming question here... (Press Enter to send, Shift+Enter for new line)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={3}
                disabled={isLoading}
              />
              <button
                className="btn-send"
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
              >
                {isLoading ? '⏳ Sending...' : '📤 Send'}
              </button>
            </div>
          </div>

          {/* Consolidated features inside the same box */}
          <div className="features-consolidated">
            <VoiceAssistant
              explanation={messages[messages.length - 1]?.content}
            />

            <div className="feature-panel-inline tips-panel-inline">
              <h4>💡 Learning Tips</h4>
              <div className="tips-list-inline">
                <div className="tip-item-inline">
                  <span className="tip-icon">❓</span>
                  <p>Ask programming questions to learn concepts</p>
                </div>
                <div className="tip-item-inline">
                  <span className="tip-icon">📚</span>
                  <p>Get simple, understandable answers with examples</p>
                </div>
                <div className="tip-item-inline">
                  <span className="tip-icon">🎯</span>
                  <p>Focus on programming, coding, and software development topics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutor;

