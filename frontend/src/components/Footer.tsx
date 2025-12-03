import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>SEMO Learning Assistance Program</h4>
          <p>Code Tutor - AI-Powered Programming Learning Platform</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="https://www.semo.edu" target="_blank" rel="noopener noreferrer">Southeast Missouri State University</a></li>
            <li><a href="https://www.semo.edu/learning-assistance" target="_blank" rel="noopener noreferrer">Learning Assistance</a></li>
            <li><a href="https://www.semo.edu/computer-science" target="_blank" rel="noopener noreferrer">Computer Science Department</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact</h4>
          <p>One University Plaza</p>
          <p>Cape Girardeau, MO 63701</p>
          <p>Email: learningassistance@semo.edu</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Southeast Missouri State University. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;





