import React from 'react';
import { ExecutionResult } from '../App';
import './OutputPanel.css';

interface OutputPanelProps {
  result: ExecutionResult | null;
  aiFeedback?: string | null;
  isGettingFeedback?: boolean;
  preExecutionAnalysis?: string | null;
  isAnalyzing?: boolean;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ result, aiFeedback, isGettingFeedback, preExecutionAnalysis, isAnalyzing }) => {
  return (
    <div className="output-panel">
      <div className="panel-header">
        <h3>📊 Output</h3>
        {result && (
          <span className="execution-time">
            {result.execution_time}s
          </span>
        )}
      </div>
      <div className="panel-content">
        {/* Pre-execution analysis */}
        {isAnalyzing && (
          <div className="pre-execution-analysis">
            <div className="analysis-loading">
              🔍 Analyzing code for potential errors...
            </div>
          </div>
        )}
        
        {preExecutionAnalysis && !isAnalyzing && (
          <div className="pre-execution-analysis">
            <div className="analysis-header">🔍 Pre-Execution Analysis</div>
            <div className="analysis-content">{preExecutionAnalysis}</div>
          </div>
        )}

        {/* Execution results */}
        {result ? (
          <>
            {result.error ? (
              <div className="output-error">
                <div className="error-header">❌ Error</div>
                <pre className="error-message">{result.error}</pre>
                {isGettingFeedback && (
                  <div className="ai-feedback-loading">
                    🤖 Getting AI feedback...
                  </div>
                )}
                {aiFeedback && !isGettingFeedback && (
                  <div className="ai-feedback">
                    <div className="ai-feedback-header">💡 AI Feedback</div>
                    <div className="ai-feedback-content">{aiFeedback}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="output-success">
                <div className="output-header">✅ Output</div>
                <pre className="output-text">{result.output || '(No output)'}</pre>
              </div>
            )}
          </>
        ) : !preExecutionAnalysis && !isAnalyzing && (
          <div className="output-placeholder">
            <p>Click "Run Code" to analyze and execute your code.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;


