import React from 'react';
import { ExplanationResult } from '../App';
import './ExplanationPanel.css';

interface ExplanationPanelProps {
  result: ExplanationResult | null;
  isExplaining?: boolean;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ result, isExplaining = false }) => {
  // Format explanation text for better readability
  const formatExplanation = (text: string): string => {
    // Split by double newlines to create paragraphs
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map(p => p.trim()).filter(p => p.length > 0).join('\n\n');
  };

  return (
    <div className="explanation-panel">
      <div className="panel-header">
        <div className="header-left">
          <span className="header-icon">💡</span>
          <h3>Code Explanation</h3>
        </div>
        {result?.provider && (
          <div className="provider-indicator">
            <span className="provider-dot"></span>
            <span>{result.provider}</span>
          </div>
        )}
      </div>
      <div className="panel-content">
        {isExplaining ? (
          <div className="explanation-loading">
            <div className="loading-spinner"></div>
            <p>AI is analyzing your code...</p>
            <p className="loading-subtitle">This may take a few seconds</p>
          </div>
        ) : result ? (
          <div className="explanation-content">
            {result.warning && (
              <div className="explanation-warning">
                <span className="warning-icon">⚠️</span>
                <div className="warning-content">
                  <strong>Note:</strong> {result.warning}
                </div>
              </div>
            )}
            
            <div className="explanation-text">
              <div className="explanation-label">
                <span className="label-icon">📖</span>
                <span>Explanation</span>
              </div>
              <div className="explanation-body">
                {formatExplanation(result.explanation || 'No explanation available')
                  .split('\n\n')
                  .map((paragraph, index) => (
                    <p key={index} className="explanation-paragraph">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>

            {result.concepts && Array.isArray(result.concepts) && result.concepts.length > 0 && (
              <div className="concepts-section">
                <div className="section-header">
                  <span className="section-icon">🔑</span>
                  <h4>Key Concepts</h4>
                </div>
                <div className="concepts-tags">
                  {result.concepts.map((concept: string, index: number) => (
                    <span key={index} className="concept-tag">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.examples && Array.isArray(result.examples) && result.examples.length > 0 && (
              <div className="examples-section">
                <div className="section-header">
                  <span className="section-icon">💻</span>
                  <h4>Code Examples</h4>
                </div>
                <div className="examples-list">
                  {result.examples.map((example: string, index: number) => (
                    <div key={index} className="example-item">
                      <div className="example-number">Example {index + 1}</div>
                      <pre className="example-code">{example}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="explanation-placeholder">
            <div className="placeholder-icon">💡</div>
            <h4>Ready to Explain</h4>
            <p>Click the <strong>"💡 Explain Code"</strong> button to get AI-powered explanations of your code.</p>
            <div className="placeholder-features">
              <div className="feature-item">
                <span className="feature-icon">✨</span>
                <span>Understand how your code works</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Learn key programming concepts</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📚</span>
                <span>See practical code examples</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplanationPanel;


