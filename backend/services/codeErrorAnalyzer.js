/**
 * Code Error Analyzer Service
 * 
 * This service handles code error detection, analysis, and provides suggestions.
 * It can work standalone with pattern matching or integrate with AI services for advanced analysis.
 */

// Python built-in functions and keywords to ignore during analysis
const PYTHON_BUILTINS = [
  'print', 'len', 'str', 'int', 'float', 'list', 'dict', 'tuple', 'set',
  'True', 'False', 'None', 'range', 'input', 'open', 'close', 'read',
  'write', 'append', 'remove', 'pop', 'sort', 'reverse', 'split', 'join',
  'upper', 'lower', 'strip', 'replace', 'find', 'count', 'sum', 'max', 'min',
  'abs', 'round', 'type', 'isinstance', 'if', 'else', 'elif', 'for', 'while',
  'def', 'class', 'import', 'from', 'return', 'break', 'continue', 'pass',
  'try', 'except', 'finally', 'raise', 'assert', 'with', 'as', 'in', 'not', 'and', 'or'
];

/**
 * Analyze code for common issues and potential errors
 * @param {string} code - The code to analyze
 * @param {string} language - Programming language (default: 'python')
 * @returns {Object} Object containing issues and suggestions
 */
export const analyzeCodeForIssues = (code, language = 'python') => {
  if (!code || typeof code !== 'string') {
    return { issues: [], suggestions: [] };
  }

  const issues = [];
  const suggestions = [];
  
  // Split code into lines for line-by-line analysis
  const codeLines = code.split('\n').map((line, idx) => ({
    line: line.trim(),
    number: idx + 1,
    original: line
  }));

  if (language.toLowerCase() === 'python') {
    // Check for undefined variables in print statements
    codeLines.forEach(({ line, number }) => {
      if (line.includes('print(')) {
        const printMatch = line.match(/print\s*\(([^)]+)\)/);
        if (printMatch) {
          const content = printMatch[1].trim();
          
          // Check if content is an undefined variable
          if (!content.startsWith('"') && 
              !content.startsWith("'") && 
              !/^\d+/.test(content) && 
              !content.includes('(') &&
              !content.startsWith('[') &&
              !content.startsWith('{')) {
            
            const varName = content.split('.')[0].split('[')[0].trim();
            
            // Skip if it's a built-in or common function
            if (PYTHON_BUILTINS.includes(varName.toLowerCase())) {
              return;
            }
            
            // Check if variable is defined before this line
            const isDefined = codeLines.slice(0, number - 1).some(prevLine => {
              const prevLineContent = prevLine.line;
              return prevLineContent.includes(`${varName} =`) || 
                     prevLineContent.includes(`${varName}=`) ||
                     prevLineContent.match(new RegExp(`for\\s+${varName}\\s+in`)) ||
                     prevLineContent.match(new RegExp(`def\\s+${varName}\\s*\\(`)) ||
                     prevLineContent.match(new RegExp(`import\\s+${varName}`)) ||
                     prevLineContent.match(new RegExp(`from\\s+.+\\s+import\\s+${varName}`));
            });
            
            if (!isDefined && /^[A-Za-z_][A-Za-z0-9_]*$/.test(varName)) {
              issues.push({
                type: 'undefined_variable',
                line: number,
                variable: varName,
                message: `Variable '${varName}' is used on line ${number} but is never defined`
              });
              
              suggestions.push({
                type: 'fix_undefined_variable',
                line: number,
                variable: varName,
                message: `If you want to print the text "${varName}", use quotes: print("${varName}")`,
                alternatives: [
                  `Define the variable first: ${varName} = "your value"`,
                  `Use quotes if it's text: print("${varName}")`
                ]
              });
            }
          }
        }
      }
    });

    // Check for undefined variables in general assignments and expressions
    codeLines.forEach(({ line, number }) => {
      // Look for variable usage (not definitions)
      const varUsagePattern = /\b([A-Z][A-Z0-9_]*|[a-z_][a-z0-9_]*)\b/g;
      const matches = [...line.matchAll(varUsagePattern)];
      
      matches.forEach(match => {
        const varName = match[1];
        
        // Skip built-ins
        if (PYTHON_BUILTINS.includes(varName.toLowerCase())) {
          return;
        }
        
        // Skip if it's a function call or definition
        if (line.includes(`def ${varName}(`) || 
            line.includes(`class ${varName}`) ||
            line.includes(`${varName}(`) && !line.includes(`${varName} =`)) {
          return;
        }
        
        // Skip if variable is defined on this line
        if (line.includes(`${varName} =`) || line.includes(`${varName}=`)) {
          return;
        }
        
        // Check if variable is defined before this line
        const isDefined = codeLines.slice(0, number - 1).some(prevLine => {
          const prevLineContent = prevLine.line;
          return prevLineContent.includes(`${varName} =`) || 
                 prevLineContent.includes(`${varName}=`) ||
                 prevLineContent.match(new RegExp(`for\\s+${varName}\\s+in`)) ||
                 prevLineContent.match(new RegExp(`def\\s+${varName}\\s*\\(`)) ||
                 prevLineContent.match(new RegExp(`import\\s+${varName}`));
        });
        
        // Check if it's already been reported
        const alreadyReported = issues.some(issue => 
          issue.variable === varName && issue.line === number
        );
        
        if (!isDefined && !alreadyReported && /^[A-Za-z_][A-Za-z0-9_]*$/.test(varName)) {
          // More lenient check - only report obvious issues
          if (varName.length > 0 && (varName[0] === varName[0].toUpperCase() || line.includes(`print(${varName}`))) {
            issues.push({
              type: 'undefined_variable',
              line: number,
              variable: varName,
              message: `Variable '${varName}' may be undefined on line ${number}`
            });
          }
        }
      });
    });

    // Check for syntax issues
    codeLines.forEach(({ line, number }) => {
      // Check for unmatched parentheses
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens !== closeParens && line.includes('print')) {
        issues.push({
          type: 'syntax_error',
          line: number,
          message: `Possible unmatched parentheses on line ${number}`
        });
      }
      
      // Check for missing colons after control structures
      if (line.match(/^(if|elif|else|for|while|def|class)\s+.*[^:]$/)) {
        issues.push({
          type: 'syntax_error',
          line: number,
          message: `Missing colon (:) after control structure on line ${number}`
        });
      }
    });
  }

  return { issues, suggestions };
};

