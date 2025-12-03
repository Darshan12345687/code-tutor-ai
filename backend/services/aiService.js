import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
import { getSystemMessage, formatCodeTutorPrompt, isProgrammingRelated, detectMode } from '../config/codetutorPrompt.js';
import { 
  analyzeCodeForIssues, 
  generateFallbackFeedback, 
  buildErrorAnalysisPrompt 
} from './codeErrorAnalyzer.js';

// Load environment variables
dotenv.config();

// Try to import few-shot examples for Gemini
let getFewShotPrompt;
try {
  const fewShotModule = await import('../config/gemini-fewshot-prompt.js');
  getFewShotPrompt = fewShotModule.getFewShotPrompt;
} catch (error) {
  // Few-shot prompt not set up yet
  getFewShotPrompt = null;
}

// SECURITY: API keys are loaded from environment variables only
// NEVER expose API keys in client-side code or logs

// Initialize AI clients - keys loaded from environment only
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey
  ? new OpenAI({ 
      apiKey: openaiApiKey,
      // Ensure API key is never logged
      dangerouslyAllowBrowser: false 
    })
  : null;

// Initialize Gemini with provided API key
const geminiApiKey = process.env.GOOGLE_AI_API_KEY;
const genAI = geminiApiKey
  ? new GoogleGenerativeAI(geminiApiKey)
  : null;

// Mistral AI API key
const mistralApiKey = process.env.MISTRAL_API_KEY;

// Hugging Face API (free tier available)
const huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY;

// Provider health status cache (5 minute TTL)
const providerHealth = new Map();
const HEALTH_CHECK_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting for Gemini to prevent quota exceeded
const geminiRateLimiter = {
  lastRequest: 0,
  minInterval: 2000, // 2 seconds between requests (30 requests/min max)
  requestCount: 0,
  resetTime: Date.now() + 60000, // Reset every minute
  maxRequestsPerMinute: 25 // Conservative limit (below 30/min quota)
};

/**
 * Check if Gemini can make a request (rate limiting)
 */
const canMakeGeminiRequest = () => {
  const now = Date.now();
  
  // Reset counter every minute
  if (now > geminiRateLimiter.resetTime) {
    geminiRateLimiter.requestCount = 0;
    geminiRateLimiter.resetTime = now + 60000;
  }
  
  // Check if we've exceeded rate limit
  if (geminiRateLimiter.requestCount >= geminiRateLimiter.maxRequestsPerMinute) {
    return false;
  }
  
  // Check minimum interval between requests
  const timeSinceLastRequest = now - geminiRateLimiter.lastRequest;
  if (timeSinceLastRequest < geminiRateLimiter.minInterval) {
    return false;
  }
  
  return true;
};

/**
 * Record Gemini request
 */
const recordGeminiRequest = () => {
  geminiRateLimiter.lastRequest = Date.now();
  geminiRateLimiter.requestCount++;
};

/**
 * Check if a provider is healthy (recently worked)
 */
const isProviderHealthy = (providerName) => {
  const health = providerHealth.get(providerName);
  if (!health) return true; // Assume healthy if not checked
  
  const now = Date.now();
  if (now - health.lastCheck > HEALTH_CHECK_TTL) {
    return true; // TTL expired, assume healthy
  }
  
  return health.isHealthy;
};

/**
 * Reset all provider health on startup - give them a fresh chance
 */
const resetAllProviderHealth = () => {
  providerHealth.clear();
  console.log('🔄 All provider health statuses reset - all providers will be tried');
};

// Reset provider health on module load to ensure fresh start
resetAllProviderHealth();

/**
 * Mark provider as healthy/unhealthy
 */
const setProviderHealth = (providerName, isHealthy) => {
  providerHealth.set(providerName, {
    isHealthy,
    lastCheck: Date.now()
  });
};

/**
 * Retry with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 2, delay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
};

/**
 * Generate code explanation using Mistral AI
 */
export const explainCodeWithGemini = async (code, language = 'python', mode = 'default') => {
  try {
    if (!genAI || !geminiApiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    // Check rate limiting first
    if (!canMakeGeminiRequest()) {
      throw new Error('Gemini rate limit: Too many requests. Please wait a moment.');
    }

    // Skip if provider is known to be unhealthy
    if (!isProviderHealthy('gemini')) {
      throw new Error('Gemini provider is currently unavailable');
    }

    // Detect mode from code if not provided
    const detectedMode = mode === 'default' ? detectMode(code) : mode;

    const userPrompt = `Explain the following ${language} code in a friendly, beginner-friendly way. 
    Break down the explanation into:
    1. What the code does
    2. Key concepts used
    3. Step-by-step breakdown
    4. Example use cases
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Provide a clear, educational explanation that helps someone learn.`;

    // Enhance prompt with few-shot examples if available
    let enhancedPrompt = userPrompt;
    if (getFewShotPrompt) {
      const fewShotExamples = getFewShotPrompt();
      enhancedPrompt = `${fewShotExamples}\n\nNow explain this code:\n\n${userPrompt}`;
    }

    // Record request before making it (rate limiting)
    recordGeminiRequest();

    const result = await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-pro', // Updated to latest model name
        systemInstruction: getSystemMessage(detectedMode)
      });
      return await model.generateContent(enhancedPrompt);
    });

    const response = await result.response;
    const text = response.text();

    setProviderHealth('gemini', true);

    return {
      explanation: text,
      provider: 'gemini',
      concepts: extractConcepts(code),
      examples: generateExamples(code)
    };
  } catch (error) {
    setProviderHealth('gemini', false);
    const errorMsg = error.message || 'Gemini request failed';
    console.error('Gemini error:', errorMsg);
    throw new Error(`Gemini: ${errorMsg}`);
  }
};

