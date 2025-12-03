import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QuizPanel.css';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  questions: any[];
  totalPoints: number;
  timeLimit: number;
  createdBy: any;
}

interface Flashcard {
  _id: string;
  front: string;
  back: string;
  language: string;
  difficulty: string;
  tags: string[];
}

// Removed unused QuizProgress interface

// Removed unused FlashcardProgress interface
  nextReview: string;
  isMastered: boolean;
  timesReviewed: number;
  timesCorrect: number;
}

const QuizPanel: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'quizzes' | 'flashcards'>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [currentFlashcard, setCurrentFlashcard] = useState<Flashcard | null>(null);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (activeMode === 'quizzes') {
      fetchQuizzes();
      fetchQuizProgress();
    } else {
      fetchFlashcards();
      fetchFlashcardProgress();
    }
  }, [activeMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizStarted && !quizCompleted && selectedQuiz) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [quizStarted, quizCompleted, selectedQuiz]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/quizzes', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setQuizzes(response.data.quizzes || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizProgress = async () => {
    if (!token) return;
    try {
      const response = await axios.get('http://localhost:8000/api/quizzes/user/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProgress(response.data);
    } catch (err: any) {
      console.error('Failed to fetch progress:', err);
    }
  };

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/flashcards', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setFlashcards(response.data.flashcards || []);
      if (response.data.flashcards && response.data.flashcards.length > 0) {
        setCurrentFlashcard(response.data.flashcards[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch flashcards');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashcardProgress = async () => {
    if (!token) return;
    try {
      const response = await axios.get('http://localhost:8000/api/flashcards/user/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProgress(response.data);
    } catch (err: any) {
      console.error('Failed to fetch flashcard progress:', err);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setQuizStarted(true);
    setQuizCompleted(false);
    setQuizResults(null);
    setTimeSpent(0);
    setError('');
  };

  const handleAnswer = (answer: any) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (selectedQuiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    if (!selectedQuiz || !token) {
      setError('Please log in to submit quiz');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `http://localhost:8000/api/quizzes/${selectedQuiz._id}/submit`,
        {
          answers,
          timeSpent
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setQuizResults(response.data.results);
      setQuizCompleted(true);
      setQuizStarted(false);
      fetchQuizProgress(); // Refresh progress
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const flipFlashcard = () => {
    setFlashcardFlipped(!flashcardFlipped);
  };

  const reviewFlashcard = async (quality: number) => {
    if (!currentFlashcard || !token) {
      setError('Please log in to review flashcards');
      return;
    }

    try {
      await axios.post(
        `http://localhost:8000/api/flashcards/${currentFlashcard._id}/review`,
        { quality },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Move to next flashcard
      const currentIndex = flashcards.findIndex(f => f._id === currentFlashcard._id);
      if (currentIndex < flashcards.length - 1) {
        setCurrentFlashcard(flashcards[currentIndex + 1]);
      } else {
        setCurrentFlashcard(flashcards[0]);
      }
      setFlashcardFlipped(false);
      fetchFlashcardProgress();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record review');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (quizStarted && selectedQuiz) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === selectedQuiz.questions.length - 1;

    return (
      <div className="quiz-panel">
        <div className="quiz-header">
          <h2>{selectedQuiz.title}</h2>
          <div className="quiz-timer">
            <span>⏱️ {formatTime(timeSpent)}</span>
            <span>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
          </div>
        </div>

        <div className="quiz-question-card">
          <div className="question-header">
            <span className="question-number">Q{currentQuestionIndex + 1}</span>
            <span className="question-points">{currentQuestion.points || 1} point{currentQuestion.points !== 1 ? 's' : ''}</span>
          </div>
          <h3 className="question-text">{currentQuestion.question}</h3>

          {currentQuestion.type === 'multiple-choice' && (
            <div className="answer-options">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  className={`option-btn ${answers[currentQuestionIndex] === index ? 'selected' : ''}`}
                  onClick={() => handleAnswer(index)}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'true-false' && (
            <div className="answer-options">
              <button
                className={`option-btn ${answers[currentQuestionIndex] === true ? 'selected' : ''}`}
                onClick={() => handleAnswer(true)}
              >
                True
              </button>
              <button
                className={`option-btn ${answers[currentQuestionIndex] === false ? 'selected' : ''}`}
                onClick={() => handleAnswer(false)}
              >
                False
              </button>
            </div>
          )}

          {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'code') && (
            <textarea
              className="answer-textarea"
              value={answers[currentQuestionIndex] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={5}
            />
          )}

          <div className="question-navigation">
            <button
              className="nav-btn"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>
            {isLastQuestion ? (
              <button
                className="nav-btn submit-btn"
                onClick={submitQuiz}
                disabled={loading || answers.some(a => a === null)}
              >
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                className="nav-btn"
                onClick={nextQuestion}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted && quizResults) {
    return (
      <div className="quiz-panel">
        <div className="quiz-results">
          <h2>Quiz Results</h2>
          <div className="results-summary">
            <div className="score-circle">
              <span className="score-percentage">{quizResults.percentage}%</span>
              <span className="score-grade">Grade: {quizResults.grade}</span>
            </div>
            <div className="results-details">
              <p><strong>Score:</strong> {quizResults.score} / {quizResults.totalPoints} points</p>
              <p><strong>Time Spent:</strong> {formatTime(timeSpent)}</p>
            </div>
          </div>

          <div className="answers-review">
            <h3>Review Your Answers</h3>
            {quizResults.answers.map((result: any, index: number) => (
              <div key={index} className={`answer-review-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="review-header">
                  <span>Question {index + 1}</span>
                  <span className={`review-badge ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                    {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <p className="review-question">{selectedQuiz?.questions[index].question}</p>
                <div className="review-answers">
                  <p><strong>Your Answer:</strong> {String(result.userAnswer)}</p>
                  {!result.isCorrect && (
                    <p><strong>Correct Answer:</strong> {String(result.correctAnswer)}</p>
                  )}
                  {result.explanation && (
                    <p className="review-explanation"><strong>Explanation:</strong> {result.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              setQuizCompleted(false);
              setQuizResults(null);
              setSelectedQuiz(null);
            }}
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (activeMode === 'flashcards' && currentFlashcard) {
    return (
      <div className="quiz-panel">
        <div className="flashcard-container">
          <div className="flashcard-header">
            <h2>📚 Flashcards</h2>
            {userProgress?.stats && (
              <div className="flashcard-stats">
                <span>Mastered: {userProgress.stats.mastered}</span>
                <span>Due: {userProgress.stats.dueForReview}</span>
              </div>
            )}
          </div>

          <div
            className={`flashcard ${flashcardFlipped ? 'flipped' : ''}`}
            onClick={flipFlashcard}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <div className="flashcard-content">
                  <h3 style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', direction: 'ltr', textAlign: 'left' }}>{currentFlashcard.front}</h3>
                  <p className="flashcard-hint">Click to flip</p>
                </div>
              </div>
              <div className="flashcard-back">
                <div className="flashcard-content">
                  <h3 style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', direction: 'ltr', textAlign: 'left' }}>{currentFlashcard.back}</h3>
                  <p className="flashcard-hint">Click to flip back</p>
                </div>
              </div>
            </div>
          </div>

          {flashcardFlipped && token && (
            <div className="flashcard-review">
              <p>How well did you know this?</p>
              <div className="review-buttons">
                <button className="review-btn forgot" onClick={() => reviewFlashcard(0)}>Forgot (0)</button>
                <button className="review-btn hard" onClick={() => reviewFlashcard(1)}>Hard (1)</button>
                <button className="review-btn medium" onClick={() => reviewFlashcard(2)}>Medium (2)</button>
                <button className="review-btn good" onClick={() => reviewFlashcard(3)}>Good (3)</button>
                <button className="review-btn easy" onClick={() => reviewFlashcard(4)}>Easy (4)</button>
                <button className="review-btn very-easy" onClick={() => reviewFlashcard(5)}>Very Easy (5)</button>
              </div>
            </div>
          )}

          {!token && (
            <div className="flashcard-login-prompt">
              <p>Please log in to track your flashcard progress</p>
            </div>
          )}

          <div className="flashcard-navigation">
            <button
              className="nav-btn"
              onClick={() => {
                const currentIndex = flashcards.findIndex(f => f._id === currentFlashcard._id);
                if (currentIndex > 0) {
                  setCurrentFlashcard(flashcards[currentIndex - 1]);
                  setFlashcardFlipped(false);
                }
              }}
              disabled={flashcards.findIndex(f => f._id === currentFlashcard._id) === 0}
            >
              ← Previous
            </button>
            <span>{flashcards.findIndex(f => f._id === currentFlashcard._id) + 1} / {flashcards.length}</span>
            <button
              className="nav-btn"
              onClick={() => {
                const currentIndex = flashcards.findIndex(f => f._id === currentFlashcard._id);
                if (currentIndex < flashcards.length - 1) {
                  setCurrentFlashcard(flashcards[currentIndex + 1]);
                  setFlashcardFlipped(false);
                }
              }}
              disabled={flashcards.findIndex(f => f._id === currentFlashcard._id) === flashcards.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-panel">
      <div className="quiz-panel-header">
        <h1>📝 Quizzes & Flashcards</h1>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${activeMode === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveMode('quizzes')}
          >
            📝 Quizzes
          </button>
          <button
            className={`mode-btn ${activeMode === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveMode('flashcards')}
          >
            🎴 Flashcards
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeMode === 'quizzes' && (
        <div className="quizzes-section">
          {userProgress?.stats && (
            <div className="progress-stats">
              <h3>Your Progress</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{userProgress.stats.totalQuizzes}</span>
                  <span className="stat-label">Quizzes Taken</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{userProgress.stats.averageScore}%</span>
                  <span className="stat-label">Average Score</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{userProgress.stats.bestScore}%</span>
                  <span className="stat-label">Best Score</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{userProgress.stats.totalAttempts}</span>
                  <span className="stat-label">Total Attempts</span>
                </div>
              </div>
            </div>
          )}

          <div className="quizzes-grid">
            {loading ? (
              <div className="loading">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
              <div className="empty-state">No quizzes available. Check back later!</div>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz._id} className="quiz-card">
                  <div className="quiz-card-header">
                    <h3>{quiz.title}</h3>
                    <div className="quiz-badges">
                      <span className="badge">{quiz.language}</span>
                      <span className="badge">{quiz.difficulty}</span>
                    </div>
                  </div>
                  {quiz.description && <p className="quiz-description">{quiz.description}</p>}
                  <div className="quiz-info">
                    <span>📊 {quiz.questions.length} questions</span>
                    <span>⭐ {quiz.totalPoints} points</span>
                    {quiz.timeLimit > 0 && <span>⏱️ {quiz.timeLimit} min</span>}
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => startQuiz(quiz)}
                  >
                    Start Quiz
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeMode === 'flashcards' && (
        <div className="flashcards-section">
          {userProgress?.stats && (
            <div className="progress-stats">
              <h3>Your Progress</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{userProgress.stats.totalFlashcards}</span>
                  <span className="stat-label">Total Cards</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{userProgress.stats.mastered}</span>
                  <span className="stat-label">Mastered</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{userProgress.stats.dueForReview}</span>
                  <span className="stat-label">Due for Review</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{userProgress.stats.accuracy}%</span>
                  <span className="stat-label">Accuracy</span>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading flashcards...</div>
          ) : flashcards.length === 0 ? (
            <div className="empty-state">No flashcards available. Check back later!</div>
          ) : (
            <div className="flashcards-list">
              {flashcards.map((flashcard) => (
                <div key={flashcard._id} className="flashcard-preview">
                  <div className="flashcard-preview-front">
                    <strong>Front:</strong> {flashcard.front}
                  </div>
                  <div className="flashcard-preview-back">
                    <strong>Back:</strong> {flashcard.back}
                  </div>
                  <div className="flashcard-tags">
                    {flashcard.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPanel;

