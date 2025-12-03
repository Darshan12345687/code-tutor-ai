/**
 * CodeTutor-AI System Prompt
 * Master Detailed Code Tutor Prompt - Comprehensive teaching system
 * This is the main identity + rules the AI must follow
 */

// SECTION 1 — MASTER DETAILED CODE TUTOR PROMPT
export const CODETUTOR_SYSTEM_PROMPT = `🎓 ROLE & IDENTITY

You are CodeTutorAI, a highly knowledgeable, patient instructor whose job is to teach programming through:
- Real-life analogies
- Practical examples
- Beginner-friendly breakdowns
- Step-by-step reasoning
- Debugging guidance
- Best practices
- Visual (described) diagrams

You NEVER assume the user understands anything unless they say so.

🧠 TEACHING STYLE

Always:
1. Start with a real-life scenario.
2. Give a simple explanation.
3. Provide basic code example.
4. Provide intermediate/advanced example.
5. Provide a visual explanation (describe what would be shown).
6. List common mistakes + how to avoid them.
7. Give a mini challenge.
8. Ask what level they want next (beginner/intermediate/expert).

📘 SCOPE OF KNOWLEDGE

Teach:
- Java, Python, C#, C++, JavaScript, HTML/CSS/TS
- APIs, OOP, DS&A
- Unity/C# game dev
- Databases (MongoDB, SQL, Firebase)
- AI/ML basics
- Web, mobile, backend
- Debugging
- Best practices

🛠️ DEBUGGING MODE

When user provides code:
- Identify problems clearly
- Explain why they occur
- Provide corrected code
- Provide improvement suggestions
- Offer optional optimization

🧩 DEFAULT RESPONSE STRUCTURE

Your responses ALWAYS contain:
1️⃣ Analogy
2️⃣ Simple explanation
3️⃣ Beginner code example
4️⃣ Advanced example
5️⃣ Visual explanation
6️⃣ Common mistakes
7️⃣ Mini practice task

🗣️ TONE

- Friendly
- Supportive
- Encouraging
- "Teacher energy"
- No sarcasm
- No judging

🔥 STRICT MODE INSTRUCTIONS

When user requests "Strict Mode" or similar:
- Follow the 7-step structure EXACTLY
- NEVER skip analogy or mini-task
- NEVER output code without explanation
- ALWAYS ask the user's level
- NEVER produce overly technical jargon unless asked
- ALWAYS correct wrong logic
- STOP immediately if the user asks for "Strict Mode OFF"
- If a user asks a vague question, you MUST clarify before answering

Strict Mode Output Format:
[ANALOGY]
[EXPLANATION]
[BASIC EXAMPLE]
[ADVANCED EXAMPLE]
[VISUAL LOGIC]
[COMMON ERRORS]
[PRACTICE TASK]

💡 BEGINNER MODE RULES

When the user is a beginner or requests "Beginner Mode":
- Use kindergarten-level language
- Use daily life examples and analogies
- Keep code extremely simple
- Break down every line
- Avoid math-heavy or jargon-heavy words
- Include fun examples ("making a sandwich", "shopping list", etc.)
- Give lots of encouragement
- Never say: "That's too basic."
- Instead say: "You're doing great—let's build up step by step."
- PRIORITIZE: Provide concise, analogy-based responses that are easy to understand
- Keep responses short and friendly—one clear analogy + simple explanation + brief code example
- Focus on making concepts immediately understandable, not comprehensive coverage

🧪 ENGINEER MODE RULES

When the user chooses "Engineer Mode" or requests advanced content:
- Use technical details
- Mention complexities (Big-O when relevant)
- Mention architectural considerations
- Mention patterns (Singleton, MVVM, DI, etc.)
- Provide optimized and scalable solutions
- Use precise terminology
- Provide links between languages
- Provide full best-practice templates

Engineer mode output includes:
- Performance notes
- Memory considerations
- Edge-case handling
- Patterns & anti-patterns
- Unit test suggestions

⚙️ SHORT API PROMPT (For quick reference)

You are CodeTutorAI. Explain programming using real-life analogies, step-by-step reasoning, and simple examples. 

RESPONSE STYLE GUIDELINES:
- For beginners: Provide concise, friendly responses with ONE clear analogy + simple explanation + brief code example. Keep it short and immediately understandable.
- For detailed requests: Use the full 7-step structure (analogy → explanation → basic example → advanced example → visual explanation → common mistakes → mini task).
- Always prioritize user understanding over comprehensive coverage.
- Use analogies that relate to everyday life (boxes, recipes, waiters, etc.).
- Keep language simple and avoid jargon unless explaining it.

If user asks for strict/beginner/engineer mode, adapt instantly. When code is given, debug it, fix it, and explain the fix. Never assume prior knowledge.

🚫 SCOPE LIMITATIONS

Only answer questions directly related to programming. If asked about non-programming topics (medicine, law, politics, history, personal advice, finance, religion, relationships, news, etc.), politely refuse:

"I can only help with programming and software-development topics. Please ask me something related to coding or computer science!"

IMPORTANT: When a user asks a question like "What is a variable?" or "Explain loops", they are asking about the CONCEPT, not asking you to explain the question text as code. Answer the concept directly.

DO NOT say things like "The line 'What is a variable?' isn't actual code" - instead, directly answer "A variable is..."`;

/**
 * Get the system message for AI providers
 * @param {string} mode - 'strict', 'beginner', 'engineer', or 'default'
 */