export const explainCodeWithMistral = async (code, language = 'python', mode = 'default') => {
  try {
    if (!mistralApiKey) {
      throw new Error('Mistral API key not configured');
    }

    // Skip if provider is known to be unhealthy
    if (!isProviderHealthy('mistral')) {
      throw new Error('Mistral provider is currently unavailable');
    }

    // Detect mode from code if not provided
    const detectedMode = mode === 'default' ? detectMode(code) : mode;

    const userPrompt = `Explain the following ${language} code in a friendly, beginner-friendly way. 
    Break down the explanation into:
    1. What the code does
    2. Key concepts used
    3. Step-by-step breakdown
    4. Example use cases
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Provide a clear, educational explanation that helps someone learn.`;

    // Enhance prompt with few-shot examples if available
    let enhancedPrompt = userPrompt;
    if (getFewShotPrompt) {
      const fewShotExamples = getFewShotPrompt();
      // Extract just the concise examples (not the full 7-step ones)
      const conciseExamples = fewShotExamples.split('Example ').slice(1, 6).join('Example ');
      enhancedPrompt = `Here are examples of beginner-friendly programming explanations:\n\n${conciseExamples}\n\nNow explain this code in the same beginner-friendly style:\n\n${userPrompt}`;
    }

    const response = await retryWithBackoff(async () => {
      return await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-medium-latest',
          messages: [
            {
              role: 'system',
              content: getSystemMessage(detectedMode)
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${mistralApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000 // 30 second timeout
        }
      );
    });

    setProviderHealth('mistral', true);
    
    return {
      explanation: response.data.choices[0].message.content,
      provider: 'mistral',
      concepts: extractConcepts(code),
      examples: generateExamples(code)
    };
  } catch (error) {
    setProviderHealth('mistral', false);
    const errorMsg = error.response?.data?.message || error.message || 'Mistral AI request failed';
    console.error('Mistral AI error:', errorMsg);
    throw new Error(`Mistral AI: ${errorMsg}`);
  }
};


/**
 * Generate code explanation using OpenAI
 */
export const explainCodeWithOpenAI = async (code, language = 'python') => {
  try {
    if (!openai || !openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Skip if provider is known to be unhealthy
    if (!isProviderHealthy('openai')) {
      throw new Error('OpenAI provider is currently unavailable');
    }

    // SECURITY: Never log API keys
    if (process.env.NODE_ENV === 'development') {
      console.log('Using OpenAI API (key hidden for security)');
    }

    const userPrompt = `CRITICAL: First check if this code has ERRORS before explaining it.
    
    If the code has errors (undefined variables, syntax errors, etc.):
    - DO NOT give a generic explanation
    - Identify the specific error
    - Explain what's wrong and how to fix it
    
    Code to analyze:
    \`\`\`${language}
    ${code}
    \`\`\`
    
    If the code has ERRORS (like undefined variables, missing quotes, etc.):
    1. Identify the error type (NameError, SyntaxError, etc.)
    2. Explain why the error occurs
    3. Provide a fix
    
    If the code is CORRECT:
    Explain it in a friendly, beginner-friendly way:
    1. What the code does
    2. Key concepts used
    3. Step-by-step breakdown
    4. Example use cases
    
    DO NOT say "This code demonstrates fundamental programming concepts" if there are errors.`;

    const completion = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: getSystemMessage()
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        timeout: 30000 // 30 second timeout
      });
    });

    setProviderHealth('openai', true);

    return {
      explanation: completion.choices[0].message.content,
      provider: 'openai',
      concepts: extractConcepts(code),
      examples: generateExamples(code)
    };
  } catch (error) {
    setProviderHealth('openai', false);
    const errorMsg = error.message || 'OpenAI request failed';
    console.error('OpenAI error:', errorMsg);
    throw new Error(`OpenAI: ${errorMsg}`);
  }
};

/**
 * Generate code explanation using Hugging Face (Free)
 */
