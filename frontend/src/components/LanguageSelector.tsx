import React from 'react';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const languages = [
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'c', name: 'C', icon: '⚙️' },
  { id: 'cpp', name: 'C++', icon: '⚡' },
  { id: 'csharp', name: 'C#', icon: '🎯' },
  { id: 'javascript', name: 'JavaScript', icon: '📜' }
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
  return (
    <div className="language-selector">
      <label className="language-label">Programming Language:</label>
      <div className="language-options">
        {languages.map(lang => (
          <button
            key={lang.id}
            className={`language-btn ${selectedLanguage === lang.id ? 'active' : ''}`}
            onClick={() => onLanguageChange(lang.id)}
            title={lang.name}
          >
            <span className="language-icon">{lang.icon}</span>
            <span className="language-name">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;






