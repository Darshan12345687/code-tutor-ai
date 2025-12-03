# Sample Code Error Detection Tests

## Quick Test Examples

### Test Case 1: Undefined Variable (print(x))

**Code:**
```python
print(x)
```

**Expected Detection:**
- Issue: Undefined variable 'x'
- Suggestion: Use quotes if it's text: `print("x")` or define variable first: `x = value`

**API Request:**
```bash
curl -X POST http://localhost:8000/api/ai/code-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(x)",
    "error": null,
    "language": "python"
  }'
```

---

### Test Case 2: Undefined Variable with Explicit Error

**Code:**
```python
print(x)
```

**Error:** `NameError: name 'x' is not defined`

**API Request:**
```bash
curl -X POST http://localhost:8000/api/ai/code-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(x)",
    "error": "NameError: name '\''x'\'' is not defined",
    "language": "python"
  }'
```

**Expected Response:**
- Detects NameError
- Provides specific fix: Use quotes or define variable
- Shows corrected code examples

---

### Test Case 3: Correct Code (No Errors)

**Code:**
```python
print("Hello World")
x = 5
print(x)
```

**API Request:**
```bash
curl -X POST http://localhost:8000/api/ai/code-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello World\")\nx = 5\nprint(x)",
    "error": null,
    "language": "python"
  }'
```

**Expected Response:**
- No errors detected
- Code is valid

---

### Test Case 4: Multiple Errors

**Code:**
```python
print(name)
print(age)
print(city)
```

**API Request:**
```bash
curl -X POST http://localhost:8000/api/ai/code-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(name)\nprint(age)\nprint(city)",
    "error": null,
    "language": "python"
  }'
```

**Expected Detection:**
- Multiple undefined variables detected
- Each variable gets specific suggestions

---

### Test Case 5: TypeError

**Code:**
```python
result = "5" + 3
```

**Error:** `TypeError: can only concatenate str (not "int") to str`

**API Request:**
```bash
curl -X POST http://localhost:8000/api/ai/code-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = \"5\" + 3",
    "error": "TypeError: can only concatenate str (not \"int\") to str",
    "language": "python"
  }'
```

**Expected Response:**
- Detects TypeError
- Explains type mismatch
- Suggests conversion: `int("5") + 3` or `"5" + str(3)`

---

## Postman Collection Examples

### Example 1: Check for Errors in print(x)

**Method:** POST  
**URL:** `http://localhost:8000/api/code-error/analyze`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "code": "print(x)",
  "language": "python"
}
```

**Expected Response:**
```json
{
  "success": true,
  "issues": [
    {
      "type": "undefined_variable",
      "line": 1,
      "variable": "x",
      "message": "Variable 'x' is used on line 1 but is never defined"
    }
  ],
  "suggestions": [
    {
      "type": "fix_undefined_variable",
      "line": 1,
      "variable": "x",
      "message": "If you want to print the text \"x\", use quotes: print(\"x\")",
      "alternatives": [
        "Define the variable first: x = \"your value\"",
        "Use quotes if it's text: print(\"x\")"
      ]
    }
  ],
  "feedback": "**Issues Detected in Your Code:**\n\n1. **UNDEFINED VARIABLE** (Line 1):\n   Variable 'x' is used on line 1 but is never defined\n\n...",
  "issueCount": 1,
  "language": "python"
}
```

---

### Example 2: Get AI-Powered Suggestions

**Method:** POST  
**URL:** `http://localhost:8000/api/code-error/suggestions`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "code": "print(x)",
  "error": null,
  "language": "python",
  "provider": "auto"
}
```

**Expected Response:**
```json
{
  "success": true,
  "feedback": "**Issue Detected:**\n\n- The code uses 'x' which is not defined. This will cause a NameError when executed.\n\n...",
  "patternAnalysis": {
    "issues": [...],
    "suggestions": [...],
    "issueCount": 1
  },
  "errorInfo": null,
  "provider": "ai-service",
  "language": "python",
  "hasError": false
}
```

---

## Frontend Integration Test

When you click "Ask AI Tutor" button in the terminal with code like `print(x)`:

1. **Frontend sends:**
```javascript
POST /api/ai/code-feedback
{
  "code": "print(x)",
  "error": null,
  "output": null,
  "language": "python"
}
```

2. **Backend responds with:**
- Error analysis detecting undefined variable
- Specific suggestions to fix
- Corrected code examples

3. **Frontend displays:**
- "🤖 AI Tutor - Code Analysis:"
- The detected issues
- Specific fix suggestions
- Corrected code examples

---

## Running the Test Script

To run the automated test:

```bash
cd backend
node test-code-error-detection.js
```

This will:
- Test pattern-based error detection
- Test error message parsing
- Test fallback feedback generation
- Show sample API request formats

---

## Expected Behavior Summary

✅ **Detects:**
- Undefined variables (e.g., `print(x)`)
- Missing quotes for strings
- Type errors
- Syntax errors

✅ **Provides:**
- Specific error identification
- Line-by-line analysis
- Actionable fix suggestions
- Corrected code examples

✅ **Uses:**
- Available API keys for better suggestions
- Pattern matching as fallback
- Error analyzer for structured feedback