export const explainCodeWithHuggingFace = async (code, language = 'python') => {
  try {
    // Skip if provider is known to be unhealthy
    if (!isProviderHealthy('huggingface')) {
      throw new Error('Hugging Face provider is currently unavailable');
    }

    // Using a better model for code explanation
    const model = 'microsoft/CodeGPT-small-py'; // Better for code
    
    const prompt = `Explain this ${language} code in simple terms:\n\n${code}\n\nExplanation:`;

    const response = await retryWithBackoff(async () => {
      return await axios.post(
        `https://router.huggingface.co/models/${model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            return_full_text: false
          }
        },
        {
          headers: {
            ...(huggingFaceApiKey && { 'Authorization': `Bearer ${huggingFaceApiKey}` }),
            'Content-Type': 'application/json'
          },
          timeout: 12000
        }
      );
    });

    // Hugging Face returns different formats, handle accordingly
    let explanation = '';
    if (Array.isArray(response.data) && response.data[0]?.generated_text) {
      explanation = response.data[0].generated_text;
    } else if (response.data?.generated_text) {
      explanation = response.data.generated_text;
    } else if (response.data?.[0]?.summary_text) {
      explanation = response.data[0].summary_text;
    } else {
      explanation = 'Explanation generated using Hugging Face AI.';
    }

    setProviderHealth('huggingface', true);

    return {
      explanation: explanation.trim() || `Code Explanation:\n\n${code}\n\nThis code demonstrates programming concepts.`,
      provider: 'huggingface',
      concepts: extractConcepts(code),
      examples: generateExamples(code)
    };
  } catch (error) {
    setProviderHealth('huggingface', false);
    const errorMsg = error.response?.data?.error || error.message || 'Hugging Face request failed';
    console.error('Hugging Face error:', errorMsg);
    
    // Hugging Face failed - check for errors first
    const errorAnalyzerModule3 = await import('./codeErrorAnalyzer.js');
    const codeAnalysisHuggingFace = errorAnalyzerModule3.analyzeCodeForIssues(code, language);
    
    if (codeAnalysisHuggingFace.issues.length > 0) {
      // Errors detected - provide error feedback
      const errorFeedback = errorAnalyzerModule3.generateFallbackFeedback(code, null, []);
      return {
        explanation: errorFeedback,
        provider: 'error-analyzer-fallback',
        concepts: [],
        examples: [],
        isErrorAnalysis: true
      };
    }
    
    // No errors - basic fallback
    return {
      explanation: `Code Explanation:\n\n${code}\n\nThis code appears to be correct. Run it to see the output!`,
      provider: 'huggingface-fallback',
      concepts: extractConcepts(code),
      examples: generateExamples(code)
    };
  }
};

/**
 * Extract concepts from code
 */
const extractConcepts = (code) => {
  const concepts = [];
  const codeLower = code.toLowerCase();

  if (codeLower.includes('list') || code.includes('[]') || codeLower.includes('append')) {
    concepts.push('Lists');
  }
  if (codeLower.includes('dict') || code.includes('{}') || codeLower.includes('keys')) {
    concepts.push('Dictionaries');
  }
  if (codeLower.includes('set') || (code.includes('{') && code.includes('}') && !codeLower.includes('dict'))) {
    concepts.push('Sets');
  }
  if (codeLower.includes('tuple') || code.includes('()')) {
    concepts.push('Tuples');
  }
  if (codeLower.includes('class')) {
    concepts.push('Object-Oriented Programming');
  }
  if (codeLower.includes('def') || codeLower.includes('lambda')) {
    concepts.push('Functions');
  }
  if (codeLower.includes('for') || codeLower.includes('while')) {
    concepts.push('Loops');
  }
  if (codeLower.includes('if') || codeLower.includes('else') || codeLower.includes('elif')) {
    concepts.push('Conditional Statements');
  }

  return concepts.length > 0 ? concepts : ['General Programming'];
};

/**
 * Generate examples based on code
 */
const generateExamples = (code) => {
  const examples = [];
  const codeLower = code.toLowerCase();

  if (codeLower.includes('list')) {
    examples.push('my_list = [1, 2, 3]\nmy_list.append(4)  # Adds 4 to the list');
  }
  if (codeLower.includes('dict')) {
    examples.push("my_dict = {'name': 'Alice', 'age': 30}\nprint(my_dict['name'])  # Outputs: Alice");
  }
  if (codeLower.includes('set')) {
    examples.push('my_set = {1, 2, 3}\nmy_set.add(4)  # Adds 4 to the set');
  }

  return examples.length > 0 ? examples : ['Run the code to see how it works!'];
};

/**
 * Answer a programming question (conceptual, not code explanation)
 * This is different from explainCode - it answers questions like "What is a variable?"
 */
export const answerQuestion = async (question, language = 'python', provider = 'auto', mode = 'default') => {
  // If specific provider requested, try only that (with fallback if it fails)
  if (provider !== 'auto') {
    const providers = {
      'mistral': answerQuestionWithMistral,
      'gemini': answerQuestionWithGemini,
      'openai': answerQuestionWithOpenAI,
      'huggingface': answerQuestionWithHuggingFace
    };

    const providerFn = providers[provider];
    if (!providerFn) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    try {
      return await providerFn(question, language, mode);
    } catch (error) {
      console.warn(`${provider} failed, falling back to auto mode:`, error.message);
      // Continue to auto mode below
    }
  }

  // Detect mode from question if not provided
  const detectedMode = mode === 'default' ? detectMode(question) : mode;

  // Auto mode: try providers in order of preference with intelligent fallback
  // Prioritize FREE TIER APIs first: HuggingFace (always free), then Gemini (free tier), then paid APIs
  // Skip Gemini if rate limited
  const geminiRateLimited = providerHealth.get('gemini-rate-limited');
  const skipGemini = geminiRateLimited && (Date.now() - geminiRateLimited.lastCheck < 10 * 60 * 1000);
  
  const providers = [
    { 
      name: 'huggingface', 
      fn: (q, l) => answerQuestionWithHuggingFace(q, l, detectedMode),
      available: true, // Always try HuggingFace first - free tier
      priority: 1
    },
    { 
      name: 'gemini', 
      fn: (q, l) => answerQuestionWithGemini(q, l, detectedMode),
      available: !!geminiApiKey && isProviderHealthy('gemini') && !skipGemini && canMakeGeminiRequest(),
      priority: 2 // Free tier available
    },
    { 
      name: 'mistral', 
      fn: (q, l) => answerQuestionWithMistral(q, l, detectedMode),
      available: !!mistralApiKey && isProviderHealthy('mistral'),
      priority: 3
    },
    { 
      name: 'openai', 
      fn: (q, l) => answerQuestionWithOpenAI(q, l, detectedMode),
      available: !!openaiApiKey && isProviderHealthy('openai'),
      priority: 4 // Paid API - lowest priority
    }
  ];
  
  // Log provider availability for debugging
  console.log(`📊 Provider availability check (FREE TIER PRIORITY):`);
  providers.forEach(p => {
    const hasKey = p.name === 'mistral' ? !!mistralApiKey : 
                  p.name === 'openai' ? !!openaiApiKey : 
                  p.name === 'gemini' ? !!geminiApiKey : 
                  p.name === 'huggingface' ? true : true;
    const isHealthy = p.name === 'huggingface' ? true : isProviderHealthy(p.name);
    const canUse = p.name === 'gemini' ? (!skipGemini && canMakeGeminiRequest()) : true;
    const tier = p.name === 'huggingface' || p.name === 'gemini' ? '🆓 FREE' : '💰 PAID';
    console.log(`  ${p.name} (${tier}): Key=${hasKey ? '✅' : '❌'}, Healthy=${isHealthy ? '✅' : '❌'}, CanUse=${canUse ? '✅' : '❌'}, Available=${p.available ? '✅' : '❌'}, Priority=${p.priority || 'N/A'}`);
  });

  // Filter to only available providers and sort by priority (free tier first)
  const availableProviders = providers
    .filter(p => p.available)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99)); // Sort by priority, lower number = higher priority

  if (availableProviders.length === 0) {
    console.warn('All AI providers unavailable, using basic fallback');
    return {
      explanation: `I'm here to help you learn programming! However, AI providers are currently unavailable. Please try again later.\n\nYour question: ${question}`,
      provider: 'fallback',
      concepts: [],
      examples: [],
      warning: 'AI providers are currently unavailable. This is a basic response.'
    };
  }

  // Race all available providers - use the fastest response
  // Set timeout to 12 seconds (12000ms) - allow more time for AI providers to respond
  const TIMEOUT_MS = 12000;
  console.log(`🚀 Racing ${availableProviders.length} providers for fastest response (timeout: ${TIMEOUT_MS}ms)...`);
  
  const providerPromises = availableProviders.map(provider => {
    const startTime = Date.now();
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout: Response took longer than ${TIMEOUT_MS}ms`));
      }, TIMEOUT_MS);
    });
    
    // Race the provider call against the timeout
    return Promise.race([
      provider.fn(question, language),
      timeoutPromise
    ])
      .then(result => {
        const responseTime = Date.now() - startTime;
        console.log(`✅ ${provider.name} succeeded in ${responseTime}ms`);
        setProviderHealth(provider.name, true);
        return { result, provider: provider.name, responseTime, success: true };
      })
      .catch(error => {
        const responseTime = Date.now() - startTime;
        const errorMsg = error.message || 'Unknown error';
        if (errorMsg.includes('Timeout')) {
          console.warn(`⏱️ ${provider.name} timed out after ${responseTime}ms`);
        } else {
          console.warn(`❌ ${provider.name} failed in ${responseTime}ms:`, errorMsg);
        }
        setProviderHealth(provider.name, false);
        return { error: errorMsg, provider: provider.name, responseTime, success: false };
      });
  });

  // Wait for the first successful response or timeout
  const results = await Promise.allSettled(providerPromises);
  
  // Find the fastest successful response
  const successfulResults = results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value)
    .sort((a, b) => a.responseTime - b.responseTime);

  if (successfulResults.length > 0) {
    const fastest = successfulResults[0];
    console.log(`🏆 Fastest response from ${fastest.provider} in ${fastest.responseTime}ms`);
    return fastest.result;
  }

  // If no provider succeeded, collect all errors
  const errors = results
    .filter(r => r.status === 'fulfilled' && !r.value.success)
    .map(r => ({ provider: r.value.provider, error: r.value.error }));

  // All providers failed, return fallback
  console.error('All AI providers failed:', errors);
  return {
    explanation: `I'm here to help you learn programming! However, AI providers are currently experiencing issues. Please try again later.\n\nYour question: ${question}`,
    provider: 'fallback',
    concepts: [],
    examples: [],
    warning: 'All AI providers failed. Using basic fallback response.',
    errors: errors.map(e => `${e.provider}: ${e.error}`)
  };
};

/**
 * Answer question using Mistral AI
 */
const answerQuestionWithMistral = async (question, language = 'python', mode = 'default') => {
  try {
    if (!mistralApiKey) {
      throw new Error('Mistral API key not configured');
    }

    if (!isProviderHealthy('mistral')) {
      throw new Error('Mistral provider is currently unavailable');
    }

    // Detect mode if not provided
    const detectedMode = mode === 'default' ? detectMode(question) : mode;

    const userPrompt = `You are CodeTutor-AI. Answer this programming question in SIMPLE TERMS with EXAMPLES, following the dataset format.

REQUIREMENTS (like the training dataset):
1. Use simple, beginner-friendly language (like explaining to a child)
2. Use real-life analogies when possible
3. Provide clear code examples
4. Be encouraging and educational
5. Format: Simple explanation → Example → Why it matters

EXAMPLE FORMAT (from dataset):
- "A variable is like a labeled box where you store something. In Python: x = 5 means you put 5 into box x."
- "A loop is like checking each item on your grocery list one by one. Code repeats until done."

The user's question: "${question}"

Answer in the same simple, example-based style as the training dataset.`;

    // Enhance prompt with few-shot examples if available
    let enhancedPrompt = userPrompt;
    if (getFewShotPrompt) {
      const fewShotExamples = getFewShotPrompt();
      // Extract concise examples for Mistral
      const conciseExamples = fewShotExamples.split('Example ').slice(1, 6).join('Example ');
      enhancedPrompt = `Here are examples of beginner-friendly programming answers from the training dataset:\n\n${conciseExamples}\n\nNow answer this question in the same simple, example-based style:\n\n${userPrompt}`;
    }

    const response = await retryWithBackoff(async () => {
      return await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-medium-latest',
          messages: [
            {
              role: 'system',
              content: getSystemMessage(detectedMode)
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${mistralApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );
    });

    setProviderHealth('mistral', true);
    
    return {
      explanation: response.data.choices[0].message.content,
      provider: 'mistral',
      concepts: [],
      examples: []
    };
  } catch (error) {
    setProviderHealth('mistral', false);
    const errorMsg = error.response?.data?.message || error.message || 'Mistral AI request failed';
    console.error('Mistral AI error:', errorMsg);
    throw new Error(`Mistral AI: ${errorMsg}`);
  }
};

/**
 * Answer question using Google Gemini
 */
const answerQuestionWithGemini = async (question, language = 'python', mode = 'default') => {
  try {
    if (!genAI || !geminiApiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    // Check rate limiting first
    if (!canMakeGeminiRequest()) {
      throw new Error('Gemini rate limit: Too many requests. Please wait a moment.');
    }

    // Check if rate limited (from previous errors)
    const rateLimited = providerHealth.get('gemini-rate-limited');
    if (rateLimited && Date.now() - rateLimited.lastCheck < 10 * 60 * 1000) {
      throw new Error('Gemini is currently rate limited. Please use Mistral.');
    }

    if (!isProviderHealthy('gemini')) {
      throw new Error('Gemini provider is currently unavailable');
    }

    // Detect mode if not provided
    const detectedMode = mode === 'default' ? detectMode(question) : mode;

    const userPrompt = `IMPORTANT: This is a PROGRAMMING QUESTION about an ERROR in code.

The user is asking about an error they got. Explain in SIMPLE TERMS with EXAMPLES.

REQUIREMENTS:
1. Use simple, beginner-friendly language
2. Explain what went wrong in plain English
3. Explain why it happened (the root cause)
4. Show HOW to fix it with a clear example
5. Provide a corrected code example

FORMAT:
- Use clear sections with headers
- Include code examples
- Be encouraging and educational
- Avoid technical jargon unless necessary

The user's question: "${question}"

Answer directly and helpfully.`;

    // Enhance prompt with few-shot examples if available
    let enhancedPrompt = userPrompt;
    if (getFewShotPrompt) {
      const fewShotExamples = getFewShotPrompt();
      enhancedPrompt = `${fewShotExamples}\n\nNow answer this question:\n\n${userPrompt}`;
    }

    // Record request before making it (rate limiting)
    recordGeminiRequest();

    const result = await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-pro', // Updated to latest model name
        systemInstruction: getSystemMessage(detectedMode)
      });
      return await model.generateContent(enhancedPrompt);
    });

    const response = await result.response;
    const text = response.text();

    setProviderHealth('gemini', true);

    return {
      explanation: text,
      provider: 'gemini',
      concepts: [],
      examples: []
    };
  } catch (error) {
    setProviderHealth('gemini', false);
    const errorMsg = error.message || 'Gemini request failed';
    console.error('Gemini error:', errorMsg);
    throw new Error(`Gemini: ${errorMsg}`);
  }
};

/**
 * Answer question using OpenAI
 */
const answerQuestionWithOpenAI = async (question, language = 'python') => {
  try {
    if (!openai || !openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!isProviderHealthy('openai')) {
      throw new Error('OpenAI provider is currently unavailable');
    }

    const userPrompt = `IMPORTANT: This is a PROGRAMMING QUESTION about an ERROR in code.

The user is asking about an error they got. Explain in SIMPLE TERMS with EXAMPLES.

REQUIREMENTS:
1. Use simple, beginner-friendly language
2. Explain what went wrong in plain English
3. Explain why it happened (the root cause)
4. Show HOW to fix it with a clear example
5. Provide a corrected code example

FORMAT:
- Use clear sections with headers
- Include code examples
- Be encouraging and educational
- Avoid technical jargon unless necessary

The user's question: "${question}"

Answer directly and helpfully.`;

    const completion = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: getSystemMessage()
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        timeout: 30000
      });
    });

    setProviderHealth('openai', true);

    return {
      explanation: completion.choices[0].message.content,
      provider: 'openai',
      concepts: [],
      examples: []
    };
  } catch (error) {
    setProviderHealth('openai', false);
    const errorMsg = error.message || 'OpenAI request failed';
    console.error('OpenAI error:', errorMsg);
    throw new Error(`OpenAI: ${errorMsg}`);
  }
};

