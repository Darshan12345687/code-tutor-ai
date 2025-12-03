import React from 'react';
import SEMOLogo from './SEMOLogo';
import './Header.css';

interface HeaderProps {
  user?: any;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-top-bar">
        <div className="header-top-content">
          <div className="semo-official-links">
            <a href="https://www.semo.edu" target="_blank" rel="noopener noreferrer" className="semo-link">semo.edu</a>
            <span className="divider">|</span>
            <a href="https://www.semo.edu/learning-assistance" target="_blank" rel="noopener noreferrer" className="semo-link">Learning Assistance</a>
          </div>
          {user && (
            <div className="user-menu-top">
              <span className="user-name">{user.fullName || user.username}</span>
              {onLogout && (
                <button className="logout-btn" onClick={onLogout}>
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="header-main">
        <div className="header-content">
          <div className="logo-section">
            <SEMOLogo size="medium" showText={true} className="header-logo" />
            <div className="logo-text">
              <h1 className="main-title">SEMO Learning Assistance Program</h1>
              <h2 className="subtitle">Code Tutor - AI-Powered Programming Learning Platform</h2>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

