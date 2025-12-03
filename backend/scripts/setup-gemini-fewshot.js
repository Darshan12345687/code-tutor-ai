#!/usr/bin/env node

/**
 * Setup Gemini Few-Shot Learning
 * Since Gemini doesn't support fine-tuning, we use few-shot learning
 * by enhancing the system prompt with examples from our dataset
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

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

function readJSONL(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }
  const content = readFileSync(filePath, 'utf-8');
  return content.trim().split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

function generateFewShotExamples(dataset, count = 10) {
  // Select diverse examples covering different topics
  const examples = [];
  const topics = new Set();
  
  for (const item of dataset) {
    if (examples.length >= count) break;
    
    // Get topic from input (first few words)
    const topic = item.input.split(' ').slice(0, 3).join(' ').toLowerCase();
    
    // Try to get diverse topics
    if (!topics.has(topic) || examples.length < 5) {
      examples.push(item);
      topics.add(topic);
    }
  }
  
  return examples;
}

function createFewShotPrompt(examples) {
  let prompt = `Here are examples of how to answer programming questions in a beginner-friendly way:\n\n`;
  
  examples.forEach((example, index) => {
    prompt += `Example ${index + 1}:\n`;
    prompt += `Question: ${example.input}\n`;
    prompt += `Answer: ${example.output}\n\n`;
  });
  
  prompt += `\nNow, when answering programming questions:\n`;
  prompt += `- Use simple analogies (like the examples above)\n`;
  prompt += `- Keep responses concise and friendly\n`;
  prompt += `- Focus on immediate understanding\n`;
  prompt += `- Use everyday language\n`;
  prompt += `- Include brief code examples when relevant\n`;
  
  return prompt;
}

async function main() {
  log('\n🎯 Setting Up Gemini Few-Shot Learning\n', 'blue');
  log('='.repeat(60), 'cyan');
  
  const datasetPath = join(__dirname, '..', 'datasets', 'merged-dataset.jsonl');
  const outputPath = join(__dirname, '..', 'config', 'gemini-fewshot-prompt.js');
  
  if (!existsSync(datasetPath)) {
    log('❌ Dataset not found!', 'red');
    log('💡 Run: npm run merge-datasets', 'yellow');
    process.exit(1);
  }
  
  log('\n📖 Reading dataset...', 'blue');
  const dataset = readJSONL(datasetPath);
  log(`✅ Found ${dataset.length} examples`, 'green');
  
  log('\n🔍 Selecting diverse examples for few-shot learning...', 'blue');
  const examples = generateFewShotExamples(dataset, 15);
  log(`✅ Selected ${examples.length} examples`, 'green');
  
  log('\n📝 Generating few-shot prompt...', 'blue');
  const fewShotPrompt = createFewShotPrompt(examples);
  
  // Create JavaScript module
  const jsContent = `/**
 * Gemini Few-Shot Learning Prompt
 * Generated from training dataset
 * This enhances Gemini responses with example-based learning
 */

export const GEMINI_FEW_SHOT_PROMPT = ${JSON.stringify(fewShotPrompt, null, 2)};

export const getFewShotPrompt = () => {
  return GEMINI_FEW_SHOT_PROMPT;
};

export const getFewShotExamples = () => {
  return ${JSON.stringify(examples, null, 2)};
};
`;
  
  writeFileSync(outputPath, jsContent);
  log(`✅ Saved to: ${outputPath}`, 'green');
  
  log('\n📊 Summary:', 'blue');
  log(`   Examples in prompt: ${examples.length}`, 'cyan');
  log(`   Total dataset size: ${dataset.length}`, 'cyan');
  log(`   Coverage: ${Math.round((examples.length / dataset.length) * 100)}%`, 'cyan');
  
  log('\n✅ Few-shot learning setup complete!', 'green');
  log('\n📋 Next Steps:', 'blue');
  log('   1. The system will automatically use few-shot examples', 'cyan');
  log('   2. Test with: npm run test-responses', 'cyan');
  log('   3. Gemini will now provide beginner-friendly responses', 'cyan');
  log('\n');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});