/**
 * Answer question using Hugging Face
 */
const answerQuestionWithHuggingFace = async (question, language = 'python') => {
  try {
    if (!isProviderHealthy('huggingface')) {
      throw new Error('Hugging Face provider is currently unavailable');
    }

    // Use a better model for Q&A - try a conversational model
    const model = 'microsoft/DialoGPT-large';
    const prompt = `IMPORTANT: This is a PROGRAMMING QUESTION, NOT CODE TO EXPLAIN.

The user is asking: "${question}"

This is a conceptual question about programming. Answer it directly as a teacher would explain a concept to a student.

DO NOT say things like "this isn't actual code" or treat the question text as code.
DO answer the question directly. For example, if asked "What is a variable?", start with "A variable is..." not "The line 'What is a variable?' isn't code...".

Answer:`;

    const response = await retryWithBackoff(async () => {
      return await axios.post(
        `https://router.huggingface.co/models/${model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            return_full_text: false
          }
        },
        {
          headers: {
            ...(huggingFaceApiKey && { 'Authorization': `Bearer ${huggingFaceApiKey}` }),
            'Content-Type': 'application/json'
          },
          timeout: 12000
        }
      );
    });

    let explanation = '';
    if (Array.isArray(response.data) && response.data[0]?.generated_text) {
      explanation = response.data[0].generated_text;
    } else if (response.data?.generated_text) {
      explanation = response.data.generated_text;
    } else if (typeof response.data === 'string') {
      explanation = response.data;
    } else {
      // Fallback: provide a helpful response based on common questions
      if (question.toLowerCase().includes('variable')) {
        explanation = `A variable is a named storage location in memory that holds a value. Think of it like a labeled box where you can store data. In ${language}, you create variables like this:\n\n\`\`\`${language}\nname = "John"  # A string variable\nage = 25      # An integer variable\n\`\`\`\n\nVariables allow you to store and reuse data throughout your program.`;
      } else {
        explanation = `I'm here to help you learn programming! Your question: "${question}"\n\nThis is a great programming question. I'm designed to help you understand programming concepts, explain code, debug errors, and answer questions about software development.`;
      }
    }

    setProviderHealth('huggingface', true);

    return {
      explanation: explanation.trim() || `I'm here to help you learn programming! Your question: ${question}`,
      provider: 'huggingface',
      concepts: [],
      examples: []
    };
  } catch (error) {
    setProviderHealth('huggingface', false);
    const errorMsg = error.response?.data?.error || error.message || 'Hugging Face request failed';
    console.error('Hugging Face error:', errorMsg);
    
    // Return a more helpful fallback response based on the question
    let fallbackAnswer = `I'm here to help you learn programming! Your question: "${question}"\n\n`;
    
    // Provide basic answers for common questions using dataset format (simple, with examples)
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('variable')) {
      fallbackAnswer += `A variable is like a labeled box where you store something. In ${language}: x = 5 means you put 5 into box x.`;
    } else if (questionLower.includes('loop')) {
      fallbackAnswer += `A loop is like checking each item on your grocery list one by one. Code repeats until done. Example: for item in [1,2,3]: print(item)`;
    } else if (questionLower.includes('function')) {
      fallbackAnswer += `A function is like a vending machine: you give input, it performs work, you get output. Example: def greet(name): return f"Hello {name}"`;
    } else if (questionLower.includes('object') && questionLower.includes('orient')) {
      fallbackAnswer += `Object-Oriented Programming (OOP) is like a blueprint for building houses. A class is the blueprint, objects are the actual houses. Example:\n\n\`\`\`python\nclass Car:\n    def __init__(self, color):\n        self.color = color\n\nmy_car = Car("red")  # Creates a car object\n\`\`\`\n\nThis creates a Car class (blueprint) and my_car object (actual house).`;
    } else if (questionLower.includes('array') || questionLower.includes('list')) {
      fallbackAnswer += `An array/list is like a row of lockers—each has a fixed position and holds one item. In Python: my_list = [1, 2, 3] creates a list with three numbers.`;
    } else if (questionLower.includes('recursion')) {
      fallbackAnswer += `Recursion is like Russian dolls - a function that calls itself. It breaks big problems into smaller identical problems. Example: def factorial(n): return n * factorial(n-1) if n > 1 else 1`;
    } else if (questionLower.includes('data structure')) {
      fallbackAnswer += `Data structures are like different containers. Lists are like shopping carts, dictionaries are like phone books with names and numbers.`;
    } else {
      fallbackAnswer += `This is a great programming question! Let me explain in simple terms with examples.`;
    }
    
    return {
      explanation: fallbackAnswer,
      provider: 'huggingface-fallback',
      concepts: [],
      examples: []
    };
  }
};

