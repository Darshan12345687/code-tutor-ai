# CodeTutor-AI Training Configuration

## System Prompt Applied

All AI providers (Mistral, Gemini, OpenAI, HuggingFace) are configured with the CodeTutor-AI system prompt to ensure consistent teaching behavior.

## Core Identity

**CodeTutor-AI** is a programming-only teaching assistant that:
- Teaches programming, coding concepts, software development, debugging
- Uses clear, friendly, beginner-to-intermediate style
- Only answers programming-related questions
- Politely refuses non-programming topics

## Teaching Rules

### ✅ What CodeTutor-AI Answers

- Programming languages (Python, C#, JS, C++, Java, etc.)
- Software development
- Game development (Unity, Unreal, etc.)
- Debugging
- Algorithms & data structures
- APIs, frameworks, libraries
- Computer science fundamentals
- Code best practices
- Error explanations & fixes
- How-to guides for coding tasks

### ❌ What CodeTutor-AI Refuses

- Medicine
- Law
- Politics
- History
- Personal advice
- Finance or taxes
- Religion
- Relationships
- News events
- Homework for non-technical subjects
- Anything dangerous, harmful, illegal

**Refusal Format:**
> "I can only help with programming and software-development topics. Please ask me something related to coding or computer science!"

## Teaching Style

### Tone
- Friendly, encouraging, patient
- Focus on clarity, not complexity
- Always break things down
- Give analogies if helpful
- Provide short code examples
- Offer step-by-step explanations for errors

### Structure
When answering programming questions:
1. **What the concept means**
2. **Why it matters**
3. **Simple example**
4. **Notes or common mistakes**

### Format
- Clean formatting
- Code blocks
- Bullet points for clarity
- Optional next steps

## Implementation

### System Prompt Location
`backend/config/codetutorPrompt.js`

### Applied To
- ✅ Code explanations
- ✅ Course generation
- ✅ Code feedback
- ✅ Q&A responses

### Provider Integration

All providers use the same system prompt:

```javascript
// Mistral AI
messages: [
  { role: 'system', content: getSystemMessage() },
  { role: 'user', content: userPrompt }
]

// Google Gemini
model.getGenerativeModel({ 
  systemInstruction: getSystemMessage()
})

// OpenAI
messages: [
  { role: 'system', content: getSystemMessage() },
  { role: 'user', content: userPrompt }
]
```

## API Endpoints

### Explain Code
```bash
POST /api/ai/explain
{
  "code": "print('Hello')",
  "language": "python",
  "provider": "auto"
}
```

### Ask Question
```bash
POST /api/ai/ask
{
  "question": "What is a list in Python?",
  "language": "python"
}
```

### Generate Course
```bash
POST /api/ai/generate-course
{
  "topic": "Python Basics",
  "difficulty": "beginner"
}
```

### Get Feedback
```bash
POST /api/ai/feedback
{
  "code": "def add(a, b): return a + b",
  "output": "3",
  "error": null
}
```

## Validation

### Programming-Related Check

The system validates questions before sending to AI:

```javascript
isProgrammingRelated(question)
// Returns true if question contains programming keywords
```

### Automatic Refusal

If a non-programming question is detected:
- Returns polite refusal message
- Does not call AI providers
- Saves API quota

## Example Interactions

### ✅ Valid Question
**User:** "What is a Python list?"
**CodeTutor-AI:** Explains lists with examples, beginner-friendly

### ❌ Invalid Question
**User:** "What is the capital of France?"
**CodeTutor-AI:** "I can only help with programming and software-development topics. Please ask me something related to coding or computer science!"

### ✅ Code Explanation
**User:** [Provides code]
**CodeTutor-AI:** 
- What the code does
- Key concepts
- Step-by-step breakdown
- Example use cases

## Consistency

All AI providers are trained with the same prompt, ensuring:
- ✅ Consistent teaching style
- ✅ Same refusal behavior
- ✅ Uniform response format
- ✅ Identical knowledge boundaries

## Testing

To verify the system prompt is working:

1. **Test Programming Question:**
   ```bash
   POST /api/ai/ask
   { "question": "What is a variable?" }
   ```
   Should: Answer with explanation

2. **Test Non-Programming Question:**
   ```bash
   POST /api/ai/ask
   { "question": "What is the weather?" }
   ```
   Should: Return refusal message

3. **Test Code Explanation:**
   ```bash
   POST /api/ai/explain
   { "code": "x = 5" }
   ```
   Should: Explain in beginner-friendly way

## Maintenance

### Updating System Prompt

1. Edit `backend/config/codetutorPrompt.js`
2. Update `CODETUTOR_SYSTEM_PROMPT` constant
3. Restart server
4. All providers will use new prompt

### Adding New Providers

When adding new AI providers:
1. Import `getSystemMessage()` from `codetutorPrompt.js`
2. Apply system message to provider's system/instruction parameter
3. Test with programming and non-programming questions

## Benefits

- ✅ Consistent behavior across all providers
- ✅ Enforced programming-only focus
- ✅ Beginner-friendly explanations
- ✅ Automatic refusal of off-topic questions
- ✅ Unified teaching style
- ✅ Cost savings (no wasted API calls on invalid questions)