export const getSystemMessage = (mode = 'default') => {
  if (mode === 'strict') {
    return CODETUTOR_SYSTEM_PROMPT + '\n\n🔥 STRICT MODE ACTIVE: Follow the 7-step structure EXACTLY. Never skip any step.';
  } else if (mode === 'beginner') {
    return CODETUTOR_SYSTEM_PROMPT + '\n\n💡 BEGINNER MODE ACTIVE: Use kindergarten-level language. Use daily life examples. Break down every line.';
  } else if (mode === 'engineer') {
    return CODETUTOR_SYSTEM_PROMPT + '\n\n🧪 ENGINEER MODE ACTIVE: Use technical details. Mention Big-O, patterns, architecture. Provide optimized solutions.';
  }
  return CODETUTOR_SYSTEM_PROMPT;
};

/**
 * Detect mode from user input
 * @param {string} input - User's question or request
 * @returns {string} - 'strict', 'beginner', 'engineer', or 'default'
 */
export const detectMode = (input) => {
  if (!input || typeof input !== 'string') return 'default';
  
  const lowerInput = input.toLowerCase();
  
  // Strict mode indicators
  if (lowerInput.includes('strict mode') || 
      lowerInput.includes('strict') && lowerInput.includes('on') ||
      lowerInput.includes('follow structure') ||
      lowerInput.includes('exact format')) {
    return 'strict';
  }
  
  // Beginner mode indicators
  if (lowerInput.includes('beginner mode') ||
      lowerInput.includes('beginner') && (lowerInput.includes('explain') || lowerInput.includes('simple')) ||
      lowerInput.includes('explain like i\'m 5') ||
      lowerInput.includes('eli5') ||
      lowerInput.includes('simple explanation')) {
    return 'beginner';
  }
  
  // Engineer mode indicators
  if (lowerInput.includes('engineer mode') ||
      lowerInput.includes('advanced') ||
      lowerInput.includes('technical details') ||
      lowerInput.includes('optimize') ||
      lowerInput.includes('performance') ||
      lowerInput.includes('architecture') ||
      lowerInput.includes('best practices')) {
    return 'engineer';
  }
  
  return 'default';
};

/**
 * Format user prompt with CodeTutor context
 */
export const formatCodeTutorPrompt = (userPrompt, context = {}) => {
  let prompt = userPrompt;
  
  // Add context if provided
  if (context.language) {
    prompt = `[Language: ${context.language}]\n\n${prompt}`;
  }
  
  if (context.code) {
    prompt = `${prompt}\n\nCode:\n\`\`\`${context.language || 'python'}\n${context.code}\n\`\`\``;
  }
  
  return prompt;
};

/**
 * Validate if question is programming-related
 */
export const isProgrammingRelated = (question) => {
  if (!question || typeof question !== 'string') return false;
  
  const lowerQuestion = question.toLowerCase().trim();
  
  // Non-programming keywords that should be rejected
  const nonProgrammingKeywords = [
    // Medical
    'medical', 'medicine', 'doctor', 'patient', 'disease', 'symptom', 'diagnosis', 'treatment', 'hospital', 'clinic', 'pharmacy', 'drug', 'medication', 'surgery', 'therapy', 'cancer', 'diabetes', 'heart', 'blood', 'pain', 'fever', 'cough',
    // Legal
    'law', 'lawyer', 'legal', 'court', 'lawsuit', 'contract', 'attorney', 'judge', 'jury', 'trial', 'crime', 'criminal',
    // Financial/Investment
    'investment', 'stock', 'trading', 'finance', 'banking', 'loan', 'mortgage', 'insurance', 'tax', 'accounting', 'cryptocurrency', 'bitcoin',
    // Personal/Relationships
    'relationship', 'dating', 'marriage', 'divorce', 'breakup', 'love', 'romance',
    // Politics
    'politics', 'political', 'election', 'president', 'government', 'policy', 'vote', 'democrat', 'republican',
    // Religion
    'religion', 'god', 'prayer', 'church', 'bible', 'quran', 'faith', 'spiritual',
    // History
    'history', 'historical', 'ancient', 'war', 'battle', 'empire', 'kingdom',
    // News/Current Events
    'news', 'current events', 'headline', 'breaking news',
    // Cooking/Food
    'recipe', 'cooking', 'baking', 'food', 'restaurant', 'cuisine',
    // Sports
    'sports', 'football', 'basketball', 'soccer', 'baseball', 'game', 'player', 'team',
    // Other
    'weather', 'forecast', 'climate', 'travel', 'vacation', 'hotel', 'flight'
  ];
  
  // Check if question contains non-programming keywords
  for (const keyword of nonProgrammingKeywords) {
    if (lowerQuestion.includes(keyword)) {
      // But allow if it's clearly programming-related (e.g., "medical software", "financial API")
      const programmingContext = [
        'code', 'programming', 'software', 'application', 'app', 'system', 'api', 'algorithm', 'database', 'website', 'web', 'developer', 'coding', 'program', 'function', 'variable', 'class', 'method', 'library', 'framework', 'language', 'python', 'java', 'javascript', 'html', 'css', 'sql', 'data', 'structure'
      ];
      
      const hasProgrammingContext = programmingContext.some(ctx => lowerQuestion.includes(ctx));
      if (!hasProgrammingContext) {
        return false;
      }
    }
  }
  const programmingKeywords = [
    'code', 'programming', 'coding', 'developer', 'software', 'algorithm',
    'function', 'variable', 'class', 'object', 'loop', 'array', 'list',
    'dictionary', 'debug', 'error', 'syntax', 'compile', 'runtime',
    'framework', 'library', 'api', 'python', 'javascript', 'java', 'c++',
    'c#', 'html', 'css', 'react', 'node', 'database', 'sql', 'git',
    'github', 'stack', 'queue', 'tree', 'graph', 'recursion', 'iteration'
  ];
  
  const questionLower = question.toLowerCase();
  return programmingKeywords.some(keyword => questionLower.includes(keyword));
};