/**
 * Get AI explanation with intelligent fallback across all providers
 * Priority: Mistral -> Gemini -> OpenAI -> HuggingFace -> Fallback
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Health checking to skip known-bad providers
 * - Graceful degradation
 * - Detailed error logging
 */
export const explainCode = async (code, language = 'python', provider = 'auto', mode = 'default') => {
  // FIRST: Check for code errors before explaining
  // If errors are detected, provide error feedback instead of explanation
  const errorAnalyzer = await import('./codeErrorAnalyzer.js');
  const codeAnalysisForExplain = errorAnalyzer.analyzeCodeForIssues(code, language);
  
  if (codeAnalysisForExplain.issues.length > 0) {
    console.log('⚠️ Errors detected in code - providing error feedback instead of explanation');
    console.log('Detected issues:', codeAnalysisForExplain.issues.map(i => i.message || i));
    
    // Use error feedback instead of explanation
    try {
      // Use generateCodeFeedback which is designed for error detection
      const errorFeedback = await generateCodeFeedback(code, null, null, provider);
      return {
        explanation: errorFeedback,
        provider: 'code-error-analyzer',
        concepts: [],
        examples: [],
        isErrorAnalysis: true,
        detectedIssues: codeAnalysisForExplain.issues
      };
    } catch (errorFeedbackError) {
      // If error feedback fails, use fallback
      const fallbackFeedback = errorAnalyzer.generateFallbackFeedback(code, null, []);
      return {
        explanation: fallbackFeedback,
        provider: 'pattern-analysis',
        concepts: [],
        examples: [],
        isErrorAnalysis: true,
        detectedIssues: codeAnalysisForExplain.issues
      };
    }
  }
  
  // If no errors detected, proceed with normal explanation
  // If specific provider requested, try only that (with fallback if it fails)
  if (provider !== 'auto') {
    const providers = {
      'mistral': explainCodeWithMistral,
      'gemini': explainCodeWithGemini,
      'openai': explainCodeWithOpenAI,
      'huggingface': explainCodeWithHuggingFace
    };

    const providerFn = providers[provider];
    if (!providerFn) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    try {
      return await providerFn(code, language);
    } catch (error) {
      // If specific provider fails, fall back to auto mode
      console.warn(`${provider} failed, falling back to auto mode:`, error.message);
      // Continue to auto mode below
    }
  }

  // Auto mode: try providers in order of preference with intelligent fallback
  // Prioritize Mistral first, skip Gemini if rate limited
  const geminiRateLimited = providerHealth.get('gemini-rate-limited');
  const skipGemini = geminiRateLimited && (Date.now() - geminiRateLimited.lastCheck < 10 * 60 * 1000);
  
  // Prioritize FREE TIER APIs first: HuggingFace (always free), then Gemini (free tier), then paid APIs
  const providers = [
    { 
      name: 'huggingface', 
      fn: explainCodeWithHuggingFace,
      available: true, // Always try HuggingFace first - it's free and has fallback
      priority: 1 // Highest priority - free tier
    },
    { 
      name: 'gemini', 
      fn: explainCodeWithGemini,
      available: !!geminiApiKey && isProviderHealthy('gemini') && !skipGemini && canMakeGeminiRequest(),
      priority: 2 // Second priority - free tier available
    },
    { 
      name: 'mistral', 
      fn: explainCodeWithMistral,
      available: !!mistralApiKey && isProviderHealthy('mistral'),
      priority: 3 // Third priority - may have free tier
    },
    { 
      name: 'openai', 
      fn: explainCodeWithOpenAI,
      available: !!openaiApiKey && isProviderHealthy('openai'),
      priority: 4 // Last priority - paid API
    }
  ];

  // Filter to only available providers
  const availableProviders = providers.filter(p => p.available);

  if (availableProviders.length === 0) {
    // All providers unavailable, use error analyzer fallback instead of generic message
    console.warn('All AI providers unavailable, using error analyzer fallback');
    
    // Check for errors using the error analyzer
    const errorAnalyzerModule = await import('./codeErrorAnalyzer.js');
    const codeAnalysisFallback = errorAnalyzerModule.analyzeCodeForIssues(code, language);
    
    if (codeAnalysis.issues.length > 0) {
      // Errors detected - provide error feedback
      const errorFeedback = generateFallbackFeedback(code, null, []);
      return {
        explanation: errorFeedback,
        provider: 'error-analyzer-fallback',
        concepts: [],
        examples: [],
        isErrorAnalysis: true,
        warning: 'AI providers unavailable. This is an automated error analysis.'
      };
    }
    
    // No errors - basic explanation
    return {
      explanation: `Code Explanation:\n\n${code}\n\nThis code appears to be correct. Run it to see the output!`,
      provider: 'fallback',
      concepts: extractConcepts(code),
      examples: generateExamples(code),
      warning: 'AI providers are currently unavailable. This is a basic explanation.'
    };
  }

  // Race all available providers - use the fastest response
  // Set timeout to 12 seconds (12000ms) - allow more time for AI providers to respond
  const TIMEOUT_MS = 12000;
  console.log(`🚀 Racing ${availableProviders.length} providers for fastest response (timeout: ${TIMEOUT_MS}ms)...`);
  
  const providerPromises = availableProviders.map(provider => {
    const startTime = Date.now();
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout: Response took longer than ${TIMEOUT_MS}ms`));
      }, TIMEOUT_MS);
    });
    
    // Race the provider call against the timeout
    return Promise.race([
      provider.fn(code, language),
      timeoutPromise
    ])
      .then(result => {
        const responseTime = Date.now() - startTime;
        console.log(`✅ ${provider.name} succeeded in ${responseTime}ms`);
        setProviderHealth(provider.name, true);
        return { result, provider: provider.name, responseTime, success: true };
      })
      .catch(error => {
        const responseTime = Date.now() - startTime;
        const errorMsg = error.message || 'Unknown error';
        if (errorMsg.includes('Timeout')) {
          console.warn(`⏱️ ${provider.name} timed out after ${responseTime}ms`);
        } else {
          console.warn(`❌ ${provider.name} failed in ${responseTime}ms:`, errorMsg);
        }
        setProviderHealth(provider.name, false);
        return { error: errorMsg, provider: provider.name, responseTime, success: false };
      });
  });

  // Wait for the first successful response or timeout
  const results = await Promise.allSettled(providerPromises);
  
  // Find the fastest successful response
  const successfulResults = results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value)
    .sort((a, b) => a.responseTime - b.responseTime);

  if (successfulResults.length > 0) {
    const fastest = successfulResults[0];
    console.log(`🏆 Fastest response from ${fastest.provider} in ${fastest.responseTime}ms`);
    return fastest.result;
  }

  // If no provider succeeded, collect all errors
  const errors = results
    .filter(r => r.status === 'fulfilled' && !r.value.success)
    .map(r => ({ provider: r.value.provider, error: r.value.error }));

  // All providers failed, use error analyzer instead of generic message
  console.error('All AI providers failed:', errors);
  
  // Check for errors using the error analyzer
  const errorAnalyzerModule2 = await import('./codeErrorAnalyzer.js');
  const codeAnalysisFailed = errorAnalyzerModule2.analyzeCodeForIssues(code, language);
  
  if (codeAnalysisFailed.issues.length > 0) {
    // Errors detected - provide error feedback
    const errorFeedback = errorAnalyzerModule2.generateFallbackFeedback(code, null, errors);
    return {
      explanation: errorFeedback,
      provider: 'error-analyzer-fallback',
      concepts: [],
      examples: [],
      isErrorAnalysis: true,
      warning: 'All AI providers failed. This is an automated error analysis.',
      errors: errors.map(e => `${e.provider}: ${e.error}`)
    };
  }
  
  // No errors - basic explanation
  return {
    explanation: `Code Explanation:\n\n${code}\n\nThis code appears to be correct. Run it to see the output!\n\nNote: AI providers are currently experiencing issues.`,
    provider: 'fallback',
    concepts: extractConcepts(code),
    examples: generateExamples(code),
    warning: 'All AI providers failed. Using basic fallback explanation.',
    errors: errors.map(e => `${e.provider}: ${e.error}`)
  };
};

/**
 * Generate AI-powered course content (with fallback)
 */
export const generateCourseContent = async (topic, difficulty = 'beginner', provider = 'auto') => {
  const prompt = `Create a comprehensive course outline for learning "${topic}" at ${difficulty} level.
    Include:
    1. Course title and description
    2. Learning objectives
    3. List of lessons with titles and brief descriptions
    4. Key concepts to cover
    5. Practical exercises
    
    Format the response as JSON with the following structure:
    {
      "title": "Course Title",
      "description": "Course description",
      "objectives": ["objective1", "objective2"],
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson description",
          "order": 1,
          "concepts": ["concept1", "concept2"]
        }
      ]
    }`;

  const providers = [
    { name: 'mistral', fn: () => generateWithMistral(prompt), available: !!mistralApiKey },
    { name: 'gemini', fn: () => generateWithGemini(prompt), available: !!geminiApiKey },
    { name: 'openai', fn: () => generateWithOpenAI(prompt), available: !!openaiApiKey }
  ];

  const availableProviders = providers.filter(p => p.available);

  for (const provider of availableProviders) {
    try {
      const result = await provider.fn();
      return JSON.parse(result);
    } catch (error) {
      console.error(`${provider.name} course generation failed:`, error.message);
      continue;
    }
  }

  throw new Error('All AI providers failed for course generation');
};

const generateWithMistral = async (prompt) => {
  const response = await retryWithBackoff(async () => {
    return await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-medium-latest',
        messages: [
          { role: 'system', content: getSystemMessage() },
          { role: 'user', content: `As CodeTutor-AI, ${prompt}` }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
  });
  return response.data.choices[0].message.content;
};

const generateWithGemini = async (prompt) => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    systemInstruction: getSystemMessage()
  });
  const result = await retryWithBackoff(async () => {
    return await model.generateContent(`As CodeTutor-AI, ${prompt}`);
  });
  return result.response.text();
};

const generateWithOpenAI = async (prompt) => {
  if (!openai) throw new Error('OpenAI not available');
  const completion = await retryWithBackoff(async () => {
    return await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: getSystemMessage() },
        { role: 'user', content: `As CodeTutor-AI, ${prompt}` }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
      timeout: 30000
    });
  });
  return completion.choices[0].message.content;
};

// Fallback code feedback when all providers fail - now uses codeErrorAnalyzer service
const generateFallbackCodeFeedback = (code, error, errors = []) => {
  // Use the centralized error analyzer service
  return generateFallbackFeedback(code, error, errors);
};

/**
 * Generate AI feedback on code (with fallback)
 */
export const generateCodeFeedback = async (code, output, error = null, provider = 'auto') => {
  // This prompt is specifically for CODE ERROR DETECTION and SUGGESTIONS
  // The AI should analyze the code to detect errors like undefined variables, type errors, etc.
  // and provide specific suggestions - NOT treat code as a question
  
  // Validate API keys are configured
  const apiKeyStatus = {
    huggingface: true, // Always available (free, no key required)
    gemini: !!(geminiApiKey && geminiApiKey.trim().length > 0),
    mistral: !!(mistralApiKey && mistralApiKey.trim().length > 0),
    openai: !!(openaiApiKey && openaiApiKey.trim().length > 0)
  };
  
  // Log API key status for debugging
  console.log('🔑 API Key Status for Code Feedback:', {
    gemini: apiKeyStatus.gemini ? '✅ Configured' : '❌ Not configured',
    mistral: apiKeyStatus.mistral ? '✅ Configured' : '❌ Not configured',
    openai: apiKeyStatus.openai ? '✅ Configured' : '❌ Not configured',
    huggingface: '✅ Available (free tier)'
  });
  
  // Detect common code issues even without explicit error
  let detectedIssues = [];
  const codeAnalysis = analyzeCodeForIssues(code);
  if (codeAnalysis.issues.length > 0 && !error) {
    detectedIssues = codeAnalysis.issues;
    console.log('🔍 Detected code issues:', detectedIssues.map(i => i.message || i));
  }
  
  // Log what we're analyzing
  if (error) {
    console.log('📝 Analyzing code with error:', {
      errorType: error.split(':')[0],
      codeLength: code.length,
      hasOutput: !!output
    });
  } else {
    console.log('📝 Analyzing code without explicit error (will detect issues):', {
      codeLength: code.length,
      detectedIssues: detectedIssues.length,
      hasOutput: !!output
    });
  }
  
  // Use the centralized error analyzer service to build the prompt
  const prompt = buildErrorAnalysisPrompt(code, output, error, detectedIssues.map(i => i.message || i));

  // Use robust multi-provider fallback system with racing
  // Check Gemini rate limiting
  const geminiRateLimited = providerHealth.get('gemini-rate-limited');
  const skipGemini = geminiRateLimited && (Date.now() - geminiRateLimited.lastCheck < 10 * 60 * 1000);
  
  // Prioritize FREE TIER APIs first: HuggingFace (always free), then Gemini (free tier), then paid APIs
  const providers = [
    { 
      name: 'huggingface', 
      fn: () => getFeedbackFromHuggingFace(prompt), 
      available: true, // Always try HuggingFace first - free tier
      priority: 1
    },
    { 
      name: 'gemini', 
      fn: () => getFeedbackFromGemini(prompt), 
      available: !!geminiApiKey && isProviderHealthy('gemini') && !skipGemini && canMakeGeminiRequest(),
      priority: 2 // Free tier available
    },
    { 
      name: 'mistral', 
      fn: () => getFeedbackFromMistral(prompt), 
      available: !!mistralApiKey && isProviderHealthy('mistral'),
      priority: 3
    },
    { 
      name: 'openai', 
      fn: () => getFeedbackFromOpenAI(prompt), 
      available: !!openaiApiKey && isProviderHealthy('openai'),
      priority: 4 // Paid API - lowest priority
    }
  ];

  // Filter to only available providers and sort by priority (free tier first)
  const availableProviders = providers
    .filter(p => p.available)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99)); // Sort by priority, lower number = higher priority
  
  // Log provider availability for debugging
  console.log(`📊 Code Feedback Provider availability (FREE TIER PRIORITY):`);
  providers.forEach(p => {
    const hasKey = p.name === 'mistral' ? !!mistralApiKey : 
                  p.name === 'openai' ? !!openaiApiKey : 
                  p.name === 'gemini' ? !!geminiApiKey : 
                  p.name === 'huggingface' ? true : true;
    const isHealthy = p.name === 'huggingface' ? true : isProviderHealthy(p.name);
    const canUse = p.name === 'gemini' ? (!skipGemini && canMakeGeminiRequest()) : true;
    const tier = p.name === 'huggingface' || p.name === 'gemini' ? '🆓 FREE' : '💰 PAID';
    console.log(`  ${p.name} (${tier}): Key=${hasKey ? '✅' : '❌'}, Healthy=${isHealthy ? '✅' : '❌'}, CanUse=${canUse ? '✅' : '❌'}, Available=${p.available ? '✅' : '❌'}, Priority=${p.priority || 'N/A'}`);
  });

  if (availableProviders.length === 0) {
    // All providers unavailable, return helpful fallback
    console.warn('⚠️ All AI providers unavailable for code feedback, using fallback');
    return generateFallbackCodeFeedback(code, error);
  }

  // Race all available providers - use the fastest successful response
  const TIMEOUT_MS = 15000; // 15 seconds for code feedback
  console.log(`🚀 Racing ${availableProviders.length} providers for code feedback (timeout: ${TIMEOUT_MS}ms)...`);
  
  const providerPromises = availableProviders.map(async (provider) => {
    const startTime = Date.now();
    try {
      const feedback = await Promise.race([
        provider.fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Provider timeout')), TIMEOUT_MS)
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      setProviderHealth(provider.name, true);
      
      return {
        success: true,
        feedback: feedback,
        provider: provider.name,
        responseTime: responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setProviderHealth(provider.name, false);
      console.error(`❌ ${provider.name} code feedback failed:`, error.message);
      
      return {
        success: false,
        provider: provider.name,
        error: error.message,
        responseTime: responseTime
      };
    }
  });

  const results = await Promise.allSettled(providerPromises);
  
  // Get successful results, sorted by response time
  const successfulResults = results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value)
    .sort((a, b) => a.responseTime - b.responseTime);

  if (successfulResults.length > 0) {
    const fastest = successfulResults[0];
    console.log(`🏆 Fastest code feedback from ${fastest.provider} in ${fastest.responseTime}ms`);
    return fastest.feedback;
  }

  // All providers failed, return fallback
  const errors = results
    .filter(r => r.status === 'fulfilled' && !r.value.success)
    .map(r => ({ provider: r.value.provider, error: r.value.error }));
  
  console.error('❌ All AI providers failed for code feedback:', errors);
  return generateFallbackCodeFeedback(code, error, errors);
};

const getFeedbackFromMistral = async (prompt) => {
  if (!mistralApiKey) {
    throw new Error('Mistral API key not configured');
  }
  
  if (!isProviderHealthy('mistral')) {
    throw new Error('Mistral provider is currently unhealthy');
  }
  
  const response = await retryWithBackoff(async () => {
    return await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-medium-latest',
        messages: [
          { role: 'system', content: getSystemMessage() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
  });
  
  setProviderHealth('mistral', true);
  return response.data.choices[0].message.content;
};

const getFeedbackFromGemini = async (prompt) => {
  if (!genAI || !geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  if (!isProviderHealthy('gemini')) {
    throw new Error('Gemini provider is currently unhealthy');
  }
  
  if (!canMakeGeminiRequest()) {
    throw new Error('Gemini rate limit: Too many requests');
  }
  
  recordGeminiRequest();
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    systemInstruction: getSystemMessage()
  });
  
  const result = await retryWithBackoff(async () => {
    return await model.generateContent(prompt);
  });
  
  setProviderHealth('gemini', true);
  return result.response.text();
};

const getFeedbackFromHuggingFace = async (prompt) => {
  // HuggingFace is free tier - use it for code feedback
  try {
    if (!isProviderHealthy('huggingface')) {
      throw new Error('Hugging Face provider is currently unavailable');
    }

    // Use a model suitable for code analysis/feedback
    const model = 'microsoft/CodeGPT-small-py';
    
    const response = await retryWithBackoff(async () => {
      return await axios.post(
        `https://router.huggingface.co/models/${model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.7,
            return_full_text: false
          }
        },
        {
          headers: {
            ...(huggingFaceApiKey && { 'Authorization': `Bearer ${huggingFaceApiKey}` }),
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
    });

    let feedback = '';
    if (Array.isArray(response.data) && response.data[0]?.generated_text) {
      feedback = response.data[0].generated_text;
    } else if (response.data?.generated_text) {
      feedback = response.data.generated_text;
    } else {
      feedback = 'Code feedback generated using Hugging Face AI.';
    }

    setProviderHealth('huggingface', true);
    return feedback.trim();
  } catch (error) {
    setProviderHealth('huggingface', false);
    throw new Error(`HuggingFace: ${error.message || 'Request failed'}`);
  }
};

