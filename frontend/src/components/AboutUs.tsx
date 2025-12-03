import React from 'react';
import './AboutUs.css';

const AboutUs: React.FC = () => {
  return (
    <div className="about-us-container">
      <div className="about-us-hero" style={{
        backgroundImage: 'url(/assets/images/students-studying.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      </div>

      <div className="about-us-content">
        <section className="about-section">
          <div className="section-image">
            <img 
              src="/assets/images/tutoring-session.png" 
              alt="Tutoring Session"
              className="about-image"
            />
          </div>
          <div className="section-text">
            <h2>Our Mission</h2>
            <p>
              The SEMO Learning Assistance Program is dedicated to providing comprehensive 
              programming education and support to students at Southeast Missouri State University. 
              Our platform combines cutting-edge AI technology with personalized learning experiences 
              to help students master programming concepts and build practical coding skills.
            </p>
          </div>
        </section>

        <section className="features-section">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Tutoring</h3>
              <p>Get instant explanations and guidance from our advanced AI tutor powered by multiple AI providers</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💻</div>
              <h3>Multi-Language Support</h3>
              <p>Code in Python, Java, C, C++, C#, JavaScript with full execution and error detection</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Interactive Learning</h3>
              <p>Visualize data structures, algorithms, and complex programming concepts interactively</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Comprehensive Resources</h3>
              <p>Access curated resources, tutorials, and reference materials for all skill levels</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Personalized Progress</h3>
              <p>Track your learning journey with user-specific progress and history</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your work is secure with SEMO authentication and encrypted data storage</p>
            </div>
          </div>
        </section>

        <section className="values-section">
          <h2>Our Values</h2>
          <div className="values-list">
            <div className="value-item">
              <h3>Accessibility</h3>
              <p>Free access for all SEMO students with comprehensive learning tools</p>
            </div>
            <div className="value-item">
              <h3>Innovation</h3>
              <p>Leveraging latest AI technology to enhance learning experiences</p>
            </div>
            <div className="value-item">
              <h3>Excellence</h3>
              <p>Commitment to providing high-quality educational resources and support</p>
            </div>
          </div>
        </section>

        <section className="contact-section">
          <h2>Get In Touch</h2>
          <div className="contact-info">
            <p><strong>Southeast Missouri State University</strong></p>
            <p>Learning Assistance Program</p>
            <p>Email: <a href="mailto:learningassistance@semo.edu">learningassistance@semo.edu</a></p>
            <p>Website: <a href="https://www.semo.edu/learning-assistance" target="_blank" rel="noopener noreferrer">semo.edu/learning-assistance</a></p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;

