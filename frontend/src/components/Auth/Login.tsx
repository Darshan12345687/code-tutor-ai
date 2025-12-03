import React, { useState } from 'react';
import axios from 'axios';
import QRScanner from './QRScanner';
import TutorLogin from './TutorLogin';
import SEMOLogo from '../SEMOLogo';
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';
import './Auth.css';
import './Login.css';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
  onNavigate?: (section: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    s0Key: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showTutorLogin, setShowTutorLogin] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Handle S0 Key-only login (for QR code scanning)
  const handleS0KeyLogin = async (s0Key: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(getApiUrl(API_ENDPOINTS.AUTH.LOGIN_S0KEY), {
        s0Key: s0Key
      });
      const { token, ...user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(token, user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setLoading(false);
    }
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

    // Validate S0 Key format - accepts both SO (letter O) and S0 (zero)
    let s0KeyValue = formData.s0Key.trim().toUpperCase();
    
    // Remove any dashes or spaces
    s0KeyValue = s0KeyValue.replace(/[-\s]/g, '');
    
    // Pattern: S followed by O or 0, then 7 digits (e.g., SO1234567)
    const s0KeyPattern = /^S[O0]\d{7}$/;
    if (!s0KeyPattern.test(s0KeyValue)) {
      setError('S0 Key must be in the format SO or S0 followed by 7 numbers (e.g., SO1234567)');
      setLoading(false);
      return;
    }
    
    // Normalize: convert S0 (zero) to SO (letter O) for consistency
    s0KeyValue = s0KeyValue.replace(/^S0(\d+)/, 'SO$1');
    formData.s0Key = s0KeyValue;

    try {
      // Include fullName if available (optional)
      const loginData = {
        email: formData.email,
        s0Key: formData.s0Key
      };
      
      const response = await axios.post(getApiUrl(API_ENDPOINTS.AUTH.LOGIN), loginData);
      const { token, ...user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(token, user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Header Navigation */}
      <header className="login-header">
        <div className="login-header-content">
          <button 
            type="button"
            className="login-header-logo-btn"
            onClick={() => onNavigate?.('home')}
          >
            <SEMOLogo size="small" showText={true} />
          </button>
          <nav className="login-header-nav">
            <button 
              type="button"
              className="nav-link-btn"
              onClick={() => onNavigate?.('home')}
            >
              Home
            </button>
            <button 
              type="button"
              className="nav-link-btn"
              onClick={() => onNavigate?.('about')}
            >
              About Us
            </button>
            <button 
              type="button"
              className="nav-link-btn"
              onClick={() => onNavigate?.('resources')}
            >
              Resources
            </button>
            <button 
              type="button"
              className="nav-link-btn"
              onClick={() => onNavigate?.('contact')}
            >
              Contact
            </button>
            <button 
              type="button"
              className="nav-link-btn sign-in-btn-header active"
            >
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content - Centered Login Form */}
      <main className="login-main-content">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-logo">
              <SEMOLogo size="small" showText={true} />
            </div>
            <div className="login-card-title">
              <h1>Welcome Back!</h1>
              <p>Sign in to continue learning.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                SEMO.EDU Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="yourname@semo.edu"
                className="form-input"
              />
              <small className="form-hint">Must be a SEMO.EDU email address.</small>
            </div>

            <div className="form-group">
              <label htmlFor="s0Key" className="form-label">
                SO Key <span className="required">*</span>
              </label>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  id="s0Key"
                  name="s0Key"
                  value={formData.s0Key}
                  onChange={handleChange}
                  required
                  placeholder="SO1234567"
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                />
                <button
                  type="button"
                  className="scan-button"
                  onClick={() => setShowQRScanner(true)}
                  title="Scan Student ID QR Code - No email required"
                >
                  <span className="scan-icon">📷</span>
                  <span>Scan ID</span>
                </button>
              </div>
              <small className="form-hint">
                Format: SO followed by numbers (e.g., SO1234567) or scan your student ID to login directly.
              </small>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer-text">
            Enter your SEMO.EDU email and SO Key to access the platform.
            <br />
            Or scan your student ID QR code to login directly (no email required).
            <br />
            Your account will be created automatically on first login.
          </div>

          <div className="tutor-login-link">
            <button
              type="button"
              className="tutor-login-button"
              onClick={() => setShowTutorLogin(true)}
            >
              👨‍🏫 Are you a tutor? Login here
            </button>
          </div>
        </div>
      </main>
      
      {showQRScanner && (
        <QRScanner
          onScan={(s0Key) => {
            // Direct login with S0 Key only (no email required for QR scan)
            handleS0KeyLogin(s0Key);
            setShowQRScanner(false);
          }}
          onClose={() => {
            setShowQRScanner(false);
            setLoading(false);
          }}
        />
      )}

      {showTutorLogin && (
        <div className="tutor-login-overlay">
          <div className="tutor-login-modal">
            <TutorLogin
              onLogin={onLogin}
              onNavigate={(section) => {
                if (section === 'signin') {
                  setShowTutorLogin(false);
                }
              }}
            />
            <button
              className="close-tutor-login"
              onClick={() => setShowTutorLogin(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;