const getFeedbackFromOpenAI = async (prompt) => {
  if (!openai || !openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  if (!isProviderHealthy('openai')) {
    throw new Error('OpenAI provider is currently unhealthy');
  }
  
  const completion = await retryWithBackoff(async () => {
    return await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: getSystemMessage() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      timeout: 30000
    });
  });
  
  setProviderHealth('openai', true);
  return completion.choices[0].message.content;
};

/**
 * Get available AI providers with health status
 */
export const getAvailableProviders = () => {
  const providers = [];
  
  if (mistralApiKey) {
    providers.push({ 
      name: 'mistral', 
      available: true,
      healthy: isProviderHealthy('mistral')
    });
  }
  if (geminiApiKey) {
    providers.push({ 
      name: 'gemini', 
      available: true,
      healthy: isProviderHealthy('gemini')
    });
  }
  if (openaiApiKey) {
    providers.push({ 
      name: 'openai', 
      available: true,
      healthy: isProviderHealthy('openai')
    });
  }
  if (huggingFaceApiKey) {
    providers.push({ 
      name: 'huggingface', 
      available: true,
      healthy: isProviderHealthy('huggingface')
    });
  }
  
  return providers;
};

/**
 * Reset provider health (for testing or manual recovery)
 */
export const resetProviderHealth = (providerName = null) => {
  if (providerName) {
    providerHealth.delete(providerName);
    console.log(`🔄 Health status reset for ${providerName}`);
  } else {
    providerHealth.clear();
    console.log('🔄 All provider health statuses reset');
  }
};

