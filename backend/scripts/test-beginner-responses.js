#!/usr/bin/env node

/**
 * Test Beginner-Friendly Responses
 * Tests the AI system to verify beginner-friendly responses
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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

const API_URL = process.env.API_URL || 'http://localhost:8000';

const testQuestions = [
  { question: "Explain variables in Python.", expected: ["variable", "box", "store", "analogy"] },
  { question: "What is a loop?", expected: ["loop", "repeat", "analogy"] },
  { question: "Explain functions to a beginner.", expected: ["function", "analogy", "simple"] },
  { question: "What is an API?", expected: ["api", "waiter", "analogy"] },
  { question: "Explain classes simply.", expected: ["class", "blueprint", "analogy"] },
];

function checkResponse(response, expected) {
  const lowerResponse = response.toLowerCase();
  const found = expected.filter(keyword => lowerResponse.includes(keyword));
  return {
    found: found.length,
    total: expected.length,
    percentage: (found.length / expected.length) * 100
  };
}

async function testQuestion(question, expected) {
  try {
    log(`\n📝 Testing: "${question}"`, 'blue');
    
    const response = await axios.post(`${API_URL}/api/ai/explain`, {
      question: question,
      language: 'python',
      mode: 'beginner'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    const explanation = response.data.explanation || '';
    const result = checkResponse(explanation, expected);
    
    log(`   Response length: ${explanation.length} characters`, 'cyan');
    log(`   Keywords found: ${result.found}/${result.total} (${Math.round(result.percentage)}%)`, 
        result.percentage >= 50 ? 'green' : 'yellow');
    
    if (result.percentage >= 50) {
      log(`   ✅ Response looks beginner-friendly!`, 'green');
    } else {
      log(`   ⚠️  Response may need improvement`, 'yellow');
    }
    
    // Show first 200 characters
    const preview = explanation.substring(0, 200);
    log(`   Preview: ${preview}...`, 'cyan');
    
    return {
      question,
      success: true,
      score: result.percentage,
      length: explanation.length
    };
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return {
      question,
      success: false,
      error: error.message
    };
  }
}

async function main() {
  log('\n🧪 Testing Beginner-Friendly Responses\n', 'blue');
  log('='.repeat(60), 'cyan');
  
  // Check if server is running
  try {
    await axios.get(`${API_URL}/`, { timeout: 5000 });
    log('✅ Server is running', 'green');
  } catch (error) {
    log('❌ Server is not running!', 'red');
    log(`   Start server with: npm start`, 'yellow');
    process.exit(1);
  }
  
  log(`\n🌐 Testing against: ${API_URL}`, 'cyan');
  log(`📊 Running ${testQuestions.length} tests...\n`, 'cyan');
  
  const results = [];
  
  for (const test of testQuestions) {
    const result = await testQuestion(test.question, test.expected);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 Test Summary\n', 'blue');
  
  const successful = results.filter(r => r.success);
  const avgScore = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.score, 0) / successful.length
    : 0;
  const avgLength = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.length, 0) / successful.length
    : 0;
  
  log(`✅ Successful tests: ${successful.length}/${results.length}`, 
      successful.length === results.length ? 'green' : 'yellow');
  log(`📈 Average keyword score: ${Math.round(avgScore)}%`, 
      avgScore >= 50 ? 'green' : 'yellow');
  log(`📏 Average response length: ${Math.round(avgLength)} characters`, 'cyan');
  
  if (avgScore >= 50 && avgLength < 500) {
    log('\n✅ Responses are beginner-friendly!', 'green');
    log('   - Good use of analogies', 'green');
    log('   - Concise explanations', 'green');
    log('   - Easy to understand', 'green');
  } else {
    log('\n⚠️  Responses may need improvement:', 'yellow');
    if (avgScore < 50) {
      log('   - Add more analogies', 'yellow');
    }
    if (avgLength >= 500) {
      log('   - Make responses more concise', 'yellow');
    }
  }
  
  log('\n💡 Tips:', 'blue');
  log('   - Fine-tune your model for better results', 'cyan');
  log('   - Add more examples to dataset', 'cyan');
  log('   - Use mode="beginner" in API calls', 'cyan');
  log('\n');
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});





