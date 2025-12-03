import React, { useState } from 'react';
import SEMOLogo from '../SEMOLogo';
import AboutUs from '../AboutUs';
import ResourcesPanel from '../Resources/ResourcesPanel';
import Login from '../Auth/Login';
import './LandingPage.css';

interface LandingPageProps {
  onLogin: (token: string, userData: any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'resources' | 'contact' | 'signin'>('home');

  const handleSignIn = () => {
    setActiveSection('signin');
  };

  return (
    <div className="landing-page">
      {/* Navigation Bar - Hidden when signin is active */}
      {activeSection !== 'signin' && (
        <nav className="landing-nav">
          <div className="nav-container">
            <button 
              className="nav-logo-btn"
              onClick={() => setActiveSection('home')}
            >
              <SEMOLogo size="small" showText={true} />
            </button>
            <div className="nav-links">
              <button 
                className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
                onClick={() => setActiveSection('home')}
              >
                Home
              </button>
              <button 
                className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
                onClick={() => setActiveSection('about')}
              >
                About Us
              </button>
              <button 
                className={`nav-link ${activeSection === 'resources' ? 'active' : ''}`}
                onClick={() => setActiveSection('resources')}
              >
                Resources
              </button>
              <button 
                className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
                onClick={() => setActiveSection('contact')}
              >
                Contact
              </button>
              <button 
                className="nav-link sign-in-btn"
                onClick={handleSignIn}
              >
                Sign In
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="landing-content">
        {activeSection === 'home' && (
          <section className="home-section">
            <div className="hero-section">
              <div className="hero-content">
                <SEMOLogo size="large" showText={true} />
                <h1 className="hero-title">Welcome to SEMO Code Tutor</h1>
                <p className="hero-subtitle">
                  Your AI-Powered Programming Learning Platform
                </p>
                <p className="hero-description">
                  Master programming with interactive code execution, AI-powered explanations, 
                  and comprehensive learning resources. Designed exclusively for SEMO students.
                </p>
                <div className="hero-cta">
                  <button className="btn-primary-large" onClick={handleSignIn}>
                    Get Started - Sign In
                  </button>
                </div>
              </div>
            </div>

            <div className="features-preview">
              <h2 className="section-title">Why Choose Code Tutor?</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🤖</div>
                  <h3>AI-Powered Tutoring</h3>
                  <p>Get instant, personalized explanations from our advanced AI tutor</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">💻</div>
                  <h3>Multi-Language Support</h3>
                  <p>Code in Python, Java, C, C++, C#, and JavaScript with real-time execution</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3>Interactive Visualizations</h3>
                  <p>Visualize data structures and algorithms to understand concepts better</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📚</div>
                  <h3>Comprehensive Resources</h3>
                  <p>Access curated tutorials, examples, and reference materials</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🎯</div>
                  <h3>Track Your Progress</h3>
                  <p>Monitor your learning journey with personalized progress tracking</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔒</div>
                  <h3>Secure & Private</h3>
                  <p>Your work is protected with SEMO authentication</p>
                </div>
              </div>
            </div>

            <div className="cta-section">
              <h2>Ready to Start Learning?</h2>
              <p>Sign in with your SEMO credentials to unlock all features</p>
              <button className="btn-primary-large" onClick={handleSignIn}>
                Sign In Now
              </button>
            </div>
          </section>
        )}

        {activeSection === 'about' && (
          <section className="about-section-wrapper">
            <AboutUs />
          </section>
        )}

        {activeSection === 'resources' && (
          <section className="resources-section-wrapper">
            <ResourcesPanel />
          </section>
        )}

        {activeSection === 'contact' && (
          <section className="contact-section">
            <div className="contact-container">
              <h2>Contact Us</h2>
              <div className="contact-info">
                <div className="contact-item">
                  <h3>📍 Location</h3>
                  <p>Southeast Missouri State University</p>
                  <p>Learning Assistance Program</p>
                </div>
                <div className="contact-item">
                  <h3>📧 Email</h3>
                  <p>
                    <a href="mailto:learningassistance@semo.edu">
                      learningassistance@semo.edu
                    </a>
                  </p>
                </div>
                <div className="contact-item">
                  <h3>🌐 Website</h3>
                  <p>
                    <a 
                      href="https://www.semo.edu/learning-assistance" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      semo.edu/learning-assistance
                    </a>
                  </p>
                </div>
                <div className="contact-item">
                  <h3>⏰ Support Hours</h3>
                  <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p>Saturday - Sunday: Closed</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'signin' && (
          <section className="signin-section-full">
            <Login 
              onLogin={onLogin} 
              onNavigate={(section) => setActiveSection(section as any)}
            />
          </section>
        )}
      </main>

      {/* Footer - Hidden when signin is active */}
      {activeSection !== 'signin' && (
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-section">
              <SEMOLogo size="small" showText={true} />
              <p>SEMO Learning Assistance Program</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <a href="https://www.semo.edu" target="_blank" rel="noopener noreferrer">SEMO.edu</a>
              <a href="https://www.semo.edu/learning-assistance" target="_blank" rel="noopener noreferrer">Learning Assistance</a>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <button onClick={() => setActiveSection('about')}>About Us</button>
              <button onClick={() => setActiveSection('resources')}>Resources</button>
              <button onClick={() => setActiveSection('contact')}>Contact</button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Southeast Missouri State University. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default LandingPage;

