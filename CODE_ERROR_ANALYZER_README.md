# Code Error Analyzer Service

## Overview

A dedicated service for analyzing code errors and providing suggestions. This module handles code error detection, pattern matching, and integrates with AI services for intelligent feedback.

## File Structure

### 1. `backend/services/codeErrorAnalyzer.js`
**Purpose**: Core service for code error analysis and feedback generation.

**Exports**:
- `analyzeCodeForIssues(code, language)` - Analyzes code for common issues
- `generateIssueFeedback(issues, suggestions)` - Generates formatted feedback from detected issues
- `parseErrorMessage(error)` - Parses error messages and extracts structured information
- `generateFallbackFeedback(code, error, providerErrors)` - Generates fallback feedback when AI is unavailable
- `buildErrorAnalysisPrompt(code, output, error, detectedIssues)` - Builds AI prompts for error analysis

**Key Features**:
- Pattern-based error detection (undefined variables, syntax errors, etc.)
- Intelligent code analysis without requiring execution
- Structured issue reporting with line numbers
- Beginner-friendly feedback generation

### 2. `backend/routes/codeErrorAnalysis.js`
**Purpose**: API routes for code error analysis.

**Endpoints**:

#### `POST /api/code-error/analyze`
Standalone code analysis without AI.
- **Input**: `{ code: string, language?: string }`
- **Output**: Pattern-based analysis with issues and suggestions
- **Use Case**: Fast analysis without AI dependency

#### `POST /api/code-error/suggestions`
AI-powered suggestions with fallback.
- **Input**: `{ code: string, error?: string, output?: string, language?: string, provider?: string }`
- **Output**: Combined AI feedback and pattern analysis
- **Use Case**: Comprehensive error analysis with AI suggestions

#### `POST /api/code-error/parse-error`
Parse error messages into structured data.
- **Input**: `{ error: string }`
- **Output**: Structured error information (type, variable, line number, etc.)
- **Use Case**: Error message parsing and extraction

## Usage Examples

### Example 1: Analyze Code for Issues

```javascript
POST /api/code-error/analyze
Content-Type: application/json

{
  "code": "print(X)",
  "language": "python"
}
```

**Response**:
```json
{
  "success": true,
  "issues": [
    {
      "type": "undefined_variable",
      "line": 1,
      "variable": "X",
      "message": "Variable 'X' is used on line 1 but is never defined"
    }
  ],
  "suggestions": [
    {
      "type": "fix_undefined_variable",
      "line": 1,
      "variable": "X",
      "message": "If you want to print the text \"X\", use quotes: print(\"X\")",
      "alternatives": [
        "Define the variable first: X = \"your value\"",
        "Use quotes if it's text: print(\"X\")"
      ]
    }
  ],
  "feedback": "**Issues Detected in Your Code:**\n\n1. **UNDEFINED VARIABLE** (Line 1):\n   Variable 'X' is used on line 1 but is never defined\n\n...",
  "issueCount": 1,
  "language": "python"
}
```

### Example 2: Get AI-Powered Suggestions

```javascript
POST /api/code-error/suggestions
Content-Type: application/json

{
  "code": "print(X)",
  "error": "NameError: name 'X' is not defined",
  "language": "python"
}
```

**Response**:
```json
{
  "success": true,
  "feedback": "**Error Detected:**\n\n- **NameError**: name 'X' is not defined\n\n...",
  "patternAnalysis": {
    "issues": [...],
    "suggestions": [...],
    "issueCount": 1
  },
  "errorInfo": {
    "type": "NameError",
    "variable": "X",
    "line": null,
    "message": "NameError: name 'X' is not defined"
  },
  "provider": "ai-service",
  "language": "python",
  "hasError": true
}
```

### Example 3: Parse Error Message

```javascript
POST /api/code-error/parse-error
Content-Type: application/json

{
  "error": "NameError: name 'X' is not defined"
}
```

**Response**:
```json
{
  "success": true,
  "errorInfo": {
    "type": "NameError",
    "variable": "X",
    "line": null,
    "message": "NameError: name 'X' is not defined"
  },
  "original": "NameError: name 'X' is not defined"
}
```

## Integration with Existing Code

The error analyzer service is now integrated into:

1. **`backend/services/aiService.js`**:
   - Uses `buildErrorAnalysisPrompt()` to generate AI prompts
   - Uses `generateFallbackFeedback()` as fallback
   - Uses `analyzeCodeForIssues()` for pattern detection

2. **Existing Routes**:
   - `/api/ai/code-feedback` still works (backwards compatible)
   - New dedicated routes provide more focused functionality

## Error Detection Capabilities

The analyzer can detect:

1. **Undefined Variables**: Variables used without definition
   - Example: `print(X)` where X is not defined
   - Detection: Checks for variable definitions before usage

2. **Missing Quotes**: Text that should be strings
   - Example: `print(hello)` instead of `print("hello")`
   - Detection: Identifies unquoted content in print statements

3. **Syntax Errors**: Missing colons, brackets, parentheses
   - Example: Missing colon after `if` statement
   - Detection: Pattern matching for common syntax issues

4. **Type Errors**: Incompatible type operations
   - Example: Adding string to integer
   - Detection: Analyzes error messages for type mismatches

## API Key Validation

The service checks API key availability and provides:
- Detailed logging of API key status
- Graceful fallback when AI providers are unavailable
- Pattern-based analysis as backup

## Benefits

1. **Separation of Concerns**: Error analysis is now in its own module
2. **Reusability**: Can be used by multiple routes/services
3. **Maintainability**: Easier to update error detection logic
4. **Testability**: Isolated functions are easier to test
5. **Flexibility**: Can work with or without AI services

## Future Enhancements

- Support for more programming languages
- Machine learning-based error prediction
- Code quality scoring
- Real-time error detection in editors
- Historical error pattern analysis