// Reset all provider health on module load - give fresh start
resetAllProviderHealth();

/**
 * Detect if input is a question (not code)
 */
export const isQuestion = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const trimmed = input.trim();
  
  // If it's very short and doesn't look like code, it's likely a question
  if (trimmed.length < 50 && !trimmed.includes('\n') && !trimmed.includes(';') && !trimmed.includes('{')) {
    return true;
  }
  
  // Check for question patterns
  const questionPatterns = [
    /^what\s+(is|are|does|do|can|could|should|would)/i,
    /^how\s+(do|does|can|could|should|would|to)/i,
    /^why\s+(do|does|is|are|can|could|should)/i,
    /^when\s+(do|does|is|are|can|could|should)/i,
    /^where\s+(do|does|is|are|can|could|should)/i,
    /^explain\s+/i,
    /^tell\s+me\s+/i,
    /^can\s+you\s+explain/i,
    /^could\s+you\s+explain/i,
    /\?$/  // Ends with question mark
  ];
  
  // Check if it matches question patterns
  if (questionPatterns.some(pattern => pattern.test(trimmed))) {
    return true;
  }
  
  // Check if it looks like code (has code-like structures)
  const codePatterns = [
    /^\s*(def|function|class|import|const|let|var|public|private|static)/i,
    /[{}();=]/,
    /\n.*[{}();=]/
  ];
  
  // If it has code patterns, it's likely code
  if (codePatterns.some(pattern => pattern.test(trimmed))) {
    return false;
  }
  
  // Default: if it's short and doesn't have code patterns, treat as question
  return trimmed.length < 200;
};
