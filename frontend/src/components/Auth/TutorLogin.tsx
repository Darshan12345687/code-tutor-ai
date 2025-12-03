import React, { useState } from 'react';
import axios from 'axios';
import SEMOLogo from '../SEMOLogo';
import './TutorLogin.css';

interface TutorLoginProps {
  onLogin: (token: string, userData: any) => void;
  onNavigate?: (section: string) => void;
}

const TutorLogin: React.FC<TutorLoginProps> = ({ onLogin, onNavigate }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/tutor/login', {
        accessCode: accessCode.trim()
      });

      const { token, user } = response.data;

      // Validate token before storing
      if (!token || typeof token !== 'string' || token.length < 50) {
        throw new Error('Invalid token received from server');
      }

      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Tutor login successful, token stored:', token.substring(0, 20) + '...');
      console.log('User data:', user);

      // Call parent's onLogin callback
      onLogin(token, user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid access code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tutor-login-container">
      <div className="tutor-login-header">
        <SEMOLogo size="medium" showText={true} />
        <h2>Tutor Login</h2>
        <p>Enter your access code to continue</p>
        {onNavigate && (
          <button 
            className="back-to-student-login"
            onClick={() => onNavigate('signin')}
          >
            ← Back to Student Login
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="tutor-login-form">
        {error && (
          <div className="tutor-login-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="accessCode">Access Code</label>
          <input
            type="text"
            id="accessCode"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Enter your tutor access code"
            required
            disabled={isLoading}
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="tutor-login-btn"
          disabled={isLoading || !accessCode.trim()}
        >
          {isLoading ? 'Logging in...' : 'Login as Tutor'}
        </button>
      </form>

      <div className="tutor-login-info">
        <p>🔒 Secure tutor access</p>
        <p className="info-text">Only authorized tutors can access the dashboard</p>
      </div>
    </div>
  );
};

export default TutorLogin;

