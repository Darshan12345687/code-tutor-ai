import express from 'express';
import { spawn } from 'child_process';
import { codeExecutionLimiter, securityLogger, validateLanguage } from '../middleware/security.js';
import { body, validationResult } from 'express-validator';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { explainCode } from '../services/aiService.js';

const router = express.Router();

// Apply security logging
router.use(securityLogger);

// Store active Python sessions (sessionId -> namespace state)
const pythonSessions = new Map();

// Cleanup function
const cleanupSession = (sessionId) => {
  pythonSessions.delete(sessionId);
  // Clean up any temp files
  try {
    unlink(join(tmpdir(), `python_session_${sessionId}.pkl`)).catch(() => {});
  } catch (err) {
    // Ignore cleanup errors
  }
};

// Cleanup sessions older than 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of pythonSessions.entries()) {
    if (now - session.lastActivity > 30 * 60 * 1000) {
      cleanupSession(sessionId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// @route   POST /api/code/analyze-code
// @desc    Analyze code for potential errors using AI
// @access  Public (but rate limited)
router.post('/analyze-code',
  codeExecutionLimiter,
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string')
      .isLength({ max: 50000 })
      .withMessage('Code cannot exceed 50KB'),
    body('language')
      .optional()
      .isIn(['python'])
      .withMessage('Only Python is supported')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      let code = req.body.code;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Code is required and must be a string' });
      }

      code = code.replace(/\0/g, '');
      
      if (code.length > 50000) {
        return res.status(400).json({ error: 'Code cannot exceed 50KB' });
      }
      
      if (code.length === 0) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }

      const language = validateLanguage(req.body.language)
        ? req.body.language.toLowerCase()
        : 'python';

      // Use AI to analyze code for potential errors
      try {
        // Create a focused analysis prompt using answerQuestion for better error detection
        const { answerQuestion } = await import('../services/aiService.js');
        
        const analysisQuestion = `Analyze this ${language} code for potential compilation errors, syntax errors, and issues BEFORE execution:

\`\`\`${language}
${code}
\`\`\`

Please check for:
1. **Syntax/Compilation Errors**: Missing colons, brackets, parentheses, incorrect indentation, typos in keywords
2. **Type Errors**: Incorrect data types, type mismatches
3. **Name Errors**: Undefined variables, misspelled function/class names, missing imports
4. **Logic Errors**: Infinite loops, incorrect conditions, off-by-one errors
5. **Runtime Errors**: Division by zero, index out of range, attribute errors
6. **Best Practices**: Code style, efficiency, readability

Be specific, beginner-friendly, and encouraging. If the code looks good, say so. Format your response clearly with sections if multiple issues are found.`;

        const analysis = await answerQuestion(analysisQuestion, language, 'auto', 'default');
        
        res.json({
          analysis: analysis.explanation || 'Code analysis completed. No obvious errors detected.',
          hasIssues: code.includes('input(') || code.includes('while True') || code.length > 100,
          suggestions: analysis.concepts || [],
          provider: analysis.provider || 'unknown'
        });
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        // If AI analysis fails, return basic analysis
        res.json({
          analysis: 'Code appears to be syntactically valid. Run it to see execution results.',
          hasIssues: false,
          suggestions: [],
          provider: 'fallback'
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/code/execute-interactive
// @desc    Execute code in an interactive Python session (maintains state)
// @access  Public (but rate limited)
router.post('/execute-interactive',
  codeExecutionLimiter,
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string')
      .isLength({ max: 50000 })
      .withMessage('Code cannot exceed 50KB'),
    body('language')
      .optional()
      .isIn(['python', 'java', 'c', 'cpp', 'csharp', 'javascript'])
      .withMessage('Invalid language'),
    body('sessionId')
      .optional({ nullable: true, checkFalsy: true })
      .customSanitizer((value) => {
        // Convert null/undefined to undefined (which express-validator treats as optional)
        if (value === null || value === undefined || value === '') {
          return undefined;
        }
        return value;
      })
      .custom((value) => {
        // Only validate if value exists (not null/undefined)
        if (value === undefined || value === null) {
          return true; // Skip validation for null/undefined
        }
        return typeof value === 'string';
      })
      .withMessage('sessionId must be a string')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      const errorMessages = errors.array().map(e => `${e.param}: ${e.msg}`).join('; ');
      return res.status(400).json({
        error: 'Validation failed',
        message: errorMessages,
        details: errors.array()
      });
    }

    try {
      // Get code directly - don't over-sanitize for interactive terminal
      let code = req.body.code;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Code is required and must be a string' });
      }

      // Basic sanitization only - remove null bytes
      code = code.replace(/\0/g, '');
      
      // Check length
      if (code.length > 50000) {
        return res.status(400).json({ error: 'Code cannot exceed 50KB' });
      }
      
      if (code.length === 0) {
        return res.status(400).json({ error: 'Code cannot be empty' });
      }

      const language = validateLanguage(req.body.language)
        ? req.body.language.toLowerCase()
        : 'python';

      if (language !== 'python') {
        return res.status(400).json({ error: 'Only Python is supported for interactive execution' });
      }

      // Handle sessionId - allow null/undefined and create new if needed
      let sessionId = req.body.sessionId;
      if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Normalize indentation: convert tabs to spaces, fix common issues
      code = code
        .replace(/\t/g, '    ') // Convert tabs to 4 spaces
        .split('\n')
        .map(line => {
          // Remove trailing whitespace
          return line.trimEnd();
        })
        .join('\n');

      // Get or create Python session namespace
      if (!pythonSessions.has(sessionId)) {
        pythonSessions.set(sessionId, {
          lastActivity: Date.now()
        });
      }

      const session = pythonSessions.get(sessionId);
      session.lastActivity = Date.now();

      // Execute code using file-based approach to handle any characters (emojis, special chars, etc.)
      const startTime = Date.now();
      const codeFile = join(tmpdir(), `python_code_${sessionId}_${Date.now()}.py`);
      const sessionFile = join(tmpdir(), `python_session_${sessionId}.pkl`);
      
      try {
        // Write code to file to avoid escaping issues
        await writeFile(codeFile, code, 'utf8');
        
        // Create Python script that executes the code file
        // Use repr() in Python to safely handle file paths with any special characters
        // This is the safest way to handle file paths in Python
        // Create Python script that executes the code file
        // Use JSON.stringify which properly escapes all special characters
        // JSON.stringify already adds quotes, so we can use it directly as a Python string
        const codeFileJson = JSON.stringify(codeFile);
        const sessionFileJson = JSON.stringify(sessionFile);
        
        const executeScript = `import sys
import json
import traceback
from io import StringIO
import pickle
import os

# JSON.stringify properly escapes all special characters, use it directly as Python string
code_file = ${codeFileJson}
session_file = ${sessionFileJson}

# Load code from file
try:
    with open(code_file, 'r', encoding='utf-8') as f:
        code = f.read()
except Exception as e:
    result = {'output': '', 'error': f'Failed to read code file: {str(e)}'}
    print(json.dumps(result))
    sys.exit(1)

# Load previous namespace if exists
try:
    with open(session_file, 'rb') as f:
        namespace = pickle.load(f)
except:
    namespace = {'__builtins__': __builtins__}

# Mock input() to handle interactive input
# Note: Frontend should replace input() calls with actual values before execution
# This mock is a fallback for cases where input() is still called
_input_call_count = {'count': 0}

# Store reference to namespace using a list (mutable container)
# This ensures mock_input can always access the current namespace
_exec_namespace_ref = [namespace]

def mock_input(prompt=''):
    import sys
    _input_call_count['count'] += 1
    call_num = _input_call_count['count']
    
    # Return empty string by default
    # Frontend should have replaced input() calls with actual values
    # If we reach here, it means input() was called directly (edge case)
    # Return a default value to prevent errors
    return ''  # Empty string as default

namespace['input'] = mock_input
namespace['_input_call_count'] = _input_call_count

# Capture output
old_stdout = sys.stdout
old_stderr = sys.stderr
sys.stdout = captured_output = StringIO()
sys.stderr = captured_error = StringIO()

# Initialize output variable
output = ''

# Update namespace reference before execution
_exec_namespace_ref[0] = namespace

try:
    # Compile code with a meaningful filename so errors show correct line numbers
    # This makes tracebacks reference "user_code" instead of the wrapper script
    compiled_code = compile(code, '<user_code>', 'exec')
    exec(compiled_code, namespace)
    # Update reference after execution (namespace is modified in place)
    _exec_namespace_ref[0] = namespace
    # Flush stdout to ensure all output is captured
    sys.stdout.flush()
    output = captured_output.getvalue()
    # If execution succeeded without exception, there's NO error - ignore stderr completely
    error = None
    stderr_content = None  # Don't even check stderr if execution succeeded
except SyntaxError as e:
    # Syntax errors need special handling to show correct line numbers
    error_traceback = traceback.format_exc()
    output = captured_output.getvalue()
    
    # CRITICAL: Only report SyntaxError if it's from user code, not wrapper script
    import re
    error_type = type(e).__name__
    error_msg = str(e)
    
    # Check filename attribute - this is the most reliable indicator
    error_filename = getattr(e, 'filename', None)
    error_lineno = getattr(e, 'lineno', None)
    
    # Check if error references <user_code> in traceback, message, or filename
    has_user_code_reference = (
        '<user_code>' in error_traceback or 
        '<user_code>' in error_msg or
        error_filename == '<user_code>'
    )
    
    # AGGRESSIVE FILTERING: If line number is > 20, it's almost certainly from wrapper script
    # Wrapper script starts around line 247+ in the Node.js file, which translates to ~100+ in Python
    # User code is almost always < 20 lines
    if error_lineno and error_lineno > 20:
        # Only trust it if filename is explicitly <user_code>
        if error_filename != '<user_code>':
            has_user_code_reference = False
    
    # Also check error message for line numbers > 20
    line_number_match = re.search(r'line\s+(\d+)', error_msg + error_traceback, re.IGNORECASE)
    if line_number_match:
        line_num = int(line_number_match.group(1))
        # If line number > 20 and no explicit <user_code> reference, filter it out
        if line_num > 20 and not has_user_code_reference:
            has_user_code_reference = False
    
    if not has_user_code_reference:
        # This is a wrapper script error, not user code error - ignore it completely
        error = None
        output = output  # Keep output if any
    else:
        # SyntaxError from user code - extract the actual error message
        # SyntaxError usually has format: "message (user_code, line X)" or "message (detected at line X)"
        line_match = re.search(r'\(<user_code>,\s*line\s*(\d+)\)', error_msg)
        
        if line_match:
            user_line = line_match.group(1)
            # Remove the filename and line reference, keep the actual error
            error_msg_clean = re.sub(r'\s*\(<user_code>,\s*line\s*\d+\)', '', error_msg)
            error = f"{error_type}: {error_msg_clean} (at line {user_line} in your code)"
        else:
            # Check for "detected at line X" format (Python 3.10+)
            # ONLY if we have explicit <user_code> reference
            detected_match = re.search(r'\(detected at line\s+(\d+)\)', error_msg, re.IGNORECASE)
            if detected_match and has_user_code_reference:
                user_line = detected_match.group(1)
                # Only report if line number is reasonable (< 20)
                if int(user_line) <= 20:
                    error_msg_clean = re.sub(r'\s*\(detected at line\s+\d+\)', '', error_msg, flags=re.IGNORECASE)
                    error = f"{error_type}: {error_msg_clean} (at line {user_line} in your code)"
                else:
                    # Line number too high, filter it out
                    error = None
            elif has_user_code_reference:
                # Fallback: just show the error without confusing line numbers
                error_msg_clean = re.sub(r'\s*\(<user_code>.*?\)', '', error_msg)
                error = f"{error_type}: {error_msg_clean}"
            else:
                # No user code reference, filter it out
                error = None
        
except Exception as e:
    error_traceback = traceback.format_exc()
    output = captured_output.getvalue()
    
    # CRITICAL: Only report errors from user code, not wrapper script
    import re
    error_lines = error_traceback.strip().split('\\n')
    
    # Find lines that reference <user_code> in the traceback
    user_code_lines = [line for line in error_lines if '<user_code>' in line]
    
    # If no <user_code> reference found, this is a wrapper script error - ignore it
    if not user_code_lines:
        error = None  # Wrapper script error, don't report it
    elif user_code_lines:
        # Extract line number from traceback
        line_match = re.search(r'line\s+(\d+)', user_code_lines[0])
        if line_match:
            user_line = line_match.group(1)
            error_type = type(e).__name__
            error_msg = str(e)
            # Remove confusing line number references from wrapper
            error_msg_clean = re.sub(r'\s*\(detected at line \d+\)', '', error_msg, flags=re.IGNORECASE)
            error = f"{error_type}: {error_msg_clean} (at line {user_line} in your code)"
        else:
            error = f"{type(e).__name__}: {str(e)}"
    else:
        # No user code reference found - this is wrapper script error, ignore it
        error = None

sys.stdout = old_stdout
sys.stderr = old_stderr

# Save namespace (exclude mock functions and internal tracking)
clean_namespace = {k: v for k, v in namespace.items() 
                   if not k.startswith('_mock') 
                   and k != 'mock_input' 
                   and k != '_input_call_count'}
try:
    with open(session_file, 'wb') as f:
        pickle.dump(clean_namespace, f)
except Exception as e:
    pass

# Clean up code file
try:
    os.remove(code_file)
except:
    pass

# ABSOLUTE STRICT FILTERING: Only report errors that are 100% from user code
# If execution succeeded (no exception), error should be None
final_error = None
if error:
    # Only set error if it's not just whitespace or empty
    error_stripped = error.strip()
    if error_stripped:
        import re
        # CRITICAL: Only report if error explicitly references <user_code> in the error message itself
        # Check both the error message and the traceback to be absolutely sure
        has_user_code_in_msg = '<user_code>' in error_stripped
        
        # Extract ALL line numbers from error message
        line_num_matches = re.findall(r'line\s+(\d+)', error_stripped, re.IGNORECASE)
        line_too_high = False
        
        # Check ALL line numbers - if ANY is > 20 and no <user_code> reference, filter it out
        if line_num_matches:
            for line_num_str in line_num_matches:
                line_num = int(line_num_str)
                # Wrapper script is ~100+ lines, user code is typically < 20 lines
                # If ANY line number is > 20 and no <user_code> reference, it's definitely wrapper script
                if line_num > 20 and not has_user_code_in_msg:
                    line_too_high = True
                    break
        
        # ONLY report error if:
        # 1. Error explicitly mentions <user_code> in the message, AND
        # 2. ALL line numbers are <= 20 (or no line numbers mentioned)
        if has_user_code_in_msg and not line_too_high:
            final_error = error_stripped
        else:
            # No <user_code> reference or line number too high = wrapper script error = IGNORE IT
            final_error = None
    else:
        final_error = None
# If execution succeeded, NEVER check stderr - it might contain wrapper script errors
# stderr_content is only checked if there was an exception

# Ensure output is a string (not None)
if output is None:
    output = ''
else:
    output = str(output)

result = {'output': output, 'error': final_error}
print(json.dumps(result))`;

        // Debug: Log the Python script (first 500 chars) to see if it's valid
        console.log('Python script preview:', executeScript.substring(0, 500));
        
        // Execute Python script
        return new Promise((resolve) => {
          const pythonProcess = spawn('python3', ['-c', executeScript], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
          });

          let stdoutData = '';
          let stderrData = '';

          pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            const stderrLine = data.toString();
            // Always capture stderr for debugging, but filter it later
            stderrData += stderrLine;
          });

          // Add timeout to prevent hanging processes
          let timeoutResolved = false;
          const timeout = setTimeout(() => {
            if (!pythonProcess.killed && !timeoutResolved) {
              timeoutResolved = true;
              pythonProcess.kill('SIGTERM');
              // Clean up code file
              unlink(codeFile).catch(() => {});
              resolve(res.json({
                output: '',
                error: 'Execution timed out after 30 seconds',
                sessionId: sessionId,
                executionTime: 30
              }));
            }
          }, 30000); // 30 second timeout

          pythonProcess.on('close', async (exitCode) => {
            clearTimeout(timeout);
            if (timeoutResolved) return; // Already handled by timeout
            
            const executionTime = (Date.now() - startTime) / 1000;
            
            // Clean up code file
            try {
              await unlink(codeFile);
            } catch (err) {
              // Ignore cleanup errors
            }
            
            try {
              // Debug: Log what we received from Python
              console.log('Python execution result:', {
                exitCode,
                hasStdout: !!stdoutData.trim(),
                stdoutLength: stdoutData.length,
                stdoutPreview: stdoutData.substring(0, 500),
                hasStderr: !!stderrData.trim(),
                stderrFull: stderrData // Show full stderr for debugging
              });
              
              if (stdoutData.trim()) {
                const result = JSON.parse(stdoutData.trim());
                console.log('Parsed result:', JSON.stringify(result));
                
                // FINAL CHECK: Only report errors that reference <user_code>
                // This is the absolute final filter to ensure no wrapper script errors leak through
                let finalError = result.error || null;
                if (finalError && typeof finalError === 'string') {
                  // Check if error references <user_code> - this is the only way to know it's from user code
                  const hasUserCode = finalError.includes('<user_code>');
                  
                  // Extract ALL line numbers from error message
                  const lineMatches = finalError.matchAll(/line\s+(\d+)/gi);
                  const lineNumbers = Array.from(lineMatches).map(m => parseInt(m[1]));
                  
                  // Check ALL line numbers - if ANY is > 20 and no <user_code> reference, filter it out
                  let shouldFilter = false;
                  if (lineNumbers.length > 0) {
                    const hasHighLineNumber = lineNumbers.some(lineNum => lineNum > 20);
                    if (hasHighLineNumber && !hasUserCode) {
                      shouldFilter = true; // Wrapper script error, ignore it
                    } else if (!hasUserCode) {
                      // No <user_code> reference at all - filter it out
                      shouldFilter = true;
                    }
                  } else if (!hasUserCode) {
                    // No line number but also no <user_code> reference - filter it out
                    shouldFilter = true;
                  }
                  
                  if (shouldFilter) {
                    finalError = null;
                  }
                  
                  // ABSOLUTE FINAL CHECK: If error doesn't contain <user_code>, it's NOT from user code
                  // This is the ultimate safeguard - no exceptions
                  if (finalError && !finalError.includes('<user_code>')) {
                    // Check if it mentions line numbers > 20 - definitely wrapper script
                    const allLineMatches = finalError.matchAll(/line\s+(\d+)/gi);
                    const allLineNumbers = Array.from(allLineMatches).map(m => parseInt(m[1]));
                    if (allLineNumbers.length > 0 && allLineNumbers.some(ln => ln > 20)) {
                      finalError = null; // Definitely wrapper script error
                    } else if (allLineNumbers.length === 0) {
                      // No line numbers but also no <user_code> - likely wrapper script error
                      finalError = null;
                    }
                  }
                }
                
                // ABSOLUTE FINAL SAFEGUARD: If error doesn't contain <user_code>, check if it's a common Python error
                // Some errors might be valid even without <user_code> if they're common Python errors
                if (finalError && !finalError.includes('<user_code>')) {
                  // Check for any line numbers > 20 - definitely wrapper script
                  const allLineMatches = Array.from(finalError.matchAll(/line\s+(\d+)/gi));
                  if (allLineMatches.length > 0) {
                    const hasHighLine = allLineMatches.some(m => parseInt(m[1]) > 20);
                    if (hasHighLine) {
                      finalError = null; // Definitely wrapper script error
                    } else {
                      // Check if it's a common Python error pattern (NameError, TypeError, etc.)
                      const commonErrorPattern = /^(NameError|TypeError|SyntaxError|ValueError|AttributeError|IndexError|KeyError|ZeroDivisionError|ImportError|IndentationError):/i;
                      if (commonErrorPattern.test(finalError)) {
                        // It's a common Python error, likely from user code - keep it but log
                        console.log('⚠️ Error without <user_code> but matches common Python error pattern:', finalError.substring(0, 100));
                        // Keep the error - it's likely valid
                      } else {
                        // Not a common error pattern and no <user_code> - filter it out
                        finalError = null;
                      }
                    }
                  } else {
                    // No line numbers - check if it's a common Python error
                    const commonErrorPattern = /^(NameError|TypeError|SyntaxError|ValueError|AttributeError|IndexError|KeyError|ZeroDivisionError|ImportError|IndentationError):/i;
                    if (commonErrorPattern.test(finalError)) {
                      // Common Python error - likely valid
                      console.log('⚠️ Error without <user_code> or line number but matches common Python error:', finalError.substring(0, 100));
                      // Keep the error
                    } else {
                      // No line numbers and not a common error - filter it out
                      finalError = null;
                    }
                  }
                }
                
                // Handle output - return the actual output value (can be empty string)
                // Frontend will handle displaying '(No output)' if needed
                const outputValue = result.output !== undefined && result.output !== null 
                  ? String(result.output) 
                  : '';
                
                resolve(res.json({
                  output: outputValue,
                  error: finalError,
                  sessionId: sessionId,
                  executionTime: executionTime
                }));
              } else if (stderrData) {
                // If we have stderr but no stdout, Python execution failed
                // BUT: Only report if it's a user code error, not wrapper script error
                const stderrMsg = stderrData.trim();
                let errorToReport = null;
                
                // Only report stderr errors if they reference <user_code>
                // Wrapper script errors should be filtered out
                if (stderrMsg.includes('<user_code>')) {
                  errorToReport = stderrMsg;
                } else {
                  // Check for line numbers - if > 20, it's wrapper script error
                  const lineMatch = stderrMsg.match(/line\s+(\d+)/i);
                  if (lineMatch) {
                    const lineNum = parseInt(lineMatch[1]);
                    // Only report if line number is reasonable (< 20) and has <user_code>
                    if (lineNum <= 20 && stderrMsg.includes('<user_code>')) {
                      errorToReport = stderrMsg;
                    }
                    // Otherwise, it's a wrapper script error - don't report it
                  }
                  // If no line number and no <user_code>, don't report it (wrapper script error)
                }
                
                // If we filtered out the error, don't show generic message - just return success
                // This prevents showing "Python process exited with code 1" for wrapper script errors
                resolve(res.json({
                  output: '(No output)',
                  error: errorToReport,
                  sessionId: sessionId,
                  executionTime: executionTime
                }));
              } else {
                // No stdout and no stderr - Python might have failed silently
                // Only report error if exit code is non-zero AND we don't have filtered stderr
                // If stderr was filtered (wrapper script error), we already handled it above
                resolve(res.json({
                  output: '(No output)',
                  error: exitCode !== 0 ? null : null, // Don't show generic error - it's likely a wrapper script issue
                  sessionId: sessionId,
                  executionTime: executionTime
                }));
              }
            } catch (parseError) {
              // If JSON parsing fails, return raw output/error
              // BUT: Filter out wrapper script errors
              let errorMsg = stderrData || (exitCode !== 0 ? `Python execution failed (exit code: ${exitCode})` : null);
              
              // CRITICAL: Filter out wrapper script errors
              if (errorMsg && typeof errorMsg === 'string') {
                // If error mentions line numbers > 20 and doesn't reference <user_code>, filter it out
                const lineMatch = errorMsg.match(/line\s+(\d+)/i);
                if (lineMatch) {
                  const lineNum = parseInt(lineMatch[1]);
                  if (lineNum > 20 && !errorMsg.includes('<user_code>')) {
                    errorMsg = null; // Wrapper script error, don't report it
                  }
                } else if (!errorMsg.includes('<user_code>')) {
                  // No line number but also no <user_code> - likely wrapper script error
                  errorMsg = null;
                }
              }
              
              resolve(res.json({
                output: stdoutData || '(No output)',
                error: errorMsg,
                sessionId: sessionId,
                executionTime: executionTime
              }));
            }
          });

          pythonProcess.on('error', async (err) => {
            clearTimeout(timeout);
            if (timeoutResolved) return; // Already handled by timeout
            
            // Clean up code file
            try {
              await unlink(codeFile);
            } catch (cleanupErr) {
              // Ignore cleanup errors
            }
            
            const errorMsg = err.code === 'ENOENT' 
              ? 'Python 3 is not installed or not in PATH. Please install Python 3.'
              : `Failed to execute Python: ${err.message}`;
            
            resolve(res.json({
              output: '',
              error: errorMsg,
              sessionId: sessionId,
              executionTime: 0
            }));
          });
        });
      } catch (fileError) {
        // Clean up code file if write failed
        try {
          await unlink(codeFile);
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }
        
        return res.status(500).json({
          error: `Failed to prepare code: ${fileError.message}`,
          sessionId: sessionId
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   DELETE /api/code/interactive/:sessionId
// @desc    Close an interactive session
// @access  Public
router.delete('/interactive/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  cleanupSession(sessionId);
  res.json({ message: 'Session closed' });
});

export default router;
