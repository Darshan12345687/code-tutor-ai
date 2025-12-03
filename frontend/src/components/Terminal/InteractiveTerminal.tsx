import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';
import './InteractiveTerminal.css';

interface TerminalProps {
  language: string;
  userId?: string;
}

export interface TerminalRef {
  executeCodeFromEditor: (code: string) => void;
}

interface HistoryItem {
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

const InteractiveTerminal = forwardRef<TerminalRef, TerminalProps>(({ language, userId }, ref) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingInputs, setPendingInputs] = useState<Array<{ prompt: string; index: number }>>([]);
  const [inputValues, setInputValues] = useState<Array<string>>([]);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<{ code: string; output: string; error: string | null } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setHistory([{
      type: 'output',
      content: `✨ Welcome to Code Tutor Terminal! ✨\n\n📝 Language: ${language.toUpperCase()}\n\n💡 Quick Tips:\n  • Type code and press Ctrl+Enter to run\n  • Press Enter for new line\n  • Type 'help' for commands\n  • Variables persist across commands\n  • input() calls will prompt for values\n\n🚀 Ready to code!`,
      timestamp: new Date()
    }]);
  }, [language]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Extract input() calls from code
  const extractInputCalls = (code: string): Array<{ prompt: string; index: number }> => {
    const inputs: Array<{ prompt: string; index: number }> = [];
    const inputRegex = /input\s*\(\s*(?:("""[\s\S]*?""")|('''[\s\S]*?''')|(".*?")|('.*?')|([^)]*?))?\s*\)/g;
    let match;
    let index = 0;
    
    while ((match = inputRegex.exec(code)) !== null) {
      let prompt = '';
      if (match[1]) prompt = match[1].slice(3, -3).trim();
      else if (match[2]) prompt = match[2].slice(3, -3).trim();
      else if (match[3]) prompt = match[3].slice(1, -1).trim();
      else if (match[4]) prompt = match[4].slice(1, -1).trim();
      else if (match[5] && match[5].trim()) prompt = `Enter value for: ${match[5].trim()}`;
      else prompt = 'Enter value:';
      
      inputs.push({ prompt, index });
      index++;
    }
    
    return inputs;
  };

  // Replace input() calls with provided values
  const replaceInputCalls = (code: string, values: string[]): string => {
    let result = code;
    let valueIndex = 0;
    
    result = result.replace(/input\s*\([^)]*\)/g, () => {
      if (valueIndex < values.length) {
        const value = values[valueIndex];
        valueIndex++;
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
        return `"${escaped}"`;
      }
      return '""';
    });
    
    return result;
  };

  // Execute code
  const executeCode = async (code: string) => {
    if (!code.trim()) return;

    // Add input to history
    setHistory(prev => [...prev, {
      type: 'input',
      content: `$ ${code}`,
      timestamp: new Date()
    }]);

    // Check for input() calls
    const inputCalls = extractInputCalls(code);
    
    if (inputCalls.length > 0) {
      setPendingCode(code);
      setPendingInputs(inputCalls);
      setInputValues(new Array(inputCalls.length).fill(''));
      setHistory(prev => [...prev, {
        type: 'output',
        content: `📝 Your code requires ${inputCalls.length} input(s). Please provide values below:`,
        timestamp: new Date()
      }]);
      return;
    }
    
    // Execute code
    await executeCodeWithInputs(code);
  };

  // Execute code (internal)
  const executeCodeWithInputs = async (code: string) => {
    // Handle special commands
    if (code.trim() === 'clear' || code.trim() === 'cls') {
      setHistory([]);
      setCommand('');
      return;
    }

    if (code.trim() === 'help') {
      setHistory(prev => [...prev, {
        type: 'output',
        content: `Available commands:\n  clear/cls - Clear terminal\n  help - Show this help\n  exit - Exit terminal\n\nYou can:\n  - Type code and press Ctrl+Enter to run\n  - Variables persist across commands`,
        timestamp: new Date()
      }]);
      setCommand('');
      return;
    }

    setIsExecuting(true);

    try {
      const token = localStorage.getItem('token');
      
      const requestBody: any = {
        code: code,
        language: language
      };
      
      if (sessionId) {
        requestBody.sessionId = sessionId;
      }
      
      const response = await axios.post(
        getApiUrl(API_ENDPOINTS.CODE.EXECUTE_INTERACTIVE),
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          timeout: 30000
        }
      );
      
      // Update session ID
      if (response.data.sessionId && !sessionId) {
        setSessionId(response.data.sessionId);
      }

      const { output, error } = response.data;

      // Store last execution for AI feedback
      setLastExecution({
        code: code,
        output: output || '',
        error: error || null
      });
      
      // Clear previous AI feedback when new code is executed
      setAiFeedback(null);

      if (error) {
        // Log the error for debugging
        console.log('📋 Console error captured:', error);
        
        setHistory(prev => [...prev, {
          type: 'error',
          content: `❌ ${error}`,
          timestamp: new Date()
        }]);
      } else {
        // Show output - handle empty output properly
        const outputContent = output !== undefined && output !== null && output !== '' 
          ? output 
          : '(No output)';
        
        setHistory(prev => [...prev, {
          type: 'output',
          content: outputContent,
          timestamp: new Date()
        }]);
      }

      // Save to history if user is logged in
      if (userId && token) {
        try {
          await axios.post(
            getApiUrl(API_ENDPOINTS.PROGRESS.SAVE_CODE),
            {
              code: code,
              language: language,
              output: output || '',
              error: error || null,
              executionTime: response.data.executionTime || 0
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        } catch (err) {
          console.error('Failed to save code history:', err);
        }
      }
    } catch (error: any) {
      console.error('Execution error:', error);
      
      let errorMessage = 'Execution failed';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Store last execution even for errors so AI tutor button can appear
      setLastExecution({
        code: code,
        output: '',
        error: errorMessage
      });
      
      // Clear previous AI feedback when new code is executed
      setAiFeedback(null);
      
      setHistory(prev => [...prev, {
        type: 'error',
        content: `❌ ${errorMessage}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsExecuting(false);
      setCommand('');
      textareaRef.current?.focus();
    }
  };

  // Handle input submission
  const handleInputSubmit = () => {
    if (pendingInputs.length === 0 || !pendingCode) return;
    
    const allProvided = inputValues.every((val, idx) => {
      return idx < pendingInputs.length && val.trim() !== '';
    });
    
    if (!allProvided) {
      setHistory(prev => [...prev, {
        type: 'error',
        content: 'Please provide all input values',
        timestamp: new Date()
      }]);
      return;
    }
    
    const modifiedCode = replaceInputCalls(pendingCode, inputValues);
    
    setPendingInputs([]);
    setInputValues([]);
    setPendingCode(null);
    
    executeCodeWithInputs(modifiedCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      executeCode(command);
    }
  };

  // Ask AI Tutor for help with errors or code suggestions
  const askAITutor = async () => {
    if (!lastExecution) {
      setHistory(prev => [...prev, {
        type: 'error',
        content: '❌ Please run some code first before asking for AI help.',
        timestamp: new Date()
      }]);
      return;
    }

    setIsLoadingAI(true);
    setAiFeedback(null);

    try {
      const token = localStorage.getItem('token');
      
      // ALWAYS use code-feedback endpoint to check for errors and provide suggestions
      // This ensures code is analyzed for errors, not treated as a question
      const endpoint = getApiUrl(API_ENDPOINTS.AI.CODE_FEEDBACK);
      
      const requestBody = {
        code: lastExecution.code,
        error: lastExecution.error || null,
        output: lastExecution.output || null,
        language: language
      };
      
      // Debug logging
      if (lastExecution.error) {
        console.log('🤖 Asking AI Tutor to analyze console error:', {
          code: lastExecution.code,
          consoleError: lastExecution.error,
          output: lastExecution.output,
          language: language
        });
      } else {
        console.log('🤖 Asking AI Tutor to check code for errors and provide suggestions:', {
          code: lastExecution.code,
          output: lastExecution.output,
          language: language
        });
      }
      
      const response = await axios.post(
        endpoint,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          timeout: 30000
        }
      );

      // Handle response from code-feedback endpoint
      const feedback = response.data.feedback || 'No feedback available.';
      setAiFeedback(feedback);
      
      // Add AI feedback to history with better formatting
      let feedbackTitle = '';
      if (lastExecution.error) {
        feedbackTitle = `🤖 AI Tutor - Error Analysis:\n\n`;
        feedbackTitle += `❌ Console Error:\n${lastExecution.error}\n\n`;
        feedbackTitle += `📝 Your Code:\n\`\`\`${language}\n${lastExecution.code}\n\`\`\`\n\n`;
        if (lastExecution.output) {
          feedbackTitle += `📤 Output:\n${lastExecution.output}\n\n`;
        }
        feedbackTitle += `💡 AI Analysis & Suggestions:\n`;
      } else {
        feedbackTitle = `🤖 AI Tutor - Code Analysis:\n\n`;
        feedbackTitle += `📝 Your Code:\n\`\`\`${language}\n${lastExecution.code}\n\`\`\`\n\n`;
        if (lastExecution.output) {
          feedbackTitle += `📤 Output:\n${lastExecution.output}\n\n`;
        }
        feedbackTitle += `💡 Code Analysis & Suggestions:\n`;
      }
      
      setHistory(prev => [...prev, {
        type: 'output',
        content: `${feedbackTitle}${feedback}`,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      console.error('AI feedback error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get AI feedback';
      setHistory(prev => [...prev, {
        type: 'error',
        content: `❌ AI Tutor Error: ${errorMessage}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Expose method to execute code from editor
  useImperativeHandle(ref, () => ({
    executeCodeFromEditor: (codeFromEditor: string) => {
      if (!codeFromEditor.trim()) return;
      executeCode(codeFromEditor);
    }
  }));

  return (
    <div className="interactive-terminal">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">💻</span>
          <span>Interactive Terminal - {language.toUpperCase()}</span>
          {sessionId && <span className="session-indicator" title="Active session">●</span>}
        </div>
        <div className="terminal-controls">
          <button className="terminal-btn" onClick={() => setHistory([])} title="Clear">
            🗑️
          </button>
        </div>
      </div>
      <div className="terminal-body" ref={terminalRef}>
        {history.map((item, index) => (
          <div key={index} className={`terminal-line ${item.type}`}>
            <span className="terminal-timestamp">
              {item.timestamp.toLocaleTimeString()}
            </span>
            <pre className="terminal-content">{item.content}</pre>
          </div>
        ))}
        {isExecuting && (
          <div className="terminal-line output">
            <span className="terminal-timestamp">Executing...</span>
            <span className="loading-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}
      </div>
      <div className="terminal-input-container">
        <span className="terminal-prompt">$</span>
        <textarea
          ref={textareaRef}
          className="terminal-input terminal-textarea"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter code... (Press Enter for new line, Ctrl+Enter to run, or click Run button)"
          disabled={isExecuting}
          autoFocus
          rows={1}
          style={{
            minHeight: '40px',
            maxHeight: '200px',
            resize: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            padding: '8px',
            overflowY: 'auto'
          }}
        />
        <button
          className="terminal-run-btn"
          onClick={() => executeCode(command)}
          disabled={!command.trim() || isExecuting}
          title="Run Code"
        >
          ▶ Run
        </button>
        <button
          className="terminal-ai-tutor-btn"
          onClick={askAITutor}
          disabled={isLoadingAI || isExecuting || !lastExecution}
          title={lastExecution?.error ? "Get AI suggestions for this error" : "Get AI help with your code"}
        >
          {isLoadingAI ? '⏳' : '🤖'} Ask AI Tutor
        </button>
      </div>
      {pendingInputs.length > 0 && (
        <div className="input-prompts-container">
          <div className="input-prompts-header">
            📝 Provide Input Values:
          </div>
          {pendingInputs.map((input, index) => (
            <div key={index} className="input-prompt-item">
              <label className="input-prompt-label">
                {input.prompt || `Input ${index + 1}:`}
              </label>
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                  if (index === 0 && el) {
                    setTimeout(() => el.focus(), 100);
                  }
                }}
                type="text"
                className="input-prompt-field"
                value={inputValues[index] || ''}
                onChange={(e) => {
                  const newValues = [...inputValues];
                  newValues[index] = e.target.value;
                  setInputValues(newValues);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index < pendingInputs.length - 1) {
                      inputRefs.current[index + 1]?.focus();
                    } else {
                      handleInputSubmit();
                    }
                  }
                }}
                placeholder={`Enter value for: ${input.prompt || `input ${index + 1}`}`}
              />
            </div>
          ))}
          <div className="input-prompts-actions">
            <button
              className="btn-submit-inputs"
              onClick={handleInputSubmit}
            >
              ✓ Submit & Run
            </button>
            <button
              className="btn-cancel-inputs"
              onClick={() => {
                setPendingInputs([]);
                setInputValues([]);
                setPendingCode(null);
                setHistory(prev => [...prev, {
                  type: 'output',
                  content: 'Input cancelled',
                  timestamp: new Date()
                }]);
              }}
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

InteractiveTerminal.displayName = 'InteractiveTerminal';

export default InteractiveTerminal;


