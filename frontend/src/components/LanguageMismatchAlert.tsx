import React from 'react';
import './LanguageMismatchAlert.css';

interface LanguageMismatchAlertProps {
  detected: string;
  selected: string;
  onSwitchLanguage: (lang: string) => void;
  onDismiss: () => void;
}

const LanguageMismatchAlert: React.FC<LanguageMismatchAlertProps> = ({
  detected,
  selected,
  onSwitchLanguage,
  onDismiss
}) => {
  const getLanguageName = (lang: string): string => {
    const names: { [key: string]: string } = {
      python: 'Python',
      java: 'Java',
      c: 'C',
      cpp: 'C++',
      csharp: 'C#',
      javascript: 'JavaScript'
    };
    return names[lang] || lang;
  };

  return (
    <div className="language-mismatch-alert">
      <div className="alert-icon">⚠️</div>
      <div className="alert-content">
        <strong>Language Mismatch Detected!</strong>
        <p>
          Your code appears to be written in <strong>{getLanguageName(detected)}</strong>, 
          but you have <strong>{getLanguageName(selected)}</strong> selected.
        </p>
        <div className="alert-actions">
          <button 
            className="btn-switch"
            onClick={() => onSwitchLanguage(detected)}
          >
            Switch to {getLanguageName(detected)}
          </button>
          <button 
            className="btn-dismiss"
            onClick={onDismiss}
          >
            Keep {getLanguageName(selected)}
          </button>
        </div>
      </div>
      <button className="alert-close" onClick={onDismiss}>×</button>
    </div>
  );
};

export default LanguageMismatchAlert;






