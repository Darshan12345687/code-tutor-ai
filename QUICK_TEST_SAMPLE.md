# Quick Test Sample for Code Error Detection

## Sample 1: Test print(x) - Undefined Variable

### Using cURL:

```bash
curl -X POST http://localhost:8000/api/ai/code-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(x)",
    "error": null,
    "language": "python"
  }'
```

### Using Postman:

**Method:** POST  
**URL:** `http://localhost:8000/api/ai/code-feedback`  
**Headers:**
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "code": "print(x)",
  "error": null,
  "language": "python"
}
```

**Expected Response:**
```json
{
  "feedback": "**Issue Detected:**\n\nThe code uses 'x' which is not defined...",
  "provider": "code-error-analyzer",
  "type": "code-error-feedback"
}
```

---

## Sample 2: Test print(X) - Uppercase X

```bash
curl -X POST http://localhost:8000/api/ai/code-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(X)",
    "error": null,
    "language": "python"
  }'
```

---

## Sample 3: Test with Explicit Error

```bash
curl -X POST http://localhost:8000/api/ai/code-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(x)",
    "error": "NameError: name '\''x'\'' is not defined",
    "language": "python"
  }'
```

---

## Sample 4: Test Correct Code (No Errors)

```bash
curl -X POST http://localhost:8000/api/ai/code-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello World\")",
    "error": null,
    "language": "python"
  }'
```

---

## Test Results Summary

✅ **Detects:** `print(x)` → Undefined variable 'x'  
✅ **Detects:** `print(X)` → Undefined variable 'X'  
✅ **Suggests:** Use quotes `print("x")` or define variable  
✅ **Provides:** Corrected code examples  
✅ **Uses:** API keys when available for better suggestions

---

## Frontend Test

1. Open the terminal in your app
2. Type: `print(x)`
3. Run the code
4. Click "🤖 Ask AI Tutor"
5. **Expected:** Error analysis showing undefined variable with fix suggestions

---

## Pattern Analysis Only (No AI)

For fast pattern-based analysis without AI:

```bash
curl -X POST http://localhost:8000/api/code-error/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(x)",
    "language": "python"
  }'
```

This returns structured issues and suggestions without AI processing.