/**
 * Generate detailed feedback message from detected issues
 * @param {Array} issues - Array of detected issues
 * @param {Array} suggestions - Array of suggestions
 * @returns {string} Formatted feedback message
 */
export const generateIssueFeedback = (issues, suggestions) => {
  if (issues.length === 0) {
    return null;
  }

  let feedback = '**Issues Detected in Your Code:**\n\n';
  
  issues.forEach((issue, idx) => {
    feedback += `${idx + 1}. **${issue.type.replace('_', ' ').toUpperCase()}** (Line ${issue.line}):\n`;
    feedback += `   ${issue.message}\n\n`;
  });

  if (suggestions.length > 0) {
    feedback += '**Suggestions to Fix:**\n\n';
    suggestions.forEach((suggestion, idx) => {
      feedback += `${idx + 1}. ${suggestion.message}\n`;
      if (suggestion.alternatives && suggestion.alternatives.length > 0) {
        suggestion.alternatives.forEach(alt => {
          feedback += `   - ${alt}\n`;
        });
      }
      feedback += '\n';
    });
  }

  return feedback;
};

/**
 * Parse error message and extract error details
 * @param {string} error - Error message string
 * @returns {Object} Parsed error information
 */
export const parseErrorMessage = (error) => {
  if (!error || typeof error !== 'string') {
    return null;
  }

  const errorInfo = {
    type: null,
    message: error.trim(),
    variable: null,
    line: null
  };

  // Extract error type (NameError, TypeError, etc.)
  const errorTypeMatch = error.match(/^(\w+Error):/);
  if (errorTypeMatch) {
    errorInfo.type = errorTypeMatch[1];
  }

  // Extract variable name for NameError
  if (errorInfo.type === 'NameError') {
    const varMatch = error.match(/name '(\w+)' is not defined/);
    if (varMatch) {
      errorInfo.variable = varMatch[1];
    }
  }

  // Extract line number
  const lineMatch = error.match(/line (\d+)/);
  if (lineMatch) {
    errorInfo.line = parseInt(lineMatch[1]);
  }

  return errorInfo;
};

