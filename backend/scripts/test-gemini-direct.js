#!/usr/bin/env node

/**
 * Direct Gemini Test
 * Tests Gemini API directly with few-shot learning
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGemini() {
  log('\n🧪 Direct Gemini Test with Few-Shot Learning\n', 'blue');
  log('='.repeat(60), 'cyan');
  
  const geminiApiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!geminiApiKey) {
    log('❌ GOOGLE_AI_API_KEY not set', 'red');
    process.exit(1);
  }
  
  log('✅ API key found', 'green');
  
  // Load few-shot prompt
  let fewShotPrompt = '';
  try {
    const fewShotModule = await import('../config/gemini-fewshot-prompt.js');
    fewShotPrompt = fewShotModule.getFewShotPrompt();
    log('✅ Few-shot prompt loaded', 'green');
    log(`   Length: ${fewShotPrompt.length} characters`, 'cyan');
  } catch (error) {
    log('⚠️  Few-shot prompt not found, using system prompt only', 'yellow');
  }
  
  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    systemInstruction: 'You are CodeTutorAI, a programming instructor. Provide beginner-friendly explanations with analogies.'
  });
  
  // Test question
  const question = "Explain variables in Python.";
  
  log(`\n📝 Testing question: "${question}"\n`, 'blue');
  
  // Build prompt
  let prompt = question;
  if (fewShotPrompt) {
    prompt = `${fewShotPrompt}\n\nNow answer this question:\n\n${question}`;
    log('✅ Using few-shot learning', 'green');
  } else {
    log('⚠️  Using system prompt only', 'yellow');
  }
  
  try {
    log('🔄 Calling Gemini API...\n', 'cyan');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    log('✅ Response received!\n', 'green');
    log('📄 Response:', 'blue');
    log('='.repeat(60), 'cyan');
    console.log(text);
    log('='.repeat(60), 'cyan');
    
    // Analyze response
    log('\n📊 Analysis:', 'blue');
    const hasAnalogy = text.toLowerCase().includes('like') || text.toLowerCase().includes('analogy');
    const isConcise = text.length < 500;
    const isFriendly = text.toLowerCase().includes('friendly') || !text.toLowerCase().includes('error');
    
    log(`   Length: ${text.length} characters`, 'cyan');
    log(`   Has analogy: ${hasAnalogy ? '✅' : '❌'}`, hasAnalogy ? 'green' : 'red');
    log(`   Is concise: ${isConcise ? '✅' : '⚠️'}`, isConcise ? 'green' : 'yellow');
    log(`   Is friendly: ${isFriendly ? '✅' : '❌'}`, isFriendly ? 'green' : 'red');
    
    if (hasAnalogy && isConcise && isFriendly) {
      log('\n✅ Response looks beginner-friendly!', 'green');
    } else {
      log('\n⚠️  Response may need improvement', 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
  
  log('\n');
}

testGemini().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});





