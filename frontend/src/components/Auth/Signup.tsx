import React, { useState } from 'react';
import axios from 'axios';
import QRScanner from './QRScanner';
import SEMOLogo from '../SEMOLogo';
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';
import './Auth.css';

interface SignupProps {
  onSignup: (token: string, user: any) => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    s0Key: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate SEMO.EDU email
    if (!formData.email.toLowerCase().endsWith('@semo.edu')) {
      setError('Email must be a SEMO.EDU email address (e.g., yourname@semo.edu)');
      setLoading(false);
      return;
    }

    // Validate and normalize S0 Key format
    let s0KeyValue = formData.s0Key.trim().toUpperCase();
    
    // Accept both SO (letter O) and S0 (zero) formats
    // Pattern: S followed by O or 0, then 7 digits (e.g., SO1234567)
    const s0KeyPattern = /^S[O0]\d{7}$/i;
    if (!s0KeyPattern.test(s0KeyValue)) {
      setError('S0 Key must be in the format SO or S0 followed by 7 numbers (e.g., SO1234567)');
      setLoading(false);
      return;
    }
    
    // Normalize: convert S0 (zero) to SO (letter O) for consistency
    s0KeyValue = s0KeyValue.replace(/^S0(\d+)/, 'SO$1');
    formData.s0Key = s0KeyValue;

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(getApiUrl(API_ENDPOINTS.AUTH.REGISTER), formData);
      const { token, ...user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onSignup(token, user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card floating">
        <div className="auth-header">
          <div className="auth-logo">
            <SEMOLogo size="medium" showText={true} />
            <h2>Create Account</h2>
          </div>
          <p>Start your coding journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">SEMO.EDU Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="yourname@semo.edu"
            />
            <small className="form-hint">Must be a SEMO.EDU email address</small>
          </div>

          <div className="form-group">
            <label htmlFor="s0Key">S0 Key *</label>
            <div className="s0key-input-group">
              <input
                type="text"
                id="s0Key"
                name="s0Key"
                value={formData.s0Key}
                onChange={handleChange}
                required
                placeholder="SO1234567"
                style={{ textTransform: 'uppercase' }}
              />
              <button
                type="button"
                className="qr-scan-btn"
                onClick={() => setShowQRScanner(true)}
                title="Scan Student ID QR Code"
              >
                📷 Scan
              </button>
            </div>
            <small className="form-hint">Format: SO followed by numbers (e.g., SO1234567) or scan your student ID</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Create a password (min 6 characters)"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button type="button" onClick={onSwitchToLogin} className="link-button">
              Sign In
            </button>
          </p>
        </div>
      </div>
      
      {showQRScanner && (
        <QRScanner
          onScan={(s0Key) => {
            setFormData({ ...formData, s0Key });
            setShowQRScanner(false);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default Signup;


