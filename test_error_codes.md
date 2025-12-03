# Sample Error Codes for Testing AI Feedback

## Test these codes in the terminal to verify AI error detection and feedback:

### 1. **NameError - Undefined Variable**
```python
x = 5
y = x + z
print(y)
```
**Expected Error:** `NameError: name 'z' is not defined`
**Expected AI Feedback:** Should identify that variable 'z' is undefined and suggest defining it.

---

### 2. **TypeError - Type Mismatch**
```python
x = "5"
y = x + 10
print(y)
```
**Expected Error:** `TypeError: can only concatenate str (not "int") to str`
**Expected AI Feedback:** Should explain type mismatch and suggest converting string to int or vice versa.

---

### 3. **SyntaxError - Missing Colon**
```python
def my_function()
    print("Hello")
```
**Expected Error:** `SyntaxError: expected ':'`
**Expected AI Feedback:** Should identify missing colon and show correct syntax.

---

### 4. **IndexError - List Index Out of Range**
```python
my_list = [1, 2, 3]
print(my_list[5])
```
**Expected Error:** `IndexError: list index out of range`
**Expected AI Feedback:** Should explain that index 5 doesn't exist and suggest valid indices.

---

### 5. **AttributeError - Wrong Method**
```python
my_string = "hello"
my_string.append(" world")
```
**Expected Error:** `AttributeError: 'str' object has no attribute 'append'`
**Expected AI Feedback:** Should explain that strings don't have append() and suggest using + or join().

---

### 6. **ZeroDivisionError**
```python
x = 10
y = 0
result = x / y
print(result)
```
**Expected Error:** `ZeroDivisionError: division by zero`
**Expected AI Feedback:** Should identify division by zero and suggest adding a check.

---

### 7. **Missing Import**
```python
import math
result = sqrt(16)
print(result)
```
**Expected Error:** `NameError: name 'sqrt' is not defined`
**Expected AI Feedback:** Should identify that sqrt needs to be called as math.sqrt().

---

### 8. **IndentationError**
```python
def test():
print("Hello")
    print("World")
```
**Expected Error:** `IndentationError: expected an indented block`
**Expected AI Feedback:** Should explain indentation issues and show correct formatting.

---

## How to Test:

1. Open the terminal in the Code Tutor app
2. Copy and paste any of the error codes above
3. Click "Run" or press Ctrl+Enter
4. The system should:
   - **Before execution:** Show pre-execution analysis detecting potential errors
   - **After execution:** Show the error and automatically provide AI feedback with:
     - Error type identification
     - Root cause explanation
     - Specific suggestions to fix
     - Corrected code example (if applicable)

## Expected AI Feedback Format:

The AI should provide feedback in this format:
1. **Error Detected:** [List all errors found]
2. **Root Cause:** [Explain why each error occurred]
3. **Suggestions to Fix:** [Provide specific, actionable suggestions]
4. **Corrected Code:** [Show the fixed version if applicable]





