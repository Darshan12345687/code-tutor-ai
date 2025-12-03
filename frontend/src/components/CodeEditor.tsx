import React, { useState, useEffect, useRef } from 'react';
import './CodeEditor.css';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode, language }) => {
  const [lineNumbers, setLineNumbers] = useState<string>('1');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1).join('\n'));
  }, [code]);

  // Normalize indentation in pasted code (like VS Code)
  const normalizeIndentation = (text: string): string => {
    // Convert tabs to spaces (4 spaces per tab)
    text = text.replace(/\t/g, '    ');
    
    // Split into lines
    const lines = text.split('\n');
    
    // Find minimum indentation (excluding empty lines)
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    if (nonEmptyLines.length === 0) return text;
    
    // Find minimum leading spaces
    const minIndent = Math.min(
      ...nonEmptyLines.map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      })
    );
    
    // Remove minimum indentation from all lines (normalize to start at column 0)
    if (minIndent > 0) {
      return lines.map(line => {
        if (line.trim().length === 0) return line;
        return line.substring(minIndent);
      }).join('\n');
    }
    
    return text;
  };

  // Handle paste event - normalize indentation
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    const pastedText = e.clipboardData.getData('text');
    const textarea = textareaRef.current;
    
    if (!textarea) return;
    
    // Get current cursor position
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = code;
    
    // Normalize the pasted text
    const normalizedText = normalizeIndentation(pastedText);
    
    // Insert normalized text at cursor position
    const newText = currentText.substring(0, start) + normalizedText + currentText.substring(end);
    
    setCode(newText);
    
    // Set cursor position after pasted text
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + normalizedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }
    }, 0);
  };

  // Handle Tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = code;
      
      if (e.shiftKey) {
        // Shift+Tab: Unindent (remove 4 spaces or 1 tab)
        const beforeCursor = currentText.substring(0, start);
        const afterCursor = currentText.substring(end);
        const lineStart = beforeCursor.lastIndexOf('\n') + 1;
        const lineEnd = currentText.indexOf('\n', end);
        const lineEndPos = lineEnd === -1 ? currentText.length : lineEnd;
        
        const line = currentText.substring(lineStart, lineEndPos);
        if (line.startsWith('    ')) {
          // Remove 4 spaces
          const newText = currentText.substring(0, lineStart) + line.substring(4) + currentText.substring(lineEndPos);
          setCode(newText);
          setTimeout(() => {
            textarea.setSelectionRange(Math.max(start - 4, lineStart), Math.max(end - 4, lineStart));
          }, 0);
        } else if (line.startsWith('\t')) {
          // Remove 1 tab
          const newText = currentText.substring(0, lineStart) + line.substring(1) + currentText.substring(lineEndPos);
          setCode(newText);
          setTimeout(() => {
            textarea.setSelectionRange(Math.max(start - 1, lineStart), Math.max(end - 1, lineStart));
          }, 0);
        }
      } else {
        // Tab: Indent (add 4 spaces)
        const beforeCursor = currentText.substring(0, start);
        const afterCursor = currentText.substring(end);
        const lineStart = beforeCursor.lastIndexOf('\n') + 1;
        const lineEnd = currentText.indexOf('\n', end);
        const lineEndPos = lineEnd === -1 ? currentText.length : lineEnd;
        
        const line = currentText.substring(lineStart, lineEndPos);
        const indentedLine = '    ' + line;
        const newText = currentText.substring(0, lineStart) + indentedLine + currentText.substring(lineEndPos);
        
        setCode(newText);
        setTimeout(() => {
          textarea.setSelectionRange(start + 4, end + 4);
        }, 0);
      }
    }
  };

  const getFileName = () => {
    const extensions: { [key: string]: string } = {
      python: 'main.py',
      java: 'Main.java',
      c: 'main.c',
      cpp: 'main.cpp',
      csharp: 'Program.cs',
      javascript: 'main.js'
    };
    return extensions[language] || 'main.py';
  };

  const getPlaceholder = () => {
    const placeholders: { [key: string]: string } = {
      python: 'Write your Python code here...',
      java: 'Write your Java code here...',
      c: 'Write your C code here...',
      cpp: 'Write your C++ code here...',
      csharp: 'Write your C# code here...',
      javascript: 'Write your JavaScript code here...'
    };
    return placeholders[language] || 'Write your code here...';
  };

  return (
    <div className="code-editor-container">
      <div className="editor-header">
        <div className="editor-tabs">
          <span className="tab active">
            <span className="file-icon">📄</span>
            {getFileName()}
          </span>
        </div>
        <div className="editor-actions">
          <button className="editor-btn" title="Format Code">⌘F</button>
          <button className="editor-btn" title="Settings">⚙️</button>
        </div>
      </div>
      <div className="editor-wrapper">
        <div className="line-numbers">
          <pre>{lineNumbers}</pre>
        </div>
        <textarea
          ref={textareaRef}
          className="code-editor"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