/**
 * Generate fallback feedback when AI services are unavailable
 * @param {string} code - The code that was executed
 * @param {string} error - Error message (if any)
 * @param {Array} providerErrors - Array of provider error objects
 * @returns {string} Formatted feedback message
 */
export const generateFallbackFeedback = (code, error = null, providerErrors = []) => {
  let feedback = '';
  
  // Analyze code for issues
  const { issues, suggestions } = analyzeCodeForIssues(code);
  
  if (error) {
    const errorInfo = parseErrorMessage(error);
    
    feedback += '**Error Detected:**\n\n';
    if (errorInfo && errorInfo.type) {
      feedback += `- **${errorInfo.type}**: ${errorInfo.message}\n\n`;
    } else {
      feedback += `- ${error}\n\n`;
    }
    
    // Provide specific guidance based on error type
    feedback += '**Root Cause:**\n';
    if (errorInfo) {
      if (errorInfo.type === 'NameError' && errorInfo.variable) {
        feedback += `- The variable '${errorInfo.variable}' is being used but was never defined.\n`;
        feedback += `- Python treats unquoted text like '${errorInfo.variable}' as a variable name, not as a string.\n`;
        feedback += `- If you want to print the text "${errorInfo.variable}", you need to use quotes.\n\n`;
        
        feedback += '**How to Fix It:**\n';
        feedback += `1. **Option 1**: Use quotes to print text:\n`;
        feedback += `   \`\`\`python\n`;
        feedback += `   print("${errorInfo.variable}")\n`;
        feedback += `   \`\`\`\n\n`;
        feedback += `2. **Option 2**: Define the variable first:\n`;
        feedback += `   \`\`\`python\n`;
        feedback += `   ${errorInfo.variable} = "your value here"\n`;
        feedback += `   print(${errorInfo.variable})\n`;
        feedback += `   \`\`\`\n\n`;
      } else if (errorInfo.type === 'TypeError') {
        feedback += `- There is a type mismatch in your code.\n`;
        feedback += `- You're trying to perform an operation between incompatible data types.\n\n`;
        feedback += `**How to Fix It:**\n`;
        feedback += `1. Check the types of the values you're using\n`;
        feedback += `2. Convert types if needed (use str(), int(), float())\n`;
        feedback += `3. Make sure you're using the correct operators for the data types\n\n`;
      } else if (errorInfo.type === 'SyntaxError') {
        feedback += `- There is a syntax error in your code.\n`;
        feedback += `- This usually means missing colons, brackets, parentheses, or incorrect indentation.\n\n`;
        feedback += `**How to Fix It:**\n`;
        feedback += `1. Check for missing colons (:) after if/for/while/def statements\n`;
        feedback += `2. Check for unmatched brackets, parentheses, or quotes\n`;
        feedback += `3. Verify your indentation is consistent (use spaces or tabs, not both)\n\n`;
      } else {
        feedback += `- Review the error message above to identify the specific issue.\n\n`;
      }
    }
  } else if (issues.length > 0) {
    // No explicit error but issues detected
    feedback += generateIssueFeedback(issues, suggestions);
    feedback += '\n';
    feedback += '**Root Cause:**\n';
    feedback += '- The code uses variables or expressions that are not properly defined.\n';
    feedback += '- Make sure all variables are defined before use, or use quotes for strings.\n\n';
    feedback += '**How to Fix It:**\n';
    feedback += '1. Review the suggestions above\n';
    feedback += '2. Add quotes around text that should be strings\n';
    feedback += '3. Define all variables before using them\n\n';
  } else {
    feedback += '**Code Analysis:**\n';
    feedback += 'The code appears to have potential issues.\n\n';
    feedback += '**General Suggestions:**\n';
    feedback += '1. Make sure all variables are defined before use\n';
    feedback += '2. Use quotes around text to make them strings\n';
    feedback += '3. Check for syntax errors (missing colons, brackets, etc.)\n\n';
  }
  
  // Add corrected code example
  feedback += '**Corrected Code Example:**\n';
  feedback += '```python\n';
  
  if (error) {
    const errorInfo = parseErrorMessage(error);
    if (errorInfo && errorInfo.type === 'NameError' && errorInfo.variable) {
      feedback += `# Option 1: Use quotes to print text\n`;
      feedback += `print("${errorInfo.variable}")\n\n`;
      feedback += `# Option 2: Define the variable first\n`;
      feedback += `${errorInfo.variable} = "your value here"\n`;
      feedback += `print(${errorInfo.variable})\n`;
    } else if (code.includes('print(X)') || code.includes('print( X')) {
      feedback += `# If you want to print the letter X as text:\n`;
      feedback += `print("X")\n\n`;
      feedback += `# Or if X should be a variable:\n`;
      feedback += `X = "some value"\n`;
      feedback += `print(X)\n`;
    } else {
      feedback += `# Fix the issue based on the error message above\n`;
      feedback += code + '\n';
    }
  } else {
    feedback += `# Fix the issues detected above\n`;
    feedback += code + '\n';
  }
  
  feedback += '```\n';
  
  // Add note about AI providers
  if (providerErrors.length > 0) {
    feedback += `\n*Note: AI providers are currently unavailable. This is an automated analysis based on code patterns. Provider errors: ${providerErrors.map(e => `${e.provider}: ${e.error}`).join(', ')}*`;
  } else {
    feedback += '\n*Note: AI providers are currently unavailable. This is an automated analysis based on code patterns.*';
  }
  
  return feedback;
};

