import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeTab: 'editor' | 'ai-tutor' | 'data-structures' | 'algorithms' | 'visualizations' | 'resources' | 'quizzes' | 'appointments' | 'about';
  setActiveTab: (tab: 'editor' | 'ai-tutor' | 'data-structures' | 'algorithms' | 'visualizations' | 'resources' | 'quizzes' | 'appointments' | 'about') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          <span className="nav-icon">✏️</span>
          <span className="nav-text">Code Editor</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'ai-tutor' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-tutor')}
        >
          <span className="nav-icon">🤖</span>
          <span className="nav-text">AI Tutor</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'data-structures' ? 'active' : ''}`}
          onClick={() => setActiveTab('data-structures')}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-text">Data Structures</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'algorithms' ? 'active' : ''}`}
          onClick={() => setActiveTab('algorithms')}
        >
          <span className="nav-icon">⚡</span>
          <span className="nav-text">Algorithms</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'visualizations' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualizations')}
        >
          <span className="nav-icon">🎨</span>
          <span className="nav-text">Visualizations</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <span className="nav-icon">🔗</span>
          <span className="nav-text">Resources</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          <span className="nav-icon">📝</span>
          <span className="nav-text">Quizzes & Flashcards</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <span className="nav-icon">📅</span>
          <span className="nav-text">Book Appointment</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <span className="nav-icon">ℹ️</span>
          <span className="nav-text">About Us</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <p>Powered by AI</p>
      </div>
    </aside>
  );
};

export default Sidebar;