/**
 * Build AI prompt for code error analysis
 * @param {string} code - The code to analyze
 * @param {string} output - Program output (if any)
 * @param {string} error - Error message (if any)
 * @param {Array} detectedIssues - Issues detected by static analysis
 * @returns {string} Formatted prompt for AI service
 */
export const buildErrorAnalysisPrompt = (code, output, error, detectedIssues = []) => {
  let analysisPrompt = '';
  
  if (!error) {
    analysisPrompt = `\n\n🔍 CRITICAL: ANALYZE THE CODE CAREFULLY FOR ERRORS:
The code was executed but no explicit error message was provided. You MUST:
1. **Check for undefined variables**: Look for variables used without being defined (e.g., print(X) where X is not defined)
2. **Check for missing quotes**: Variables that should be strings but aren't in quotes
3. **Check for type mismatches**: Operations between incompatible types
4. **Check for missing imports**: Required modules not imported
5. **Check for syntax issues**: Missing colons, brackets, parentheses
6. **Check for logic errors**: Code that will fail at runtime

IMPORTANT: If you see code like "print(X)" where X is a capital letter and not defined, this WILL cause a NameError.
- X without quotes is treated as a variable name
- If X is not defined, Python will throw: NameError: name 'X' is not defined
- Solution: Use quotes if you want text: print("X") OR define the variable first: X = "value"; print(X)

DO NOT give generic explanations like "This code demonstrates fundamental programming concepts."
You MUST identify the specific issue and explain how to fix it.`;
    
    if (detectedIssues.length > 0) {
      analysisPrompt += `\n\n⚠️ DETECTED ISSUES IN CODE:\n${detectedIssues.map((issue, idx) => `${idx + 1}. ${issue.message || issue}`).join('\n')}\n\nYou MUST address these specific issues in your response.`;
    }
  }

  const prompt = `You are a CODE ERROR DETECTION AND SUGGESTION ASSISTANT. Your job is to:
1. READ and ANALYZE the console/terminal error message provided below (if any)
2. DETECT ERRORS in code even if no explicit error message is provided
3. Detect errors in code (compilation errors, runtime errors, undefined variables, type errors)
4. Explain WHY the error occurred in simple, beginner-friendly terms
5. Provide specific suggestions to fix the errors
6. Show corrected code

CRITICAL: This is CODE ERROR ANALYSIS. The user ran code and either:
- Got an error in the console/terminal (if error message is provided), OR
- The code has issues that will cause errors (you must detect these)

You MUST:
- Read the exact error message from the console (if provided)
- Analyze what the error means
- Explain why it happened in THIS specific code
- Provide a fix
- If no error message is provided, actively detect issues in the code

Code that was executed:
\`\`\`python
${code}
\`\`\`

${output ? `Program Output:\n${output}\n` : ''}
${error ? `⚠️ CONSOLE ERROR MESSAGE (READ THIS CAREFULLY):\n${error}\n\n🔍 YOUR TASK: Analyze this console error message. The user ran the code above and this is the exact error that appeared in the terminal/console. You MUST:\n1. Read and understand this specific error message\n2. Identify what type of error it is (NameError, TypeError, SyntaxError, etc.)\n3. Explain what this error means in simple terms\n4. Explain why it happened in the user's specific code\n5. Provide step-by-step instructions to fix it\n6. Show the corrected code\n\nDO NOT give generic explanations. Focus on THIS specific error message and THIS specific code.\n` : ''}
${analysisPrompt}

REQUIRED FORMAT (you MUST follow this structure):

${error ? `
1. **What Went Wrong:**
   - State the exact error type (NameError, TypeError, SyntaxError, etc.)
   - Explain what this error means in simple terms
   - Example: "NameError means Python doesn't recognize the name 'X' because it was never defined as a variable"

2. **Why This Error Occurred:**
   - Explain the specific reason for THIS code
   - Point out the exact line or part that caused the error
   - Example: "In your code 'print(X)', Python thinks 'X' is a variable name, but you never created a variable called 'X'"

3. **How to Fix It:**
   - Provide specific, actionable steps
   - Show exactly what needs to change
   - Example: "Put quotes around 'X' to make it a string: print('X') or define X as a variable first"

4. **Corrected Code:**
\`\`\`python
[Show the fixed code here]
\`\`\`
` : `
1. **Issue Detected:**
   - Identify the specific problem in the code
   - Explain what will happen when this code runs
   - Example: "The code uses 'X' which is not defined. This will cause a NameError when executed."

2. **Why This Is a Problem:**
   - Explain why the code won't work
   - Point out the exact line or part that has the issue
   - Example: "In 'print(X)', Python treats X as a variable name. Since X is never defined, Python will throw: NameError: name 'X' is not defined"

3. **How to Fix It:**
   - Provide specific, actionable steps
   - Show exactly what needs to change
   - Example: "If you want to print the letter X as text, use quotes: print('X'). If X should be a variable, define it first: X = 'value'; print(X)"

4. **Corrected Code:**
\`\`\`python
[Show the fixed code here]
\`\`\`
`}

CRITICAL INSTRUCTIONS:
- DO NOT give generic explanations like "This code demonstrates fundamental programming concepts"
- DO NOT say "the code is correct" if there are obvious issues
- DO identify specific problems (undefined variables, missing quotes, syntax errors, etc.)
- DO provide actionable fixes with corrected code examples
- Keep responses beginner-friendly but accurate
- Focus on explaining WHY the issue will occur, not just what the issue is`;

  return prompt;
};

export default {
  analyzeCodeForIssues,
  generateIssueFeedback,
  parseErrorMessage,
  generateFallbackFeedback,
  buildErrorAnalysisPrompt
};




